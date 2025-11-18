import chalk from "chalk";
import type { Command } from "commander";
import { mkdtemp, rm } from "node:fs/promises";
import S3ClientService from "../lib/aws/s3.js";
import os from "node:os";
import path from "node:path";
import sh from "../lib/sh.js";

async function checkoutRepo(repo: string, ref: string) {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "gh-sync-"));
  await sh("git", ["clone", "--depth", "1", "--branch", ref, repo, tmp]);
  return tmp;
}

function load(program: Command) {
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
}

export default { load };
