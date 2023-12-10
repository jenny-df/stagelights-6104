import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Applause, Application, Challenge, Comment, Connection, FocusedPost, Folder, Media, Opportunity, Portfolio, Queue, Restrictions, Tag, User, Vote, WebSession } from "./app";
import { BadValuesError } from "./concepts/errors";
import { FocusedPostDoc } from "./concepts/focusedPost";
import { OpportunityDoc, Requirements } from "./concepts/opportunity";
import { PortfolioDoc } from "./concepts/portfolio";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  /////////////////////////////////////////USERS + SESSIONS//////////////////////////////////////////////

  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.user(await User.getUserById(user));
  }

  @Router.get("/users")
  async getUserByName(name?: string) {
    const users = await User.getUsers(name);
    return await Responses.users(users);
  }

  @Router.get("/users/:id")
  async getUserById(id: ObjectId) {
    const user = await User.getUserById(new ObjectId(id));
    return await Responses.user(user);
  }
  @Router.post("/users") // TO-DO: change user types for this to be string
  async createUser(session: WebSessionDoc, email: string, password: string, name: string, profilePic: string, birthday: Date, city: string, state: string, country: string, userType: string) {
    WebSession.isLoggedOut(session);
    const createdUser = await User.create(email, password, name, new Date(birthday), city, state, country);

    if (createdUser.user) {
      const id = createdUser.user._id;
      await Applause.initialize(id);
      await Folder.createPractice(id);
      const splitUserTypes = userType.split(", ");
      await Restrictions.create(id, splitUserTypes);
      let media;
      try {
        media = await Media.create(id, profilePic);
      } catch {
        media = await Media.create(id, "https://drive.google.com/file/d/1ElQWXRMeOdkWTpujerxmYhSNqFuKOEyB/preview");
      }
      await User.updateProfilePic(id, media);
      await Portfolio.create(id, media);
      const updatedUser = await User.getUserById(createdUser.user._id);
      return { msg: createdUser.msg, user: await Responses.user(updatedUser) };
    }
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>, profilePic?: string) {
    const user = WebSession.getUser(session);
    if (profilePic) {
      const newProfilePic = await Media.create(user, profilePic);
      const oldProfilePic = await User.updateProfilePic(user, newProfilePic);
      await Media.delete(oldProfilePic);
    }
    if (update) {
      await User.update(user, update);
    }
    return { msg: "Successfully updated user" };
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    await Applause.delete(user);
    await Application.withdrawUser(user);
    await Comment.deleteUserComments(user);
    await Connection.removeUser(user);
    await FocusedPost.deleteUser(user);
    await Folder.deleteUser(user);
    await Media.deleteUser(user);
    await Portfolio.delete(user);
    await Opportunity.deactivateUser(user);
    await Queue.deleteAllManagerQueues(user);
    await Restrictions.delete(user);
    await Vote.deleteUser(user);
    await Tag.deleteUser(user);
    await Restrictions.delete(user);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, email: string, password: string) {
    const u = await User.authenticate(email, password);
    const actor = await Restrictions.isActor(u._id);
    const admin = await Restrictions.isAdmin(u._id);
    const castor = await Restrictions.isCastor(u._id);
    WebSession.start(session, u._id, actor, castor, admin);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  /////////////////////////////////////////FOCUSED POSTS//////////////////////////////////////////////

  @Router.get("/focusedPosts")
  async getPosts(authorEmail?: string, _id?: ObjectId) {
    let posts;
    if (authorEmail) {
      const id = (await User.getUserByEmail(authorEmail))._id;
      posts = await FocusedPost.getByAuthor(id);
    } else if (_id) {
      posts = [await FocusedPost.getById(new ObjectId(_id))];
    } else {
      posts = await FocusedPost.getFocusedPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/focusedPosts")
  async createPost(session: WebSessionDoc, content: string, mediaURLs: string, categoryID: ObjectId) {
    const user = WebSession.getUser(session);
    let media: ObjectId[] = [];
    if (mediaURLs) {
      const mediaSeperated = mediaURLs.split(", ");
      media = await Promise.all(mediaSeperated.map(async (url) => await Media.create(user, url)));
    }
    const created = await FocusedPost.create(user, content, media, new ObjectId(categoryID));
    await Applause.update(user, 3);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/focusedPosts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<FocusedPostDoc>) {
    const user = WebSession.getUser(session);
    return await FocusedPost.update(new ObjectId(_id), update, user);
  }

  @Router.delete("/focusedPosts")
  async deletePost(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    const media = await FocusedPost.getMediaById(new ObjectId(id));
    await Promise.all(media.map(async (id) => await Media.delete(id)));
    await Tag.deletePost(new ObjectId(id));
    await Applause.update(user, -3);
    return await FocusedPost.delete(new ObjectId(id), user);
  }

  @Router.get("/categories")
  async getCategories(_id?: ObjectId) {
    if (_id) {
      return await FocusedPost.getCategory(new ObjectId(_id));
    }
    return await FocusedPost.getAllCategories();
  }

  @Router.post("/categories")
  async addCategory(session: WebSessionDoc, name: string, description: string) {
    const admin = WebSession.isAdmin(session);
    Restrictions.check(admin, "admin");
    return await FocusedPost.createCategory(name, description);
  }

  @Router.delete("/categories")
  async deleteCategory(session: WebSessionDoc, id: ObjectId) {
    const admin = WebSession.isAdmin(session);
    Restrictions.check(admin, "admin");
    return await FocusedPost.deleteCategory(new ObjectId(id));
  }

  /////////////////////////////////////////CONNECTIONS//////////////////////////////////////////////

  @Router.get("/connections/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const requests = await Connection.getRequests(user);
    return await Responses.connectionRequests(requests);
  }

  @Router.get("/connections/:id")
  async getConnections(id: ObjectId) {
    const connections = await User.idsToUsers(await Connection.getConnections(new ObjectId(id)));
    return await Responses.users(connections);
  }

  @Router.post("/connections/requests")
  async sendConnectionRequest(session: WebSessionDoc, receiverId: ObjectId) {
    const user = WebSession.getUser(session);
    const to = (await User.getUserById(new ObjectId(receiverId)))._id; // Verify to id
    return await Connection.sendRequest(user, to);
  }

  @Router.patch("/connections/accept/:from")
  async acceptConnectionRequest(session: WebSessionDoc, from: ObjectId) {
    const user = WebSession.getUser(session);
    const senderId = (await User.getUserById(new ObjectId(from)))._id; // Verify to id
    await Applause.update(user, 1);
    await Applause.update(senderId, 1);
    return await Connection.acceptRequest(senderId, user);
  }

  @Router.patch("/connections/reject/:from")
  async rejectConnectionRequest(session: WebSessionDoc, from: ObjectId) {
    const user = WebSession.getUser(session);
    const senderId = (await User.getUserById(new ObjectId(from)))._id; // Verify to id
    return await Connection.rejectRequest(senderId, user);
  }

  @Router.delete("/connections/requests/:to")
  async removeConnectiondRequest(session: WebSessionDoc, to: ObjectId) {
    const user = WebSession.getUser(session);
    return await Connection.removeRequest(user, new ObjectId(to));
  }

  @Router.delete("/connections/:user2")
  async removeFriend(session: WebSessionDoc, user2: ObjectId) {
    const user = WebSession.getUser(session);
    const user2Id = (await User.getUserById(new ObjectId(user2)))._id; // Verify to id
    await Applause.update(user, -1);
    await Applause.update(user2Id, -1);
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
    const postId = (await FocusedPost.getById(new ObjectId(post)))._id; // verify post
    const created = await Comment.create(user, content, postId);
    await Applause.update(user, 0.5);
    return { msg: created.msg, post: await Responses.comment(created.comment) };
  }

  @Router.patch("/comments")
  async updateComment(session: WebSessionDoc, _id: ObjectId, newContent: string) {
    const user = WebSession.getUser(session);
    return await Comment.update(new ObjectId(_id), user, newContent);
  }

  @Router.delete("/comments/:_id")
  async deleteComment(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Applause.update(user, -0.5);
    return await Comment.delete(new ObjectId(_id), user);
  }

  /////////////////////////////////////////TAGS//////////////////////////////////////////////

  @Router.get("/tags/post/:postId")
  async getPostTags(postId: ObjectId) {
    const post = (await FocusedPost.getById(new ObjectId(postId)))._id; // verify post
    const tags = await Tag.getByPost(post);
    return await Responses.tags(tags);
  }

  @Router.get("/tags/user/:userId")
  async getUserTags(userId: ObjectId) {
    const user = (await User.getUserById(new ObjectId(userId)))._id; // verify user
    const tags = await Tag.getByTagged(user);
    return await Responses.tags(tags);
  }

  @Router.post("/tags")
  async createTag(session: WebSessionDoc, post: ObjectId, tagged: ObjectId) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    const taggedId = (await User.getUserById(new ObjectId(tagged)))._id; // verify user
    const postId = (await FocusedPost.getAndVerify(new ObjectId(post), user))._id; // verify post
    const created = await Tag.create(user, taggedId, postId);
    await Applause.update(taggedId, 2);
    return { msg: created.msg, post: await Responses.tag(created.tag) };
  }

  @Router.delete("/tags")
  async deleteTag(session: WebSessionDoc, post: ObjectId, tagged: ObjectId) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    const taggedId = (await User.getUserById(new ObjectId(tagged)))._id; // verify user
    const postId = (await FocusedPost.getById(new ObjectId(post)))._id; // verify post
    await Applause.update(taggedId, -2);
    return await Tag.deleteTag(user, taggedId, postId);
  }

  /////////////////////////////////////////CHALLANGES//////////////////////////////////////////////

  @Router.get("/challenge")
  async getSpecificChallenge(_id?: ObjectId) {
    if (_id) {
      const challenge = await Challenge.getPosted(new ObjectId(_id));
      return await Responses.challenge(challenge);
    }
    const challenges = await Challenge.getAllPosted();
    return await Responses.challenges(challenges);
  }

  @Router.get("/challenge/today")
  async getTodaysChallenge() {
    const challenge = await Challenge.todaysChallenge();
    return await Responses.challenge(challenge);
  }

  @Router.get("/challenge/accepted")
  async getTodaysAccepted() {
    const posts = await FocusedPost.getAcceptedToday();
    return posts.map((post) => post.author.toString());
  }

  @Router.post("/challenge")
  async proposeChallenge(session: WebSessionDoc, prompt: string) {
    const user = WebSession.getUser(session);
    const created = await Challenge.propose(user, prompt);
    await Applause.update(user, 0.5);
    return { msg: created.msg, challenge: await Responses.challenge(created.proposed) };
  }

  @Router.post("/acceptChallenge")
  async acceptChallenge(session: WebSessionDoc, content: string, mediaURLs: string) {
    const user = WebSession.getUser(session);
    let media: ObjectId[] = [];
    if (mediaURLs) {
      const mediaSeperated = mediaURLs.split(", ");
      media = await Promise.all(mediaSeperated.map(async (url) => await Media.create(user, url)));
    }

    const challengeCategory = await FocusedPost.getCategoryByName("Challenge", "Daily creative challenges");
    const created = await FocusedPost.create(user, content, media, challengeCategory._id);
    await Applause.update(user, 5);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  /////////////////////////////////////////APPLAUSE//////////////////////////////////////////////

  @Router.get("/applause")
  async getApplauseValue(session: WebSessionDoc) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    return await Applause.getValueByUser(user);
  }

  /////////////////////////////////////////OPPORTUNITY//////////////////////////////////////////////

  @Router.get("/opportunities/id")
  async getOpportunityById(_id?: ObjectId) {
    if (_id) {
      const opportunity = await Opportunity.getById(new ObjectId(_id));
      return await Responses.opportunity(opportunity);
    }
    const opportunities = await Opportunity.getAll();
    return await Responses.opportunities(opportunities);
  }

  @Router.get("/opportunities/user/:_id")
  async getOpportunitiesByUser(_id: ObjectId) {
    const opportunities = await Opportunity.getByUser(new ObjectId(_id));
    return await Responses.opportunities(opportunities);
  }

  @Router.get("/opportunities/inRange")
  async opportunityInRange(session: WebSessionDoc, id: ObjectId, start: Date, end: Date) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (id) {
      return await Opportunity.datesInRange(new ObjectId(id), startDate, endDate);
    }
    return { msg: "no opportunity id given" };
  }

  @Router.post("/opportunities")
  async createOpportunity(session: WebSessionDoc, title: string, description: string, startOn: Date, endsOn: Date, requirements: Requirements) {
    const castor = WebSession.isCastor(session);
    Restrictions.check(castor, "casting director");
    const user = WebSession.getUser(session);
    const startDate = new Date(startOn);
    const endDate = new Date(endsOn);
    const created = await Opportunity.create(user, title, description, startDate, endDate, requirements);
    await Applause.update(user, 3);
    return { msg: created.msg, challenge: await Responses.opportunity(created.opportunity) };
  }

  @Router.patch("/opportunities")
  async updateOpportunity(session: WebSessionDoc, id: ObjectId, update: Partial<OpportunityDoc>) {
    const castor = WebSession.isCastor(session);
    Restrictions.check(castor, "casting director");
    const user = WebSession.getUser(session);
    return await Opportunity.update(new ObjectId(id), user, update);
  }

  @Router.patch("/opportunities/deactivate")
  async deactivateOpportunity(_id: ObjectId, session?: WebSessionDoc) {
    if (session) {
      const castor = WebSession.isCastor(session);
      Restrictions.check(castor, "casting director");
      const user = WebSession.getUser(session);
      return await Opportunity.deactivate(new ObjectId(_id), user);
    }

    return await Opportunity.deactivate(new ObjectId(_id));
  }

  @Router.patch("/opportunities/reactivate")
  async reactivateOpportunity(session: WebSessionDoc, _id: ObjectId) {
    const castor = WebSession.isCastor(session);
    Restrictions.check(castor, "casting director");
    const user = WebSession.getUser(session);
    return await Opportunity.reactivate(new ObjectId(_id), user);
  }

  @Router.delete("/opportunities/:_id")
  async deleteOpportunity(session: WebSessionDoc, _id: ObjectId) {
    const castor = WebSession.isCastor(session);
    Restrictions.check(castor, "casting director");
    const user = WebSession.getUser(session);
    await Applause.update(user, -3);
    return await Opportunity.delete(new ObjectId(_id), user);
  }

  /////////////////////////////////////////APPLICATION//////////////////////////////////////////////

  @Router.get("/application/opportunity")
  async getOpApplications(session: WebSessionDoc, opId: ObjectId) {
    const castor = WebSession.isCastor(session);
    Restrictions.check(castor, "casting director");
    const user = WebSession.getUser(session);
    return await Responses.applications(await Application.getAppsForOp(user, new ObjectId(opId)));
  }

  @Router.get("/application")
  async getUserApplications(session: WebSessionDoc) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    return await Responses.applications(await Application.getAppsForUser(user));
  }

  @Router.get("/application/:_id")
  async getApplication(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Responses.application(await Application.getAppById(new ObjectId(_id), user));
  }

  @Router.post("/application")
  async createApplication(session: WebSessionDoc, text: string, media: string, opId: ObjectId) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    let mediaCreated: ObjectId[] = [];
    if (media) {
      const mediaURLs = media.split(", ");
      mediaCreated = await Promise.all(mediaURLs.map(async (url) => await Media.create(user, url)));
    }

    const owner = (await Opportunity.getById(new ObjectId(opId)))?.user ?? new ObjectId();
    const response = await Application.create(owner, user, text, mediaCreated, new ObjectId(opId));
    await Applause.update(user, 2);
    return { msg: response.msg, application: await Responses.application(response.application) };
  }

  @Router.patch("/application")
  async updateStatus(session: WebSessionDoc, id: ObjectId, newStatus: "rejected" | "approved" | "audition" | "withdrawn") {
    if (newStatus !== "rejected" && newStatus !== "approved" && newStatus !== "audition" && newStatus !== "withdrawn") {
      throw new BadValuesError("newStatus is not a valid status type. Please enter one of the following: approved, rejected, audition, withdrawn");
    }
    const user = WebSession.getUser(session);
    await Application.changeStatus(user, new ObjectId(id), newStatus);
    if (newStatus === "withdrawn") {
      await Applause.update(user, -2);
    }
    return { msg: "status changed successfully" };
  }

  /////////////////////////////////////////PORTFOLIO//////////////////////////////////////////////

  @Router.get("/portfolio/:userId")
  async getUserPortfolio(userId: ObjectId) {
    return await Portfolio.getByUser(new ObjectId(userId));
  }

  @Router.patch("/portfolio")
  async editPortfolio(session: WebSessionDoc, update?: Partial<PortfolioDoc>, headshot?: string) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    if (headshot) {
      const newHeadshot = await Media.create(user, headshot);
      const oldHeadshot = await Portfolio.updateHeadshot(user, newHeadshot);
      if (oldHeadshot) {
        await Media.delete(oldHeadshot);
      }
    }
    await Applause.update(user, 0.5);
    if (update) {
      return await Portfolio.update(user, update);
    }
    return { msg: "successfully updated headshot" };
  }

  @Router.patch("/portfolio/media/add")
  async addPortfolioMedia(session: WebSessionDoc, media: string) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    const mediaId = await Media.create(user, media);
    await Applause.update(user, 0.5);
    return await Portfolio.addMedia(user, mediaId);
  }

  @Router.patch("/portfolio/media/remove")
  async removePortfolioMedia(session: WebSessionDoc, media: ObjectId) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    await Media.delete(new ObjectId(media));
    await Applause.update(user, -0.5);
    return await Portfolio.removeMedia(user, new ObjectId(media));
  }

  /////////////////////////////////////////PRACTICE FOLDER//////////////////////////////////////////////

  @Router.get("/practicefolder")
  async getPracticeFolder(session: WebSessionDoc) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    return await Responses.folder(await Folder.getPractice(user));
  }

  @Router.patch("/practicefolder/add")
  async addPracticeItem(session: WebSessionDoc, content: string) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    if (content) {
      return await Folder.addPractice(user, content);
    }
    return { msg: "please enter a url in the content" };
  }

  @Router.patch("/practicefolder/remove")
  async removePracticeItem(session: WebSessionDoc, content: string) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    return await Folder.removePractice(user, content);
  }

  @Router.get("/practicefolder/settings")
  async getSettings() {
    return Folder.getCapacity();
  }

  @Router.patch("/practicefolder/settings")
  async changeSettings(session: WebSessionDoc, capacityLimit: number) {
    const admin = WebSession.isAdmin(session);
    Restrictions.check(admin, "admin");
    Folder.changeCapacity(Number(capacityLimit));
    return { msg: "Successfully Changed Limit" };
  }

  /////////////////////////////////////////REPERTOIRE FOLDERS//////////////////////////////////////////////

  @Router.get("/repertoirefolders")
  async getRepertoireFolder(_id: ObjectId) {
    return await Responses.folder(await Folder.getRepertoire(new ObjectId(_id)));
  }

  @Router.get("/repertoirefolders/:user")
  async getUserRepertoires(user: ObjectId) {
    return await Responses.folders(await Folder.getUserRepertoire(new ObjectId(user)));
  }

  @Router.post("/repertoirefolders")
  async createRepertoireFolder(session: WebSessionDoc, name: string) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    if (name) {
      const created = await Folder.createRepertoire(user, name);
      await Applause.update(user, 0.5);
      return { msg: created.msg, folder: await Responses.folder(created.folder) };
    }
    return { msg: "Repertoire folder needs a name" };
  }

  @Router.patch("/repertoirefolders/add")
  async addRepertoireItem(session: WebSessionDoc, content: string, folder: ObjectId) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    if (content && folder) {
      return await Folder.addRepertoire(user, new ObjectId(folder), content);
    }
    return { msg: "needs content url!" };
  }

  @Router.patch("/repertoirefolders/remove")
  async removeRepertoireItem(session: WebSessionDoc, content: string, folder: ObjectId) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    if (content && folder) {
      return await Folder.removeRepertoire(user, new ObjectId(folder), content);
    }
    return { msg: "missing content or folder" };
  }

  @Router.delete("/repertoirefolders")
  async deleteRepertoire(session: WebSessionDoc, _id: ObjectId) {
    const actor = WebSession.isActor(session);
    Restrictions.check(actor, "actor");
    const user = WebSession.getUser(session);
    await Applause.update(user, -0.5);
    return await Folder.deleteRepertoire(user, new ObjectId(_id));
  }

  /////////////////////////////////////////QUEUE//////////////////////////////////////////////

  // @Router.post("/queue")
  // async initializeQueue(session: WebSessionDoc, queueFor: ObjectId, timePerPerson: number, startTime: Date) {
  //   const castor = WebSession.isCastor(session);
  //   Restrictions.check(castor, "casting director");
  //   const user = WebSession.getUser(session);
  //   const applications = await Application.getAppsForOp(user, new ObjectId(queueFor));
  //   const applicants = applications.map((app) => app.user);
  //   const ranked = await Applause.rank(applicants);
  //   const queue = ranked.map((applause) => applause.user);
  //   const created = await Queue.create(user, new ObjectId(queueFor), queue, new Date(startTime), Number(timePerPerson));
  //   return { msg: created.msg, queue: await Responses.queue(created.queue) };
  // }

  // @Router.get("/queue/estimatedTime")
  // async estimatedQueueTime(session: WebSessionDoc, queueFor: ObjectId) {
  //   const actor = WebSession.isActor(session);
  //   Restrictions.check(actor, "actor");
  //   const user = WebSession.getUser(session);
  //   return await Queue.getEstimatedTime(new ObjectId(queueFor), user);
  // }

  // @Router.patch("/queue")
  // async nextInQueue(session: WebSessionDoc, _id: ObjectId, newStatusPrev?: "approved" | "rejected") {
  //   if (newStatusPrev && newStatusPrev !== "approved" && newStatusPrev !== "rejected") {
  //     throw new BadValuesError("newStatusPrev must be either approved or rejected");
  //   }
  //   const castor = WebSession.isCastor(session);
  //   Restrictions.check(castor, "casting director");
  //   const user = WebSession.getUser(session);
  //   const response = await Queue.progressQueue(user, new ObjectId(_id));
  //   const prevUser = response.prev;
  //   if (newStatusPrev && prevUser) {
  //     const applicationId = await Application.getAppByOpForUser(prevUser, new ObjectId(_id));
  //     await Application.changeStatus(user, applicationId, newStatusPrev);
  //   }
  //   let next = "None";
  //   if (response.next) {
  //     next = (await User.getUserById(response.next)).name;
  //   }
  //   return { next: next, current: (await User.getUserById(response.current)).name };
  // }

  // @Router.delete("/queue")
  // async deleteQueue(session: WebSessionDoc, _id: ObjectId) {
  //   const castor = WebSession.isCastor(session);
  //   Restrictions.check(castor, "casting director");
  //   const user = WebSession.getUser(session);
  //   return await Queue.delete(user, new ObjectId(_id));
  // }

  /////////////////////////////////////////RESTRICTIONS//////////////////////////////////////////////

  @Router.get("/restrictions")
  async getAllowed(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Restrictions.getAccountTypes(user);
  }

  @Router.get("/restrictions/:id")
  async getUserTypes(id: ObjectId) {
    return await Restrictions.getAccountTypes(new ObjectId(id));
  }

  @Router.get("/anyAdmins")
  async anyAdmins() {
    return await Restrictions.anyAdmins();
  }

  @Router.patch("/restrictions") // TO-DO: change account types for this to be string
  async updateTypes(session: WebSessionDoc, accountTypes: string) {
    const user = WebSession.getUser(session);
    const splitAccountTypes = accountTypes.split(", "); //
    const msg = await Restrictions.edit(user, splitAccountTypes);
    const actor = await Restrictions.isActor(user);
    const admin = await Restrictions.isAdmin(user);
    const castor = await Restrictions.isCastor(user);
    WebSession.resetTypes(session, actor, admin, castor);
    return msg;
  }

  /////////////////////////////////////////VOTE//////////////////////////////////////////////

  @Router.get("/vote")
  async postVotes(post: ObjectId) {
    await FocusedPost.getById(new ObjectId(post)); // verify post
    return await Vote.votesForParent(new ObjectId(post));
  }

  @Router.post("/vote")
  async upvote(session: WebSessionDoc, post: ObjectId, upvote: boolean) {
    if (upvote === "true") {
      upvote = true;
    } else {
      upvote = false;
    }
    const user = WebSession.getUser(session);
    const postAuthor = (await FocusedPost.getById(new ObjectId(post))).author; // verify post
    const voteResponse = await Vote.vote(user, new ObjectId(post), upvote);
    await Applause.update(postAuthor, voteResponse.applausePoints);
    return voteResponse;
  }

  /////////////////////////////////////////CATCH ALL//////////////////////////////////////////////

  @Router.get("/*")
  catchAllError() {
    return { msg: "route doesn't exist" };
  }
}

export default getExpressRouter(new Routes());
