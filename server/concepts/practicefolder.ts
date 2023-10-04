import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface PraticeFolderDoc extends BaseDoc {
  user: ObjectId;
  contents: ObjectId[];
}

export default class PraticeFolderConcept {
  public readonly practiceFolders = new DocCollection<PraticeFolderDoc>("practiceFolders");
  private capacity = 15;

  async create(user: ObjectId) {
    const contents: ObjectId[] = [];
    const _id = await this.practiceFolders.createOne({ user, contents });
    return { msg: "PraticeFolder successfully created!", practiceFolder: await this.practiceFolders.readOne({ _id }) };
  }
}
