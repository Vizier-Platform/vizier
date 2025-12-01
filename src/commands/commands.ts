import { Command } from "commander";

import { loadInitCommand } from "./init.js";
import { loadDeployCommand } from "./deployStack.js";
import { loadDestroyCommand } from "./destroyStack.js";
import { loadRemoveVizierCommand } from "./removeVizier.js";
import { loadDomainSetupCommand } from "./domainSetup.js";
import { loadDomainRemoveCommand } from "./domainRemove.js";

export const loadCommands = (program: Command) => {
  loadInitCommand(program, "init");
  loadDeployCommand(program, "deploy");
  loadDomainSetupCommand(program, "domain-setup");
  loadDomainRemoveCommand(program, "domain-remove");
  loadDestroyCommand(program, "destroy");
  loadRemoveVizierCommand(program, "remove");
};
