import { Command } from "commander";

import { loadInitCommand } from "./init.js";
import { loadDeployCommand } from "./deployStack.js";
import { loadDestroyCommand } from "./destroyStack.js";
import { loadRemoveVizierCommand } from "./removeVizier.js";
import { loadDomainSetupCommand } from "./domainSetup.js";

export const loadCommands = (program: Command) => {
  // command names specified here so that they are
  // - all visible in one place
  // - decoupled from behavior definitions
  // "help" is provided by commander

  loadInitCommand(program, "init");
  loadDeployCommand(program, "deploy");
  loadDomainSetupCommand(program, "domain-setup");
  loadDestroyCommand(program, "destroy");
  loadRemoveVizierCommand(program, "remove");
};
