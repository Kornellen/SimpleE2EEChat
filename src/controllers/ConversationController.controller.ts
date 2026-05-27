import { Request, Response } from "express";
import { HttpError } from "../helpers/HttpError";
import { Conversation } from "../models/prisma/client";
import { IConversationService } from "../services/Conversation.interface";
import { ConversationService } from "../services/ConversationService.service";

export interface IConversationController {
  findConversationByMembers(req: Request, res: Response): Promise<Response>;
  createConversation(req: Request, res: Response): Promise<Response>;
}

export class ConversationController implements IConversationController {
  private conversationService: IConversationService;
  constructor(conversationService: IConversationService) {
    this.conversationService = conversationService;
  }
  public async findConversationByMembers(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const { userId, reciverId } = req.query;

    // console.log(userId + " " + reciverId);

    if (!userId || !reciverId)
      throw new HttpError("Bad request", 400, "Bad Request");

    const conver = await this.conversationService.findConversationByMembers([
      String(userId),
      String(reciverId),
    ]);

    if (conver === undefined)
      throw new HttpError("Conversation not found", 404, "Not Found");

    return res.status(200).json(conver);
  }

  async createConversation(req: Request, res: Response): Promise<Response> {
    const { userId, reciverId } = req.body;

    if (!userId || !reciverId)
      throw new HttpError("Bad request", 400, "Bad Request");

    const conver = await this.conversationService.createConversation([
      String(userId),
      String(reciverId),
    ]);

    return res.status(200).json(conver);
  }
}
