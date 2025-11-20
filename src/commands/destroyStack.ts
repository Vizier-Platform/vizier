import chalk from "chalk";
import type { Command } from "commander";
import { destroyStackFromConfig } from "../aws/destroyStack.js";

export function loadDestroyCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Destroy stack and associated resources.")
    .action(async () => {
      await destroyStackFromConfig();
      console.log(chalk.yellow("Stack destroyed."));
    });
}
