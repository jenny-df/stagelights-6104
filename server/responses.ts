import { ObjectId } from "mongodb";
import { Comment, FocusedPost, Media, Opportunity, User } from "./app";
import { ApplauseDoc, NoCounterError, UserExistsError } from "./concepts/applause";
import { ApplicationDoc, NotApplierError, NotOwnerError } from "./concepts/application";
import { ChallengeDoc } from "./concepts/challenge";
import { CommentAuthorNotMatchError, CommentDoc } from "./concepts/comment";
import { AlreadyConnectedError, ConnectionDoc, ConnectionNotFoundError, ConnectionRequestAlreadyExistsError, ConnectionRequestDoc, ConnectionRequestNotFoundError } from "./concepts/connection";
import { FocusedPostAuthorNotMatchError, FocusedPostDoc } from "./concepts/focusedPost";
import { FolderDoc, HasPracticeFolderError, NoPracticeFolderError, NotFolderOwnerError, NotInFolderError, PraticeFolderDoc } from "./concepts/folder";
import { NotOpportunityOwnerError, OpportunityDoc } from "./concepts/opportunity";
import { HasPortfolioError, NoPortfolioError, PortfolioDoc } from "./concepts/portfolio";
import { DuplicateQueueError, NoQueueError, NotInQueueError, NotManagerError, QueueDoc } from "./concepts/queue";
import { AlreadyInitializedError, NoRestrictionsError, RestrictionDoc } from "./concepts/restrictions";
import { DuplicatedTagError, TagDoc, TaggerNotMatchError } from "./concepts/tag";
import { UserDoc } from "./concepts/user";
import { VoteDoc } from "./concepts/vote";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert UserDoc into more readable format for the frontend by converting
   * the media id into a url.
   */
  static async user(user: Partial<UserDoc> | null) {
    if (!user) {
      return user;
    }
    const media = await this.oneMedia(user.profilePic ?? new ObjectId());
    return { ...user, profilePic: media };
  }

  /**
   * Same as {@link user} but for an array of UserDoc for improved performance.
   */
  static async users(users: Partial<UserDoc>[]) {
    const mediaIds = users.map((user) => user.profilePic ?? new ObjectId());
    const media = await this.media(mediaIds);
    return users.map((user, i) => ({ ...user, profilePic: media[i] }));
  }

  /**
   * Convert FocusedPostDoc into more readable format for the frontend by converting
   * the author id into a name, category id into its name and media ids into urls.
   */
  static async post(post: FocusedPostDoc | null) {
    if (!post) {
      return post;
    }
    const author = (await User.getUserById(post.author)).name;
    const category = (await FocusedPost.getCategory(post.category)).name;
    const media = await this.media(post.media);
    return { ...post, author, category, media };
  }

  /**
   * Same as {@link post} but for an array of FocusedPostDoc for improved performance.
   */
  static async posts(posts: FocusedPostDoc[]) {
    const authors = await User.idsToNames(posts.map((post) => post.author));
    const categories = await Promise.all(posts.map(async (post) => await FocusedPost.getCategory(post.category)));
    const media = await Promise.all(posts.map(async (post) => await this.media(post.media)));
    return posts.map((post, i) => ({ ...post, author: authors[i], category: categories[i], media: media[i] }));
  }

  /**
   * Convert CommentDoc into more readable format for the frontend by converting
   * the author id into a name.
   */
  static async comment(comment: CommentDoc | null) {
    if (!comment) {
      return comment;
    }
    const author = (await User.getUserById(comment.author)).name;
    return { ...comment, author };
  }

  /**
   * Same as {@link comment} but for an array of CommentDoc for improved performance.
   */
  static async comments(comments: CommentDoc[]) {
    const authors = await User.idsToNames(comments.map((comment) => comment.author));
    return comments.map((comment, i) => ({ ...comment, author: authors[i] }));
  }

  /**
   * Convert TagDoc into more readable format for the frontend by converting
   * the tagger and tagged ids into names.
   */
  static async tag(tag: TagDoc | null) {
    if (!tag) {
      return tag;
    }
    const tagger = (await User.getUserById(tag.tagger)).name;
    const tagged = (await User.getUserById(tag.tagged)).name;
    const post = await this.post(await FocusedPost.getById(tag.post));
    return { ...tag, tagger, tagged, post };
  }

  /**
   * Same as {@link tag} but for an array of TagDoc for improved performance.
   */
  static async tags(tags: TagDoc[]) {
    const taggers = await User.idsToNames(tags.map((tag) => tag.tagger));
    const tagged = await User.idsToNames(tags.map((tag) => tag.tagged));
    const posts = await Promise.all(tags.map(async (tag) => await this.post(await FocusedPost.getById(tag.post))));
    return tags.map((tag, i) => ({ ...tag, tagger: taggers[i], tagged: tagged[i], post: posts[i] }));
  }

  /**
   * Convert ChallengeConcept into more readable format for the frontend by converting
   * the challenger id into a name.
   */
  static async challenge(challenge: ChallengeDoc | null) {
    if (!challenge) {
      return challenge;
    }
    const challenger = (await User.getUserById(challenge.challenger)).name;
    return { ...challenge, challenger };
  }

  /**
   * Same as {@link challenge} but for an array of ChallengeConcept for improved performance.
   */
  static async challenges(challenges: ChallengeDoc[]) {
    const challengers = await User.idsToNames(challenges.map((challenge) => challenge.challenger));
    return challenges.map((challenge, i) => ({ ...challenge, challenger: challengers[i] }));
  }

  /**
   * Convert ApplauseDoc into more readable format for the frontend by converting
   * the user id into a name.
   */
  static async applause(applause: ApplauseDoc | null) {
    if (!applause) {
      return applause;
    }
    const user = await User.getUserById(applause.user);
    return { ...applause, user: user.name };
  }

  /**
   * Same as {@link applause} but for an array of ApplauseDoc for improved performance.
   */
  static async applauses(applauses: ApplauseDoc[]) {
    const users = await User.idsToNames(applauses.map((applause) => applause.user));
    return applauses.map((applause, i) => ({ ...applause, user: users[i] }));
  }

  /**
   * Convert OpportunityDoc into more readable format for the frontend by converting
   * the user id into a name.
   */
  static async opportunity(opportunity: OpportunityDoc | null) {
    if (!opportunity) {
      return opportunity;
    }
    const user = await User.getUserById(opportunity.user);
    return { ...opportunity, user: user.name };
  }

  /**
   * Same as {@link opportunity} but for an array of OpportunityDoc for improved performance.
   */
  static async opportunities(opportunities: OpportunityDoc[]) {
    const users = await User.idsToNames(opportunities.map((opportunity) => opportunity.user));
    return opportunities.map((opportunity, i) => ({ ...opportunity, user: users[i] }));
  }

  /**
   * Convert media ObjectIds into more readable format for the frontend by converting
   * them into links.
   */
  static async oneMedia(media: ObjectId | null) {
    if (!media) {
      return media;
    }
    return (await this.media([media]))[0];
  }

  /**
   * Same as {@link oneMedia} but for an array of ObjectIds for improved performance.
   */
  static async media(media: ObjectId[]) {
    return await Media.idsToURLs(media);
  }

  /**
   * Convert ApplicationDoc into more readable format for the frontend by converting
   * the user ids into names, opportunity ids to titles and media to URLs.
   */
  static async application(application: ApplicationDoc | null) {
    if (!application) {
      return application;
    }
    const owner = (await User.getUserById(application.owner)).name;
    const user = (await User.getUserById(application.user)).name;
    const applicationFor = (await Opportunity.getById(application.applicationFor))?.title ?? "DELETED";
    const media = await this.media(application.media);
    return { ...application, owner, user, applicationFor, media };
  }

  /**
   * Same as {@link application} but for an array of ApplicationDoc for improved performance.
   */
  static async applications(applications: ApplicationDoc[]) {
    const owners = await User.idsToNames(applications.map((application) => application.owner));
    const users = await User.idsToNames(applications.map((application) => application.user));
    const opportunities = await Promise.all(applications.map(async (application) => (await Opportunity.getById(application.applicationFor))?.title ?? "DELETED"));
    const media = await Promise.all(applications.map(async (application) => await this.media(application.media)));
    return applications.map((application, i) => ({ ...application, owner: owners[i], user: users[i], applicationFor: opportunities[i], media: media[i] }));
  }

  /**
   * Convert PortfolioDoc into more readable format for the frontend by converting
   * the user id into a name, headshot id and media ids to urls.
   */
  static async portfolio(portfolio: PortfolioDoc | null) {
    if (!portfolio) {
      return portfolio;
    }
    const user = (await User.getUserById(portfolio.user)).name;
    const headshot = await this.oneMedia(portfolio.headshot);
    const media = await this.media(portfolio.media);
    return { ...portfolio, user, headshot, media };
  }

  /**
   * Same as {@link portfolio} but for an array of PortfolioDoc for improved performance.
   */
  static async portfolios(portfolios: PortfolioDoc[]) {
    const users = await User.idsToNames(portfolios.map((portfolio) => portfolio.user));
    const headshots = await Promise.all(portfolios.map(async (portfolio) => await this.oneMedia(portfolio.headshot)));
    const media = await Promise.all(portfolios.map(async (portfolio) => await this.media(portfolio.media)));
    return portfolios.map((portfolio, i) => ({ ...portfolio, user: users[i], headshot: headshots[i], media: media[i] }));
  }

  /**
   * Convert FolderDoc into more readable format for the frontend by converting
   * the user id into a name and content ids to urls.
   */
  static async folder(folder: FolderDoc | PraticeFolderDoc | null) {
    if (!folder) {
      return folder;
    }
    const user = (await User.getUserById(folder.user)).name;
    const contents = await this.media(folder.contents);
    return { ...folder, user, contents };
  }

  /**
   * Same as {@link folder} but for an array of FolderDoc for improved performance.
   */
  static async folders(folders: FolderDoc[] | PraticeFolderDoc[]) {
    const users = await User.idsToNames(folders.map((folder) => folder.user));
    const contents = await Promise.all(folders.map(async (folder) => await this.media(folder.contents)));
    return folders.map((folder, i) => ({ ...folder, user: users[i], contents: contents[i] }));
  }

  /**
   * Convert QueueDoc into more readable format for the frontend by converting
   * the user ids into names and opportunity id into a title.
   */
  static async queue(queue: QueueDoc | null) {
    if (!queue) {
      return queue;
    }
    const queueManager = (await User.getUserById(queue.queueManager)).name;
    const queueFor = (await Opportunity.getById(queue.queueFor)).title;
    const queued = await User.idsToNames(queue.queue);
    return { ...queue, queueManager, queueFor, queue: queued };
  }

  /**
   * Same as {@link queue} but for an array of QueueDoc for improved performance.
   */
  static async queues(queues: QueueDoc[]) {
    const queueManagers = await User.idsToNames(queues.map((queue) => queue.queueManager));
    const queueFor = await Promise.all(queues.map(async (queue) => await User.idsToNames(queue.queue)));
    const queued = await Promise.all(queues.map(async (queue) => await User.idsToNames(queue.queue)));
    return queues.map((queue, i) => ({ ...queue, queueManager: queueManagers[i], queueFor: queueFor[i], queue: queued[i] }));
  }

  /**
   * Convert RestrictionDoc into more readable format for the frontend by converting
   * the user id into a name.
   */
  static async restriction(restriction: RestrictionDoc | null) {
    if (!restriction) {
      return restriction;
    }
    const user = (await User.getUserById(restriction.user)).name;
    return { ...restriction, user };
  }

  /**
   * Same as {@link restriction} but for an array of RestrictionDoc for improved performance.
   */
  static async restrictions(restrictions: RestrictionDoc[]) {
    const users = await User.idsToNames(restrictions.map((restriction) => restriction.user));
    return restrictions.map((restriction, i) => ({ ...restriction, user: users[i] }));
  }

  /**
   * Convert VoteDoc into more readable format for the frontend by converting
   * the user id into a name and parent id into a post object.
   */
  static async vote(vote: VoteDoc | null) {
    if (!vote) {
      return vote;
    }
    const user = (await User.getUserById(vote.user)).name;
    const parent = await this.post(await FocusedPost.getById(vote.parent));
    return { ...vote, user, parent };
  }

  /**
   * Same as {@link vote} but for an array of VoteDoc for improved performance.
   */
  static async votes(votes: VoteDoc[]) {
    const users = await User.idsToNames(votes.map((vote) => vote.user));
    const posts = await Promise.all(votes.map(async (vote) => await this.post(await FocusedPost.getById(vote.parent))));
    return votes.map((vote, i) => ({ ...vote, user: users[i], post: posts[i] }));
  }

  /**
   * Convert ConnectionRequestDoc into more readable format for the frontend
   * by converting the ids into names.
   */
  static async connectionRequests(requests: ConnectionRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const fromNames = await User.idsToNames(from);
    const to = requests.map((request) => request.to);
    const toNames = await User.idsToNames(to);
    return requests.map((request, i) => ({ ...request, from: fromNames[i], to: toNames[i] }));
  }

  /**
   * Convert ConnectionDoc into more readable format for the frontend
   * by converting the ids into names.
   */
  static async connection(connections: ConnectionDoc[]) {
    const user1 = connections.map((request) => request.user1);
    const user1Names = await User.idsToNames(user1);
    const user2 = connections.map((request) => request.user2);
    const user2Names = await User.idsToNames(user2);
    return connections.map((connection, i) => ({ ...connection, user1: user1Names[i], user2: user2Names[i] }));
  }
}

