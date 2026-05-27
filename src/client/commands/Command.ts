export abstract class Command {
  public abstract child_commends: Command[] | null;

  protected abstract addChild(command: Command): void;
  public abstract name: string;
  public abstract onCommand(): void;
}
