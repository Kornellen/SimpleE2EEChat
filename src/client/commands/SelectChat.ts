import { Client } from "../Client";
import { Select } from "./Select";

export class SelectChat extends Select {
  public name: string;
  private webUserNameHandlerBound = this.webUserNameHandler.bind(this);
  private line: string = "";
  private userName: string = "";

  constructor(name: string) {
    super(name.split(" ")[0]);
    this.name = name;
    super.addChild(this);
  }

  public onCommand(): void {
    process.stdout.write("\n> Input user name: ");
    process.stdin.on("data", this.webUserNameHandlerBound);
  }

  private webUserNameHandler(key: string) {
    if (key === "\u007f") {
      this.line = this.line.slice(0, -1);
      process.stdout.write("\r> Input user name: \x1b[K");
      process.stdout.write(this.line);
      return;
    }

    if (key === "\r") {
      this.userName = this.line;
      process.stdout.write("\r\n");
      process.stdin.off("data", this.webUserNameHandlerBound);
      this.line = "";
      Client.connect(this.userName);
      return;
    }

    this.line += key;
    process.stdout.write(key);
  }
}
