import { Request } from "express";
import { WebSocket } from "ws";

export class MessageController {
  private SOCKETS: WebSocket[] = [];
  constructor() {}

  public send(ws: WebSocket, req: Request) {
    console.log("User connected to /send!");
    this.SOCKETS.push(ws);

    ws.ping(JSON.stringify({ message: "Hello Client" }));
    console.log(this.SOCKETS.length);

    ws.on("message", (data) => {
      console.log(data.toString());

      this.SOCKETS.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN && socket !== ws)
          socket.send(data);
      });

      console.log(req.query.conversation);
    });
    ws.on("close", () => {
      this.SOCKETS.filter((socket) => socket !== ws);
      console.log("user disconnected from /send");
    });
  }
}
