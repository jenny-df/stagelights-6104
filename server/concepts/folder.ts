import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface PraticeFolderDoc extends FolderDoc {
  numContents: number;
}

export interface FolderDoc extends BaseDoc {
  user: ObjectId;
  contents: ObjectId[];
  name: string;
}

export default class FolderConcept {
  public readonly practiceFolders = new DocCollection<PraticeFolderDoc>("practice folders");
  public readonly repertoireFolders = new DocCollection<FolderDoc>("repertoire folders");
  private capacity = 15;

  /**
   * Creates a new repertoire object
   * @param user id of the user creating the repertoire folder
   * @param name name of the repertoire folder
   * @returns an object containing a success message and the new folder object
   */
  async createRepertoire(user: ObjectId, name: string) {
    const contents: ObjectId[] = [];
    const _id = await this.repertoireFolders.createOne({ user, contents, name });
    return { msg: "Repertoire Folder successfully created!", folder: await this.repertoireFolders.readOne({ _id }) };
  }

  /**
   * Adds an item to a given repertoire folder if it belongs to the user given
   * @param user id of the user deleting
   * @param folder id of the repertoire folder being modified
   * @param item id of item being added
   * @returns an object containing a success message
   */
  async addRepertoire(user: ObjectId, folder: ObjectId, item: ObjectId) {
    const repertoire = await this.repertoireFolderFinder(user, folder);
    repertoire.contents.push(item);
    await this.repertoireFolders.updateOne({ _id: folder }, { contents: repertoire.contents });
    return { msg: "successfully added the item given" };
  }

  /**
   * Removes an item from a given repertoire folder if it belongs to the user given
   * @param user id of the user
   * @param folder id of the repertoire folder being modified
   * @param item id of item being removed
   * @returns an object containing a success message
   * @throws NotInFolderError if the item isn't in the folder given
   */
  async removeRepertoire(user: ObjectId, folder: ObjectId, item: ObjectId) {
    const repertoire = await this.repertoireFolderFinder(user, folder);
    const stringContents = repertoire.contents.map((id) => id.toString());
    const index = stringContents.indexOf(item.toString());
    if (index !== -1) {
      const newContents = repertoire.contents.splice(index, 1);
      await this.repertoireFolders.updateOne({ _id: folder }, { contents: newContents });
      return { msg: "successfully removed the item given" };
    }
    throw new NotInFolderError(item);
  }

  /**
   * Deletes a given repertoire folder if it belongs to the user
   * @param user id of the user deleting
   * @param _id id of the repertoire folder being deleted
   * @returns an object containing a success message
   */
  async deleteRepertoire(user: ObjectId, _id: ObjectId) {
    await this.repertoireFolderFinder(user, _id);
    await this.repertoireFolders.deleteOne({ _id });
    return { msg: "successfully deleted repertoire folder" };
  }

  /**
   * Gets all the repertoire folders for a given user
   * @param user id of the user
   * @returns an array of repertoire folders for a given user
   */
  async getUserRepertoire(user: ObjectId) {
    return await this.repertoireFolders.readMany({ user });
  }

  /**
   * Gets a repertoire folder if it exists
   * @param _id id of the repertoire folder
   * @returns the folder object if it exists
   */
  async getRepertoire(_id: ObjectId) {
    return await this.repertoireFolders.readOne({ _id });
  }

  /**
   * Changes the capacity of the practice folder
   * @param newLimit new capacity
   */
  changeCapacity(newLimit: number) {
    this.capacity = newLimit;
  }

  /**
   * Gets the capacity of the practice folder
   * @returns the capacity of the practice folders
   */
  getCapacity() {
    return this.capacity;
  }

  /**
   * Creates a practice folder for a given user as long as one doesn't already exist
   * @param user id of the user
   * @returns an object containing a success message and the folder object
   */
  async createPractice(user: ObjectId) {
    await this.alreadyHasPracticeFolder(user);
    const _id = await this.practiceFolders.createOne({ user, contents: [], name: "Practice Folder", numContents: 0 });
    return { msg: "Pratice Folder successfully created!", folder: await this.practiceFolders.readOne({ _id }) };
  }

