import { prisma } from "../../prisma/prisma";
import { HttpError } from "../helpers/HttpError";
import { Conversation } from "../models/prisma/client";
import { IConversationService } from "./Conversation.interface";
import { Mapper } from "./UserService.service";

export type ConversationDTO = { id: string };

export class ConversationService implements IConversationService {
  constructor() {}
  public async findConversationByMembers(
    membersIds: string[],
  ): Promise<Conversation | undefined> {
    const conver = await prisma.conversation.findFirst({
      where: {
        members: {
          every: {
            userId: { in: membersIds },
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!conver) return undefined;
    const mappedConver: Mapper<Conversation, ConversationDTO> = (
      conver: Conversation,
    ) => ({ id: conver.id });
    return mappedConver(conver);
  }

  async createConversation(membersIds: string[]): Promise<Conversation> {
    const conver = await this.findConversationByMembers(membersIds);

    if (conver) return conver;

    const createConver = await prisma.conversation.create({
      data: { id: undefined },
    });

    membersIds.forEach(
      async (member) =>
        await prisma.conversationMember.create({
          data: { userId: member, conversationId: createConver.id },
        }),
    );

    return createConver;
  }
}
