import type { Command } from "commander";

export function loadRemoveVizierCommand(program: Command, commandName: string) {
  program
    .command(commandName)
    .description("Remove Vizier configuration from your project")
    .action(async () => {
      // delete the .vizier directory if it exists
      const fs = await import("fs");
      const path = await import("path");
      const vizierConfigPath = path.join(process.cwd(), ".vizier");

      if (fs.existsSync(vizierConfigPath)) {
        fs.rmSync(vizierConfigPath, { recursive: true, force: true });
      }
      console.log("Vizier configuration removed from project.");
    });
}
