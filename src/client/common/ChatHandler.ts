import { WebSocket, RawData } from "ws";
import crypto from "crypto";
import { PromptHandler, promptHandler } from "./PromptHandler";
import { UserState, userState } from "./UserState";
import { commandHandler } from "./CommandHandler";

export type MessageType = { user: { id: string; name: string }; msg: Buffer };
export class ChatHandler {
  private userState: UserState;
  private promptHandler: PromptHandler;

  private reciverPublicKey: string;

  constructor() {
    this.reciverPublicKey = "";
    this.userState = userState;
    this.promptHandler = promptHandler;
  }
  public async connect(username: string) {
    console.log(`\nConnecting to: ${username}...`);

    const reciverId = await this.getReciverId(username);

    // TODO: Write Exception for Conversation not found error
    const conversationId = await this.getConversationId(reciverId);

    const wsc = new WebSocket(`ws://localhost:3000/chat/${conversationId}`);

    wsc.on("open", () => {
      console.log(`\rConnected to: ${conversationId}\n`);
      process.stdout.write("(You): ");
    });

    wsc.on("message", (msg) => this.reciveMessageHandle(msg));

    wsc.on("error", (err) => console.error(err));

    this.sendMessageHandle(wsc, reciverId);
  }

  private async getReciverId(reciverName: string): Promise<string> {
    const reciverIdResponse = await fetch(
      `http://localhost:3000/api/user/${reciverName}`,
    );

    const userData = await reciverIdResponse.json();

    return userData.id;
  }

  private async getConversationId(reciverId: string): Promise<string> {
    const conversationIdResponse = await fetch(
      `http://localhost:3000/api/conversation?userId=${this.userState.userId}&reciverId=${reciverId}`,
    );

    const conversationData = await conversationIdResponse.json();

    if (conversationData.id === "undefined")
      throw new Error("Conversation not found!");

    return conversationData.id;
  }

  private async reciveMessageHandle(msg: RawData) {
    {
      const message: MessageType = JSON.parse(msg.toString());

      const decryptedMsg = crypto
        .privateDecrypt(
          {
            key: this.userState.privateKey,
            padding: crypto.constants.RSA_PKCS1_PADDING,
          },
          Buffer.from(message.msg),
        )
        .toString("utf8");

      process.stdout.write(
        `\r${message.user.name ?? "(You)"}: ${decryptedMsg}\n`,
      );
      process.stdout.write("(You): ");
    }
  }

  private async sendMessageHandle(wsc: WebSocket, reciverId: string) {
    while (true) {
      const msg = await this.promptHandler.prompt("(You): ");
      if (msg === "/exit") {
        wsc.close();
        commandHandler.handleCommand();
        break;
      }

      try {
        const key = await this.getReciverPublicKey(reciverId);

        const encryptedMsg = crypto.publicEncrypt(
          {
            key,
            padding: crypto.constants.RSA_PKCS1_PADDING,
          },
          Buffer.from(msg, "utf8"),
        );

        const payload: MessageType = {
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
