import { Command } from "./Command";

export class Help extends Command {
  public child_commends: Command[] | null;
  public name: string;

  protected addChild(command: Command): void {}

  constructor(name: string) {
    super();
    this.name = name;
    this.child_commends = null;
  }

  public onCommand(): void {
    process.stdout.write("\r\x1b[K\n");
    process.stdout.write("-------------- HELP ---------\n");
    process.stdout.write("--                         --\n");
    process.stdout.write("--    To Be Implemented    --\n");
    process.stdout.write("--                         --\n");
    process.stdout.write("-----------------------------\n");
    return;
  }
}
