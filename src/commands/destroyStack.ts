import chalk from "chalk";
import type { Command } from "commander";
import { destroyStackFromConfig } from "../aws/destroyStack.js";
import { deletePath, readProperties } from "../utils/readWrite.js";
import { deleteCertificate } from "../aws/certificates.js";
import { domainConfigSchema, type DomainConfig } from "../types/index.js";

export function loadDestroyCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Destroy stack and associated resources.")
    .action(async () => {
      await destroyStackFromConfig();
      console.log(chalk.yellow("Stack destroyed."));

      deletePath(".github/workflows/vizier.yml");
      console.log("GitHub Actions workflow removed.");

      const domainConfigRaw = readProperties(".vizier/domain.json");
      const domainConfig: DomainConfig | undefined =
        domainConfigSchema.safeParse(domainConfigRaw).success
          ? domainConfigSchema.parse(domainConfigRaw)
          : undefined;

      if (domainConfig) {
        console.log(chalk.blue("Deleting certificate from ACM..."));
        await deleteCertificate(domainConfig.certArn);
        deletePath(".vizier/domain.json");
        console.log("Domain configuration removed.");
      }
    });
}
