import { Client } from "../Client";
import { PromptHandler, promptHandler } from "../common/PromptHandler";
import { Select } from "./Select";

export class SelectChat extends Select {
  public name: string;
  private userName: string = "";
  private promptHandler: PromptHandler;

  constructor(name: string) {
    super(name.split(" ")[0]);
    this.name = name;
    super.addChild(this);
    this.promptHandler = promptHandler;
  }

  public override async onCommand(): Promise<void> {
    this.userName = await this.promptHandler.prompt("Enter user: ");
    Client.connect(this.userName);
  }
}
