import fs from "node:fs";
import path from "node:path";

export function readProperties(relativePath: string): object | undefined {
  const absolutePath = path.join(process.cwd(), relativePath);

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

export function writeProperties(
  relativePath: string,
  properties: object
): void {
  writeText(relativePath, JSON.stringify(properties, null, 2));
}

export function writeText(relativePath: string, text: string): void {
  const absolutePath = path.join(process.cwd(), relativePath);

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, text, "utf8");
}

export function deletePath(relativePath: string): void {
  const absolutePath = path.join(process.cwd(), relativePath);

  fs.rmSync(absolutePath, { recursive: true, force: true });
}
