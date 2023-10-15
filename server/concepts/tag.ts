import { ObjectId } from "mongodb";

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
   * Creates a new tag
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
    return await this.tags.readMany(
      { post },
      {
        sort: { dateUpdated: -1 },
      },
    );
  }

  /**
   * Gets tags for a given user
   * @user id of the user that we're retrieving tags for
   * @returns tag objects which belong to a given user
   */
  async getByTagged(tagged: ObjectId) {
    return await this.tags.readMany(
      { tagged },
      {
        sort: { dateUpdated: -1 },
      },
    );
  }

  /**
   * Deletes a tag if the post exists and the user deleting is the tagger
   * @param user id of the user deleting
   * @param tagged id of the tagged user
   * @param post id of the post containing the tag
   * @returns an object containing a success message
   * @throws BadValuesError if no tag object exists for tagged user on post
   */
  async deleteTag(user: ObjectId, tagged: ObjectId, post: ObjectId) {
    const tagId = (await this.tags.readOne({ tagged, post }))?._id;
    if (tagId) {
      await this.isTagger(tagId, user);
      await this.tags.deleteOne({ _id: tagId });
      return { msg: "Tag deleted successfully!" };
    }
    throw new BadValuesError("Tag doesn't exist");
  }

  /**
   * Removes all tags by and for a user
   * @param user id of the user trying to delete tag
   * @returns an object containing a success message
   */
  async deleteUser(user: ObjectId) {
    await this.tags.deleteMany({
      $or: [{ tagged: user }, { tagger: user }],
    });
    return { msg: "Tags deleted successfully!" };
  }

  /**
   * Removes all tags for a given post
   * @param user id of the user trying to delete tag
   * @returns an object containing a success message
   */
  async deletePost(post: ObjectId) {
    await this.tags.deleteMany({ post });
    return { msg: "Tags deleted successfully!" };
  }

  /**
   * Checks if a given post already has a tag for given user
   * @param tagged id of the user being tagged
   * @param post id of the post we're checking
   * @throws DuplicatedTagError if the user is already tagged in the given post
   */
  private async tagExists(tagged: ObjectId, post: ObjectId) {
    const tag = await this.tags.readOne({ tagged, post });
    if (tag) {
      throw new DuplicatedTagError(tagged, post);
    }
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
      throw new TaggerNotMatchError(user, tag.post);
    }
  }
}

export class TaggerNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly post: ObjectId,
  ) {
    super("{0} is not the tagger for the following post: {1}!", user, post);
  }
}

export class DuplicatedTagError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly post: ObjectId,
  ) {
    super("{0} is already tagged in the following post: {1}!", user, post);
  }
}
