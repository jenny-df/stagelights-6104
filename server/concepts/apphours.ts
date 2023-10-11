import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError } from "./errors";

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

  async initialize(user: ObjectId, hourDivisions: HourDivision[]) {
    this.addUpToTotal(hourDivisions);
    await this.satisfiesMin(hourDivisions);
    await this.categoriesDontExist(hourDivisions);
    await this.userExists(user);
    const _id = await this.hours.createOne({ user, hourDivisions });
    return { msg: "AppHour successfully created!", appHour: await this.hours.readOne({ _id }) };
  }

  getTotalHours() {
    return this.totalHours;
  }

  getMinHours() {
    return this.minHours;
  }

  async setTotalHours(newTotal: number) {
    const numCategories = (await this.getAllCategories()).length;
    if (this.minHours * numCategories <= newTotal) {
      this.totalHours = newTotal;
    }
    throw new BadValuesError("The minimum number of hours on each category means that users wil have to go over limit! Either decrease the minimum number of hours or increase the total time.");
  }

  async setMinHours(newMin: number) {
    const numCategories = (await this.getAllCategories()).length;
    if (newMin * numCategories <= this.totalHours) {
      this.minHours = newMin;
    }
    throw new BadValuesError("This new minimum number of hours on each category means that users wil have to go over limit! Either decrease the minimum number of hours or increase the total time.");
  }

  async getAllCategories() {
    return await this.divisionCategories.readMany({});
  }

  async addCategory(name: string) {
    const newNumCategories = (await this.getAllCategories()).length + 1;
    if (this.minHours * newNumCategories <= this.totalHours) {
      await this.categoryExists(name);
      await this.divisionCategories.createOne({ category: name });
    }
  }

  async removeCategory(name: string) {
    await this.divisionCategories.deleteOne({ name });
  }

  async getCategoryById(_id: ObjectId) {
    return await this.divisionCategories.readOne({ _id });
  }

  private async userExists(user: ObjectId) {
    const userFound = await this.hours.readOne({ user });
    if (userFound) {
      throw new NotAllowedError("User already has an app hours entry");
    }
  }

  private async categoryExists(name: string) {
    const category = await this.divisionCategories.readOne({ name });
    if (category) {
      throw new NotAllowedError("There already exists a category with the name {0}", name);
    }
  }

  private async categoryDoesntExist(_id: ObjectId) {
    const category = await this.divisionCategories.readOne({ _id });
    if (!category) {
      throw new NotAllowedError("No category exists with the id: {0}", _id);
    }
  }

  private async categoriesDontExist(hourDivisions: HourDivision[]) {
    for (const category of hourDivisions) {
      await this.categoryDoesntExist(category.category);
    }
  }

  private addUpToTotal(hourDivisions: HourDivision[]) {
    let total = 0;
    for (const category of hourDivisions) {
      total += category.hours;
    }
    if (total !== this.totalHours) {
      throw new HoursDontEqualTotalError(total, this.totalHours);
    }
  }

  private async satisfiesMin(hourDivisions: HourDivision[]) {
    for (const category of hourDivisions) {
      if (category.hours < this.minHours) {
        const categoryName = (await this.getCategoryById(category.category))?.category ?? "DELETED";
        throw new HoursLessThanMinError(categoryName, category.hours, this.minHours);
      }
    }
  }
}

export class HoursDontEqualTotalError extends BadValuesError {
  constructor(
    public readonly actual: number,
    public readonly expected: number,
  ) {
    super("The total currently is {0} hours but it should be {1} hours!", actual, expected);
  }
}

export class HoursLessThanMinError extends BadValuesError {
  constructor(
    public readonly category: string,
    public readonly actual: number,
    public readonly expected: number,
  ) {
    super("The time allocated for {0} is currently {1} hours but it should be at least {2}!", category, actual, expected);
  }
}
