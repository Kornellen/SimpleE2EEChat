import { userState, UserState } from "./UserState";
import fs from "fs";
import path from "path";
export class PrivateKeyHandler {
  private userState: UserState;

  constructor() {
    this.userState = userState;
  }

  public loadPrivateKey() {
    if (!this.userState.privateKey)
      this.userState.privateKey = fs.readFileSync(
        path.join(
          this.userState.SESSION_FILE_PATH,
          `priv_key_${this.userState.username}.pem`,
        ),
        "utf-8",
      );
    else this.userState.privateKey;
  }
}

export const privateKeyHandler = new PrivateKeyHandler();
