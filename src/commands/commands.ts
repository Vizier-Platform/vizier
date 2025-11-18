import { Command } from "commander";

import init from "./init.js";
import deployStack from "./deployStack.js";
import destroyStack from "./destroyStack.js";
// import createBucket from "./createBucket.js";
// import syncBucket from "./syncBucket.js";
// import ghSync from "./gh-sync.js";
// import emptyBucket from "./emptyBucket.js";
// import destroyBucket from "./destroyBucket.js";

export const loadCommands = (program: Command) => {
  // command names specified here so that they are
  // - all visible in one place
  // - decoupled from behavior definitions
  // "help" is provided by commander

  init.load(program, "init");
  deployStack.load(program, "deploy");
  destroyStack.load(program, "destroy");

  // deprecated bucket commands
  // createBucket.load(program, "create");
  // syncBucket.load(program, "sync");
  // ghSync.load(program, "gh-sync");
  // emptyBucket.load(program, "empty");
  // destroyBucket.load(program, "destroy");
};
