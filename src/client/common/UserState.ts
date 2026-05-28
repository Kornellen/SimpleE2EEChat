import os from "os";
import { APP_DIRECTORY } from "../../constants";
import path from "path";
import fs from "fs";
import { PromptHandler, promptHandler } from "./PromptHandler";
import { SessionError } from "./helpers/SessionError";

export type typeGuard<T> = (val: unknown) => val is T;

export type Token = { token: string; exp: Date };

export type SessionData = {
  userId: string;
  username: string;
};

export class UserState {
  private _SESSION_FILE_PATH: string;
  private _userId: string = "";
  private _username: string = "";

  private _privateKey: string = "";

  public get SESSION_FILE_PATH(): string {
    return this._SESSION_FILE_PATH;
  }

  public set username(name: string) {
    this._username = name;
  }
  public get username(): string {
    return this._username;
  }

  public set userId(id: string) {
    this._userId = id;
  }
  public get userId(): string {
    return this._userId;
  }

  public set privateKey(key: string) {
    this._privateKey = key;
  }
  public get privateKey(): string {
    return this._privateKey;
  }

  private promptHandler: PromptHandler;
  constructor() {
    this._SESSION_FILE_PATH = "";
    this.privateKey = "";
    this.promptHandler = promptHandler;
  }

  public async save(data: SessionData): Promise<void> {
    this.userId = data.userId;
    this.username = data.username;
    fs.writeFileSync(
      path.join(this._SESSION_FILE_PATH, "session.json"),
      JSON.stringify(data, null, 2),
    );
  }

  public async load(): Promise<boolean> {
    try {
      const appDir = APP_DIRECTORY.replace("HOMEDIR", os.homedir());
      const profiles = fs.readdirSync(appDir);

      process.stdout.write(
        profiles.map((profile, idx) => `${idx}) ${profile}`).join(" ") + "\n",
      );

      if (profiles.length > 1) {
        const profileNumber = await this.promptHandler.prompt(
          "Enter profile number: ",
        );

        const isNumber: typeGuard<number> = (val: unknown): val is number => {
          return !isNaN(Number(val)) && isFinite(Number(val) && Number(val));
        };

        if (!isNumber(profileNumber)) throw new Error("Invalid data type!");

        this._SESSION_FILE_PATH = path.join(appDir, profiles[profileNumber]);
      } else this._SESSION_FILE_PATH = path.join(appDir, profiles[0]);
      const sessionFilePath = path.join(
        this._SESSION_FILE_PATH,
        "session.json",
      );
      if (fs.existsSync(sessionFilePath)) {
        const sessionData = JSON.parse(
          fs.readFileSync(sessionFilePath, "utf-8"),
        ) as SessionData;

        if (!sessionData)
          throw new SessionError(
            "Invalid Session data",
            "Invalid Session data",
          );

        this.userId = sessionData.userId;
        this.username = sessionData.username;

        return true;
      } else {
        throw new SessionError("File not found", "Session file not found!");
      }
    } catch (error) {
      if (error instanceof SessionError) {
        console.error(`${error.name} ${error.message}`);
        return false;
      }

      if (error) console.error(error);

      return false;
    }
  }
}

export const userState = new UserState();
