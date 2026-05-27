import { Command } from "./Command";

export class SwitchUser extends Command {
  public child_commends: Command[] | null;
  protected addChild(command: Command): void {}
  constructor(name: string) {
    super();
    this.name = name;
    this.child_commends = null;
  }
  public name: string;
  public onCommand(): void {}
}
