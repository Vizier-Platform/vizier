import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function sh(cmd: string, args: string[]) {
  try {
    const { stdout } = await execFileAsync(cmd, args);
    if (stdout.trim()) console.log(stdout);
  } catch (error) {
    if (error && typeof error === "object" && "stderr" in error) {
      console.error(error.stderr);
    }
    throw error;
  }
}
