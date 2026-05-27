import express, { NextFunction, Request, Response } from "express";
import expressWs, { Application as ExpressApp } from "express-ws";
import userRouter from "./routes/user.route";
import dotenv from "dotenv";
import { HttpError } from "./helpers/HttpError";
import { MessageController } from "./controllers/MessageController.controller";
import conversationRouter from "./routes/conversation.route";

dotenv.config({ path: "./.env", quiet: true });

type WsApp = express.Express & ExpressApp;

const app: WsApp = express() as WsApp;
expressWs(app);

app.use(express.json());

const routers = [userRouter, conversationRouter];

routers.forEach((router) => app.use("/api", router));

app.use(handleHttpError);

function handleHttpError(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(err);
  if (err instanceof HttpError)
    return res
      .status(err.httpStatus)
      .json({ name: err.name, message: err.message });

  return res.status(500).json({ message: "Internal Server Error" });
}

const messageController = new MessageController();

app.ws("/chat/:convId", (ws, req) => messageController.send(ws, req));

app.listen(3000, () => console.log("App is listening"));
