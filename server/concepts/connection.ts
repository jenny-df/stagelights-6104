import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ConnectionDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId;
}

export interface ConnectionRequestDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
  status: "pending" | "rejected" | "accepted";
}

export default class ConnectionConcept {
  public readonly connection = new DocCollection<ConnectionDoc>("connection");
  public readonly requests = new DocCollection<ConnectionRequestDoc>("connectionRequests");

  /**
   * Retrieves the requests to and from the given user
   * @param user user we're trying to get the requests from and to
   * @returns the requests to and from a given user
   */
  async getRequests(user: ObjectId) {
    return await this.requests.readMany({ to: user, status: "pending" });
  }

  /**
   * Sends a request from one user to another unless they're already connected
   * @param from user id who's sending request
   * @param to user id who's being requested for a connection
   * @returns an object with a success message
   */
  async sendRequest(from: ObjectId, to: ObjectId) {
    await this.canSendRequest(from, to);
    await this.requests.createOne({ from, to, status: "pending" });
    return { msg: "Sent request!" };
  }

  /**
   * Accepts a connection request
   * @param from user id who sent request
   * @param to user id who's accepting request
   * @returns an object with a success message
   */
  async acceptRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    void this.requests.createOne({ from, to, status: "accepted" });
    void this.addConnection(from, to);
    return { msg: "Accepted request!" };
  }

  /**
   * Rejects a connection request
   * @param from user id who sent request
   * @param to user id who's accepting request
   * @returns an object with a success message
   */
  async rejectRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    await this.requests.createOne({ from, to, status: "rejected" });
    return { msg: "Rejected request!" };
  }

  /**
   * Removes a connection request if it exists
   * @param from user id who sent request
   * @param to user id who was requested
   * @returns an object with a success message
   */
  async removeRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    return { msg: "Removed request!" };
  }

  /**
   * Removes a connection if it exists
   * @param user user id removing the connection
   * @param user2 user id being removed as a connection
   * @returns an object containing a success message
   * @throws ConnectionNotFoundError if the connection doesn't exist
   */
  async removeConnection(user: ObjectId, user2: ObjectId) {
    const connection = await this.connection.popOne({
      $or: [
        { user1: user, user2: user2 },
        { user1: user2, user2: user },
      ],
    });
    if (connection === null) {
      throw new ConnectionNotFoundError(user, user2);
    }
    return { msg: "Removed connection!" };
  }

  /**
   * Gets the connections of a given user
   * @param user user id we're getting connections for
   * @returns the connections of that user
   */
  async getConnections(user: ObjectId) {
    const connections = await this.connection.readMany({
      $or: [{ user1: user }, { user2: user }],
    });
    return connections.map((connection) => (connection.user1.toString() === user.toString() ? connection.user2 : connection.user1));
  }

  /**
   * Creates a connection between 2 users
   * @param user1 id of the first user
   * @param user2 id of the second user
   */
  private async addConnection(user1: ObjectId, user2: ObjectId) {
    void this.connection.createOne({ user1, user2 });
  }

  /**
   * Removes a connection request if it exists
   * @param from user id who sent request
   * @param to user id who was requested
   * @throws ConnectionRequestNotFoundError if the connection request doesn't exist
   */
  private async removePendingRequest(from: ObjectId, to: ObjectId) {
    const request = await this.requests.popOne({ from, to, status: "pending" });
    if (!request) {
      throw new ConnectionRequestNotFoundError(from, to);
    }
  }

  /**
   * Checks if two users are not connected already
   * @param u1 id of the first user
   * @param u2 id of the second user
   * @throws AlreadyConnectedError if the users are already connected
   */
  private async isNotConnected(u1: ObjectId, u2: ObjectId) {
    const connection = await this.connection.readOne({
      $or: [
        { from: u1, to: u2 },
        { from: u2, to: u1 },
      ],
    });
    if (connection !== null || u1.toString() === u2.toString()) {
      throw new AlreadyConnectedError(u1, u2);
    }
  }

  /**
   * Checks if a user can send a connection request to another user
   * @param u1 id of the first user
   * @param u2 id of the second user
   * @throws ConnectionRequestAlreadyExistsError if a request was already sent
   * @throws AlreadyConnectedError if the users are already connected
   */
  private async canSendRequest(u1: ObjectId, u2: ObjectId) {
    await this.isNotConnected(u1, u2);
    // check if there is pending request between these users
    const request = await this.requests.readOne({
      from: { $in: [u1, u2] },
      to: { $in: [u1, u2] },
      status: "pending",
    });
    if (request !== null) {
      throw new ConnectionRequestAlreadyExistsError(u1, u2);
    }
  }
}

export class ConnectionRequestNotFoundError extends NotFoundError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Connection request from {0} to {1} does not exist!", from, to);
  }
}

export class ConnectionRequestAlreadyExistsError extends NotAllowedError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Connection request between {0} and {1} already exists!", from, to);
  }
}

export class ConnectionNotFoundError extends NotFoundError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("Connection between {0} and {1} does not exist!", user1, user2);
  }
}

export class AlreadyConnectedError extends NotAllowedError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("{0} and {1} are already connected!", user1, user2);
  }
}
