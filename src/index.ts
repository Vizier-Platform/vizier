#!/usr/bin/env node
import { program } from "commander";
import { loadCommands } from "./commands/commands.js";

program
  .version("1.0.2")
  .name("vizier")
  .description("an AWS deployment platform");
loadCommands(program);

program.parse(process.argv);
