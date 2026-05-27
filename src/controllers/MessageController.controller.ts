import { Request } from "express";
import { WebSocket } from "ws";

export class MessageController {
  private SOCKETS: Set<WebSocket> = new Set();
  constructor() {}

  public send(ws: WebSocket, req: Request) {
    console.log("User connected to /send!");
    this.SOCKETS.add(ws);

    ws.ping(JSON.stringify({ message: "Hello Client" }));
    console.log(`Current Number of connected users: ${this.SOCKETS.size}`);

    ws.on("pong", (asnw) => console.log(asnw.toString()));

    ws.on("message", (data) => {
      this.SOCKETS.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN && socket !== ws)
          socket.send(data);
      });
    });
    ws.on("close", () => {
      this.SOCKETS.delete(ws);
      console.log("User disconnected from /send");
      console.log(`Current Number of connected users: ${this.SOCKETS.size}`);
    });
  }
}
