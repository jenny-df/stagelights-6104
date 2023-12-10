import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface UserDoc extends BaseDoc {
  email: string;
  password: string;
  name: string;
  profilePic: ObjectId;
  birthday: Date;
  city: string;
  state: string;
  country: string;
}

export default class UserConcept {
  public readonly users = new DocCollection<UserDoc>("users");

  /**
   * Creates a new user
   * @param email email of user (must be unique)
   * @param password password to allow authentication
   * @param name name of user
   * @param information general information on the user
   * @returns an object containing a success message and a user object
   */
  async create(email: string, password: string, name: string, birthday: Date, city: string, state: string, country: string) {
    await this.canCreate(email, password);
    const tempProfilePic = new ObjectId();
    const _id = await this.users.createOne({ email, password, name, profilePic: tempProfilePic, birthday, city, state, country });
    return { msg: "User created successfully!", user: await this.users.readOne({ _id }) };
  }

  /**
   * Finds a user by their id
   * @param _id id of user
   * @returns user information (without password)
   */
  async getUserById(_id: ObjectId) {
    const user = await this.userDoesntExist(_id);
    return this.sanitizeUser(user);
  }

  /**
   * Finds a user by their email
   * @param email email of user
   * @returns user information (without password)
   */
  async getUserByEmail(email: string) {
    const user = await this.userEmailDoesntExist(email);
    return this.sanitizeUser(user);
  }

  /**
   * Gets the names of given users from their ids
   * @param ids ids of users we're getting the name for
   * @returns an array containing users' names
   */
  async idsToNames(ids: ObjectId[]) {
    const users = await this.users.readMany({ _id: { $in: ids } });
    // Store strings in Map because ObjectId comparison by reference is wrong
    const idToUser = new Map(users.map((user) => [user._id.toString(), user]));
    return ids.map((id) => idToUser.get(id.toString())?.name ?? "DELETED_USER");
  }

  /**
   * Gets user info from their ids
   * @param ids ids of users we're getting the info for
   * @returns an array containing users' info
   */
  async idsToUsers(ids: ObjectId[]) {
    return await this.users.readMany({ _id: { $in: ids } });
  }

  /**
   * Retrieves all users or users with a given name
   * @param name name being searched
   * @returns user objects that have that name or all users if no name is indicated
   */
  async getUsers(name?: string) {
    // If username is undefined, return all users by applying empty filter
    const filter = name ? { name } : {};
    const users = (await this.users.readMany(filter)).map(this.sanitizeUser);
    return users;
  }

  /**
   * Authenticates users
   * @param email email of user
   * @param password password of user
   * @returns an object containing a success message and user id
   * @throws NotAllowedError if the email or password is incorrect
   */
  async authenticate(email: string, password: string) {
    const user = await this.users.readOne({ email, password });
    if (!user) {
      throw new NotAllowedError("Email or password is incorrect.");
    }
    return { msg: "Successfully authenticated.", _id: user._id };
  }

  /**
   * Updates the information of a user
   * @param _id id of user being updated
   * @param update new information for the user
   * @returns an object containing a success message
   */
  async update(_id: ObjectId, update: Partial<UserDoc>) {
    this.sanitizeUpdate(update);
    if ("email" in update) {
      if (update.email) {
        await this.isEmailUnique(update.email);
      }
    }
    await this.users.updateOne({ _id }, update);
    return { msg: "User updated successfully!" };
  }

  /**
   * Updates the profile picture for a given user
   * @param _id id of user being updated
   * @param profilePic new profile pic id for the user
   * @returns the id of the old profile pic
   */
  async updateProfilePic(_id: ObjectId, profilePic: ObjectId) {
    const oldProfilePic = (await this.userDoesntExist(_id)).profilePic;
    await this.users.updateOne({ _id }, { profilePic });
    return oldProfilePic;
  }

  /**
   * Deletes a given user
   * @param _id Id of user being deleted
   * @returns an object containg a success message
   */
  async delete(_id: ObjectId) {
    await this.users.deleteOne({ _id });
    return { msg: "User deleted!" };
  }

  /**
   * Checks if the given email belongs to an existing user or not
   * @param email email of user we're checking
   * @returns user object if it exists
   * @throws NotfoundError if the user isn't found
   */
  private async userEmailDoesntExist(email: string) {
    const user = await this.users.readOne({ email });
    if (!user) {
      throw new NotFoundError(`User not found!`);
    }
    return user;
  }

  /**
   * Checks if the given id belongs to an existing user or not
   * @param _id id of user we're checking
   * @returns user object if it exists
   * @throws NotfoundError if the user isn't found
   */
  private async userDoesntExist(_id: ObjectId) {
    const user = await this.users.readOne({ _id });
    if (!user) {
      throw new NotFoundError(`User not found!`);
    }
    return user;
  }

  /**
   * Removes the password from UserDoc input
   * @param user UserDoc information on the user
   * @returns a sanitized version of the given input (i.e. without the password)
   */
  private sanitizeUser(user: UserDoc) {
    // eslint-disable-next-line
    const { password, ...rest } = user; // remove password
    return rest;
  }

  /**
   * Checks if a users credentials are valid
   * @param email email being checked
   * @param password password being checked
   * @throws BadValuesError if the email or password is empty
   */
  private async canCreate(email: string, password: string) {
    if (!email || !password) {
      throw new BadValuesError("Email and password must be non-empty!");
    }
    await this.isEmailUnique(email);
  }

  /**
   * Checks if a given email is unique
   * @param email email that we're checking if it's unique
   * @throws NotAllowedError if the email isn't unique
   */
  private async isEmailUnique(email: string) {
    if (await this.users.readOne({ email })) {
      throw new NotAllowedError(`User with email ${email} already exists!`);
    }
  }

  /**
   * Sanitizes an update field
   * @param update the new content that's being updated
   * @throws NotAllowedError if trying to update a readonly field
   */
  private sanitizeUpdate(update: Partial<UserDoc>) {
    const allowedUpdates = ["email", "password", "name", "city", "state", "country"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}
