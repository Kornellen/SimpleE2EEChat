import { Client } from "../Client";
import { userState, UserState } from "../common/UserState";
import { Command } from "./Command";

export class ShowKey extends Command {
  public name: string;
  public child_commends: Command[] | null;

  private userState: UserState;
  constructor(name: string) {
    super();
    this.name = name;
    this.userState = userState;
    this.child_commends = null;
  }

  protected addChild(command: Command): void {}
  public onCommand(): void {
    process.stdout.write("\n" + this.userState.privateKey);
  }
}
