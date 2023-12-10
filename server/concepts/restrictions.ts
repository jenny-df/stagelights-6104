import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, UnauthenticatedError } from "./errors";

export interface RestrictionDoc extends BaseDoc {
  user: ObjectId;
  actorPages: boolean;
  castingDirPages: boolean;
  adminPages: boolean;
}

export default class RestrictionConcept {
  public readonly restrictions = new DocCollection<RestrictionDoc>("restrictions");

  /**
   * Creates a new restrictions entry for a given user (if it doesn't already exist)
   * @param user id of user
   * @param accountTypes array of user types which could include actor, casting director, admin
   * @returns an object containing a success message and restricitons object
   */
  async create(user: ObjectId, accountTypes: string[]) {
    await this.alreadyExists(user);
    const actorPages = accountTypes.includes("actor");
    const castingDirPages = accountTypes.includes("casting director");
    const adminPages = accountTypes.includes("admin");
    const _id = await this.restrictions.createOne({ user, actorPages, castingDirPages, adminPages });
    return { msg: "Restriction successfully created!", restrictions: await this.restrictions.readOne({ _id }) };
  }

  /**
   * Checks if there is any admin
   * @returns boolean representing whether there is an admin
   */
  async anyAdmins() {
    return (await this.restrictions.readOne({ adminPages: true })) !== null;
  }

  /**
   * Checks if a given user is an admin
   * @param user id of user
   * @returns boolean representing whether the user is an admin or not
   */
  async isAdmin(user: ObjectId) {
    return (await this.doesntExist(user)).adminPages;
  }

  /**
   * Checks if a given user is an actor
   * @param user id of user
   * @returns boolean representing whether the user is an actor or not
   */
  async isActor(user: ObjectId) {
    return (await this.doesntExist(user)).actorPages;
  }

  /**
   * Checks if a given user is a casting director
   * @param user id of user
   * @returns boolean representing whether the user is a casting director or not
   */
  async isCastor(user: ObjectId) {
    return (await this.doesntExist(user)).castingDirPages;
  }

  /**
   * Checks if a user has the requirements to access something
   * @param item boolean indicating if user is of the type require
   * @param type name of the type required
   * @throws NotAllowedError if the user doesn't have the required type
   */
  check(item: boolean | undefined, type: string) {
    if (item === undefined) {
      throw new UnauthenticatedError("Must be logged in");
    }
    if (!item) {
      throw new NotAllowedError("User isn't of type: {0}", type);
    }
  }

  /**
   * Gets the user account types
   * @param user id of user
   * @returns an array of user types
   */
  async getAccountTypes(user: ObjectId) {
    const restriction = await this.doesntExist(user);
    const accountTypes = [];
    if (restriction.actorPages) accountTypes.push("actor");
    if (restriction.castingDirPages) accountTypes.push("casting director");
    if (restriction.adminPages) accountTypes.push("admin");
    return accountTypes;
  }

  /**
   * Updates a user's restrictions if they exist
   * @param user id of user
   * @param accountTypes array of user types which could include actor, castin director, admin
   * @returns an object containing a success message
   */
  async edit(user: ObjectId, accountTypes: string[]) {
    await this.doesntExist(user);
    const actorPages = accountTypes.includes("actor");
    const castingDirPages = accountTypes.includes("casting director");
    const adminPages = accountTypes.includes("admin");
    await this.restrictions.updateOne({ user }, { actorPages, castingDirPages, adminPages });
    return { msg: "successfully updated restrictions" };
  }

  /**
   * Deletes a restrictions object for a user
   * @param user id of user
   * @returns an object containing a success message
   */
  async delete(user: ObjectId) {
    await this.restrictions.deleteOne({ user });
    return { msg: "successfully deleted restrictions" };
  }

  /**
   * Checks if a given user doesn't already have a restrictions entry in the db
   * @param user id of user
   * @throws AlreadyInitializedError if the user already has a restrictions object
   */
  private async alreadyExists(user: ObjectId) {
    if (await this.restrictions.readOne({ user })) {
      throw new AlreadyInitializedError(user);
    }
  }

  /**
   * Checks if a given user has a restrictions entry in the db
   * @param user id of user
   * @returns an object representing the restrictions
   * @throws NoRestrictionsError if the user doesn't have a restrictions object
   */
  private async doesntExist(user: ObjectId) {
    const restriction = await this.restrictions.readOne({ user });
    if (!restriction) {
      throw new NoRestrictionsError(user);
    }
    return restriction;
  }
}

export class AlreadyInitializedError extends NotAllowedError {
  constructor(public readonly user: ObjectId) {
    super("{0} already has initialized restrictions", user);
  }
}

export class NoRestrictionsError extends NotAllowedError {
  constructor(public readonly user: ObjectId) {
    super("{0} hasn't initialized restrictions", user);
  }
}
