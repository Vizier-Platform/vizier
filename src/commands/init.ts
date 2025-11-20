import { input, select } from "@inquirer/prompts";
import chalk from "chalk";
import type { Command } from "commander";
import { writeProperties } from "../utils/outputs.js";
import type {
  StackType,
  ConfigBase,
  Config,
  ConfigFront,
  ConfigFrontBack,
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
      const projectId = `${projectName}-${Date.now()}`;

      const stackType: StackType = await select<StackType>({
        message: "Select project type",
        choices: [
          {
            name: "static site",
            value: "front",
            description: "A static site (S3, Cloudfront)",
          },
          {
            name: "frontend + backend",
            value: "front+back",
            description:
              "Separately hosted frontend and backend (S3, Cloudfront, ECS)",
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
          const directory = await input({
            message: "What is the relative path to the asset directory?",
            required: true,
          });
          const frontConfig: ConfigFront = {
            ...configBase,
            stackType, // redundant but explicit to satisfy typescript
            assetDirectory: directory,
          };
          config = frontConfig;
          break;
        }
        case "front+back": {
          const directory = await input({
            message: "What is the relative path to the asset directory?",
            required: true,
          });
          const dockerfileDirectory = await input({
            message: "What is the relative path to the Dockerfile?",
            required: true,
          });
          const frontBackConfig: ConfigFrontBack = {
            ...configBase,
            stackType, // redundant but explicit to satisfy typescript
            assetDirectory: directory,
            dockerfileDirectory,
          };
          config = frontBackConfig;
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
