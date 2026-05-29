import { Request } from "express";
import { WebSocket } from "ws";
import { prisma } from "../../prisma/prisma";
import { Mapper } from "../services/UserService.service";
import { MessageType } from "../client/common/ChatHandler";

type MessageDTO = { user: { id: string; name: string }; msg: Buffer };

export class MessageController {
  private SOCKETS: Set<WebSocket> = new Set();
  private INIT_CHAT_MSGS: Map<string, MessageType> = new Map();
  constructor() {}

  public async chat(ws: WebSocket, req: Request) {
    console.log("User connected to /chat!");

    this.broadcastToHosts(ws, {
      type: "usr_ent",
      msg: "User entered chat",
      user: { id: "NONE", name: "[SYSTEM]" },
    });

    const convId = String(req.params.convId);
    this.SOCKETS.add(ws);
    if (!this.INIT_CHAT_MSGS.has(convId)) this.loadChatHistory(ws, convId);

    ws.on("message", (data) => {
      const parsedData: MessageType = JSON.parse(data.toString());

      if (parsedData.type === "init_chat") {
        this.handleChatInit(convId, parsedData, ws);
        return;
      }

      this.saveMessage(convId, parsedData.msg, parsedData.user.id);

      this.broadcastToHosts(ws, parsedData);
    });

    ws.on("close", () => {
      this.SOCKETS.delete(ws);
      this.broadcastToHosts(ws, {
        type: "usr_ext",
        msg: "User left chat",
        user: { id: "NONE", name: "[SYSTEM]" },
      });
      console.log(`User left conversation: ${convId}`);
    });
  }

  private broadcastToHosts(ws: WebSocket, msg: MessageType) {
    this.SOCKETS.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN && socket !== ws)
        socket.send(JSON.stringify(msg));
    });
  }

  private handleChatInit(
    convId: string,
    initMessage: MessageType,
    senderWs: WebSocket,
  ) {
    const existingInit = this.INIT_CHAT_MSGS.get(convId);

    if (!existingInit) {
      this.INIT_CHAT_MSGS.set(convId, initMessage);
    } else {
      senderWs.send(JSON.stringify(existingInit));
      this.INIT_CHAT_MSGS.delete(convId);
    }
  }

  private async saveMessage(
    converId: string,
    msg: string,
    userId: string,
  ): Promise<void> {
    await prisma.message.create({
      data: {
        content: msg,
        conversationId: converId,
        userId: userId,
      },
    });
  }
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
