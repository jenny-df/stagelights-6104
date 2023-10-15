import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Applause, Application, Challenge, Comment, Connection, FocusedPost, Media, Opportunity, Portfolio, Tag, User, WebSession } from "./app";
import { FocusedPostDoc } from "./concepts/focusedPost";
import { OpportunityDoc, Requirements } from "./concepts/opportunity";
import { PortfolioDoc, ProfessionalInfo, Style } from "./concepts/portfolio";
import { UserDoc } from "./concepts/user";
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
    return await User.getUsers(name);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, email: string, password: string, name: string, profilePic: string, birthday: Date, city: string, state: string, country: string) {
    WebSession.isLoggedOut(session);
    const createdUser = await User.create(email, password, name, birthday, city, state, country);

    if (createdUser.user) {
      const id = createdUser.user._id;
      await Applause.initialize(id);
      let media;
      try {
        media = await Media.create(id, profilePic);
      } catch {
        media = await Media.create(id, "https://drive.google.com/file/d/1ElQWXRMeOdkWTpujerxmYhSNqFuKOEyB/preview");
      }
      await User.update(id, { profilePic: media });

      // await AppHours.initialize();
    }

    return createdUser;
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>, profilePic?: string) {
    const user = WebSession.getUser(session);
    if (profilePic) {
      const newMedia = await Media.create(user, profilePic);
      const oldProfilePic = await User.updateProfilePic(user, newMedia);
      await Media.delete(oldProfilePic);
    }
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
  async getPosts(authorEmail?: string) {
    let posts;
    if (authorEmail) {
      const id = (await User.getUserByEmail(authorEmail))._id;
      posts = await FocusedPost.getByAuthor(id);
    } else {
      posts = await FocusedPost.getFocusedPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/focusedPosts")
  async createPost(session: WebSessionDoc, content: string, mediaURLs: string, category: ObjectId) {
    const user = WebSession.getUser(session);
    const mediaSeperated = mediaURLs.split(", ");
    const media = await Promise.all(mediaSeperated.map(async (url) => await Media.create(user, url)));
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
    const media = await FocusedPost.getMediaById(_id);
    await Promise.all(media.map(async (id) => await Media.delete(id)));
    return await FocusedPost.delete(_id, user);
  }

  @Router.get("/categories")
  async getCategories() {
    return await FocusedPost.getAllCategories();
  }

  @Router.post("/categories")
  async addCategory(name: string, description: string) {
    return await FocusedPost.createCategory(name, description);
  }

  @Router.delete("/categories")
  async deleteCategory(id: ObjectId) {
    return await FocusedPost.deleteCategory(new ObjectId(id));
  }

  /////////////////////////////////////////CONNECTIONS//////////////////////////////////////////////

  @Router.get("/connections")
  async getConnections(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToNames(await Connection.getConnections(user));
  }

  @Router.get("/connections/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const requests = await Connection.getRequests(user);
    return await Responses.connectionRequests(requests);
  }

  @Router.post("/connections/requests")
  async sendConnectionRequest(session: WebSessionDoc, receiverId: ObjectId) {
    const user = WebSession.getUser(session);
    const to = (await User.getUserById(receiverId))._id; // Verify to id
    return await Connection.sendRequest(user, to);
  }

  @Router.patch("/connections/accept/:from")
  async acceptConnectionRequest(session: WebSessionDoc, from: ObjectId) {
    const user = WebSession.getUser(session);
    const senderId = (await User.getUserById(from))._id; // Verify to id
    return await Connection.acceptRequest(senderId, user);
  }

  @Router.patch("/connections/reject/:from")
  async rejectConnectionRequest(session: WebSessionDoc, from: ObjectId) {
    const user = WebSession.getUser(session);
    const senderId = (await User.getUserById(from))._id; // Verify to id
    return await Connection.rejectRequest(senderId, user);
  }

  @Router.delete("/connections/requests/:to")
  async removeConnectiondRequest(session: WebSessionDoc, to: ObjectId) {
    const user = WebSession.getUser(session);
    return await Connection.removeRequest(user, to);
  }

  @Router.delete("/connections/:user2")
  async removeFriend(session: WebSessionDoc, user2: ObjectId) {
    const user = WebSession.getUser(session);
    const user2Id = (await User.getUserById(user2))._id; // Verify to id
    return await Connection.removeConnection(user, user2Id);
  }

  /////////////////////////////////////////COMMENTS//////////////////////////////////////////////

  @Router.get("/comments/post/:postId")
  async getComments(postId: ObjectId) {
    const directComments = await Comment.getByParent(new ObjectId(postId));
    return await Responses.comments(directComments);
  }

  @Router.post("/comments")
  async createComment(session: WebSessionDoc, post: ObjectId, content: string) {
    const user = WebSession.getUser(session);
    const postId = (await FocusedPost.getById(post))._id;
    const created = await Comment.create(user, content, postId);
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
    const post = (await FocusedPost.getById(postId))._id; // verify post
    const tags = await Tag.getByPost(post);
    return await Responses.tags(tags);
  }

  @Router.get("/tags/user/:userId")
  async getUserTags(userId: ObjectId) {
    const user = (await User.getUserById(userId))._id; // verify user
    const tags = await Tag.getByTagged(user);
    return await Responses.tags(tags);
  }

  @Router.post("/tags")
  async createTag(session: WebSessionDoc, post: ObjectId, tagged: ObjectId) {
    const user = WebSession.getUser(session);
    const taggedId = (await User.getUserById(tagged))._id; // verify user
    const postId = (await FocusedPost.getAndVerify(post, user))._id; // verify post
    const created = await Tag.create(user, taggedId, postId);
    return { msg: created.msg, post: await Responses.tag(created.tag) };
  }

  @Router.delete("/tags")
  async deleteTag(session: WebSessionDoc, post: ObjectId, tagged: ObjectId) {
    const user = WebSession.getUser(session);
    const taggedId = (await User.getUserById(tagged))._id; // verify user
    const postId = (await FocusedPost.getById(post))._id; // verify post
    return await Tag.delete(user, taggedId, postId);
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
    return await Challenge.updateChallengeCount(new ObjectId(_id), 1);
  }

  @Router.patch("/challenges/reject/:_id")
  async rejectChallenge(_id: ObjectId) {
    return await Challenge.updateChallengeCount(new ObjectId(_id), -1);
  }

  /////////////////////////////////////////APPLAUSE//////////////////////////////////////////////

  @Router.get("/applause")
  async getApplauseValue(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Applause.getValueByUser(user);
  }

  @Router.get("/applause/ranking")
  async rank(users: ObjectId[]) {
    const userIds = await Promise.all(users.map(async (user) => (await User.getUserById(user))?._id)); // verify users
    const ranking = await Applause.rank(userIds);
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
    const opportunities = await Opportunity.getAll();
    return await Responses.opportunities(opportunities);
  }

  @Router.get("/opportunities/id/:_id")
  async getOpportunityById(_id: ObjectId) {
    const opportunity = await Opportunity.getById(_id);
    return await Responses.opportunity(opportunity);
  }

  @Router.get("/opportunities/title/:searched")
  async getOpportunitiesByTitle(searched: string) {
    const opportunities = await Opportunity.getByTitle(searched);
    return await Responses.opportunities(opportunities);
  }

  @Router.get("/opportunities/inRange")
  async opportunityInRange(id: ObjectId, start: Date, end: Date) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return await Opportunity.datesInRange(id, startDate, endDate);
  }

  @Router.post("/opportunities")
  async createOpportunity(session: WebSessionDoc, title: string, description: string, startOn: Date, endsOn: Date, requirements: Requirements) {
    const user = WebSession.getUser(session);
    const startDate = new Date(startOn);
    const endDate = new Date(endsOn);
    const created = await Opportunity.create(user, title, description, startDate, endDate, requirements);
    return { msg: created.msg, challenge: await Responses.opportunity(created.opportunity) };
  }

  @Router.patch("/opportunities")
  async updateOpportunity(session: WebSessionDoc, id: ObjectId, update: Partial<OpportunityDoc>) {
    const user = WebSession.getUser(session);
    return await Opportunity.update(id, user, update);
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

  /////////////////////////////////////////APPLICATION//////////////////////////////////////////////

  @Router.get("/application/opportunity")
  async getOpApplications(session: WebSessionDoc, opId: ObjectId) {
    const user = WebSession.getUser(session);
    return await Responses.applications(await Application.getAppsForOp(user, opId));
  }

  @Router.get("/application")
  async getUserApplications(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.applications(await Application.getAppsForUser(user));
  }

  @Router.get("/application/:_id")
  async getApplication(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Responses.application(await Application.getAppById(_id, user));
  }

  @Router.post("/application")
  async createApplication(session: WebSessionDoc, text: string, media: string, opId: ObjectId) {
    const user = WebSession.getUser(session);
    const mediaURLs = media.split(", ");
    const mediaCreated = await Promise.all(mediaURLs.map(async (url) => await Media.create(user, url)));
    const owner = (await Opportunity.getById(opId))?.user ?? new ObjectId();
    const response = await Application.create(owner, user, text, mediaCreated, opId);
    return { msg: response.msg, application: await Responses.application(response.application) };
  }

  @Router.patch("/application")
  async updateStatus(session: WebSessionDoc, id: ObjectId, newStatus: "rejected" | "approved" | "audition" | "withdrawn") {
    const user = WebSession.getUser(session);
    await Application.changeStatus(user, id, newStatus);
    return { msg: "status changed successfully" };
  }

  /////////////////////////////////////////PORTFOLIO//////////////////////////////////////////////

  @Router.get("/portfolio")
  async getUserPortfolio(userId: ObjectId) {
    return await Portfolio.getPortfolioByUser(new ObjectId(userId));
  }

  @Router.post("/portfolio")
  async initializePortfolio(session: WebSessionDoc, style: Style, info: ProfessionalInfo, media: string, intro: string, heatshot: string) {
    const user = WebSession.getUser(session);
    const mediaURLs = media.split(", ");
    const mediaCreated = await Promise.all(mediaURLs.map(async (url) => await Media.create(user, url)));
    const headShotCreated = await Media.create(user, heatshot);
    const response = await Portfolio.create(user, style, intro, info, mediaCreated, headShotCreated);
    return { msg: response.msg, portfolio: await Responses.portfolio(response.portfolio) };
  }

  @Router.patch("/portfolio")
  async editPortfolio(session: WebSessionDoc, update: Partial<PortfolioDoc>) {
    const user = WebSession.getUser(session);
    return await Portfolio.update(user, update);
  }

  @Router.patch("/portfolio/media/add")
  async addPortfolioMedia(session: WebSessionDoc, media: string) {
    const user = WebSession.getUser(session);
    const mediaId = await Media.create(user, media);
    return await Portfolio.addMedia(user, mediaId);
  }

  @Router.patch("/portfolio/media/remove")
  async removePortfolioMedia(session: WebSessionDoc, media: ObjectId) {
    const user = WebSession.getUser(session);
    await Media.delete(media);
    return await Portfolio.removeMedia(user, media);
  }

  @Router.delete("/portfolio")
  async deletePortfolio(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Portfolio.deleteUserPortfolio(user);
  }

  /////////////////////////////////////////PRACTICE FOLDER//////////////////////////////////////////////

  // @Router.patch("/practicefolder/add")
  // async addItem(session: WebSessionDoc, content: ObjectId[]) {
  //   return null;
  // }

  // @Router.patch("/practicefolder/remove")
  // async removeItem(session: WebSessionDoc, content: ObjectId[]) {
  //   return null;
  // }

  // @Router.patch("/practicefolder/settings")
  // async changeSettings(capacityLimit: number) {
  //   return null;
  // }

  /////////////////////////////////////////QUEUE//////////////////////////////////////////////

  // @Router.post("/queue")
  // async initializeQueue(user: WebSessionDoc, queue: ObjectId[], rankings: ObjectId[], timePerPerson: number, startTime: Date) {
  //   return null;
  // }
  // @Router.patch("/queue")
  // async nextInQueue(_id: ObjectId) {
  //   return null;
  // }

  /////////////////////////////////////////RESTRICTIONS//////////////////////////////////////////////

  // @Router.get("/restrictions")
  // async getAllowed(user: WebSessionDoc) {
  //   return null;
  // }

  // @Router.patch("/restrictions/general")
  // async updateTypes(user: WebSessionDoc, accountTypes: string[]) {
  //   return null;
  // }

  // @Router.patch("/restrictions/childToAdult")
  // async childToAdult(user: WebSessionDoc) {
  //   return null;
  // }

  /////////////////////////////////////////VOTE//////////////////////////////////////////////

  // @Router.get("/vote/:post")
  // async postVotes(post: ObjectId) {
  //   return null;
  // }

  // @Router.post("/vote/upvote")
  // async upvote(user: WebSessionDoc, post: ObjectId) {
  //   return null;
  // }

  // @Router.post("/vote/downvote")
  // async downvote(user: WebSessionDoc, post: ObjectId) {
  //   return null;
  // }

  // @Router.delete("/vote/:id")
  // async deleteVote(_id: ObjectId) {
  //   return null;
  // }

  /////////////////////////////////////////CATCH ALL//////////////////////////////////////////////

  @Router.get("/*")
  catchAllError() {
    return { msg: "route doesn't exist" };
  }
}

export default getExpressRouter(new Routes());
