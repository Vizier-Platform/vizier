import chalk from "chalk";
import type { Command } from "commander";
import S3ClientService from "../lib/aws/s3.js";

export function loadDestroyBucketCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Empties and tears down S3 Bucket")
    .argument("<bucketname>", "Full name of bucket to be destroyed")
    .action(async (bucketName) => {
      const client = new S3ClientService();
      await client.emptyBucket(bucketName);
      await client.destroyBucket(bucketName);
      console.log(chalk.green(`${bucketName} was destroyed`));
    });
}
