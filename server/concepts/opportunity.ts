import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError } from "./errors";

export interface Requirements {
  physical: string[];
  skill: string[];
  location: string;
}

export interface OpportunityDoc extends BaseDoc {
  user: ObjectId;
  title: string;
  description: string;
  startOn: Date;
  endsOn: Date;
  expiresOn: Date;
  requirements: Requirements;
  isActive: boolean;
}

export default class OpportunityConcept {
  public readonly opportunities = new DocCollection<OpportunityDoc>("opportunities");

  /**
   * Creates an opportunity listing
   * @param user id of user creating opportunity
   * @param title title of opportunity
   * @param description description of opportunity
   * @param startOn start date for the opportunity
   * @param endsOn end date for the opportunity
   * @param requirements requirements to be considered
   * @returns an object containing a success message and opportunity object
   * @throws BadValuesError if one of the required inputs is missing
   */
  async create(user: ObjectId, title: string, description: string, startOn: Date, endsOn: Date, requirements: Requirements) {
    if (!(title && description && startOn && endsOn)) {
      throw new BadValuesError("missing a required input (one of the following: title, description, start or end date)");
    }
    this.checkDateValidity(startOn, endsOn);
    const daysTillExpires = 14;
    const expiresOn = new Date();
    expiresOn.setDate(expiresOn.getDate() + daysTillExpires);
    const isActive = true;
    const _id = await this.opportunities.createOne({ user, title, description, startOn, endsOn, expiresOn, requirements, isActive });
    return { msg: "Opportunity successfully created!", opportunity: await this.opportunities.readOne({ _id }) };
  }

  /**
   * Gets all opportunities
   * @returns all opportunities
   */
  async getAll() {
    return await this.opportunities.readMany(
      {},
      {
        sort: { dateUpdated: -1 },
      },
    );
  }

  /**
   * Gets an opportunity by it's id
   * @param _id id of the opportunity
   * @returns an opportunity object
   */
  async getById(_id: ObjectId) {
    return await this.opportunityExists(_id);
  }

  /**
   * Gets all opportunities by a given user
   * @param user id of the user
   * @returns all opportunity objects by the user
   */
  async getByUser(user: ObjectId) {
    return await this.opportunities.readMany({ user });
  }

  /**
   * Gets opportunities by title
   * @param title searched string
   * @returns opportunities
   */
  async getByTitle(title: string) {
    return await this.opportunities.readMany(
      { title },
      {
        sort: { dateUpdated: -1 },
      },
    );
  }

  /**
   * Figures out if an opportunity fits perfectly into a user's free time
   * @param _id ids of the opportunity
   * @param start start date of when user is free
   * @param end end date of when user is free
   * @returns true if the opportunity fits in the user's schedule and false otherwise
   */
  async datesInRange(_id: ObjectId, start: Date, end: Date) {
    this.checkDateValidity(start, end);
    const opportunity = await this.opportunityExists(_id);
    return start <= opportunity.startOn && opportunity.endsOn <= end;
  }

  /**
   * Updates the information of an opportunity
   * @param _id id of the opportunity
   * @param user id of the user updating
   * @param update updated information
   * @returns an object with a success message
   */
  async update(_id: ObjectId, user: ObjectId, update: Partial<OpportunityDoc>) {
    this.sanitizeUpdate(update);
    const oldOp = await this.opportunityByUser(_id, user);
    if (update.startOn && update.endsOn) {
      this.checkDateValidity(new Date(update.startOn), new Date(update.endsOn));
    } else if (update.startOn && !update.endsOn) {
      this.checkDateValidity(new Date(update.startOn), oldOp.endsOn);
    } else if (!update.startOn && update.endsOn) {
      this.checkDateValidity(oldOp.startOn, new Date(update.endsOn));
    }
    await this.opportunities.updateOne({ _id }, update);
    return { msg: "Opportunity updated successfully!" };
  }

