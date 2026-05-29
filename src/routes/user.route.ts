import { Request, Response, Router } from "express";
import { UserController } from "../controllers/UserController.controller";
import { UserService } from "../services/UserService.service";
import { IUserController } from "../controllers/UserController.interface";
import { IUserService } from "../services/UserService.interface";

const userRouter = Router();

const userService: IUserService = UserService.getInstance();
const userController: IUserController = new UserController(userService);

userRouter.get("/publickey/:userId", (req: Request, res: Response) =>
  userController.getPublicKey(req, res),
);

userRouter.post("/user/register", (req: Request, res: Response) =>
  userController.register(req, res),
);

userRouter.post("/user/login", (req: Request, res: Response) =>
  userController.login(req, res),
);

userRouter.get("/user/:name", (req: Request, res: Response) =>
  userController.getUserId(req, res),
);

export default userRouter;
