import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface FocusedPostDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  media: ObjectId[];
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
   */
  async create(author: ObjectId, content: string, media: ObjectId[], category: ObjectId) {
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
    return await this.posts.readMany(query, {
      sort: { dateUpdated: -1 },
    });
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
   * Finds a post by id
   * @param _id id of the post
   * @returns post that has that id
   * @throws BadValuesError if no post exists with that id
   */
  async getById(_id: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (post) {
      return post;
    }
    throw new BadValuesError("Post with id {0} doesn't exist", _id);
  }

  /**
   * Finds a post by id and verifies if it was posted by the person given
   * @param _id id of the post
   * @param user id of the potential author
   * @returns post that has that id
   */
  async getAndVerify(_id: ObjectId, user: ObjectId) {
    return await this.isAuthor(user, _id);
  }

  /**
   * Updates information about a post
   * @param _id id of a post
   * @param update the new information of the post
   * @param user id of the user updating the post
   * @returns an object containing a success message
   */
  async update(_id: ObjectId, update: Partial<FocusedPostDoc>, user: ObjectId) {
    const post = await this.isAuthor(user, _id);
    this.sanitizeUpdate(update);
    if (update.category && update.content) {
      await this.verifyCategory(update.content, update.category);
    } else if (update.category) {
      await this.verifyCategory(post.content, update.category);
    } else if (update.content) {
      await this.verifyCategory(update.content, post.category);
    }
    await this.posts.updateOne({ _id }, update);
    return { msg: "Focused post successfully updated!" };
  }

  /**
   * Gets all the media for a post by id
   * @param _id id of the focused post
   * @returns the media for a given post if it exists
   */
  async getMediaById(_id: ObjectId) {
    return (await this.getById(_id)).media;
  }

  /**
   * Deletes a given post if the user is that author
   * @param _id id of a post
   * @param user id of user trying to delete post
   * @returns an object containing a success message
   */
  async delete(_id: ObjectId, user: ObjectId) {
    await this.isAuthor(user, _id);
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
   */
  async getCategory(_id: ObjectId) {
    return await this.doesntExist(_id);
  }

  /**
   * Creates a new category if one doesn't already exists with the same name
   * @param name name of category
   * @param description description on what the category means
   * @returns an object containing a success message and category object
   */
  async createCategory(name: string, description: string) {
    await this.validCategory(name, description);
    const _id = await this.categories.createOne({ name, description });
    return { msg: "Category successfully created!", category: await this.categories.readOne({ _id }) };
  }

  /**
   * Deletes a given category and all its posts
   * @param _id id of the category
   * @returns a success message
   */
  async deleteCategory(_id: ObjectId) {
    await this.categories.deleteOne({ _id });
    await this.posts.deleteMany({ category: _id });
    return { msg: "successfully deleted category and its posts" };
  }

  /**
   * Deletes all a users posts
   * @param user id of the user
   * @returns a success message
   */
  async deleteUser(user: ObjectId) {
    await this.posts.deleteMany({ user });
    return { msg: "successfully deleted all user's posts" };
  }

  /**
   * Checks if a user is the author of a post
   * @param user id of user that we're checking
   * @param _id id of a post
   * @returns focused post object if found and is for the given user
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
    return post;
  }

  /**
   * Checks if a given category doens't already exists
   * @param _id id of the category
   * @throws NotFoundError if the category isn't found
   */
  private async doesntExist(_id: ObjectId) {
    const found = await this.categories.readOne({ _id });
    if (!found) {
      throw new NotFoundError(`'${_id}' category not found`);
    }
    return found;
  }

  /**
   * Checks if the new category parameters contain text and if we're duplicating a
   * category name
   * @param name the name of the new category
   * @param description the description of the new category
   * @throws NotAllowedError if one or both are left empty or if the name already exists
   */
  private async validCategory(name: string, description: string) {
    if (!(name && description)) {
      throw new NotAllowedError("Name or description of category missing");
    }
    const found = await this.categories.readOne({ name });
    if (found) {
      throw new NotAllowedError(`'${name}' category already exists`);
    }
  }

  /**
   * Verifies the content and category of a new post
   * @param content text of a post
   * @param category category given to the post
   * @throws NotAllowedError if the content or category are left empty
   */
  private async verifyCategory(content: string, category: ObjectId) {
    await this.doesntExist(category);
    // HERE (Need a way to verify that the content belongs to the content)
    if (content && category) {
      return;
    }
    throw new NotAllowedError(`Category or content missing`);
  }

  /**
   * Sanitizes an update field
   * @param update the new content that's being updated
   * @throws NotAllowedError if trying to update a readonly field
   */
  private sanitizeUpdate(update: Partial<FocusedPostDoc>) {
    const allowedUpdates = ["content", "category"];
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
