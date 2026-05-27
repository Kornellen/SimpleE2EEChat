import { Request } from "express";
import { WebSocket } from "ws";
import { prisma } from "../../prisma/prisma";
import { Mapper } from "../services/UserService.service";
import { MessageType } from "../client/Client";

type MessageDTO = { user: { id: string; name: string }; msg: Buffer };

export class MessageController {
  private SOCKETS: Set<WebSocket> = new Set();
  constructor() {}

  public async chat(ws: WebSocket, req: Request) {
    console.log("User connected to /chat!");
    const convId = String(req.params.convId);
    this.SOCKETS.add(ws);

    //! Works but, Chat supports only asymmetric chatting.
    // const msgs = await this.fetchLastMessages(convId);
    // msgs.forEach((msg) => ws.send(JSON.stringify(msg)));

    ws.ping(JSON.stringify({ message: "Hello Client" }));
    console.log(`Current Number of connected users: ${this.SOCKETS.size}`);

    ws.on("pong", (asnw) => console.log(asnw.toString()));

    // function toBuffer(data: any) {
    //   if (Buffer.isBuffer(data)) return data;

    //   if (data?.type === "Buffer" && Array.isArray(data?.data))
    //     return Buffer.from(data.data);

    //   if (typeof data === "string") return Buffer.from(data, "utf8");

    //   return Buffer.from(data);
    // }

    ws.on("message", (data) => {
      const parsedData: MessageType = JSON.parse(data.toString());
      // const encryptedBuffer = toBuffer(parsedData.msg);
      // const encryptedBufferBase64 = encryptedBuffer.toString("base64");

      // this.saveMessage(convId, encryptedBufferBase64, parsedData.user.id);

      this.SOCKETS.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN && socket !== ws)
          socket.send(data);
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
    msg: string,
    userId: string,
  ): Promise<void> {
    await prisma.message.create({
      data: { content: msg, conversationId: converId, userId: userId },
    });
  }
  //! Works but, Chat supports only asymmetric chatting.

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