// focused post

Router.registerError(FocusedPostAuthorNotMatchError, async (e) => {
  const name = (await User.getUserById(e.author)).name;
  return e.formatWith(name, e._id);
});

// connection

Router.registerError(ConnectionRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.name, user2.name);
});

Router.registerError(ConnectionNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.name, user2.name);
});

Router.registerError(ConnectionRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.name, user2.name);
});

Router.registerError(AlreadyConnectedError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.name, user2.name);
});

// tag

Router.registerError(TaggerNotMatchError, async (e) => {
  const user = await User.getUserById(e.user);
  const post = await FocusedPost.getById(e.post);
  return e.formatWith(user.name, post.content);
});

Router.registerError(DuplicatedTagError, async (e) => {
  const user = await User.getUserById(e.user);
  const post = await FocusedPost.getById(e.post);
  return e.formatWith(user.name, post.content);
});

// comment

Router.registerError(CommentAuthorNotMatchError, async (e) => {
  const user = await User.getUserById(e.author);
  const content = (await Comment.getComment(e._id))?.content;
  return e.formatWith(user.name, content);
});

// applause

Router.registerError(UserExistsError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});

Router.registerError(NoCounterError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});

// application

Router.registerError(NotApplierError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});

Router.registerError(NotOwnerError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name, e.newStatus);
});

