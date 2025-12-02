import chalk from "chalk";
import type { Command } from "commander";
import {
  deletePath,
  readProperties,
  writeProperties,
} from "../utils/readWrite.js";
import { domainConfigSchema } from "../types/index.js";
import { deployStack } from "./deployStack.js";
import { deleteCertificate } from "../aws/certificates.js";

export function loadDomainRemoveCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Remove your custom domain configuration")
    .action(async () => {
      // read from configuration file
      const domainConfig = domainConfigSchema.parse(
        readProperties(".vizier/domain.json")
      );

      try {
        // delete the configuration file
        deletePath(".vizier/domain.json");

        // redeploy the stack without domain settings
        console.log(chalk.blue("Redeploying stack without domain settings..."));
        await deployStack();

        // delete the certificate from ACM
        console.log(chalk.blue("Deleting certificate from ACM..."));
        await deleteCertificate(domainConfig.certArn);
        console.log(chalk.yellow("Domain configuration removed successfully."));
      } catch (error) {
        console.error(chalk.red(error));

        // TODO: instead of this hazardous fallback,
        // introduce a feature toggle to disable domain in deployment?

        // restore the configuration file on error
        writeProperties(".vizier/domain.json", domainConfig);
        process.exit(1);
      }
    });
}
