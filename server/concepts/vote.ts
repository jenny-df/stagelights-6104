import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface VoteDoc extends BaseDoc {
  value: 1 | -1;
  post: ObjectId;
  user: ObjectId;
}

export default class VoteConcept {
  public readonly votes = new DocCollection<VoteDoc>("votes");

  async create(user: ObjectId, post: ObjectId, upvote: boolean) {
    let value: 1 | -1;
    if (upvote) value = 1;
    else value = -1;
    const _id = await this.votes.createOne({ user, value, post });
    return { msg: "Vote successfully created!", tag: await this.votes.readOne({ _id }) };
  }
}
