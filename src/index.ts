import express from "express";
import expressWs, { Application as ExpressApp } from "express-ws";
import userRouter from "./routes/user.route";
import dotenv from "dotenv";
import { WebSocket } from "ws";

dotenv.config({ path: "./.env", quiet: true });

type WsApp = express.Express & ExpressApp;

const app: WsApp = express() as WsApp;
expressWs(app);

app.use(express.json());

app.use("/api", userRouter);

const SOCKETS: WebSocket[] = [];

app.ws("/send", (ws, req) => {
  console.log("User connected to /send!");
  SOCKETS.push(ws);

  ws.ping(JSON.stringify({ message: "Hello Client" }));
  console.log(SOCKETS.length);

  ws.on("message", (data) => {
    console.log(data.toString());

    SOCKETS.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN && socket !== ws)
        socket.send(data);
    });

    console.log(req.query.conversation);
  });
  ws.on("close", () => {
    SOCKETS.filter((socket) => socket !== ws);
    console.log("user disconnected from /send");
  });
});

app.listen(3000, () => console.log("App is listening"));
