import ApplauseConcept from "./concepts/applause";
import ChallengeConcept from "./concepts/challenge";
import CommentConcept from "./concepts/comment";
import ConnectionConcept from "./concepts/connection";
import OpportunityConcept from "./concepts/opportunity";
import FocusedPostConcept from "./concepts/post";
import TagConcept from "./concepts/tag";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const FocusedPost = new FocusedPostConcept();
export const Connection = new ConnectionConcept();
export const Comment = new CommentConcept();
export const Tag = new TagConcept();
export const Challenge = new ChallengeConcept();
export const Applause = new ApplauseConcept();
export const Opportunity = new OpportunityConcept();
