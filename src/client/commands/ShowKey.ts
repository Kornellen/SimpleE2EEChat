import { Client } from "../Client";
import { Command } from "./Command";

export class ShowKey extends Command {
  public name: string;
  public child_commends: Command[] | null;

  constructor(name: string) {
    super();
    this.name = name;
    this.child_commends = null;
  }

  protected addChild(command: Command): void {}
  public onCommand(): void {
    Client.loadPrivateKey();
    process.stdout.write("\n" + Client.privateKey);
  }
}
