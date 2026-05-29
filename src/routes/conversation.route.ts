import { Request, Response, Router } from "express";
import { IConversationService } from "../services/Conversation.interface";
import { ConversationService } from "../services/ConversationService.service";
import {
  ConversationController,
  IConversationController,
} from "../controllers/ConversationController.controller";
import { IUserService } from "../services/UserService.interface";
import { UserService } from "../services/UserService.service";

const conversationRouter = Router();

const conversationService: IConversationService = new ConversationService();
const userService: IUserService = UserService.getInstance();

const conversationController: IConversationController =
  new ConversationController(conversationService, userService);

conversationRouter.get("/conversation/", (req: Request, res: Response) =>
  conversationController.findConversationByMembers(req, res),
);

conversationRouter.post("/conversation", (req: Request, res: Response) =>
  conversationController.createConversation(req, res),
);

export default conversationRouter;
