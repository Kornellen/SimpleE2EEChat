import { Conversation } from "../models/prisma/client";

export interface IConversationService {
  findConversationByMembers(
    membersIds: string[],
  ): Promise<Conversation | undefined>;

  createConversation(membersIds: string[]): Promise<Conversation>;
}
