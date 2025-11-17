import fs from "node:fs";
import path from "node:path";

const VIZIER_DIR = path.join(process.cwd(), ".vizier");
const OUTPUTS_PATH = path.join(VIZIER_DIR, "outputs.json");

export function readStoredProperties(fileName: string): object | undefined {
  const absolutePath = path.join(VIZIER_DIR, fileName);

  if (!fs.existsSync(absolutePath)) {
    return undefined;
  }

  try {
    const raw = fs.readFileSync(absolutePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function writeStoredProperties(
  fileName: string,
  properties: object
): void {
  fs.mkdirSync(VIZIER_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(VIZIER_DIR, fileName),
    JSON.stringify(properties, null, 2)
  );
}

export function clearStoredOutputs(): void {
  if (!fs.existsSync(OUTPUTS_PATH)) {
    return;
  }
  fs.writeFileSync(OUTPUTS_PATH, "");
}