// folder

Router.registerError(NotInFolderError, async (e) => {
  const media = await Responses.oneMedia(e.item);
  return e.formatWith(media?.url);
});

Router.registerError(NoPracticeFolderError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});

Router.registerError(NotFolderOwnerError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});

Router.registerError(HasPracticeFolderError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});

// opportunity

Router.registerError(NotOpportunityOwnerError, async (e) => {
  const user = await User.getUserById(e.user);
  const opportunity = await Opportunity.getById(e._id);
  return e.formatWith(user.name, opportunity.title);
});

// portfolio

Router.registerError(NoPortfolioError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});

Router.registerError(HasPortfolioError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});

// queue

Router.registerError(DuplicateQueueError, async (e) => {
  const opportunity = await Opportunity.getById(e.opId);
  return e.formatWith(opportunity.title);
});

Router.registerError(NoQueueError, async (e) => {
  const opportunity = await Opportunity.getById(e.opId);
  return e.formatWith(opportunity.title);
});

Router.registerError(NotManagerError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});

Router.registerError(NotInQueueError, async (e) => {
  const user = await User.getUserById(e.user);
  const opportunity = await Opportunity.getById(e.opId);
  return e.formatWith(user.name, opportunity.title);
});

// restrictions

Router.registerError(AlreadyInitializedError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});

Router.registerError(NoRestrictionsError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});
