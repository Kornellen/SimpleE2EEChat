import { ConversationData } from "./ChatHandler";
import { KeyRing } from "./KeyRing";
import { userState, UserState } from "./UserState";
import fs from "fs";
import path from "path";
export class FileHandler {
  private static _SESSION_FILE_PATH: string;
  private static _PRIVATE_KEY_PATH: string;
  private static _CONVERSATIONS_FILE_PATH: string;

  private static userState: UserState = userState;
  private static keyRing: KeyRing;

  public static set SESSION_FILE_PATH(path: string) {
    this._SESSION_FILE_PATH = path;
  }
  public static set PRIVATE_KEY_PATH(path: string) {
    this._PRIVATE_KEY_PATH = path;
  }
  public static set CONVERSATIONS_FILE_PATH(path: string) {
    this._CONVERSATIONS_FILE_PATH = path;
  }

  public static get SESSION_FILE_PATH() {
    return this._SESSION_FILE_PATH;
  }
  public static get PRIVATE_KEY_PATH() {
    return this._PRIVATE_KEY_PATH;
  }
  public static get CONVERSATIONS_FILE_PATH() {
    return this._CONVERSATIONS_FILE_PATH;
  }

  public static loadPrivateKey() {
    if (!this.keyRing.userPrivateKey)
      return fs.readFileSync(this._PRIVATE_KEY_PATH, "utf-8");
    else return this.keyRing.userPrivateKey;
  }

  public static saveConversationsFile(conversations: ConversationData[]): void {
    try {
      this.ensureConversationFileExists();

      fs.writeFileSync(
        this.CONVERSATIONS_FILE_PATH,
        JSON.stringify(conversations, null, 2),
      );
    } catch (err) {
      console.error(err);
    }
  }

  public static ensureConversationFileExists(): void {
    if (!fs.existsSync(this.CONVERSATIONS_FILE_PATH)) {
      fs.writeFileSync(
        this.CONVERSATIONS_FILE_PATH,
        JSON.stringify([], null, 2),
      );
    }
  }

  public static loadConversationsFile(): ConversationData[] {
    this.CONVERSATIONS_FILE_PATH = path.join(
      this.userState.SESSION_FILE_PATH,
      "conversations.json",
    );

    this.ensureConversationFileExists();

    try {
      const fileContent = fs.readFileSync(
        this.CONVERSATIONS_FILE_PATH,
        "utf-8",
      );
      const conversations: ConversationData[] = JSON.parse(fileContent);

      return Array.isArray(conversations) ? conversations : [];
    } catch (err) {
      return [];
    }
  }
}
