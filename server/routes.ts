import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Applause, Challenge, Comment, Connection, FocusedPost, Opportunity, Tag, User, WebSession } from "./app";
import { OpportunityDoc, Requirements } from "./concepts/opportunity";
import { FocusedPostDoc } from "./concepts/post";
import { UserDoc, UserInfoDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  /////////////////////////////////////////SESSIONS//////////////////////////////////////////////

  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  /////////////////////////////////////////USERS//////////////////////////////////////////////

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:name")
  async getUser(name: string) {
    return await User.getUserByEmail(name);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, email: string, password: string, name: string, information: UserInfoDoc) {
    WebSession.isLoggedOut(session);
    const createdUser = await User.create(email, password, name, information);
    if (createdUser.user) {
      await Applause.initialize(createdUser.user._id);
    }

    return createdUser;
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    await Applause.delete(user);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, email: string, password: string) {
    const u = await User.authenticate(email, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  /////////////////////////////////////////FOCUSED POSTS//////////////////////////////////////////////

  @Router.get("/focusedPosts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByEmail(author))._id;
      posts = await FocusedPost.getByAuthor(id);
    } else {
      posts = await FocusedPost.getFocusedPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/focusedPosts")
  async createPost(session: WebSessionDoc, content: string, media: string, category: ObjectId) {
    const user = WebSession.getUser(session);
    const created = await FocusedPost.create(user, content, media, category);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/focusedPosts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<FocusedPostDoc>) {
    const user = WebSession.getUser(session);
    return await FocusedPost.update(_id, update, user);
  }

  @Router.delete("/focusedPosts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    return FocusedPost.delete(_id, user);
  }

  @Router.post("/categories")
  async addCategory(name: string, description: string) {
    return FocusedPost.createCategory(name, description);
  }

  /////////////////////////////////////////CONNECTIONS//////////////////////////////////////////////

  @Router.get("/connections")
  async getConnections(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToNames(await Connection.getConnections(user));
  }

  @Router.delete("/connections/:connectionId")
  async removeFriend(session: WebSessionDoc, connectionId: ObjectId) {
    const user = WebSession.getUser(session);
    return await Connection.removeConnection(user, connectionId);
  }

  @Router.get("/connections/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.connectionRequests(await Connection.getRequests(user));
  }

  @Router.post("/connections/requests/:to")
  async sendConnectionRequest(session: WebSessionDoc, to: ObjectId) {
    const user = WebSession.getUser(session);
    return await Connection.sendRequest(user, to);
  }

  @Router.delete("/connections/requests/:to")
  async removeConnectiondRequest(session: WebSessionDoc, to: ObjectId) {
    const user = WebSession.getUser(session);
    return await Connection.removeRequest(user, to);
  }

  @Router.patch("/connections/accept/:from")
  async acceptConnectionRequest(session: WebSessionDoc, from: ObjectId) {
    const user = WebSession.getUser(session);
    return await Connection.acceptRequest(from, user);
  }

  @Router.patch("/connections/reject/:from")
  async rejectConnectionRequest(session: WebSessionDoc, from: ObjectId) {
    const user = WebSession.getUser(session);
    return await Connection.rejectRequest(from, user);
  }

  /////////////////////////////////////////COMMENTS//////////////////////////////////////////////

  @Router.get("/comments/post/:postId")
  async getComments(postId: ObjectId) {
    const directComments = await Comment.getByParent(postId);
    return Responses.comments(directComments); // HERE (Update to include subcomments)
  }

  @Router.post("/comments")
  async createComment(session: WebSessionDoc, post: ObjectId, content: string) {
    const user = WebSession.getUser(session);
    const created = await Comment.create(user, content, post);
    return { msg: created.msg, post: await Responses.comment(created.comment) };
  }

  @Router.patch("/comments/:_id")
  async updateComment(session: WebSessionDoc, _id: ObjectId, newContent: string) {
    const user = WebSession.getUser(session);
    return await Comment.update(_id, user, newContent);
  }

  @Router.delete("/comments/:_id")
  async deleteComment(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Comment.delete(_id, user);
  }

  /////////////////////////////////////////TAGS//////////////////////////////////////////////

  @Router.get("/tags/post/:postId")
  async getPostTags(postId: ObjectId) {
    const tags = await Tag.getByPost(postId);
    return await Responses.tags(tags);
  }

  @Router.get("/tags/user/:userId")
  async getUserTags(userId: ObjectId) {
    const tags = await Tag.getByTagged(userId);
    return await Responses.tags(tags);
  }

  @Router.post("/tags")
  async createTag(session: WebSessionDoc, post: ObjectId, tagged: ObjectId) {
    const user = WebSession.getUser(session);
    const created = await Tag.create(user, tagged, post);
    return { msg: created.msg, post: await Responses.tag(created.tag) };
  }

  @Router.delete("/tags/:_id")
  async deleteTag(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Tag.delete(_id, user);
  }

  /////////////////////////////////////////CHALLANGES//////////////////////////////////////////////

  @Router.get("/challenges")
  async getChallenges() {
    const challenges = await Challenge.getAllPosted();
    return await Responses.challenges(challenges);
  }

  @Router.get("/challenges/:_id")
  async getSpecificChallenge(_id: ObjectId) {
    const challenge = await Challenge.getPosted(_id);
    return await Responses.challenge(challenge);
  }

  @Router.post("/challenges")
  async proposeChallenge(session: WebSessionDoc, prompt: string) {
    const user = WebSession.getUser(session);
    const created = await Challenge.propose(user, prompt);
    return { msg: created.msg, challenge: await Responses.challenge(created.proposed) };
  }

  @Router.post("/challenges/post")
  async postChallenge() {
    // const user = WebSession.getUser(session); // HERE (make sure admin posting)
    const posted = await Challenge.randomlyPostOne();
    return { msg: posted.msg, challenge: await Responses.challenge(posted.posted) };
  }

  @Router.patch("/challenges/accept/:_id")
  async acceptChallenge(_id: ObjectId) {
    await Challenge.updateChallengeCount(_id, 1);
  }

  @Router.patch("/challenges/reject/:_id")
  async rejectChallenge(_id: ObjectId) {
    await Challenge.updateChallengeCount(_id, -1);
  }

  /////////////////////////////////////////APPLAUSE//////////////////////////////////////////////

  @Router.get("/applause")
  async getApplauseValue(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Applause.getValueByUser(user);
  }

  @Router.get("/applause/ranking")
  async rank(users: ObjectId[]) {
    const ranking = await Applause.rank(users);
    return Responses.applauses(ranking);
  }

  @Router.patch("/applause/add")
  async addApplause(session: WebSessionDoc, value: number) {
    const user = WebSession.getUser(session);
    return await Applause.update(user, value);
  }

  @Router.patch("/applause/remove")
  async removeApplause(session: WebSessionDoc, value: number) {
    const user = WebSession.getUser(session);
    return await Applause.update(user, value);
  }

  /////////////////////////////////////////OPPORTUNITY//////////////////////////////////////////////

  @Router.get("/opportunities/id")
  async getOpportunities() {
    return await Opportunity.getAll();
  }

  @Router.get("/opportunities/id/:id")
  async getOpportunityById(_id: ObjectId) {
    return await Opportunity.getById(_id);
  }

  @Router.get("/opportunities/title/:searched")
  async getOpportunitiesByTitle(searched: string) {
    return await Opportunity.getByTitle(searched);
  }

  @Router.get("/opportunities/inRange")
  async opportunityInRange(_id: ObjectId, start: Date, end: Date) {
    return await Opportunity.datesInRange(_id, start, end);
  }

  @Router.post("/opportunities")
  async createOpportunity(session: WebSessionDoc, title: string, description: string, startOn: Date, endsOn: Date, requirements: Requirements) {
    const user = WebSession.getUser(session);
    const created = await Opportunity.create(user, title, description, startOn, endsOn, requirements);
    return { msg: created.msg, challenge: await Responses.opportunity(created.opportunity) };
  }

  @Router.patch("/opportunities")
  async updateOpportunity(session: WebSessionDoc, _id: ObjectId, update: Partial<OpportunityDoc>) {
    const user = WebSession.getUser(session);
    return await Opportunity.update(_id, user, update);
  }

  @Router.patch("/opportunities/deactivate/:_id")
  async deactivateOpportunity(_id: ObjectId, session?: WebSessionDoc) {
    if (session) {
      const user = WebSession.getUser(session);
      return await Opportunity.deactivate(_id, user);
    }

    return await Opportunity.deactivate(_id);
  }

  @Router.patch("/opportunities/reactivate/:_id")
  async reactivateOpportunity(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Opportunity.reactivate(_id, user);
  }

  @Router.delete("/opportunities/:_id")
  async deleteOpportunity(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Opportunity.delete(_id, user);
  }
}

export default getExpressRouter(new Routes());
