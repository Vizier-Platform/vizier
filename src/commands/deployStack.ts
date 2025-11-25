import chalk from "chalk";
import type { Command } from "commander";
import { deployFrontendFromConfig } from "../aws/stacks/frontend.js";
import { readProperties, writeText } from "../utils/readWrite.js";
import { type Config, configSchema } from "../types/index.js";
import { deployFrontendWithServerFromConfig } from "../aws/stacks/frontendWithServer.js";
import { deployServerFromConfig } from "../aws/stacks/server.js";
import { deployServerWithDatabaseFromConfig } from "../aws/stacks/serverWithDatabase.js";
import { deployFrontendWithServerWithDatabaseFromConfig } from "../aws/stacks/frontendWithServerWithDatabase.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function loadDeployCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Deploy static site to CloudFormation Stack")
    .action(deployStack);
}

export async function deployStack() {
  const config: Config = configSchema.parse(
    readProperties(".vizier/config.json")
  );
  const { stackType } = config;

  let workflowPath: string;

  switch (stackType) {
    case "front": {
      await deployFrontendFromConfig(config);
      console.log(chalk.green(`Static site deployed.`));
      workflowPath = "../templates/syncAssets.yml";
      break;
    }
    case "front+back": {
      await deployFrontendWithServerFromConfig(config);
      console.log(chalk.green(`Frontend and backend deployed.`));
      workflowPath = "../templates/syncAssetsBuildImage.yml";
      break;
    }
    case "back": {
      await deployServerFromConfig(config);
      console.log(chalk.green(`Server deployed.`));
      workflowPath = "../templates/buildImage.yml";
      break;
    }
    case "back+db": {
      await deployServerWithDatabaseFromConfig(config);
      console.log(chalk.green(`Server with database deployed.`));
      workflowPath = "../templates/buildImage.yml";
      break;
    }
    case "front+back+db": {
      await deployFrontendWithServerWithDatabaseFromConfig(config);
      console.log(chalk.green(`Frontend, backend, and database deployed.`));
      workflowPath = "../templates/syncAssetsBuildImage.yml";
      break;
    }
    default: {
      const unhandledType: never = stackType;
      console.error(chalk.red(`Unhandled stack type ${unhandledType}`));
      process.exit(1);
    }
  }

  const workflowText = fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), workflowPath),
    "utf8"
  );

  writeText(".github/workflows/vizier.yml", workflowText);
  console.log(
    "GitHub Actions workflow written to .github/workflows/vizier.yml"
  );
  console.log("Use git push to trigger the re-deployment workflow.");
}
