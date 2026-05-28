import { Request } from "express";
import { WebSocket } from "ws";
import { prisma } from "../../prisma/prisma";
import { Mapper } from "../services/UserService.service";
import { MessageType } from "../client/common/ChatHandler";

type MessageDTO = { user: { id: string; name: string }; msg: Buffer };

export class MessageController {
  private SOCKETS: Set<WebSocket> = new Set();
  constructor() {}

  public async chat(ws: WebSocket, req: Request) {
    console.log("User connected to /chat!");
    const convId = String(req.params.convId);
    this.SOCKETS.add(ws);

    ws.ping(JSON.stringify({ message: "Hello Client" }));
    console.log(`Current Number of connected users: ${this.SOCKETS.size}`);

    ws.on("pong", (asnw) => console.log(asnw.toString()));

    ws.on("message", (data) => {
      const parsedData: MessageType = JSON.parse(data.toString());

      this.SOCKETS.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN && socket !== ws)
          socket.send(JSON.stringify(parsedData));
      });
    });
    ws.on("close", () => {
      this.SOCKETS.delete(ws);
      console.log("User disconnected from /chat");
      console.log(`Current Number of connected users: ${this.SOCKETS.size}`);
    });
  }

  //! Works but, Chat supports only asymmetric chatting.
  private async saveMessage(
    converId: string,
    msg: Buffer,
    userId: string,
  ): Promise<void> {
    function toBuffer(data: any) {
      if (Buffer.isBuffer(data)) return data;

      if (data?.type === "Buffer" && Array.isArray(data?.data))
        return Buffer.from(data.data);

      if (typeof data === "string") return Buffer.from(data, "utf8");

      return Buffer.from(data);
    }

    const encryptedBuffer = toBuffer(msg);
    const encryptedBufferBase64 = encryptedBuffer.toString("base64");

    await prisma.message.create({
      data: {
        content: encryptedBufferBase64,
        conversationId: converId,
        userId: userId,
      },
    });
  }
  //! Works but, Chat supports only asymmetric chatting.
  private async loadChatHistory(ws: WebSocket, converId: string) {
    const msgs = await this.fetchLastMessages(converId);
    msgs.forEach((msg) => ws.send(JSON.stringify(msg)));
  }

  private async fetchLastMessages(converId: string): Promise<MessageDTO[]> {
    const msgs = await prisma.message.findMany({
      where: { conversationId: converId },
      select: { content: true, user: { select: { name: true, id: true } } },
    });
    if (!msgs) return [];
    const mappedMsgs: Mapper<typeof msgs, MessageDTO[]> = (
      msgs,
    ): MessageDTO[] =>
      msgs.map(
        (msg): MessageDTO => ({
          user: { id: msg.user.id, name: msg.user.name },
          msg: Buffer.from(msg.content, "base64"),
        }),
      );

    return mappedMsgs(msgs);
  }
}
