import { Client } from "../Client";
import { CommandHandler } from "../commands/CommandHandler";

type UserData = { name: string; password: string };
export class LoginHandler {
  private userData: UserData;
  private tryCount: number = 1;

  public get Username() {
    return this.userData.name;
  }

  private line: string = "";
  private nameHandlerBound;
  private passwordHandlerBound;

  private commandHandler: CommandHandler;
  constructor() {
    this.userData = {
      name: "",
      password: "",
    };
    this.commandHandler = new CommandHandler();

    this.nameHandlerBound = this.nameHandler.bind(this);
    this.passwordHandlerBound = this.passwordHandler.bind(this);
  }
  public userLogin() {
    this.userData = {
      name: "",
      password: "",
    };
    this.line = "";
    if (this.tryCount === 1) console.log("Welcome!");
    if (this.tryCount > 3) {
      console.log("Blocked for 30s. Login tries limit exceeded");

      setTimeout(() => {
        this.line = "";
        process.stdout.write("Name: ");
        process.stdin.on("data", this.nameHandlerBound);
        this.tryCount = 0;
      }, 30000);

      return;
    }
    process.stdout.write("Name: ");
    process.stdin.on("data", this.nameHandlerBound);
  }
  private nameHandler(key: string | Buffer<ArrayBuffer>) {
    if (key === "\u0003") process.exit(0);

    if (key === "\u007f") {
      this.line = this.line.slice(0, -1);
      process.stdout.write("\rName: \x1b[K");
      process.stdout.write(this.line);
      return;
    }

    if (key === "\r") {
      this.userData.name = this.line;
      process.stdout.write("\r\n");
      process.stdin.off("data", this.nameHandlerBound);
      this.line = "";
      process.stdout.write("Password: ");
      process.stdin.on("data", this.passwordHandlerBound);
      return;
    }
    this.line += key;
    process.stdout.write(key);
  }

  private passwordHandler(key: string | Buffer<ArrayBuffer>) {
    if (key === "\u0003") process.exit(0);

    if (key === "\u007f") {
      this.line = this.line.slice(0, -1);
      process.stdout.write("\rPassword: \x1b[K");
      process.stdout.write("*".repeat(this.line.length));
      return;
    }

    if (key === "\r" && this.line.length > 0) {
      this.userData.password = this.line;
      process.stdout.write("\r\n");
      process.stdin.off("data", this.passwordHandlerBound);

      this.loginUser();
      this.tryCount += 1;
      return;
    }
    if (
      typeof key === "string" &&
      key.length === 1 &&
      key >= " " &&
      key <= "~"
    ) {
      this.line += key;
      process.stdout.write("*");
    }
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
