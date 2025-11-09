import { Command } from "commander";
import chalk from "chalk";
import S3ClientService from "../lib/aws/s3.js";

export const loadCommands = (program: Command) => {
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
