import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface Style {
  backgroundImage: string;
  backgroundColor: string;
  font: string;
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

  async create(user: ObjectId, style: Style, intro: string, info: ProfessionalInfo, media: ObjectId[], headshot: ObjectId) {
    const _id = await this.portfolios.createOne({ user, style, intro, info, media, headshot });
    return { msg: "Portfolio successfully created!", portfolio: await this.portfolios.readOne({ _id }) };
  }
}
