import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface QueueDoc extends BaseDoc {
  queueManager: ObjectId;
  queueFor: ObjectId;
  queue: ObjectId[];
  startTime: Date;
  timePerPerson: Date;
  currentPosition: number;
}

export default class QueueConcept {
  public readonly queues = new DocCollection<QueueDoc>("queues");

  async create(queueManager: ObjectId, queueFor: ObjectId, queue: ObjectId[], startTime: Date, timePerPerson: Date) {
    const currentPosition = 1;
    const _id = await this.queues.createOne({ queueManager, queueFor, queue, startTime, timePerPerson, currentPosition });
    return { msg: "Queue successfully created!", queue: await this.queues.readOne({ _id }) };
  }
}
