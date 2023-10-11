import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface TagDoc extends BaseDoc {
  tagger: ObjectId;
  tagged: ObjectId;
  post: ObjectId;
}

export default class TagConcept {
  public readonly tags = new DocCollection<TagDoc>("tags");

  /**
   * New tag
   * @param tagger id of the user tagging
   * @param tagged id of the user tagged
   * @param post id of the post tag is on
   * @returns an object containing a success message and the tag object
   */
  async create(tagger: ObjectId, tagged: ObjectId, post: ObjectId) {
    await this.tagExists(tagged, post);
    const _id = await this.tags.createOne({ tagger, tagged, post });
    return { msg: "Tag successfully created!", tag: await this.tags.readOne({ _id }) };
  }

  /**
   * Gets tags for a given post
   * @param post id of the post that we're retrieving tags for
   * @returns tag objects which belong to a given post
   */
  async getByPost(post: ObjectId) {
    return await this.getTags({ post });
  }

  /**
   * Gets tags for a given user
   * @user id of the user that we're retrieving tags for
   * @returns tag objects which belong to a given user
   */
  async getByTagged(tagged: ObjectId) {
    return await this.getTags({ tagged });
  }

  /**
   * Removes a given tag
   * @param user id of the user trying to delete tag
   * @param tagged id of tagged user
   * @param post id of post
   * @returns an object containing a success message
   * @throws Bad
   */
  async delete(user: ObjectId, tagged: ObjectId, post: ObjectId) {
    return await this.deleteTag(user, tagged, post);
  }

  private async tagExists(tagged: ObjectId, post: ObjectId) {
    const tag = await this.tags.readOne({ tagged, post });
    if (tag) {
      throw new NotAllowedError("can't duplicate a tag");
    }
  }

  private async deleteTag(user: ObjectId, tagged: ObjectId, post: ObjectId) {
    const tagId = (await this.tags.readOne({ tagged, post }))?._id;
    if (tagId) {
      await this.isTagger(tagId, user);
      await this.tags.deleteOne({ _id: tagId });
      return { msg: "Tag deleted successfully!" };
    }
    throw new BadValuesError("Tag doesn't exist");
  }

  /**
   * Figures out if the user given is the tagger of a given tag
   * @param _id id of the tag
   * @param user id of the proposed tagger
   * @throws NotFoundError if there is no tag with the given id
   * @throws TaggerNotMatchError if the user given isn't the tagger
   */
  private async isTagger(_id: ObjectId, user: ObjectId) {
    const tag = await this.tags.readOne({ _id });
    if (!tag) {
      throw new NotFoundError(`Tag ${_id} does not exist!`);
    }
    if (tag.tagger.toString() !== user.toString()) {
      throw new TaggerNotMatchError(user, _id);
    }
  }

  /**
   * Get tags based on a query specified
   * @param query the filtering query to find the tags
   * @returns all tags that are produced by the filtering
   */
  private async getTags(query: Filter<TagDoc>) {
    const tags = await this.tags.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return tags;
  }
}

export class TaggerNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the tagger of {1}!", user, _id);
  }
}
