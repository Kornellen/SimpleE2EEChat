import { UserState, userState } from "./UserState";
import path from "path";
import { FileHandler } from "./FileHandler";
import { ConversationData, MessageType } from "./ChatHandler";
import crypto from "crypto";
import { EncryptionHandler } from "./EncryptionHandler";
import { WebSocket } from "ws";
export class KeyRing {
  private _userPrivateKey: string = "";
  private _reciverPublicKey: string = "";

  private static _conversationKey: Buffer = Buffer.from("");

  private userState: UserState;

  public static get conversationKey(): Buffer {
    return this._conversationKey;
  }

  public get userPrivateKey(): string {
    return this._userPrivateKey;
  }

  public get reciverPublicKey(): string {
    return this._reciverPublicKey;
  }

  public static set conversationKey(val: Buffer) {
    this._conversationKey = val;
  }

  public set userPrivateKey(val: string) {
    this._userPrivateKey = val;
  }

  public set reciverPublicKey(val: string) {
    this._reciverPublicKey = val;
  }

  constructor() {
    this.reciverPublicKey = "";
    this.userPrivateKey = "";
    this.userState = userState;
  }

  public loadPrivateKey() {
    FileHandler.PRIVATE_KEY_PATH = path.join(
      this.userState.SESSION_FILE_PATH,
      `priv_key_${this.userState.username}.pem`,
    );
    this.userPrivateKey = FileHandler.loadPrivateKey();
  }

  public async loadReciverPublicKey(reciverId: string) {
    if (!this.reciverPublicKey) {
      const data = await fetch(
        `http://localhost:3000/api/publickey/${reciverId}`,
      );

      const { key } = await data.json();

      this.reciverPublicKey = key;
    }

    return this.reciverPublicKey;
  }

  public saveConverKey(converId: string): void {
    KeyRing.conversationKey = KeyRing.conversationKey;

    let conversations = FileHandler.loadConversationsFile();

    const existingIndex = conversations.findIndex(
      (conv) => conv.converId === converId,
    );

    const entry: ConversationData = {
      converId: converId,
      key: KeyRing.conversationKey.toString("base64"),
    };

    if (existingIndex !== -1) conversations[existingIndex] = entry;
    else conversations.push(entry);

    FileHandler.saveConversationsFile(conversations);
  }

  public async sendConverAESKey(ws: WebSocket) {
    const payload: MessageType = {
      type: "init_chat",
      user: { id: this.userState.userId, name: this.userState.username },
      msg: "",
    };

    const encryptedKey = EncryptionHandler.encryptWithUserPublicKey(
      KeyRing.conversationKey,
    );

    payload.msg = encryptedKey.toString("base64");

    ws.send(JSON.stringify(payload));
  }

  public static generateConverAESKey(): Buffer {
    return crypto.randomBytes(32);
  }
}

export const keyRing = new KeyRing();
