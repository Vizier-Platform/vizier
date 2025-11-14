import fs from "node:fs";
import path from "node:path";

const VIZIER_DIR = path.join(process.cwd(), ".vizier");
const OUTPUTS_PATH = path.join(VIZIER_DIR, "outputs.json");

export interface StoredOutputs {
  bucketName: string;
}

export function readStoredOutputs(): StoredOutputs | undefined {
  if (!fs.existsSync(OUTPUTS_PATH)) {
    return undefined;
  }

  try {
    const raw = fs.readFileSync(OUTPUTS_PATH, "utf8");
    return JSON.parse(raw) as StoredOutputs;
  } catch {
    return undefined;
  }
}

export function writeStoredOutputs(outputs: StoredOutputs): void {
  fs.mkdirSync(VIZIER_DIR, { recursive: true });
  fs.writeFileSync(OUTPUTS_PATH, JSON.stringify(outputs, null, 2));
}

export function clearStoredOutputs(): void {
  if (!fs.existsSync(OUTPUTS_PATH)) {
    return;
  }
  fs.writeFileSync(OUTPUTS_PATH, "");
}
