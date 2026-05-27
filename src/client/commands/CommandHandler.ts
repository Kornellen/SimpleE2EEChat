import { Command } from "./Command";
import { Help, Select, SelectChat, SwitchUser } from "./Commands";
import { ShowKey } from "./ShowKey";
export class CommandHandler {
  private command: string;
  private commands: Command[];
  constructor() {
    this.command = "";
    this.commands = [
      new Help("help"),
      new Select("select"),
      new SelectChat("select chat"),
      new SwitchUser("switch user"),
      new ShowKey("show key"),
    ];
  }

  private line: string = "";
  private commandHandlerBounds = this.commandHandler.bind(this);

  private commandHandler(key: string) {
    if (key === "\u0003") process.exit(0);

    if (key === "\u007f") {
      this.line = this.line.slice(0, -1);
      process.stdout.write("\rInput Command > \x1b[K");
      process.stdout.write(this.line);
      return;
    }

    if (key === "\r" && this.line.length > 0) {
      this.command = this.line;
      process.stdin.off("data", this.commandHandlerBounds);
      this.selectCommand();
      this.command = "";
      this.line = "";
      return;
    }

    if (key === "\u0005") return this.availableCommands();

    this.line += key;
    process.stdout.write(key);
  }

  public handleCommand() {
    process.stdout.write("Input Command > ");
    process.stdin.on("data", this.commandHandlerBounds);
  }

  private availableCommands() {
    this.commands.forEach((command) =>
      process.stdout.write("\n> " + command.name + "\n"),
    );

    process.stdout.write("\n> ");
  }

  private selectCommand() {
    const command = this.commands.find(
      (command) => command.name === this.command,
    );

    if (command === undefined) throw new Error("Command not found");

    command.onCommand();
    process.stdout.write("\n> ");
  }
}
