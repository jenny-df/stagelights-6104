import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface RestrictionDoc extends BaseDoc {
  user: ObjectId;
  actorPages: boolean;
  directorPages: boolean;
  castingDirPages: boolean;
  scriptWriterPages: boolean;
  receiveRequests: boolean;
  filteredPosts: boolean;
  parentNeeded: boolean;
}

export default class RestrictionConcept {
  public readonly restrictions = new DocCollection<RestrictionDoc>("restrictions");

  async create(user: ObjectId, birthday: Date, accountTypes: string[]) {
    const today = new Date();
    const _id = await this.restrictions.createOne({ user });
    return { msg: "Restriction successfully created!", tag: await this.restrictions.readOne({ _id }) };
  }
}
