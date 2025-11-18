import { Command } from "commander";
import chalk from "chalk";
import S3ClientService from "../lib/aws/s3.js";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sh from "../lib/sh.js";
import { deployS3StackFromConfig } from "../lib/aws/cdk-s3.js";
import { destroyStackFromConfig } from "../lib/aws/destroyStack.js";
import { writeProperties } from "../lib/outputs.js";
import type {
  ConfigBase,
  ConfigFront,
  FullConfig,
  StackType,
} from "../types/index.js";
// import enquirer from "enquirer";
import { input, select } from "@inquirer/prompts";

async function checkoutRepo(repo: string, ref: string) {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "gh-sync-"));
  await sh("git", ["clone", "--depth", "1", "--branch", ref, repo, tmp]);
  return tmp;
}

export const loadCommands = (program: Command) => {
  program
    .command("init")
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
            description: "A static site",
          },
        ],
      });

      const configBase: ConfigBase = {
        projectName,
        projectId,
        stackType,
      };

      let config: FullConfig;

      switch (stackType) {
        case "front": {
          const directory = await input({
            message: "What is the relative path to the asset directory?",
            required: true,
          });
          const frontConfig: ConfigFront = {
            ...configBase,
            assetDirectory: directory,
          };
          config = frontConfig;
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

  program
    .command("deploy")
    .description("Deploy static site to CloudFormation Stack")
    .action(async () => {
      await deployS3StackFromConfig();
      console.log(chalk.green(`Static site live.`));
    });

  program
    .command("destroyStack")
    .description("Destroy stack and associated resources.")
    .action(async () => {
      await destroyStackFromConfig();
      console.log(chalk.yellow("Stack destroyed."));
    });

  program
    .command("create")
    .description("Creates an empty S3 Bucket for static hosting")
    .argument("<basename>", "Base name for bucket")
    .action(async (basename) => {
      const bucketName = `${basename}-${Date.now()}`;
      const client = new S3ClientService();
      await client.createBucket(bucketName);
      await client.enableStaticHosting(bucketName);
    });

  program
    .command("sync")
    .description("Uploads local files to S3 Bucket")
    .requiredOption(
      "-b, --bucket <bucket-name>",
      "The name of the S3 Bucket you're deploying to"
    )
    .requiredOption("-d, --directory <local-directory>")
    .action(async (options) => {
      const bucketName = `${options.bucket}`;
      const localDirectory = `${options.directory}`;
      const client = new S3ClientService();

      await client.emptyBucket(bucketName);
      console.log(chalk.yellow(`${bucketName} emptied.`));
      await client.syncDirectory(bucketName, localDirectory);
      console.log(chalk.green(`${bucketName} synced with ${localDirectory}`));
    });

  program
    .command("gh-sync")
    .description("Uploads github files to S3 Bucket")
    .requiredOption("-r --repo <git_url>", "Public GitHub Repo URL")
    .option("--ref <branch>", "Branch to deploy from (default to main)", "main")
    .requiredOption(
      "-b, --bucket <bucket-name>",
      "The name of the S3 Bucket you're deploying to"
    )
    .action(async (options) => {
      const { repo, ref, bucket } = options;
      const client = new S3ClientService();

      console.log(chalk.blue(`Cloning ${repo}@${ref}...`));
      const checkoutPath = await checkoutRepo(repo, ref);

      try {
        await client.emptyBucket(bucket);
        console.log(chalk.yellow(`${bucket} emptied.`));

        await client.syncDirectory(bucket, checkoutPath);
        console.log(chalk.green(`${bucket} synced with ${repo}@${ref}`));
      } finally {
        await rm(checkoutPath, { recursive: true, force: true });
      }
    });

  program
    .command("empty")
    .description("Empties out specific bucket")
    .argument("<bucketName>", "Name of bucket to be emptied")
    .action(async (bucketName) => {
      const client = new S3ClientService();
      await client.emptyBucket(bucketName);
      console.log(chalk.green(`${bucketName} emptied.`));
    });

  program
    .command("destroy")
    .description("Empties and tears down S3 Bucket")
    .argument("<bucketname>", "Full name of bucket to be destroyed")
    .action(async (bucketName) => {
      // LOOK INTO COMMANDER PROMPT TOOLS
      const client = new S3ClientService();
      await client.emptyBucket(bucketName);
      await client.destroyBucket(bucketName);
      console.log(chalk.green(`${bucketName} was destroyed`));
    });
};
