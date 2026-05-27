import { promptHandler, PromptHandler } from "../common/PromptHandler";
import { Command } from "./Command";
import { Help, Select, SelectChat, SwitchUser } from "./Commands";
import { ShowCommands } from "./ShowCommands";
import { ShowKey } from "./ShowKey";
export class CommandHandler {
  private command: string;
  private commands: Command[];
  private promptHandler: PromptHandler;
  constructor() {
    this.command = "";
    this.commands = [
      new Help("help"),
      new Select("select"),
      new SelectChat("select chat"),
      new SwitchUser("switch user"),
      new ShowKey("show key"),
      new ShowCommands("list commands"),
    ];

    (this.commands[5] as ShowCommands).availableCommands = this.commands;

    this.promptHandler = promptHandler;
  }

  public async handleCommand() {
    this.command = await this.promptHandler.prompt("Input Command > ", false);
    this.selectCommand();
  }

  private selectCommand() {
    const command = this.commands.find(
      (command) => command.name === this.command,
    );

    if (command === undefined) throw new Error("Command not found");

    command.onCommand();
    if (command.name !== "select chat") this.handleCommand();
  }
}

export const commandHandler = new CommandHandler();
