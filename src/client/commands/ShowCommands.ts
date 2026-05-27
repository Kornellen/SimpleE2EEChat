import { Command } from "./Command";

export class ShowCommands extends Command {
  public child_commends: Command[] | null;
  public name: string;

  private _availableCommands: Command[] = [];
  public set availableCommands(val: Command[]) {
    this._availableCommands = val;
  }
  constructor(name: string) {
    super();
    this.name = name;
    this.child_commends = null;
  }

  protected addChild(command: Command): void {}
  public onCommand(): void {
    this._availableCommands.forEach((command) =>
      process.stdout.write("\n> " + command.name + "\n"),
    );
  }
}
