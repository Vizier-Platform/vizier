import chalk from "chalk";
import type { Command } from "commander";
import { input } from "@inquirer/prompts";
import { writeProperties } from "../utils/readWrite.js";
import {
  deleteCertificate,
  getCertificateDomainValidation,
  requestCertificate,
} from "../aws/certificates.js";
import type { DomainConfig } from "../types/index.js";

export function loadDomainSetupCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("set up custom domain")
    .action(async () => {
      const domainName = await input({
        message:
          "Enter your fully qualified domain name (e.g. www.example.com):",
        required: true,
      });

      console.log(chalk.blue(`Requesting certificate...`));
      const certArn = await requestCertificate(domainName);

      console.log(
        chalk.blue(`Fetching DNS validation options for the certificate...`)
      );
      const validation = await getCertificateDomainValidation(certArn);

      console.log(chalk.green(`Certificate requested successfully!`));

      printDnsRecordInstructions(
        `To validate domain ownership, please create the following DNS record:`,
        validation.ResourceRecord
      );

      console.log(
        chalk.magenta(
          `After creating the DNS record, it may take some time for the certificate to be validated.`
        )
      );

      // poll for validation status until it is confirmed
      console.log(chalk.blue(`Waiting for certificate validation...`));
      let status = validation.ValidationStatus;

      const ATTEMPTS = 30;
      const DELAY_MS = 30000;
      for (let i = 0; i < ATTEMPTS; i++) {
        if (status === "SUCCESS") {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

        const updatedValidation = await getCertificateDomainValidation(certArn);
        status = updatedValidation.ValidationStatus;
        console.log(chalk.blue(`Current validation status: ${status}`));
      }

      if (status !== "SUCCESS") {
        console.log(
          chalk.red(
            `Certificate validation timed out. Deleting certificate and aborting setup.`
          )
        );
        await deleteCertificate(certArn);
        process.exit(1);
      }

      console.log(chalk.green(`Certificate validated successfully!`));

      const domainConfig: DomainConfig = { domainName, certArn };
      writeProperties(".vizier/domain.json", domainConfig);
      console.log(
        chalk.green(
          `Domain configuration saved to domain.json. You can now proceed to deploy your application with the custom domain.`
        )
      );

      console.log(
        chalk.cyan(
          `Run 'vizier deploy' to deploy your application with your custom domain.`
        )
      );
    });
}

export function printDnsRecordInstructions(
  message: string,
  {
    Type,
    Name,
    Value,
  }: {
    Type: string;
    Name: string;
    Value: string;
  }
) {
  console.log(chalk.cyan(message));
  console.log(`Type: ${chalk.cyan(Type)}`);
  console.log(`Name: ${chalk.cyan(Name)}`);
  console.log(`Value: ${chalk.cyan(Value)}`);
}
