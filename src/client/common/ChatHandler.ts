import { WebSocket, RawData } from "ws";
import crypto from "crypto";
import { PromptHandler, promptHandler } from "./PromptHandler";
import { UserState, userState } from "./UserState";
import { commandHandler } from "./CommandHandler";
import fs from "fs";
import path from "path";
import { DecrptionHandler } from "./DecryptionHandler";
import { EncryptionHandler } from "./EncryptionHandler";
import { SelectChat } from "../commands/SelectChat";
export type MessageType = {
  type: "init_chat" | "usr_msg" | "usr_ext" | "usr_ent";
  user: { id: string; name: string };
  msg: string;
};

type ConversationData = { converId: string; key: string };

export class ChatHandler {
  private userState: UserState;
  private promptHandler: PromptHandler;

  private reciverPublicKey: string;

  private converAESKey: Buffer;
  private converId: string;

  private USER_CONVERSATION_FILE: string;

  constructor() {
    this.reciverPublicKey = "";
    this.userState = userState;
    this.promptHandler = promptHandler;
    this.converAESKey = Buffer.from("");
    this.USER_CONVERSATION_FILE = "";
    this.converId = "";
  }

  private generateConverAESKey(): Buffer {
    return crypto.randomBytes(32);
  }

  public async connect(username: string) {
    console.log(`\nConnecting to: ${username}...`);

    this.USER_CONVERSATION_FILE = path.join(
      this.userState.SESSION_FILE_PATH,
      "conversations.json",
    );

    const reciverId = await this.getReciverId(username);

    // TODO: Write Exception for Conversation not found error
    const conversationId = await this.getConversationId(reciverId);

    this.converId = conversationId;
    const wsc = new WebSocket(`ws://localhost:3000/chat/${conversationId}`);

    await this.getReciverPublicKey(reciverId);

    const websocketHandle = () => {
      console.log(`\rConnected to: ${conversationId}\n`);

      const conversations = this.loadConversationsFile();

      const existingConv = conversations.find(
        (conv) => conv.converId === conversationId,
      );

      if (!existingConv) {
        this.converAESKey = this.generateConverAESKey();
        this.sendConverAESKey(wsc, reciverId);
        this.saveConverKey(this.converAESKey);
      } else {
        this.converAESKey = Buffer.from(existingConv.key, "base64");
      }

      process.stdout.write("(You): ");
    };

    wsc.on("open", websocketHandle.bind(this));

    wsc.on("message", (msg) => this.reciveMessageHandle(msg));

    wsc.on("error", (err) => console.error(err));

    this.sendMessageHandle(wsc);
  }

  private async getReciverId(reciverName: string): Promise<string> {
    try {
      const reciverIdResponse = await fetch(
        `http://localhost:3000/api/user/${reciverName}`,
      );

      const userData = await reciverIdResponse.json();

      return userData.id;
    } catch (error) {
      throw error;
    }
  }

  private async sendConverAESKey(ws: WebSocket, reciverId: string) {
    const payload: MessageType = {
      type: "init_chat",
      user: { id: this.userState.userId, name: this.userState.username },
      msg: "",
    };

    const encryptedKey = EncryptionHandler.encryptWithUserPublicKey(
      this.converAESKey,
      this.reciverPublicKey,
    );

    payload.msg = encryptedKey.toString("base64");

    ws.send(JSON.stringify(payload));
  }

  private async getConversationId(reciverId: string): Promise<string> {
    try {
      const conversationIdResponse = await fetch(
        `http://localhost:3000/api/conversation?userId=${this.userState.userId}&reciverId=${reciverId}`,
      );

      const conversationData = await conversationIdResponse.json();

      if (conversationData.id === "undefined")
        throw new Error("Conversation not found!");

      return conversationData.id;
    } catch (error) {
      console.error(error);
      throw new Error();
    }
  }

  private ensureConversationFileExists(): void {
    if (!fs.existsSync(this.USER_CONVERSATION_FILE)) {
      fs.writeFileSync(
        this.USER_CONVERSATION_FILE,
        JSON.stringify([], null, 2),
      );
    }
  }

  private loadConversationsFile(): ConversationData[] {
    this.ensureConversationFileExists();

    try {
      const fileContent = fs.readFileSync(this.USER_CONVERSATION_FILE, "utf-8");
      const conversations: ConversationData[] = JSON.parse(fileContent);

      return Array.isArray(conversations) ? conversations : [];
    } catch (err) {
      return [];
    }
  }

  private saveConversationsFile(conversations: ConversationData[]): void {
    try {
      this.ensureConversationFileExists();

      fs.writeFileSync(
        this.USER_CONVERSATION_FILE,
        JSON.stringify(conversations, null, 2),
      );
    } catch (err) {
      console.error(err);
    }
  }

  private saveConverKey(chatKey: Buffer): void {
    let conversations = this.loadConversationsFile();

    const existingIndex = conversations.findIndex(
      (conv) => conv.converId === this.converId,
    );

    const entry: ConversationData = {
      converId: this.converId,
      key: chatKey.toString("base64"),
    };

    if (existingIndex !== -1) {
      conversations[existingIndex] = entry;
    } else {
      conversations.push(entry);
    }

    this.saveConversationsFile(conversations);
  }

  private async reciveMessageHandle(msg: RawData) {
    {
      const message: MessageType = JSON.parse(msg.toString());

      if (this.chatEvent(message)) return;

      const decryptedMsg = DecrptionHandler.decryptMessage(
        message.msg,
        this.converAESKey,
      );
      process.stdout.write(
        `\r${message.user.name ?? "(You)"}: ${decryptedMsg}\n`,
      );
      process.stdout.write("(You): ");
    }
  }

  private chatEvent(message: MessageType) {
    switch (message.type) {
      case "init_chat":
        this.converAESKey = DecrptionHandler.decryptWithUserPrivateKey(
          message.msg.toString(),
        );

        this.saveConverKey(this.converAESKey);
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

  private async sendMessageHandle(wsc: WebSocket) {
    while (true) {
      const msg = await this.promptHandler.prompt("(You): ");
      if (msg === "/exit") {
        wsc.close();
        commandHandler.handleCommand();
        break;
      }

      try {
        const encryptedMsg = EncryptionHandler.encryptMessage(
          msg,
          this.converAESKey,
        );

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

  private async getReciverPublicKey(reciverId: string): Promise<string> {
    if (!this.reciverPublicKey) {
      const data = await fetch(
        `http://localhost:3000/api/publickey/${reciverId}`,
      );

      const { key } = await data.json();

      this.reciverPublicKey = key;
    }

    return this.reciverPublicKey;
  }
}

export const chatHandler = new ChatHandler();
