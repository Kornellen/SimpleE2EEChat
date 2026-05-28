import { promptHandler, PromptHandler } from "./PromptHandler";
import { Command } from "../commands/Command";
import { COMMANDS, ShowCommands } from "../commands/Commands";
export class CommandHandler {
  private command: string;
  private commands: Command[];
  private promptHandler: PromptHandler;
  constructor() {
    this.command = "";

    this.commands = COMMANDS;

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
