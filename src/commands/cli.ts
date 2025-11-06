import { Command } from "commander";

export const loadCommands = (program: Command) => {
  program
    .command("hello")
    .description("test commands by saying hello")
    .action(() => console.log("hello there!"));
};
