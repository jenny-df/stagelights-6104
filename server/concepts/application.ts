import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ApplicationDoc extends BaseDoc {
  owner: ObjectId;
  user: ObjectId;
  status: "approved" | "audition" | "rejected" | "pending" | "withdrawn";
  text: string;
  media: ObjectId[];
  applicationFor: ObjectId;
}

export default class ApplicationConcept {
  public readonly applications = new DocCollection<ApplicationDoc>("applications");

  /**
   * Creates a new application
   * @param owner id of user who manages the opportunity
   * @param user id of user applying
   * @param portfolio id of user's portfolio
   * @param text header text on application
   * @param media additional media attached to the application
   * @param applicationFor id of opportunity user is applying to
   * @returns an object containing a success message and an application object
   */
  async create(owner: ObjectId, user: ObjectId, text: string, media: ObjectId[], applicationFor: ObjectId) {
    this.ownerIsApplier(owner, user);
    const status = "pending";
    const _id = await this.applications.createOne({ owner, user, status, text, media, applicationFor });
    return { msg: "Application successfully created!", application: await this.applications.readOne({ _id }) };
  }

  /**
   * Finds the applications for a given opportunity
   * @param user id of the user trying to get the info
   * @param opId id of the opportunity
   * @returns an array of application objects (excluding withdrawn applications)
   * @throws NotAllowedError if the user accessing isn't the owner of the opportunity
   */
  async getAppsForOp(user: ObjectId, opId: ObjectId) {
    const applications = await this.applications.readMany({ applicationFor: opId, status: { $in: ["approved", "audition", "rejected", "pending"] } });
    const owner = applications[0]?.owner ?? new ObjectId();
    if (user.toString() === owner.toString()) {
      return applications;
    }
    throw new NotAllowedError("Not owner of opportunity so can't access this information");
  }

  /**
   * Finds all the applications for a given user
   * @param userId id of the user
   * @returns an array of application objects
   */
  async getAppsForUser(userId: ObjectId) {
    return await this.applications.readMany({ user: userId });
  }

  /**
   * Finds an application by its id if it exists and returns it if the user
   * is the applier or owner
   * @param _id id of the application
   * @param user id of the user trying to access the information
   * @returns an application object if found
   * @throws NotAllowedError if the user isn't the owner or applier
   */
  async getAppById(_id: ObjectId, user: ObjectId) {
    const application = await this.doesntExist(_id);
    const owner = application?.owner.toString();
    const creator = application?.user.toString();
    if (user.toString() in [owner, creator]) {
      return application;
    }
    throw new NotAllowedError("Not owner or applier. So can't view application");
  }

  /**
   * Changes the status of a given application
   * @param _id id of the application
   * @param newStatus updated status of application
   */
  async changeStatus(user: ObjectId, _id: ObjectId, newStatus: "approved" | "audition" | "rejected" | "withdrawn") {
    const application = await this.doesntExist(_id);
    const owner = application?.owner.toString() ?? "";
    const applier = application?.user.toString() ?? "";
    this.checkStatusChange(user, newStatus, owner, applier);
    await this.applications.updateOne({ _id }, { status: newStatus });
  }

  /**
   * Withdraws all the applications for a given user
   * @param user id of the user
   * @returns an object containing a succcess message
   */
  async withdrawUser(user: ObjectId) {
    const applications = await this.applications.readMany(user);
    await Promise.all(applications.map(async (app) => await this.applications.updateOne({ _id: app._id }, { status: "withdrawn" })));
    return { msg: "Successfully withdrawn all user's applications" };
  }

  /**
   * Checks if the owner and applier are the same user
   * @param owner id of the owner of the opportunity
   * @param user id of the applier
   * @throws NotAllowedError if they are the same user
   */
  private ownerIsApplier(owner: ObjectId, user: ObjectId) {
    if (owner.toString() === user.toString()) {
      throw new NotAllowedError("Owners of opportunities can't apply to their own listing");
    }
  }

  /**
   * Checks if the status changes are valid and allowed
   * @param user id of user
   * @param newStatus new proposed status of application
   * @param owner string version of owner id
   * @param applier string version of applier id
   * @throws NotApplierError if withdrawing application but user isn't applier
   * @throws NotOwnerError if approving, rejecting or moving to audition pile
   *         but user isn't owner of the opportunity being applied to
   */
  private checkStatusChange(user: ObjectId, newStatus: "approved" | "audition" | "rejected" | "withdrawn", owner: string, applier: string) {
    if (newStatus == "withdrawn" && user.toString() !== applier) {
      throw new NotApplierError(user);
    }
    if (newStatus in ["approved", "audition", "rejected"] && user.toString() !== owner) {
      throw new NotOwnerError(user, newStatus);
    }
  }

  /**
   * Checks if an application exists or not using its id
   * @param _id id of the application
   * @returns an application object if found
   * @throws NotFoundError if no application with given id is found
   */
  private async doesntExist(_id: ObjectId) {
    const application = this.applications.readOne({ _id });
    if (application) {
      return application;
    }
    throw new NotFoundError("No application with id {0} found", _id);
  }
}

export class NotApplierError extends NotAllowedError {
  constructor(public readonly user: ObjectId) {
    super("{0} withdrawing isn't the applier", user);
  }
}

export class NotOwnerError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly newStatus: string,
  ) {
    super("{0} can't change the status to {1} since they aren't the owner of the opportunity", user, newStatus);
  }
}
