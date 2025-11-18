import type { Command } from "commander";
import S3ClientService from "../lib/aws/s3.js";

function load(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Creates an empty S3 Bucket for static hosting")
    .argument("<basename>", "Base name for bucket")
    .action(async (basename) => {
      const bucketName = `${basename}-${Date.now()}`;
      const client = new S3ClientService();
      await client.createBucket(bucketName);
      await client.enableStaticHosting(bucketName);
    });
}

export default { load };
