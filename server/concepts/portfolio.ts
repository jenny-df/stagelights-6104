import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface Style {
  backgroundImage: string | null;
  backgroundColor: string | null;
  font: string;
  fontSize: number;
  textColor: string;
}

export interface ProfessionalInfo {
  education: string[];
  experience: string[];
  skills: string[];
  languages: string[];
}

export interface PortfolioDoc extends BaseDoc {
  user: ObjectId;
  style: Style;
  intro: string;
  info: ProfessionalInfo;
  media: ObjectId[];
  headshot: ObjectId;
}

export default class PortfolioConcept {
  public readonly portfolios = new DocCollection<PortfolioDoc>("portfolios");

  /**
   * Creates a new portfolio for a given user
   * @param user id of user who owns portfolio
   * @param style customized style of the portfolio
   * @param intro the introductory paragraph
   * @param info professional information about the user
   * @param media media that highlights the user's talent
   * @param headshot headshot of the user
   * @returns an object containing a success message and a portfolio object
   */
  async create(user: ObjectId, headshot: ObjectId) {
    await this.alreadyExists(user);
    const style = {
      backgroundImage: null,
      backgroundColor: "white",
      font: "Ariel",
      fontSize: 12,
      textColor: "black",
    };
    const info = {
      education: [],
      experience: [],
      skills: [],
      languages: [],
    };
    const _id = await this.portfolios.createOne({ user, style, intro: "", info, media: [], headshot });
    return { msg: "Portfolio successfully created!", portfolio: await this.portfolios.readOne({ _id }) };
  }

  /**
   * Gets the portfolio of a given user if it exists
   * @param user id of the user
   * @returns portfolio of the user
   */
  async getByUser(user: ObjectId) {
    return await this.doesntExist(user);
  }

  /**
   * Deletes a portfolio for a given user
   * @param user id of the user
   * @returns an object containing a success message
   */
  async delete(user: ObjectId) {
    await this.portfolios.deleteOne({ user });
    return { msg: "Porfolio has been successfully deleted" };
  }

  /**
   * Updates the information of a portfolio
   * @param user id of user who's portfolio is being updated
   * @param update new information for the portfolio
   * @returns an object containing a success message
   */
  async update(user: ObjectId, update: Partial<PortfolioDoc>) {
    this.sanitizeUpdate(update);
    await this.portfolios.updateOne({ user }, update);
    return { msg: "Porfolio updated successfully!" };
  }

  /**
   * Updates the user's headshot on the portfolio
   * @param user id of user who's portfolio is being updated
   * @param headshot id of the media headshot
   * @returns the old headshot
   */
  async updateHeadshot(user: ObjectId, headshot: ObjectId) {
    const oldHeadshot = (await this.portfolios.readOne({ user }))?.headshot;
    await this.portfolios.updateOne({ user }, { headshot });
    return oldHeadshot;
  }

  /**
   * Adds a piece of media to the user's portfolio
   * @param user id of the user who's updating their media
   * @param media id of the media being added
   * @returns an object containing a success message
   */
  async addMedia(user: ObjectId, media: ObjectId) {
    const portfolio = await this.doesntExist(user);
    portfolio.media.push(media);
    await this.portfolios.updateOne({ user }, { media: portfolio.media });
    return { msg: "successfully added the media given" };
  }

  /**
   * Removes a piece of media from the user's portfolio if found
   * @param userId id of the user who's updating their media
   * @param media id of the media being removed
   * @returns an object containing a success message
   */
  async removeMedia(userId: ObjectId, media: ObjectId) {
    const newMedia = await this.getMediaAndRemove(userId, media);
    await this.portfolios.updateOne({ user: userId }, { media: newMedia });
    return { msg: "successfully removed the media given" };
  }

  /**
   * Sanitizes an update field
   * @param update the new content that's being updated
   * @throws NotAllowedError if trying to update a readonly field
   */
  private sanitizeUpdate(update: Partial<PortfolioDoc>) {
    const allowedUpdates = ["style", "intro", "info", "headshot"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }

  /**
   * Tries to find the media on the portfolio for a given user and remove a given media
   * @param user id of the user we're getting the media for
   * @param media id of the media being removed
   * @returns an array of media object ids
   * @throws BadValuesError if the media doesn't exist in the array
   */
  private async getMediaAndRemove(user: ObjectId, media: ObjectId) {
    const portfolio = await this.doesntExist(user);
    const stringMedia = portfolio.media.map((id) => id.toString());
    const index = stringMedia.indexOf(media.toString());
    if (index !== -1) {
      return portfolio.media.splice(index, 1);
    }
    throw new BadValuesError("The media given doesn't exist in the media of the portfolio");
  }

  /**
   * Checks if a given user doesn't have a porfolio
   * @param user id of the user we're checking
   * @returns portfolio object if it exists
   * @throws NoPortfolioError if the user doesn't already have a porfolio
   */
  private async doesntExist(user: ObjectId) {
    const portfolio = await this.portfolios.readOne({ user });
    if (!portfolio) {
      throw new NoPortfolioError(user);
    }
    return portfolio;
  }

  /**
   * Checks if a given user already has a porfolio
   * @param user id of the user we're checking
   * @throws HasPortfolioError if the user already has a porfolio
   */
  private async alreadyExists(user: ObjectId) {
    if (await this.portfolios.readOne({ user })) {
      throw new HasPortfolioError(user);
    }
  }
}

export class NoPortfolioError extends NotFoundError {
  constructor(public readonly user: ObjectId) {
    super("{0} already has a portfolio! They can't have 2", user);
  }
}

export class HasPortfolioError extends NotAllowedError {
  constructor(public readonly user: ObjectId) {
    super("{0} already has a portfolio! They can't have 2", user);
  }
}
