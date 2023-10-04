import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface CommentDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  parent: ObjectId;
}

export default class CommentConcept {
  public readonly comments = new DocCollection<CommentDoc>("comments");

  /**
   * Creates a new comment
   * @param author id of user commenting
   * @param content text in the comment
   * @param parent id of what the comment is on (another comment / post)
   * @returns an object containing a success messgae and the comment object
   */
  async create(author: ObjectId, content: string, parent: ObjectId) {
    const _id = await this.comments.createOne({ author, content, parent });
    return { msg: "Comment successfully created!", comment: await this.comments.readOne({ _id }) };
  }

  /**
   * Gets the comments for a parent item (post/comment)
   * @param parent id of parent object (item that was commented on)
   * @returns comment objects that belong to the parent given
   */
  async getByParent(parent: ObjectId) {
    const comments = await this.comments.readMany(
      { parent },
      {
        sort: { dateUpdated: -1 },
      },
    );
    return comments;
  }

  /**
   * Gets the comment by id
   * @param _id id of comment
   * @returns comment objects that belong to the parent given
   */
  async getComment(_id: ObjectId) {
    return await this.comments.readOne({ _id });
  }

  /**
   * Update the contents of a comment
   * @param _id id of comment
   * @param user id of user trying to delete comment
   * @param newContent updated text of the comment
   * @returns an object containing a success message
   * @throws NotFoundError if the comment doesn't exist
   * @throws CommentAuthorNotMatchError if the user isn't the author comment
   */
  async update(_id: ObjectId, user: ObjectId, newContent: string) {
    await this.isAuthor(user, _id);
    await this.comments.updateOne({ _id }, { content: newContent });
    return { msg: "Comment successfully updated!" };
  }

  /**
   * Deletes a comment
   * @param _id id of comment
   * @param user id of user trying to delete comment
   * @returns an object containing a success message
   * @throws NotFoundError if the comment doesn't exist
   * @throws CommentAuthorNotMatchError if the user isn't the author comment
   */
  async delete(_id: ObjectId, user: ObjectId) {
    await this.isAuthor(user, _id);
    await this.comments.deleteOne({ _id });
    return { msg: "Comment deleted successfully!" };
  }

  private async isAuthor(user: ObjectId, _id: ObjectId) {
    const comment = await this.comments.readOne({ _id });
    if (!comment) {
      throw new NotFoundError(`Comment ${_id} does not exist!`);
    }
    if (comment.author.toString() !== user.toString()) {
      throw new CommentAuthorNotMatchError(user, _id);
    }
  }
}

export class CommentAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of comment {1}!", author, _id);
  }
}
