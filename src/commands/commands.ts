import { Command } from "commander";

export const loadCommands = (program: Command) => {
  program
    .command("create")
    .description("Creates an empty S3 Bucket for static hosting")
    .argument("<basename>", "Base name for bucket")
    .action(async (basename) => {
      const bucketName = `${basename}-${Date.now()}`;

      console.log(bucketName);
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

      console.log(`Bucket name is ${bucketName}`);
      console.log(`The name of the directory is ${localDirectory}`);
    });

  program
    .command("destroy")
    .description("Empties and tears down S3 Bucket")
    .argument("<bucketname>", "Full name of bucket to be destroyed")
    .action(async (bucketname) => {
      // LOOK INTO COMMANDER PROMPT TOOLS
      const bucket = bucketname;
      console.log(`${bucket} successfully destroyed`);
    });
};
