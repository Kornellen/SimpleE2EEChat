import { Client } from "../Client";
import { commandHandler, CommandHandler } from "../commands/CommandHandler";

type UserData = { name: string; password: string };
export class LoginHandler {
  private userData: UserData;
  private tryCount: number = 1;

  public get Username() {
    return this.userData.name;
  }

  private commandHandler: CommandHandler;
  constructor() {
    this.userData = {
      name: "",
      password: "",
    };
    this.commandHandler = commandHandler;
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

    this.userData.name = await this.prompt("Name: ");
    this.userData.password = await this.prompt("Password: ", true);

    await this.loginUser();
  }

  public async prompt(
    question: string,
    isPassword: boolean = false,
  ): Promise<string> {
    return new Promise((resolve) => {
      let line = "";
      process.stdin.setRawMode(true);
      process.stdin.setEncoding("utf8");

      process.stdout.write(question);

      const handler = (key: string) => {
        if (key === "\u0003") process.exit(0);

        if (key === "\u007f" && line.length > 0) {
          line = line.slice(0, -1);
          process.stdout.write("\b \b");
          return;
        }

        if (key === "\r" || key === "\n") {
          var data = line;
          cleanup();
          return resolve(data.trim());
        }

        if (key.length === 1 && key >= " " && key <= "~") {
          line += key;
          process.stdout.write(isPassword ? "*" : key);
        }
      };

      const cleanup = () => {
        process.stdout.write("\r\n");
        process.stdin.off("data", handler);
        process.stdin.setRawMode(false);
        line = "";
      };

      process.stdin.on("data", handler);
    });
  }

  private async loginUser() {
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
      Client.username = result.name;
      Client.userId = result.id;

      Client.loadPrivateKey();

      console.log(`Logged as ${result.name} (${result.id})`);
      this.commandHandler.handleCommand();
    }
  }
}
export const loginHandler = new LoginHandler();
