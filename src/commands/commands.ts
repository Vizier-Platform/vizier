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
  init.load(program);
  deploy.load(program);
  destroyStack.load(program);
  create.load(program);
  sync.load(program);
  ghSync.load(program);
  empty.load(program);
  destroy.load(program);
};
