import { SessionData } from "express-session";
import { ObjectId } from "mongodb";
import { NotAllowedError, UnauthenticatedError } from "./errors";

export type WebSessionDoc = SessionData;

// This allows us to overload express session data type.
// Express session does not support non-string values over requests.
// We'll be using this to store the user _id in the session.
declare module "express-session" {
  export interface SessionData {
    user?: string;
    admin?: boolean;
    actor?: boolean;
    castor?: boolean;
  }
}

export default class WebSessionConcept {
  /**
   * Initializes a session
   * @param session websession object for a given session
   * @param user id of user
   * @param actor is the user an actor
   * @param castor is the user a casting director
   * @param admin is the user an admin
   */
  start(session: WebSessionDoc, user: ObjectId, actor: boolean, castor: boolean, admin: boolean) {
    this.isLoggedOut(session);
    session.user = user.toString();
    session.actor = actor;
    session.admin = admin;
    session.castor = castor;
  }

  /**
   * Ends a session
   * @param session websession object for a given session
   */
  end(session: WebSessionDoc) {
    this.isLoggedIn(session);
    session.user = undefined;
    session.actor = undefined;
    session.admin = undefined;
    session.castor = undefined;
  }

  /**
   * Gets the id of the logged in user
   * @param session websession object for a given session
   * @returns the id of the user
   */
  getUser(session: WebSessionDoc) {
    this.isLoggedIn(session);
    return new ObjectId(session.user);
  }

  /**
   * Checks if the user is an actor
   * @param session websession object for a given session
   * @returns a boolean representing whether the user is an actor or not
   */
  isActor(session: WebSessionDoc) {
    this.isLoggedIn(session);
    return session.actor;
  }

  /**
   * Checks if the user is an admin
   * @param session websession object for a given session
   * @returns a boolean representing whether the user is an admin or not
   */
  isAdmin(session: WebSessionDoc) {
    this.isLoggedIn(session);
    return session.admin;
  }

  /**
   * Checks if the user is a casting director
   * @param session websession object for a given session
   * @returns a boolean representing whether the user is a casting director or not
   */
  isCastor(session: WebSessionDoc) {
    this.isLoggedIn(session);
    return session.castor;
  }

  /**
   * Checks if a user is logged in or not
   * @param session websession object for a given session
   * @throws UnauthenticatedError if no user is logged in
   */
  isLoggedIn(session: WebSessionDoc) {
    if (session.user === undefined) {
      throw new UnauthenticatedError("Must be logged in!");
    }
  }

  /**
   * Checks if a user is logged out or not
   * @param session websession object for a given session
   * @throws NotAllowedError if user is logged in
   */
  isLoggedOut(session: WebSessionDoc) {
    if (session.user !== undefined) {
      throw new NotAllowedError("Must be logged out!");
    }
  }
}
