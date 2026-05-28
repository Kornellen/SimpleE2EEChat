import { chatHandler, ChatHandler } from "../common/ChatHandler";
import { PromptHandler, promptHandler } from "../common/PromptHandler";
import { Select } from "./Select";

export class SelectChat extends Select {
  public name: string;
  private promptHandler: PromptHandler;
  private chatHandler: ChatHandler;

  constructor(name: string) {
    super(name.split(" ")[0]);
    this.name = name;
    super.addChild(this);
    this.promptHandler = promptHandler;
    this.chatHandler = chatHandler;
  }

  public override async onCommand(): Promise<void> {
    const username = await this.promptHandler.prompt("Enter user: ");
    this.chatHandler.connect(username);
  }
}
