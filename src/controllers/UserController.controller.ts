import { Request, Response } from "express";
import { HttpError } from "../helpers/HttpError";
import { IUserController } from "./UserController.interface";
import { IUserService, UserDTO } from "../services/UserService.interface";

export class UserController implements IUserController {
  private userService: IUserService;
  constructor(userService: IUserService) {
    this.userService = userService;
  }

  public async login(req: Request, res: Response): Promise<Response> {
    try {
      const { name, password } = req.body;

      if (!name || !password)
        throw new HttpError("Bad Request", 400, "Bad Request");

      const userData: UserDTO = await this.userService.login(name, password);

      return res.status(200).json(userData);
    } catch (error) {
      console.error(error);
      if (error instanceof HttpError)
        return res
          .status(error.httpStatus)
          .json({ name: error.name, message: error.message });

      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  public async register(req: Request, res: Response): Promise<Response> {
    try {
      const { name, password } = req.body;

      if (!name || !password)
        throw new HttpError("Bad Request", 400, "Bad Request");

      const userData: UserDTO = await this.userService.register(name, password);

      return res.status(200).json(userData);
    } catch (error) {
      console.error(error);
      if (error instanceof HttpError)
        return res
          .status(error.httpStatus)
          .json({ name: error.name, message: error.message });

      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  public async getPublicKey(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== "string")
        throw new Error("Invalid userId");

      const key = await this.userService.getPublicKey(userId);

      return res.status(200).json(key);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof HttpError)
        return res
          .status(error.httpStatus)
          .json({ name: error.name, message: error.message });

      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
}
