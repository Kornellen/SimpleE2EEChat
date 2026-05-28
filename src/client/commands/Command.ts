export abstract class Command {
  public abstract child_commends: Command[] | null;

  protected addChild(command: Command): void {
    this.child_commends?.push(command);
  }
  public abstract name: string;
  public abstract onCommand(): void;
}
