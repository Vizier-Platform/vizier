import type { Command } from "commander";
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";

export function loadRemoveVizierCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Remove Vizier configuration from your project")
    .action(async () => {
      const confirmation = await confirm({
        message: `This will remove Vizier configuration from your project but ${chalk.red("DOES NOT TEAR DOWN ANY RESOURCES")}. Run ${chalk.yellow("vizier destroy")} first if you want to tear down your resources. Vizier will not be able to destroy your stack if you run this before vizier destroy. Continue deleting Vizier configuration?`,
        default: false,
      });

      if (!confirmation) {
        console.log("Operation cancelled.");
        return;
      }

      // delete the .vizier directory if it exists
      const fs = await import("fs");
      const path = await import("path");
      const vizierConfigPath = path.join(process.cwd(), ".vizier");

      if (fs.existsSync(vizierConfigPath)) {
        fs.rmSync(vizierConfigPath, { recursive: true, force: true });
      }
      console.log("Vizier configuration removed from project.");
    });
}
