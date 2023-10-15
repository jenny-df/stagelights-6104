import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface QueueDoc extends BaseDoc {
  queueManager: ObjectId;
  queueFor: ObjectId;
  queue: ObjectId[];
  startTime: Date;
  timePerPerson: number;
  currentPosition: number;
  totalQueued: number;
}

export default class QueueConcept {
  public readonly queues = new DocCollection<QueueDoc>("queues");

  /**
   * Creates a new queue for an opportunity if it doesn't already exist
   * @param queueManager id of the queue manager
   * @param queueFor id of the opportunity that has the queue
   * @param queue users in the queue (in order that they are being interviewed/auditioning)
   * @param startTime start time of the interview/audition
   * @param timePerPerson estimated number of hours per person in queue
   * @returns an object containing a success message and a queue object
   */
  async create(queueManager: ObjectId, queueFor: ObjectId, queue: ObjectId[], startTime: Date, timePerPerson: number) {
    await this.alreadyExists(queueFor);
    const currentPosition = 0;
    const totalQueued = queue.length;
    const _id = await this.queues.createOne({ queueManager, queueFor, queue, startTime, timePerPerson, currentPosition, totalQueued });
    return { msg: "Queue successfully created!", queue: await this.queues.readOne({ _id }) };
  }

  /**
   * Finds the estimated time for a given user in a given queue
   * @param queueFor if of the opportunity the user is queued in
   * @param user id of the user checking their estimated time
   * @returns the estimated start time for the given user
   * @throws NotInQueueError if the user isn't in queue
   */
  async getEstimatedTime(queueFor: ObjectId, user: ObjectId) {
    const queue = await this.doesntExist(queueFor);
    const stringQueue = queue.queue.map((userQueued) => userQueued.toString());
    const index = stringQueue.indexOf(user.toString());
    if (index !== -1) {
      const posInQueue = index + 1;
      const hrsFromStart = posInQueue * queue.timePerPerson;
      const estimatedTime = new Date(queue.startTime);
      estimatedTime.setHours(hrsFromStart);
      return estimatedTime;
    }
    throw new NotInQueueError(user, queueFor);
  }

  /**
   * Progresses the queue if possible and finds the person just removed from the queue
   * and the next person so they can be notified
   * @param user id of the user trying to progress the queue
   * @param queueFor id of the opportunity that the queue belongs to
   * @returns an object containing the id of the latest user removed from the queue
   *          and the id of the next user in the queue
   */
  async progressQueue(user: ObjectId, queueFor: ObjectId) {
    const queue = await this.doesntExist(queueFor);
    this.isManager(user, queue.queueManager);

    const newPosition = queue.currentPosition + 1;
    if (queue.totalQueued < newPosition) {
      throw new NotAllowedError("Went through everyone in queue;");
    }
    await this.queues.updateOne({ queueFor }, { currentPosition: newPosition });

    const current = queue.queue[newPosition - 1];
    const nextQueued = queue.queue[newPosition] ?? null;
    return { next: nextQueued, current: current };
  }

  /**
   * Deletes the queue for a given opportunity if it exists
   * @param user id of user trying to delete
   * @param queueFor id of the opportunity it's creating a queue for
   * @returns an object containing a success message
   */
  async delete(user: ObjectId, queueFor: ObjectId) {
    const queue = await this.doesntExist(queueFor);
    this.isManager(user, queue.queueManager);
    await this.queues.deleteOne({ queueFor });
    return { msg: "Queue successfully deleted!" };
  }

  /**
   * Deletes all queues created by a given user
   * @param queueManager id of the user managing the queues
   * @returns an object containing a success message
   */
  async deleteAllManagerQueues(queueManager: ObjectId) {
    await this.queues.deleteMany({ queueManager });
    return { msg: "Queue successfully deleted all user's queues!" };
  }

  /**
   * Checks if a given opportunity already has a queue
   * @param queueFor id of the opportunity we're checking
   * @throws DuplicateQueueError if the opportunity already has a queue
   */
  private async alreadyExists(queueFor: ObjectId) {
    const queue = await this.queues.readOne({ queueFor });
    if (queue) {
      throw new DuplicateQueueError(queueFor);
    }
  }

  /**
   * Checks if a given opportunity has a queue or not
   * @param queueFor id of the opportunity we're checking
   * @returns queue object for the opportunity if it exists
   * @throws NoQueueError if no queue exists for the given opportunity
   */
  private async doesntExist(queueFor: ObjectId) {
    const queue = await this.queues.readOne({ queueFor });
    if (!queue) {
      throw new NoQueueError(queueFor);
    }
    return queue;
  }

  /**
   * Checks if a given user is the manager of a queue
   * @param user id of the user who we're checking
   * @param queueManager id of the managing user
   * @throws NotManagerError if the user isn't the managing user
   */
  private isManager(user: ObjectId, queueManager: ObjectId) {
    if (queueManager.toString() !== user.toString()) {
      throw new NotManagerError(user);
    }
  }
}

export class DuplicateQueueError extends NotAllowedError {
  constructor(public readonly opId: ObjectId) {
    super("There already exists a queue for {0}", opId);
  }
}

export class NoQueueError extends NotFoundError {
  constructor(public readonly opId: ObjectId) {
    super("There is no queue for ", opId);
  }
}

export class NotManagerError extends NotAllowedError {
  constructor(public readonly user: ObjectId) {
    super("{0} is not the manager of this queue!", user);
  }
}

export class NotInQueueError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly opId: ObjectId,
  ) {
    super("{0} is not in the queue for !", user, opId);
  }
}
