import { Command } from "./Command";

export class Select extends Command {
  public child_commends: Command[] | null;
  public name: string;
  protected addChild(command: Command): void {
    this.child_commends?.push(command);
  }
  constructor(name: string) {
    super();
    this.name = name;
    this.child_commends = null;
  }

  public onCommand(): void {
    process.stdout.write("\nIncomplete command syntax! select {chat}\n");
    return;
  }
}
