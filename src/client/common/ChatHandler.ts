import { WebSocket, RawData } from "ws";

import { PromptHandler, promptHandler } from "./PromptHandler";
import { UserState, userState } from "./UserState";
import { commandHandler } from "./CommandHandler";
import fs from "fs";
import path from "path";
import { DecrptionHandler } from "./DecryptionHandler";
import { EncryptionHandler } from "./EncryptionHandler";
import { keyRing, KeyRing } from "./KeyRing";
import { FileHandler } from "./FileHandler";
export type MessageType = {
  type: "init_chat" | "usr_msg" | "usr_ext" | "usr_ent";
  user: { id: string; name: string };
  msg: string;
};

export type ConversationData = { converId: string; key: string };

export class ChatHandler {
  private userState: UserState;
  private promptHandler: PromptHandler;

  private keyRing: KeyRing;

  private converId: string;

  constructor() {
    this.userState = userState;
    this.promptHandler = promptHandler;
    this.keyRing = keyRing;

    this.converId = "";
  }
  private createWebSocket(): WebSocket {
    return new WebSocket(`ws://localhost:3000/chat/${this.converId}`);
  }
  public async connect(username: string) {
    try {
      console.log(`\nConnecting to: ${username}...`);

      const reciverId = await this.getReciverId(username);

      if (reciverId === undefined) throw new Error("User not found");

      const conversationId = await this.getConversationId(reciverId);

      this.converId = conversationId;

      const wsc = this.createWebSocket();

      await this.keyRing.loadReciverPublicKey(reciverId);

      wsc.on("open", () => this.webSocketHandle(wsc));

      wsc.on("message", (msg) => this.reciveMessageHandle(msg));

      wsc.on("error", (err) => console.error(err));

      this.sendMessageHandle(wsc);
    } catch (error) {
      if (error instanceof Error) console.error(`[SYSTEM]: ${error.message}`);
      else console.error(error);

      commandHandler.handleCommand();
    }
  }

  private webSocketHandle(wsc: WebSocket) {
    console.log(`\rConnected to: ${this.converId}\n`);

    const conversation = this.findConversation();

    if (!conversation) {
      KeyRing.conversationKey = KeyRing.generateConverAESKey();
      this.keyRing.sendConverAESKey(wsc);

      this.keyRing.saveConverKey(this.converId);
    } else {
      KeyRing.conversationKey = Buffer.from(conversation.key, "base64");
    }
    process.stdout.write("(You): ");
  }

  private async getReciverId(reciverName: string): Promise<string | undefined> {
    try {
      const reciverIdResponse = await fetch(
        `http://localhost:3000/api/user/${reciverName}`,
      );

      const userData = await reciverIdResponse.json();
      if (!userData) return undefined;
      return userData.id;
    } catch (error) {
      throw error;
    }
  }

  private findConversation(): ConversationData | undefined {
    const conversations = FileHandler.loadConversationsFile();

    const existingConv = conversations.find(
      (conv) => conv.converId === this.converId,
    );

    return existingConv;
  }
  private async getConversationId(reciverId: string): Promise<string> {
    try {
      const conversationIdResponse = await fetch(
        `http://localhost:3000/api/conversation?userId=${this.userState.userId}&reciverId=${reciverId}`,
      );

      const conversationData = await conversationIdResponse.json();

      if (conversationData.id === undefined)
        throw new Error("Conversation not found!");

      return conversationData.id;
    } catch (error) {
      console.error(error);
      throw new Error();
    }
  }

  private chatEvent(message: MessageType) {
    switch (message.type) {
      case "init_chat":
        KeyRing.conversationKey = DecrptionHandler.decryptWithUserPrivateKey(
          message.msg.toString(),
        );

        this.keyRing.saveConverKey(this.converId);
        return true;
      case "usr_ext":
      case "usr_ent":
        process.stdout.write(`\r${message.user.name}: ${message.msg}\n`);
        process.stdout.write(`\r(You): `);
        return true;
      case "usr_msg":
        return false;
    }
  }

  private async reciveMessageHandle(msg: RawData) {
    {
      const message: MessageType = JSON.parse(msg.toString());

      if (this.chatEvent(message)) return;

      const decryptedMsg = DecrptionHandler.decryptMessage(message.msg);
      process.stdout.write(
        `\r${message.user.name ?? "(You)"}: ${decryptedMsg}\n`,
      );
      process.stdout.write("(You): ");
    }
  }

  private async sendMessageHandle(wsc: WebSocket) {
    while (true) {
      const msg = await this.promptHandler.prompt("(You): ");
      if (msg === "/exit") {
        wsc.close();
        commandHandler.handleCommand();
        break;
      }

      try {
        const encryptedMsg = EncryptionHandler.encryptMessage(msg);

        const payload: MessageType = {
          type: "usr_msg",
          user: { id: this.userState.userId, name: this.userState.username },
          msg: encryptedMsg,
        };

        wsc.send(JSON.stringify(payload));
      } catch (error) {
        console.error(error);
      }
    }
  }
}

export const chatHandler = new ChatHandler();
