import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

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
   * @throws DateRangeError if the start date is greater than or equal to end date
   */
  async create(user: ObjectId, title: string, description: string, startOn: Date, endsOn: Date, requirements: Requirements) {
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
    return await this.opportunities.readOne({ _id });
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
   * @throws OpportunityDoestExistError if the opportunity doesn't exist
   * @throws NotOwnerError if the user given isn't the owner of the opportunity
   * @throws DateRangeError if the start date is greater than or equal to end date
   */
  async datesInRange(_id: ObjectId, start: Date, end: Date) {
    this.checkDateValidity(start, end);
    await this.opportunityExists(_id);
    const opportunity = await this.getById(_id);
    if (opportunity) {
      console.log(opportunity.startOn, start, end, opportunity.endsOn);
      return start <= opportunity.startOn && opportunity.endsOn <= end;
    }
  }

  /**
   * Updates the information of an opportunity
   * @param _id id of the opportunity
   * @param user id of the user updating
   * @param update updated information
   * @returns an object with a success message
   * @throws OpportunityDoestExistError if the opportunity doesn't exist
   * @throws NotOwnerError if the user given isn't the owner of the opportunity
   */
  async update(_id: ObjectId, user: ObjectId, update: Partial<OpportunityDoc>) {
    await this.opportunityExists(_id);
    await this.opportunityByUser(_id, user);
    const oldOp = await this.getById(_id);
    if (oldOp) {
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
    // will never reach here
  }

  /**
   * Deactivates an opportunity after it expires or after the creator deactivates it
   * @param _id id of the opportunity
   * @param user id of the user deactivating (if any - could be system updating)
   * @returns an object containing a success message
   * @throws OpportunityDoestExistError if the opportunity doesn't exist
   * @throws NotOwnerError if the user given isn't the owner of the opportunity
   */
  async deactivate(_id: ObjectId, user?: ObjectId) {
    if (user) {
      await this.update(_id, user, { isActive: false });
      return { msg: "Opportunity deactivated successfully!" };
    }
    const opportunity = await this.getById(_id);
    if (opportunity) {
      const isActive = opportunity.isActive;
      const expiresOn = opportunity.expiresOn;
      const currentDate = new Date();
      if (isActive && expiresOn >= currentDate) {
        await this.opportunities.updateOne({ _id }, { isActive: false });
        return { msg: "Opportunity deactivated successfully!" };
      }
    }
  }

  /**
   * Reactivates an opportunity if the creator initiates reactivity
   * @param _id id of the opportunity
   * @param user id of the user reactivating
   * @returns an object containing a success message
   * @throws OpportunityDoestExistError if the opportunity doesn't exist
   * @throws NotOwnerError if the user given isn't the owner of the opportunity
   */
  async reactivate(_id: ObjectId, user: ObjectId) {
    const daysTillExpires = 14;
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + daysTillExpires);
    await this.update(_id, user, { isActive: true, expiresOn: newExpiryDate });
    return { msg: "Opportunity reactivated successfully!" };
  }

  /**
   * Removes an opportunity if it exists and the user deleting is the creator
   * @param _id id of opportunity
   * @param user id of the user deleting
   * @returns an object containing a success message
   * @throws OpportunityDoestExistError if the opportunity doesn't exist
   * @throws NotOwnerError if the user given isn't the owner of the opportunity
   */
  async delete(_id: ObjectId, user: ObjectId) {
    await this.opportunityExists(_id);
    await this.opportunityByUser(_id, user);
    await this.opportunities.deleteOne({ _id });
    return { msg: "Opportunity deleted successfully!" };
  }

  /**
   * Checks if a given opportunity exists by id
   * @param _id id of the opportunity we're checking
   * @throws OpportunityDoestExistError if the opportunity doesn't exist
   */
  private async opportunityExists(_id: ObjectId) {
    const opportunity = await this.opportunities.readOne({ _id });
    if (!opportunity) {
      throw new OpportunityDoestExistError(_id);
    }
  }

  /**
   * Checks if a given user is the creator of a given opportunity
   * @param _id id of the opportunity
   * @param user id of the user we're checking
   * @throws NotOwnerError if the user given isn't the owner of the opportunity
   */
  private async opportunityByUser(_id: ObjectId, user: ObjectId) {
    const opportunity = await this.opportunities.readOne({ _id });
    if (opportunity?.user.toString() !== user.toString()) {
      throw new NotOwnerError(user, _id);
    }
  }

  /**
   * Checks if the start date is less than end date (i.e. Valid)
   * @param start start date
   * @param end end date
   * @throws DateRangeError if the start date is greater than or equal to end date
   */
  private checkDateValidity(start: Date, end: Date) {
    if (start >= end) {
      throw new DateRangeError(start, end);
    }
  }
}

export class NotOwnerError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("Opportunity {0} isn't owned by {1}!", _id, user);
  }
}

export class DateRangeError extends NotAllowedError {
  constructor(
    public readonly start: Date,
    public readonly end: Date,
  ) {
    super("{0} is greater than or equal to {1} which isn't a valid input!", start, end);
  }
}

export class OpportunityDoestExistError extends NotAllowedError {
  constructor(public readonly _id: ObjectId) {
    super("Opportunity {0} doesn't exist!", _id);
  }
}
