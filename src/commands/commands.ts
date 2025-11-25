import { Command } from "commander";

import { loadInitCommand } from "./init.js";
import { loadDeployCommand } from "./deployStack.js";
import { loadDestroyCommand } from "./destroyStack.js";
import { loadRemoveVizierCommand } from "./removeVizier.js";

export const loadCommands = (program: Command) => {
  loadInitCommand(program, "init");
  loadDeployCommand(program, "deploy");
  loadDestroyCommand(program, "destroy");
  loadRemoveVizierCommand(program, "remove");
};
