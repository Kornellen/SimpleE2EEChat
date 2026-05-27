import { Request, Response } from "express";

export interface IUserController {
  login: (req: Request, res: Response) => Promise<Response>;
  register: (req: Request, res: Response) => Promise<Response>;

  getPublicKey: (req: Request, res: Response) => Promise<Response>;

  getUserId: (req: Request, res: Response) => Promise<Response>;
}
