import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ApplauseDoc extends BaseDoc {
  user: ObjectId;
  value: number;
}

export default class ApplauseConcept {
  public readonly applauses = new DocCollection<ApplauseDoc>("applauses");

  /**
   * Creates a new applause counter
   * @param user id of the user who owns counter
   * @returns an object containing a success message and the applause object
   */
  async initialize(user: ObjectId) {
    await this.alreadyExists(user);
    const _id = await this.applauses.createOne({ user, value: 0 });
    return { msg: "Applause counter successfully created!", applause: await this.applauses.readOne({ _id }) };
  }

  /**
   * Gets an applause value for a given user
   * @param uesr id of the user that we're retrieving the applause counter for
   * @returns applause value for the given user
   */
  async getValueByUser(user: ObjectId) {
    return (await this.doesntExist(user)).value;
  }

  /**
   * Finds the ranking of a given group of users
   * @param users ids of the users
   * @returns an ordered array of users from highest ranking to lowest
   */
  async rank(users: ObjectId[]) {
    const applauseCounters = await Promise.all(users.map(async (user) => this.doesntExist(user)));
    applauseCounters.sort((a, b) => b.value - a.value);
    return applauseCounters;
  }

  /**
   * Updates the value of an applause counter by the amount given
   * @param user id of the user
   * @param amount amount to be added to the applause counter
   * @returns new value for applause counter
   */
  async update(user: ObjectId, amount: number) {
    const applause = await this.doesntExist(user);
    const value = Number(applause.value) + Number(amount);
    await this.applauses.updateOne({ user }, { value });
    return value;
  }

  /**
   * Removes the applause counter for a given user
   * @param user id of the user
   * @returns an object containing a success message
   */
  async delete(user: ObjectId) {
    await this.doesntExist(user);
    await this.applauses.deleteOne({ user });
    return { msg: "Applause counter deleted successfully!" };
  }

  /**
   * Figures out if the user given already has an applause counter
   * @param user id of user who we're checking
   * @throws UserExistsError if the user already has an applause counter
   */
  private async alreadyExists(user: ObjectId) {
    const applause = await this.applauses.readOne({ user });
    if (applause) {
      throw new UserExistsError(user);
    }
  }

  /**
   * Figures out if the user given doesn't have an applause counter
   * @param user id of user who we're checking
   * @throws NoCounterError if the user doesn't have an applause counter
   */
  private async doesntExist(user: ObjectId) {
    const applause = await this.applauses.readOne({ user });
    if (!applause) {
      throw new NoCounterError(user);
    }
    return applause;
  }
}

export class UserExistsError extends NotAllowedError {
  constructor(public readonly user: ObjectId) {
    super("{0} already has applause counter!", user);
  }
}

export class NoCounterError extends NotFoundError {
  constructor(public readonly user: ObjectId) {
    super("{0} doesn't have applause counter!", user);
  }
}
