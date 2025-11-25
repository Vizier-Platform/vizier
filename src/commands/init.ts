import { input, select } from "@inquirer/prompts";
import chalk from "chalk";
import type { Command } from "commander";
import { writeProperties } from "../utils/outputs.js";
import {
  type StackType,
  type ConfigBase,
  type Config,
  type ConfigFront,
  type ConfigFrontBack,
  type ConfigBack,
  type ConfigBackDb,
  type ConfigFrontBackDb,
  STACK_NAME_INVALID_CHARACTER_PATTERN,
  stackNameSchema,
} from "../types/index.js";

export function loadInitCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Initialize Vizier in your project root")
    .action(async () => {
      const projectName = await input({
        message: "What is the project name?",
        required: true,
      });

      const characterFilteredProjectName = projectName
        .trim()
        .replace(STACK_NAME_INVALID_CHARACTER_PATTERN, "");
      const projectId = `vzr-${characterFilteredProjectName}-${Date.now()}`;
      stackNameSchema.parse(projectId);

      const stackType: StackType = await select<StackType>({
        message: "Select project type",
        choices: [
          {
            name: "static site",
            value: "front",
            description: "A static site (S3, Cloudfront)",
          },
          {
            name: "static frontend + server",
            value: "front+back",
            description:
              "Separately hosted frontend and backend (S3, Cloudfront, ECS)",
          },
          {
            name: "server only",
            value: "back",
            description: "All in one server (ECS)",
          },
          {
            name: "server with database",
            value: "back+db",
            description: "A server with a database (ECS, RDS)",
          },
          {
            name: "static frontend + server with database",
            value: "front+back+db",
            description:
              "Separately hosted frontend and backend with database (S3, Cloudfront, ECS, RDS)",
          },
        ],
      });

      const configBase: ConfigBase = {
        projectName,
        projectId,
        stackType,
      };

      let config: Config;

      switch (stackType) {
        case "front": {
          const assetDirectory = await promptAssetDirectory();
          const frontConfig: ConfigFront = {
            ...configBase,
            stackType,
            assetDirectory,
          };
          config = frontConfig;
          break;
        }
        case "front+back": {
          const assetDirectory = await promptAssetDirectory();
          const dockerfileDirectory = await promptDockerfileDirectory();
          const frontBackConfig: ConfigFrontBack = {
            ...configBase,
            stackType,
            assetDirectory,
            dockerfileDirectory,
          };
          config = frontBackConfig;
          break;
        }
        case "back": {
          const dockerfileDirectory = await promptDockerfileDirectory();
          const backConfig: ConfigBack = {
            ...configBase,
            stackType,
            dockerfileDirectory,
          };
          config = backConfig;
          break;
        }
        case "back+db": {
          const dockerfileDirectory = await promptDockerfileDirectory();
          const backDbConfig: ConfigBackDb = {
            ...configBase,
            stackType,
            dockerfileDirectory,
          };
          config = backDbConfig;
          break;
        }
        case "front+back+db": {
          const assetDirectory = await promptAssetDirectory();
          const dockerfileDirectory = await promptDockerfileDirectory();
          const frontBackDbConfig: ConfigFrontBackDb = {
            ...configBase,
            stackType,
            assetDirectory,
            dockerfileDirectory,
          };
          config = frontBackDbConfig;
          break;
        }
        default: {
          const unhandledType: never = stackType;
          console.error(chalk.red(`Unhandled stack type ${unhandledType}`));
          process.exit(1);
        }
      }

      writeProperties("config.json", config);
      console.log("Project initialized successfully.");
      console.log("Run vizier deploy to deploy your application.");
    });
}

async function promptDockerfileDirectory() {
  return await input({
    message: "What is the relative path to the Dockerfile?",
    required: true,
  });
}

async function promptAssetDirectory() {
  return await input({
    message: "What is the relative path to the asset directory?",
    required: true,
  });
}
