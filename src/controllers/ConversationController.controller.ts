import { Request, Response } from "express";
import { HttpError } from "../helpers/HttpError";
import { IConversationService } from "../services/Conversation.interface";
import { IUserService } from "../services/UserService.interface";
import { typeGuard } from "../client/common/UserState";

export interface IConversationController {
  findConversationByMembers(req: Request, res: Response): Promise<Response>;
  createConversation(req: Request, res: Response): Promise<Response>;
}

export class ConversationController implements IConversationController {
  private conversationService: IConversationService;
  private userService: IUserService;

  private uuidRegEx = new RegExp(
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  );
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
    const { userId, reciverId } = await this.validateRequest(req, "GET");

    let conver = await this.conversationService.findConversationByMembers([
      userId,
      reciverId,
    ]);

    if (conver === undefined) {
      req.body = { ...req.query };

      return this.createConversation(req, res);
    }

    return res.status(200).json(conver);
  }

  private async validateRequest(req: Request, method: "GET" | "POST") {
    const { userId, reciverId } = method === "GET" ? req.query : req.body;

    const isString: typeGuard<string> = (val): val is string =>
      typeof val === "string" && !userId;

    if (!isString(userId) || !isString(reciverId))
      throw new HttpError("Bad request", 400, "Bad Request");

    if (!this.uuidRegEx.test(userId) || this.uuidRegEx.test(reciverId))
      throw new HttpError("Bad request", 400, "Bad Request");

    if (
      !(await this.userService.isUserExisting(userId)) ||
      !(await this.userService.isUserExisting(reciverId))
    )
      throw new HttpError("User not found", 404, "Not Found");

    return method === "GET" ? req.query : req.body;
  }

  async createConversation(req: Request, res: Response): Promise<Response> {
    const { userId, reciverId } = await this.validateRequest(req, "POST");

    const conver = await this.conversationService.createConversation([
      userId,
      reciverId,
    ]);

    return res.status(200).json(conver);
  }
}
