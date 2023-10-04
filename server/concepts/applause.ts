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
   * @throws UserExistsError if the user already has an applause counter
   */
  async initialize(user: ObjectId) {
    await this.userExists(user);
    const value = 0;
    const _id = await this.applauses.createOne({ user, value });
    return { msg: "Applause counter successfully created!", applause: await this.applauses.readOne({ _id }) };
  }

  /**
   * Gets an applause value for a given user
   * @param uesr id of the user that we're retrieving the applause counter for
   * @returns applause value for the given user
   */
  async getValueByUser(user: ObjectId) {
    const applause = await this.getByUser(user);
    console.log(applause);
    return applause?.value;
  }

  /**
   * Finds the ranking of a given group of users
   * @param users ids of the users
   * @returns an ordered array of users from highest ranking to lowest
   * @throws NoCounterError if any user doesn't have an applause counter
   */
  async rank(users: ObjectId[]) {
    const applauseCounters = await Promise.all(
      users.map(async (user) =>
        this.getByUser(user).then((applause) => {
          if (applause) {
            return applause;
          } else {
            throw new NotAllowedError("Won't reach here");
          }
        }),
      ),
    );
    applauseCounters.sort((a, b) => b.value - a.value);
    return applauseCounters;
  }

  /**
   * Updates the value of an applause counter by the amount given
   * @param user id of the user
   * @param amount amount to be added to the applause counter
   * @returns new value for applause counter
   * @throws NoCounterError if the user doesn't have an applause counter
   */
  async update(user: ObjectId, amount: number) {
    return await this.addValue(user, amount);
  }

  /**
   * Removes the applause counter for a given user
   * @param user id of the user
   * @returns an object containing a success message
   */
  async delete(user: ObjectId) {
    await this.noCounter(user);
    await this.applauses.deleteOne({ user });
    return { msg: "Applause counter deleted successfully!" };
  }

  /**
   * Gets an applause counter for a given user
   * @param uesr id of the user that we're retrieving the applause counter for
   * @returns applause counter for the given user
   */
  private async getByUser(user: ObjectId) {
    await this.noCounter(user);
    return await this.applauses.readOne({ user });
  }

  /**
   * Figures out if the user given already has an applause counter
   * @param user id of user who we're checking
   * @throws UserExistsError if the user already has an applause counter
   */
  private async userExists(user: ObjectId) {
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
  private async noCounter(user: ObjectId) {
    const applause = await this.applauses.readOne({ user });
    if (!applause) {
      throw new NoCounterError(user);
    }
  }

  /**
   * Updates the value of an applause counter by the amount given
   * @param user id of the user
   * @param amount amount to be added to the applause counter
   * @returns new value for applause counter
   * @throws NoCounterError if the user doesn't have an applause counter
   */
  private async addValue(user: ObjectId, amount: number) {
    const applause = await this.getByUser(user);
    if (!applause) {
      throw new NoCounterError(user);
    }
    const newValue = Number(applause.value) + Number(amount);
    await this.applauses.updateOne({ user }, { value: newValue });
    return newValue;
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
