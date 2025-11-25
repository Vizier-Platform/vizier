import chalk from "chalk";
import type { Command } from "commander";
import { destroyStackFromConfig } from "../aws/destroyStack.js";
import { deletePath } from "../utils/readWrite.js";

export function loadDestroyCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Destroy stack and associated resources.")
    .action(async () => {
      await destroyStackFromConfig();
      console.log(chalk.yellow("Stack destroyed."));

      deletePath(".github/workflows/vizier.yml");
      console.log("GitHub Actions workflow removed.");
    });
}
