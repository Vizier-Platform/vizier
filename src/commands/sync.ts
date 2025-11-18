import chalk from "chalk";
import type { Command } from "commander";
import S3ClientService from "../lib/aws/s3.js";

function load(program: Command) {
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
}

export default { load };
