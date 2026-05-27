import { Request, Response, Router } from "express";
import { IConversationService } from "../services/Conversation.interface";
import { ConversationService } from "../services/ConversationService.service";
import {
  ConversationController,
  IConversationController,
} from "../controllers/ConversationController.controller";

const conversationRouter = Router();

const conversationService: IConversationService = new ConversationService();
const conversationController: IConversationController =
  new ConversationController(conversationService);

conversationRouter.get("/conversation/", (req: Request, res: Response) =>
  conversationController.findConversationByMembers(req, res),
);

conversationRouter.post("/conversation", (req: Request, res: Response) =>
  conversationController.createConversation(req, res),
);

export default conversationRouter;
