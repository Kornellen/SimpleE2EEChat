import { Request, Response } from "express";
import { HttpError } from "../helpers/HttpError";
import { Conversation } from "../models/prisma/client";
import { IConversationService } from "../services/Conversation.interface";
import { ConversationService } from "../services/ConversationService.service";
import { IUserService } from "../services/UserService.interface";

export interface IConversationController {
  findConversationByMembers(req: Request, res: Response): Promise<Response>;
  createConversation(req: Request, res: Response): Promise<Response>;
}

export class ConversationController implements IConversationController {
  private conversationService: IConversationService;
  private userService: IUserService;
  constructor(
    conversationService: IConversationService,
    userService: IUserService,
  ) {
    this.conversationService = conversationService;
    this.userService = userService;
  }
  public async findConversationByMembers(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const { userId, reciverId } = req.query;

    if (!userId || !reciverId)
      throw new HttpError("Bad request", 400, "Bad Request");

    let conver = await this.conversationService.findConversationByMembers([
      String(userId),
      String(reciverId),
    ]);

    if (conver === undefined) {
      req.body = { ...req.query };

      return this.createConversation(req, res);
    }

    return res.status(200).json(conver);
  }

  async createConversation(req: Request, res: Response): Promise<Response> {
    const { userId, reciverId } = req.body;

    console.log(req.body);

    if (
      !(await this.userService.isUserExisting(userId)) ||
      !(await this.userService.isUserExisting(reciverId))
    )
      throw new HttpError("Invalid users", 400, "Bad Request");

    const conver = await this.conversationService.createConversation([
      String(userId),
      String(reciverId),
    ]);

    return res.status(200).json(conver);
  }
}
