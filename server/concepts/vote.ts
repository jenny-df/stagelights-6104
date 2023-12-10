import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError } from "./errors";

export interface VoteDoc extends BaseDoc {
  upvote: boolean;
  parent: ObjectId;
  user: ObjectId;
}

export default class VoteConcept {
  public readonly votes = new DocCollection<VoteDoc>("votes");

  /**
   * Creates a vote if it doesn't exist and updates or deletes it if it does
   * @param user id of the user deleting
   * @param parent id of the parent post/comment that has the vote
   * @param upvote if the vote is an upvote or not
   * @returns an object containing a message and the applause change
   */
  async vote(user: ObjectId, parent: ObjectId, upvote: boolean) {
    if (user && parent) {
      const vote = await this.votes.readOne({ user, parent });
      let applause = 0.5;

      if (vote) {
        if (vote.upvote === upvote) {
          await this.delete(user, parent);
          if (upvote) {
            applause = -0.5; // cancel perks from upvote
          }
          return { applausePoints: applause, msg: "vote removed" };
        }
        await this.votes.updateOne({ user, parent }, { upvote });
        if (!upvote) {
          applause = -0.5; // deduct applause for downvote
        }
        return { applausePoints: applause * 2, msg: "vote value updated" }; // double to undo previous vote
      }
      await this.votes.createOne({ user, upvote, parent });
      if (!upvote) {
        applause = -0.5; // deduct applause for downvote
      }
      return { applausePoints: applause, msg: "Vote successfully created!" };
    }
    throw new BadValuesError("there is a required field that's empty");
  }

  /**
   * Counts the total number of upvotes and downvotes for a given parent
   * @param parent id of the parent post/comment that has the vote
   * @returns an object containing the number of upvotes and the number of downvotes
   */
  async votesForParent(parent: ObjectId) {
    const votes = await this.votes.readMany({ parent });
    const count = { up: 0, down: 0 };
    for (const vote of votes) {
      if (vote.upvote) {
        count.up += 1;
      } else {
        count.down += 1;
      }
    }
    return count;
  }

  /**
   * Deletes a vote
   * @param user id of the user deleting
   * @param parent id of the parent post/comment that has the vote
   * @returns an object containing a success message
   */
  private async delete(user: ObjectId, parent: ObjectId) {
    await this.votes.deleteOne({ user, parent });
    return { msg: "Vote successfully deleted!" };
  }

  /**
   * Deletes all votes by a given user
   * @param user id of the user
   * @returns an object containing a success message
   */
  async deleteUser(user: ObjectId) {
    await this.votes.deleteMany({ user });
    return { msg: "Votes successfully deleted!" };
  }
}
