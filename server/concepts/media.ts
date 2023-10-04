import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface MediaDoc extends BaseDoc {
  user: ObjectId;
  content: File;
  url: string | null;
}

export default class MediaConcept {
  public readonly medias = new DocCollection<MediaDoc>("medias");

  async create(user: ObjectId, content?: File, url?: string) {
    const _id = await this.medias.createOne({ user, content, url });
    return { msg: "Media successfully created!", media: await this.medias.readOne({ _id }) };
  }
}
