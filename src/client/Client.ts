import fs from "fs";
import { loginHandler, LoginHandler } from "./common/LoginHandler";
import { APP_DIRECTORY } from "../constants";
import os from "os";
import { WebSocket } from "ws";
import crypto from "crypto";
import { PromptHandler, promptHandler } from "./common/PromptHandler";

// process.stdin.on("data", (key) => (key === "\u0003" ? process.exit(0) : null));
export type MessageType = { user: { id: string; name: string }; msg: Buffer };
export class Client {
  private static _privateKey: string = "";
  private static _username: string;
  private static _userId: string;

  public static get privateKey(): string {
    return this._privateKey;
  }

  public static set privateKey(val: string) {
    this._privateKey = val;
  }

  public static get username(): string {
    return this._username;
  }

  public static set username(val: string) {
    this._username = val;
  }

  public static get userId(): string {
    return this._userId;
  }

  public static set userId(val: string) {
    this._userId = val;
  }

  private loginHandler: LoginHandler;
  private static promptHandler: PromptHandler = promptHandler;
  constructor() {
    this.loginHandler = loginHandler;
    this.loginHandler.userLogin();
  }

  public static loadPrivateKey() {
    if (!Client.privateKey)
      Client.privateKey = fs.readFileSync(
        APP_DIRECTORY.replace("HOMEDIR", os.homedir()).replace(
          "USER",
          Client._username,
        ),
        "utf-8",
      );
    else Client.privateKey;
  }

  public static async connect(username: string) {
    console.log(`\nConnecting to: ${username}...`);

    const reciverIdResponse = await fetch(
      `http://localhost:3000/api/user/${username}`,
    );

    // console.log(reciverIdResponse);

    const userData = await reciverIdResponse.json();
    // TODO: Write Exception for error
    const conversationIdResponse = await fetch(
      `http://localhost:3000/api/conversation?userId=${this.userId}&reciverId=${userData.id}`,
    );

    const conversationData = await conversationIdResponse.json();

    const wsc = new WebSocket(
      `ws://localhost:3000/chat/${conversationData.id}`,
    );

    wsc.on("open", () => {
      console.log(`\rConnected to: ${conversationData.id}!\n`);
      process.stdout.write("(You): ");
    });

    wsc.on("message", (msg) => {
      const message: MessageType = JSON.parse(msg.toString());

      console.log(message.msg);

      const decryptedMsg = crypto
        .privateDecrypt(
          {
            key: this.privateKey,
            padding: crypto.constants.RSA_PKCS1_PADDING,
          },
          Buffer.from(message.msg.toString(), "base64"),
        )
        .toString("utf8");

      process.stdout.write(`\r${message.user ?? "(You)"}: ${decryptedMsg}\n`);
      process.stdout.write("(You): ");
    });

    wsc.on("error", (err) => console.error(err));
    while (true) {
      const msg = await this.promptHandler.prompt("(You): ");
      if (msg === "/exit") {
        wsc.close();
        break;
      }

      try {
        const data = await fetch(
          `http://localhost:3000/api/publickey/${userData.id}`,
        );

        const { key } = await data.json();

        const encryptedMsg = crypto.publicEncrypt(
          {
            key,
            padding: crypto.constants.RSA_PKCS1_PADDING,
          },
          Buffer.from(msg, "utf8"),
        );
        const payload: MessageType = {
          user: { id: this.userId, name: this.username },
          msg: encryptedMsg,
        };

        wsc.send(JSON.stringify(payload));
      } catch (error) {
        console.error(error);
      }
    }
  }
}

new Client();
