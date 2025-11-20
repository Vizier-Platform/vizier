import { Command } from "commander";

import { loadInitCommand } from "./init.js";
import { loadDeployCommand } from "./deployStack.js";
import { loadDestroyCommand } from "./destroyStack.js";
import { loadRemoveVizierCommand } from "./removeVizier.js";
// import { loadCreateBucketCommand } from "./createBucket.js";
// import { loadSyncBucketCommand } from "./syncBucket.js";
// import { loadGhSyncCommand } from "./gh-sync.js";
// import { loadEmptyBucketCommand } from "./emptyBucket.js";
// import { loadDestroyBucketCommand } from "./destroyBucket.js";

export const loadCommands = (program: Command) => {
  // command names specified here so that they are
  // - all visible in one place
  // - decoupled from behavior definitions
  // "help" is provided by commander

  loadInitCommand(program, "init");
  loadDeployCommand(program, "deploy");
  loadDestroyCommand(program, "destroy");
  loadRemoveVizierCommand(program, "remove");

  // deprecated bucket commands
  // loadCreateBucketCommand(program, "createBucket");
  // loadSyncBucketCommand(program, "syncBucket");
  // loadGhSyncCommand(program, "gh-syncBucket");
  // loadEmptyBucketCommand(program, "emptyBucket");
  // loadDestroyBucketCommand(program, "destroyBucket");
};
