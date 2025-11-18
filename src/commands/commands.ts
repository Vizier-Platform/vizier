import { Command } from "commander";

import init from "./init.js";
import deploy from "./deploy.js";
import destroyStack from "./destroyStack.js";
import create from "./create.js";
import sync from "./sync.js";
import ghSync from "./gh-sync.js";
import empty from "./empty.js";
import destroy from "./destroy.js";

export const loadCommands = (program: Command) => {
  // command names specified here so that they are
  // - all visible in one place
  // - decoupled from behavior definitions
  // "help" is provided by commander

  init.load(program, "init");
  deploy.load(program, "deploy");
  destroyStack.load(program, "destroyStack");
  create.load(program, "create"); // create bucket
  sync.load(program, "sync"); // sync bucket
  ghSync.load(program, "gh-sync"); // clone repository and sync to bucket
  empty.load(program, "empty"); // empty a bucket
  destroy.load(program, "destroy"); // destroy bucket
};
