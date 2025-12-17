import type { Command } from "commander";
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { deletePath } from "../utils/readWrite.js";

export function loadRemoveVizierCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("remove project (deletes config from project directory)")
    .action(async () => {
      const confirmation = await confirm({
        message: `This will remove Vizier configuration from your project but ${chalk.red("DOES NOT TEAR DOWN ANY RESOURCES")}. Run ${chalk.cyan("vizier destroy")} first if you want to tear down your resources. Vizier will not be able to destroy your stack if you run this before vizier destroy. Continue deleting Vizier configuration?`,
        default: false,
      });

      if (!confirmation) {
        console.log(chalk.yellow("Operation cancelled."));
        return;
      }

      deletePath(".vizier");
      console.log(chalk.yellow("Vizier configuration removed from project."));
    });
}
