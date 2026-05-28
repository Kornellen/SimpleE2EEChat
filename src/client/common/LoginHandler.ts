import { Client } from "../Client";
import { commandHandler, CommandHandler } from "./CommandHandler";
import { PrivateKeyHandler, privateKeyHandler } from "./PrivateKeyHandler";
import { promptHandler } from "./PromptHandler";
import { UserState, userState } from "./UserState";

type UserData = { name: string; password: string };
export class LoginHandler {
  private userData: UserData;
  private tryCount: number = 1;

  public get Username(): string {
    return this.userData.name;
  }

  private commandHandler: CommandHandler;
  private userStateHandler: UserState;
  private privateKeyHandler: PrivateKeyHandler;
  constructor() {
    this.userData = {
      name: "",
      password: "",
    };
    this.commandHandler = commandHandler;
    this.userStateHandler = userState;
    this.privateKeyHandler = privateKeyHandler;
  }
  public async userLogin() {
    this.userData = {
      name: "",
      password: "",
    };
    if (this.tryCount === 1) console.log("Welcome!");
    if (this.tryCount > 3) {
      console.log("Blocked for 30s. Login tries limit exceeded");

      setTimeout(() => {
        this.tryCount = 1;
        this.userLogin();
      }, 5000);

      return;
    }
    if (await this.userStateHandler.load()) {
      return this.loginUser(true);
    }
    this.userData.name = await promptHandler.prompt("Name: ");
    this.userData.password = await promptHandler.prompt("Password: ", true);
    await this.loginUser();
  }

  private async loginUser(fromSession: boolean = false) {
    if (!fromSession) {
      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      const response = await fetch("http://localhost:3000/api/user/login", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(this.userData),
      });

      if (!response.ok) {
        this.tryCount += 1;
        const { message } = await response.json();
        console.error(`${message}`);

        this.userLogin();
      } else {
        const result = await response.json();

        await userState.save({ userId: result.id, username: result.name });
      }
    }

    this.privateKeyHandler.loadPrivateKey();
    console.log(`Logged as ${userState.username} (${userState.userId})`);
    this.commandHandler.handleCommand();
  }
}
export const loginHandler = new LoginHandler();
