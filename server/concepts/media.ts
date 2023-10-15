import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotFoundError } from "./errors";

export interface MediaDoc extends BaseDoc {
  user: ObjectId;
  url: string;
}

export default class MediaConcept {
  public readonly medias = new DocCollection<MediaDoc>("medias");

  /**
   * Creates a piece of media
   * @param user id of the user who owns the new media
   * @param url string containing a url of a google drive image/video/audio
   * @returns id of the new media object
   */
  async create(user: ObjectId, url: string) {
    if (url) {
      this.isNotGoogleDriveLink(url);
      let edittedURL = url;
      if (url.endsWith("view?usp=share_link")) {
        edittedURL = edittedURL.replace("view?usp=share_link", "preview");
      }
      return await this.medias.createOne({ user, url: edittedURL });
    }
    throw new BadValuesError("can't leave url empty for media");
  }

  /**
   * Gets a piece of media by id if it exists
   * @param _id id of the media
   * @returns a media object
   */
  async getMediaById(_id: ObjectId) {
    return await this.doesntExists(_id);
  }

  /**
   * Gives the URLs for ids given
   * @param ids ids of media that are being changed to URLs
   * @returns array of URLs
   */
  async idsToURLs(ids: ObjectId[]) {
    return await Promise.all(ids.map(async (id) => (await this.doesntExists(id)).url));
  }

  /**
   * Deletes a piece of media by id if it exists
   * @param _id id of the media being deleted
   * @returns an object containing a success message
   */
  async delete(_id: ObjectId) {
    await this.medias.deleteOne({ _id });
    return { msg: "Deleted media successfully" };
  }

  /**
   * Deletes all the media for a given user
   * @param user id of the media being deleted
   * @returns an object containing a success message
   */
  async deleteUser(user: ObjectId) {
    await this.medias.deleteMany({ user });
    return { msg: "Deleted all media successfully" };
  }

  /**
   * Checks if a piece of media with a given id exists
   * @param _id id of media that we're checking
   * @returns the media if found
   * @throws NotFoundError if no media with the given id exists
   */
  private async doesntExists(_id: ObjectId) {
    const media = await this.medias.readOne({ _id });
    if (!media) {
      throw new NotFoundError("No media with id {0} exists", _id);
    }
    return media;
  }

  /**
   * Checks if a url contains drive.google.com (i.e. it's a google drive link)
   * @param url url of media that we're checking
   * @throws BadValuesError if the link isn't a google drive link (i.e. doesn't contain drive.google.com)
   */
  private isNotGoogleDriveLink(url: string) {
    if (!url.includes("drive.google.com")) {
      throw new BadValuesError("Media links must be Google Drive links. The current link isn't: {0}", url);
    }
  }
}
