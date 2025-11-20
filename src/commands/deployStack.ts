import chalk from "chalk";
import type { Command } from "commander";
import { deployFrontendFromConfig } from "../aws/stacks/frontend.js";
import { readProperties } from "../utils/outputs.js";
import { type Config, configSchema } from "../types/index.js";

export function loadDeployCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Deploy static site to CloudFormation Stack")
    .action(async () => {
      const config: Config = configSchema.parse(readProperties("config.json"));
      const { stackType } = config;

      switch (stackType) {
        case "front": {
          await deployFrontendFromConfig();
          console.log(chalk.green(`Static site deployed.`));
          break;
        }
        case "front+back": {
          console.error(
            chalk.red("front+back stack type is not yet implemented.")
          );
          process.exit(1);
          break;
        }
        default: {
          const unhandledType: never = stackType;
          console.error(chalk.red(`Unhandled stack type ${unhandledType}`));
          process.exit(1);
        }
      }
    });
}
