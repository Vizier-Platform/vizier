import chalk from "chalk";
import { Command } from "commander";
import S3ClientService from "../lib/aws/s3.js";

export function loadEmptyBucketCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Empties out specific bucket")
    .argument("<bucketName>", "Name of bucket to be emptied")
    .action(async (bucketName) => {
      const client = new S3ClientService();
      await client.emptyBucket(bucketName);
      console.log(chalk.green(`${bucketName} emptied.`));
    });
}
