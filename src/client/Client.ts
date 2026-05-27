import fs from "fs";
import { LoginHandler } from "./common/LoginHandler";
import { APP_DIRECTORY } from "../constants";
import os from "os";
import { WebSocket } from "ws";
import crypto from "crypto";

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdin.on("data", (key) => (key === "\u0003" ? process.exit(0) : null));

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

  constructor() {
    this.loginHandler = new LoginHandler();
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

    console.log(`\nFetching id...`);
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

    wsc.on("ping", () => {
      wsc.pong(JSON.stringify({ message: "Connection established" }));
    });

    wsc.on("open", () => {
      console.log("Connection is open!\n");

      process.stdout.write("(You): ");
    });

    wsc.on("message", (msg) => {
      const message: { user: string; msg: Buffer } = JSON.parse(msg.toString());
      console.log((message.msg as any).data as Buffer);

      const decryptedMsg = crypto
        .privateDecrypt(
          {
            key: this.privateKey,
            padding: crypto.constants.RSA_PKCS1_PADDING,
          },
          Buffer.from(message.msg),
        )
        .toString("utf8");

      process.stdout.write(`${message.user}: ${decryptedMsg}\n`);
    });

    let currentMessage = "";
    process.stdout.write("(You): ");
    process.stdin.on("data", async (key) => {
      if (key === "\u0003") process.exit();

      if (key === "\r") {
        const data = await fetch(
          `http://localhost:3000/api/publickey/${userData.id}`,
        );

        const { key } = await data.json();

        const encryptedMsg = crypto.publicEncrypt(
          {
            key,
            padding: crypto.constants.RSA_PKCS1_PADDING,
          },
          Buffer.from(currentMessage, "utf8"),
        );
        wsc.send(JSON.stringify({ user: this.username, msg: encryptedMsg }));
        process.stdout.write("\r\n");
        process.stdout.write("(You): ");
        currentMessage = "";
      }

      if (key === "\u007f") {
        currentMessage = currentMessage.slice(0, -1);
        process.stdout.write("\r\x1b[K");
        process.stdout.write(currentMessage);
        return;
      }

      currentMessage += key;
      process.stdout.write(key);
    });

    wsc.on("error", (err) => console.error(err));

    return;
  }
}

new Client();