  /**
   * Deactivates an opportunity after it expires or after the creator deactivates it
   * @param _id id of the opportunity
   * @param user id of the user deactivating (if left empty, it's the system updating)
   * @returns an object containing a success message
   */
  async deactivate(_id: ObjectId, user?: ObjectId) {
    if (user) {
      await this.opportunityByUser(_id, user);
      await this.opportunities.updateOne({ _id }, { isActive: false });
      return { msg: "Opportunity deactivated successfully!" };
    }

    // automatic updating by system
    const opportunity = await this.opportunityExists(_id);
    const isActive = opportunity.isActive;
    const expiresOn = opportunity.expiresOn;
    const currentDate = new Date();
    if (isActive && expiresOn < currentDate) {
      await this.opportunities.updateOne({ _id }, { isActive: false });
      return { msg: "Opportunity exipred -> deactivated successfully!" };
    }
  }

  /**
   * Reactivates an opportunity if the creator initiates reactivity
   * @param _id id of the opportunity
   * @param user id of the user reactivating
   * @returns an object containing a success message
   */
  async reactivate(_id: ObjectId, user: ObjectId) {
    const daysTillExpires = 14;
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + daysTillExpires);
    await this.opportunityByUser(_id, user);
    await this.opportunities.updateOne({ _id }, { isActive: true, expiresOn: newExpiryDate });
    return { msg: "Opportunity reactivated successfully!" };
  }

  /**
   * Removes an opportunity if it exists and the user deleting is the creator
   * @param _id id of opportunity
   * @param user id of the user deleting
   * @returns an object containing a success message
   */
  async delete(_id: ObjectId, user: ObjectId) {
    await this.opportunityByUser(_id, user);
    await this.opportunities.deleteOne({ _id });
    return { msg: "Opportunity deleted successfully!" };
  }

  /**
   * Deactivates all opportunities by a given user
   * @param user id of the user deactivating (if left empty, it's the system updating)
   * @returns an object containing a success message
   */
  async deactivateUser(user: ObjectId) {
    const opportunities = await this.getByUser(user);
    await Promise.all(opportunities.map(async (op) => await this.opportunities.updateOne({ _id: op._id }, { isActive: false })));
    return { msg: "Opportunities deactivated successfully!" };
  }

  /**
   * Sanitizes an update field
   * @param update the new content that's being updated
   * @throws NotAllowedError if trying to update a readonly field
   */
  private sanitizeUpdate(update: Partial<OpportunityDoc>) {
    const allowedUpdates = ["description", "startOn", "endOn", "requirements"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }

  /**
   * Checks if a given opportunity exists by id
   * @param _id id of the opportunity we're checking
   * @returns the opportunity object if it exists
   * @throws OpportunityDoestExistError if the opportunity doesn't exist
   */
  private async opportunityExists(_id: ObjectId) {
    const opportunity = await this.opportunities.readOne({ _id });
    if (!opportunity) {
      throw new OpportunityDoestExistError(_id);
    }
    return opportunity;
  }

  /**
   * Checks if a given user is the creator of a given opportunity
   * @param _id id of the opportunity
   * @param user id of the user we're checking
   * @returns opportunity object if it exists
   * @throws NotOwnerError if the user given isn't the owner of the opportunity
   */
  private async opportunityByUser(_id: ObjectId, user: ObjectId) {
    const opportunity = await this.opportunityExists(_id);
    if (opportunity.user.toString() !== user.toString()) {
      throw new NotOwnerError(user, _id);
    }
    return opportunity;
  }

  /**
   * Checks if the start date is less than end date (i.e. Valid)
   * @param start start date
   * @param end end date
   * @throws NotAllowedError if the start date is greater than or equal to end date
   */
  private checkDateValidity(start: Date, end: Date) {
    if (start >= end) {
      throw new NotAllowedError("{0} is greater than or equal to {1} which isn't a valid input!", start, end);
    }
  }
}

export class NotOwnerError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("Opportunity ({0}) isn't owned by {1}!", _id, user);
  }
}

export class OpportunityDoestExistError extends NotAllowedError {
  constructor(public readonly _id: ObjectId) {
    super("Opportunity ({0}) doesn't exist!", _id);
  }
}
