export class PromptHandler {
  private line: string;
  constructor() {
    this.line = "";
  }
  public async prompt(
    question: string,
    isPassword: boolean = false,
  ): Promise<string> {
    return new Promise((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      process.stdout.write(question);

      const handler = (key: string) => {
        if (key === "\u0003") process.exit(0);

        if (key === "\u007f" && this.line.length > 0) {
          this.line = this.line.slice(0, -1);
          process.stdout.write("\b \b");
          return;
        }

        if (key === "\r" || key === "\n") {
          var data = this.line;
          this.cleanup(handler);
          return resolve(data.trim());
        }

        if (key.length === 1 && key >= " " && key <= "~") {
          this.line += key;
          process.stdout.write(isPassword ? "*" : key);
        }
      };

      process.stdin.on("data", handler);
    });
  }

  private cleanup(handler: (key: string) => void) {
    process.stdout.write("\r\n");
    process.stdin.off("data", handler);
    process.stdin.setRawMode(false);
    this.line = "";
  }
}

export const promptHandler = new PromptHandler();
