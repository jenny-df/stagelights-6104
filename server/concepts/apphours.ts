import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface HourDivision {
  category: ObjectId;
  hours: number;
}

export interface AppHourDoc extends BaseDoc {
  user: ObjectId;
  hourDivisions: HourDivision[];
}

export interface AppCategoriesDoc extends BaseDoc {
  category: string;
}

export default class AppHourConcept {
  public readonly hours = new DocCollection<AppHourDoc>("appHours");
  private totalHours = 2;
  private minHours = 0.5;
  private divisionCategories = new DocCollection<AppCategoriesDoc>("appCategories");

  async create(user: ObjectId, hourDivisions: HourDivision[]) {
    const _id = await this.hours.createOne({ user, hourDivisions });
    return { msg: "AppHour successfully created!", appHour: await this.hours.readOne({ _id }) };
  }
}
