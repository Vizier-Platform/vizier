import chalk from "chalk";
import type { Command } from "commander";
import { deployFrontendFromConfig } from "../aws/stacks/frontend.js";
import { readProperties } from "../utils/outputs.js";
import { type Config, configSchema } from "../types/index.js";
import { deployFrontendWithServerFromConfig } from "../aws/stacks/frontendWithServer.js";
import { deployServerFromConfig } from "../aws/stacks/server.js";
import { deployServerWithDatabaseFromConfig } from "../aws/stacks/serverWithDatabase.js";
import { deployFrontendWithServerWithDatabaseFromConfig } from "../aws/stacks/frontendWithServerWithDatabase.js";

export function loadDeployCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Deploy static site to CloudFormation Stack")
    .action(async () => {
      const config: Config = configSchema.parse(
        readProperties(".vizier/config.json")
      );
      const { stackType } = config;

      switch (stackType) {
        case "front": {
          await deployFrontendFromConfig(config);
          console.log(chalk.green(`Static site deployed.`));
          break;
        }
        case "front+back": {
          await deployFrontendWithServerFromConfig(config);
          console.log(chalk.green(`Frontend and backend deployed.`));
          break;
        }
        case "back": {
          await deployServerFromConfig(config);
          console.log(chalk.green(`Server deployed.`));
          break;
        }
        case "back+db": {
          await deployServerWithDatabaseFromConfig(config);
          console.log(chalk.green(`Server with database deployed.`));
          break;
        }
        case "front+back+db": {
          await deployFrontendWithServerWithDatabaseFromConfig(config);
          console.log(chalk.green(`Frontend, backend, and database deployed.`));
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
