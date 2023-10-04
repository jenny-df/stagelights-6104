import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ChallengeDoc extends BaseDoc {
  challenger: ObjectId;
  prompt: string;
  numAccepted: number;
}

export default class ChallengeConcept {
  public readonly posted = new DocCollection<ChallengeDoc>("posted challenges");
  public readonly proposed = new DocCollection<ChallengeDoc>("proposed challenges");

  /**
   * Adds a new proposed challenges to the collection of proposed ones
   * @param challenger id of the challenge proposer
   * @param prompt the text of the prompt
   * @returns an object containing a success message and the proposed challenge object
   */
  async propose(challenger: ObjectId, prompt: string) {
    const numAccepted = 0;
    const _id = await this.proposed.createOne({ challenger, prompt, numAccepted });
    return { msg: "Challenge Proposal successfully created!", proposed: await this.proposed.readOne({ _id }) };
  }

  /**
   * Retrieves a given posted challenges
   * @param _id id of the challenge being retrieved
   * @returns a posted challenges belonging to the id given
   */
  async getPosted(_id: ObjectId) {
    return await this.posted.readOne({ _id });
  }

  /**
   * Retreives all posted challenges
   * @returns all posted challenges
   */
  async getAllPosted() {
    return await this.posted.readMany({});
  }

  /**
   * Randomly selects a challenge from the selection of proposed ones that haven't
   * been posted yet.
   * @returns an object containing a success message and the posted challenge object
   * @throws NoProposedChallenges if there are no proposed challenges yet
   */
  async randomlyPostOne() {
    const allProposals = await this.proposed.readMany({});
    const numProposals = allProposals.length;
    if (numProposals !== 0) {
      const randomlySelected = allProposals[Math.floor(Math.random() * numProposals)];
      const proposedId = randomlySelected._id;
      const numAccepted = 0;
      const challenger = randomlySelected.challenger;
      const prompt = randomlySelected.prompt;
      const postedId = await this.proposed.createOne({ challenger, prompt, numAccepted });
      await this.proposed.deleteOne({ proposedId });
      return { msg: "Challenge successfully posted!", posted: await this.posted.readOne({ postedId }) };
    }
    throw new NoProposedChallenges();
  }

  /**
   * Updates the number of people who have participated in the challenge
   * @param _id id of the challenge being accepted or cancelled
   * @param value 1 if challenge is being accepted or -1 if acceptance is cancelled
   */
  async updateChallengeCount(_id: ObjectId, value: number) {
    const challenge = await this.posted.readOne({ _id });
    if (challenge) {
      const numAccepted = challenge.numAccepted + value;
      await this.posted.updateOne({ _id }, { numAccepted }); // HERE (Might be incorrect)
    }
    throw new ChallengeNotFound(_id);
  }
}

export class ChallengeNotFound extends NotFoundError {
  constructor(public readonly _id: ObjectId) {
    super("{0} is not an existing challenge!", _id);
  }
}

export class NoProposedChallenges extends NotAllowedError {
  constructor() {
    super("No proposed challenges to select from!");
  }
}
