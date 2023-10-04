import { Comment, FocusedPost, User } from "./app";
import { ApplauseDoc, NoCounterError, UserExistsError } from "./concepts/applause";
import { ChallengeDoc } from "./concepts/challenge";
import { CommentAuthorNotMatchError, CommentDoc } from "./concepts/comment";
import { AlreadyConnectedError, ConnectionNotFoundError, ConnectionRequestAlreadyExistsError, ConnectionRequestDoc, ConnectionRequestNotFoundError } from "./concepts/connection";
import { OpportunityDoc } from "./concepts/opportunity";
import { FocusedPostAuthorNotMatchError, FocusedPostDoc } from "./concepts/post";
import { TagDoc, TaggerNotMatchError } from "./concepts/tag";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert FocusedPostDoc into more readable format for the frontend by converting
   * the author id into a name.
   */
  static async post(post: FocusedPostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await User.getUserById(post.author);
    const category = await FocusedPost.getCategory(post.category);
    return { ...post, author: author.name, category: category?.name };
  }

  /**
   * Same as {@link post} but for an array of FocusedPostDoc for improved performance.
   */
  static async posts(posts: FocusedPostDoc[]) {
    const authors = await User.idsToNames(posts.map((post) => post.author));

    const categories = await Promise.all(posts.map(async (post) => await FocusedPost.getCategory(post.category)));
    return posts.map((post, i) => ({ ...post, author: authors[i], category: categories[i] }));
  }

  /**
   * Convert CommentDoc into more readable format for the frontend by converting
   * the author id into a name.
   */
  static async comment(comment: CommentDoc | null) {
    if (!comment) {
      return comment;
    }
    const author = await User.getUserById(comment.author);
    return { ...comment, author: author.name };
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
    const tagger = await User.getUserById(tag.tagger);
    const tagged = await User.getUserById(tag.tagged);
    return { ...tag, tagger: tagger.name, tagged: tagged.name };
  }

  /**
   * Same as {@link tag} but for an array of TagDoc for improved performance.
   */
  static async tags(tags: TagDoc[]) {
    const taggers = await User.idsToNames(tags.map((tag) => tag.tagger));
    const tagged = await User.idsToNames(tags.map((tag) => tag.tagged));
    return tags.map((tag, i) => ({ ...tag, tagger: taggers[i], tagged: tagged[i] }));
  }

  /**
   * Convert ChallengeConcept into more readable format for the frontend by converting
   * the challenger id into a name.
   */
  static async challenge(challenge: ChallengeDoc | null) {
    if (!challenge) {
      return challenge;
    }
    const challenger = await User.getUserById(challenge.challenger);
    return { ...challenge, challenger: challenger.name };
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
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into names.
   */
  static async connectionRequests(requests: ConnectionRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const names = await User.idsToNames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: names[i], to: names[i + requests.length] }));
  }
}

Router.registerError(FocusedPostAuthorNotMatchError, async (e) => {
  const name = (await User.getUserById(e.author)).name;
  return e.formatWith(name, e._id);
});

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

Router.registerError(TaggerNotMatchError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name, "given tag");
});

Router.registerError(CommentAuthorNotMatchError, async (e) => {
  const user = await User.getUserById(e.author);
  const content = (await Comment.getComment(e._id))?.content;
  return e.formatWith(user.name, content);
});

Router.registerError(UserExistsError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});

Router.registerError(NoCounterError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.name);
});
