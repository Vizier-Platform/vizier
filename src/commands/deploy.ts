import chalk from "chalk";
import type { Command } from "commander";
import { deployS3StackFromConfig } from "../lib/aws/cdk-s3.js";
import { readProperties } from "../lib/outputs.js";
import { type Config, configSchema } from "../types/index.js";

function load(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Deploy static site to CloudFormation Stack")
    .action(async () => {
      const config: Config = configSchema.parse(readProperties("config.json"));
      const { stackType } = config;

      switch (stackType) {
        case "front": {
          await deployS3StackFromConfig();
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

export default { load };
