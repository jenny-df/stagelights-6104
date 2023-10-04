import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface ApplicationDoc extends BaseDoc {
  user: ObjectId;
  portfolio: ObjectId;
  status: "approved" | "audition" | "rejected" | "pending" | "withdrawn" | "dormant";
  text: string;
  media: ObjectId;
  applicationFor: ObjectId;
}

export default class ApplicationConcept {
  public readonly applications = new DocCollection<ApplicationDoc>("applications");

  async create(user: ObjectId, portfolio: ObjectId, text: string, media: ObjectId, applicationFor: ObjectId) {
    const status = "pending";
    const _id = await this.applications.createOne({ user, portfolio, status, text, media, applicationFor });
    return { msg: "Application successfully created!", tag: await this.applications.readOne({ _id }) };
  }
}