  /**
   * Adds a given item to the user's practice folder
   * @param user id of the user
   * @param item id of item being removed
   * @returns an object containing a success message
   */
  async addPractice(user: ObjectId, item: ObjectId) {
    const practice = await this.doesntHavePracticeFolder(user);

    if (practice.numContents + 1 <= this.capacity) {
      practice.contents.push(item);
      await this.practiceFolders.updateOne({ user }, { contents: practice.contents, numContents: practice.numContents + 1 });
      return { msg: "successfully added the item given" };
    }
    throw new NotAllowedError("Practice folder full! Remove before adding more");
  }

  /**
   * Removes a given item from the user's practice folder if it exists
   * @param user id of the user
   * @param item id of item being removed
   * @returns an object containing a success message
   * @throws NotInFolderError if the item doesn't exist in the user's pratice folder
   */
  async removePractice(user: ObjectId, item: ObjectId) {
    const practice = await this.doesntHavePracticeFolder(user);
    const stringContents = practice.contents.map((id) => id.toString());
    const index = stringContents.indexOf(item.toString());
    if (index !== -1) {
      const newContents = practice.contents.splice(index, 1);
      await this.practiceFolders.updateOne({ user }, { contents: newContents, numContents: practice.numContents - 1 });
      return { msg: "successfully removed the item given" };
    }
    throw new NotInFolderError(item);
  }

  /**
   * Gets the practice folder for a given user if it exists
   * @param user id of the user
   * @returns practice folder object if it exists
   */
  async getPractice(user: ObjectId) {
    return await this.doesntHavePracticeFolder(user);
  }

  /**
   * Deletes all the folders for a given user
   * @param user id of the user
   * @returns an object containing a success message
   */
  async deleteUser(user: ObjectId) {
    await this.practiceFolders.deleteOne({ user });
    await this.repertoireFolders.deleteMany({ user });
    return { msg: "Successfully deleted all folders for the user" };
  }

  /**
   * Checks if a given user already has a practice folder
   * @param user id of the user
   * @throws HasPracticeFolderError if the user already has a practice folder
   */
  private async alreadyHasPracticeFolder(user: ObjectId) {
    const practice = await this.practiceFolders.readOne({ user });
    if (practice) {
      throw new HasPracticeFolderError(user);
    }
  }

  /**
   * Checks if a given user has a practice folder already
   * @param user id of the user
   * @returns practice folder object if found
   * @throws NoPracticeFolderError if the user doesn't have one
   */
  private async doesntHavePracticeFolder(user: ObjectId) {
    const practice = await this.practiceFolders.readOne({ user });
    if (!practice) {
      throw new NoPracticeFolderError(user);
    }
    return practice;
  }

  /**
   * Attempts to find a repertoire object and checks if the user given is the
   * owner
   * @param user id of the user asking for a repertoire folder
   * @param _id id of the repertoire folder
   * @returns the repertoire object if found
   * @throws NotFoundError if no repertoire is found with given id
   * @throws NotFolderOwnerError if the user given isn't the owner
   */
  private async repertoireFolderFinder(user: ObjectId, _id: ObjectId) {
    const repertoire = await this.repertoireFolders.readOne({ _id });
    if (!repertoire) {
      throw new NotFoundError("There is no repertoire folder with id {0}", _id);
    }
    if (repertoire.user.toString() !== user.toString()) {
      throw new NotFolderOwnerError(user);
    }
    return repertoire;
  }
}

export class NotInFolderError extends NotFoundError {
  constructor(public readonly item: ObjectId) {
    super("{0} doesn't exist in the contents of the folder given", item);
  }
}

export class NoPracticeFolderError extends NotFoundError {
  constructor(public readonly user: ObjectId) {
    super("The user {0} doesn't have a practice folder yet", user);
  }
}

export class NotFolderOwnerError extends NotAllowedError {
  constructor(public readonly user: ObjectId) {
    super("The user {0} isn't the owner of this folder", user);
  }
}

export class HasPracticeFolderError extends NotAllowedError {
  constructor(public readonly user: ObjectId) {
    super("{0} can't have more than one practice folder", user);
  }
}
