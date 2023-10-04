import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FocusedPostDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  media: ObjectId;
  category: ObjectId;
}

export interface CategoriesDoc extends BaseDoc {
  name: string;
  description: string;
}

export default class FocusedPostConcept {
  public readonly posts = new DocCollection<FocusedPostDoc>("focused posts");
  public readonly categories = new DocCollection<CategoriesDoc>("focused post categories");

  /**
   * Creates a new focused post
   * @param author id of poster
   * @param content text content of the post
   * @param media media in the post
   * @param category id of focused category
   * @returns an object containing a success message and focused post object
   * @throws NotFoundError if the category isn't found
   */
  async create(author: ObjectId, content: string, media: ObjectId, category: ObjectId) {
    await this.checkCategory(category);
    await this.verifyCategory(content, category);
    const _id = await this.posts.createOne({ author, content, media, category });
    return { msg: "Focused post successfully created!", post: await this.posts.readOne({ _id }) };
  }

  /**
   * Filters posts by a given query
   * @param query how the posts are being filtered
   * @returns posts that passed the filter
   */
  async getFocusedPosts(query: Filter<FocusedPostDoc>) {
    const posts = await this.posts.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return posts;
  }

  /**
   * Finds all the posts by a given user
   * @param author author of posts
   * @returns posts from the author given
   */
  async getByAuthor(author: ObjectId) {
    return await this.getFocusedPosts({ author });
  }

  /**
   * Updates information about a post
   * @param _id id of a post
   * @param update the new information of the post
   * @param userId id of the user updating the post
   * @returns an object containing a success message
   * @throws NotFoundError if post doesn't exist
   * @throws FocusedPostAuthorNotMatchError if user isn't author
   */
  async update(_id: ObjectId, update: Partial<FocusedPostDoc>, userId: ObjectId) {
    await this.isAuthor(userId, _id);
    this.sanitizeUpdate(update);
    await this.posts.updateOne({ _id }, update);
    return { msg: "Focused post successfully updated!" };
  }

  /**
   * Deletes a given post if the user is that author
   * @param _id id of a post
   * @param userId id of user trying to delete post
   * @returns an object containing a success message
   * @throws NotFoundError if post doesn't exist
   * @throws FocusedPostAuthorNotMatchError if user isn't author
   */
  async delete(_id: ObjectId, userId: ObjectId) {
    await this.isAuthor(userId, _id);
    await this.posts.deleteOne({ _id });
    return { msg: "Focused post deleted successfully!" };
  }

  /**
   * Finds all category objects
   * @returns category objects
   */
  async getAllCategories() {
    return await this.categories.readMany({});
  }

  /**
   * Finds a category object given category's 'id
   * @param _id id of the category
   * @returns category object
   * @throws NotFoundError if the category isn't found
   */
  async getCategory(_id: ObjectId) {
    await this.checkCategory(_id);
    return await this.categories.readOne({ _id });
  }

  /**
   * Creates a new category if one doesn't already exists with the same name
   * @param name name of category
   * @param description description on what the category means
   * @returns an object containing a success message and category object
   * @throws NotAllowedError if the category is found
   */
  async createCategory(name: string, description: string) {
    await this.checkNotCategory(name);
    const _id = await this.categories.createOne({ name, description });
    return { msg: "Category successfully created!", category: await this.categories.readOne({ _id }) };
  }

  /**
   * Checks if a user is the author of a post
   * @param user id of user that we're checking
   * @param _id id of a post
   * @throws NotFoundError if post doesn't exist
   * @throws FocusedPostAuthorNotMatchError if user isn't author
   */
  private async isAuthor(user: ObjectId, _id: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Focused post ${_id} does not exist!`);
    }
    if (post.author.toString() !== user.toString()) {
      throw new FocusedPostAuthorNotMatchError(user, _id);
    }
  }

  /**
   * Checks if a given category doens't already exists
   * @param _id id of the category
   * @throws NotFoundError if the category isn't found
   */
  private async checkCategory(_id: ObjectId) {
    const found = await this.categories.readOne({ _id });
    if (!found) {
      throw new NotFoundError(`'${_id}' category not found`);
    }
  }

  /**
   * Checks if a given category already exists
   * @param _id id of the category
   * @throws NotAllowedError if the category is found
   */
  private async checkNotCategory(name: string) {
    const found = await this.categories.readOne({ name });
    if (found) {
      throw new NotAllowedError(`'${name}' category already exists`);
    }
  }

  /**
   *
   * @param content text of a post
   * @param category category given to the post
   * @throws NotAllowedError if the text doesn't match the category
   */
  private async verifyCategory(content: string, category: ObjectId) {
    // HERE (Need a way to verify that the content belongs to the content)
    if (!(content && category)) {
      throw new NotAllowedError(`Category doesnt match content`);
    }
  }

  /**
   * Sanitizes an update field
   * @param update the new content that's being updated
   * @throws NotAllowedError if trying to update a readonly field
   */
  private sanitizeUpdate(update: Partial<FocusedPostDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["content", "media", "options"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class FocusedPostAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of focused post {1}!", author, _id);
  }
}
