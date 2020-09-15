import readline from "readline";

export class ReadlineFactory {
  private static instance: ReadlineFactory;
  private iReadline: readline.ReadLine;

  private constructor() {
    this.iReadline = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  readQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.iReadline.question(`${question} `, (answer: string) =>
        resolve(answer.trim())
      );
    });
  }

  close(): void {
    this.iReadline.close();
  }

  static getInstance() {
    if (!ReadlineFactory.instance) {
      this.instance = new ReadlineFactory();
    }
    return this.instance;
  }
}
