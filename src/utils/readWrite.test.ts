import { jest } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  readProperties,
  writeProperties,
  writeText,
  deletePath,
} from "./readWrite.js";

describe("readWrite", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vizier-test-"));
    // mock process.cwd() to return the temporary directory
    // so that all file operations are done in the temp directory
    jest.spyOn(process, "cwd").mockReturnValue(tempDir);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("writeProperties and readProperties", () => {
    it("should write and read properties correctly", () => {
      const props = { key: "value", number: 42 };
      writeProperties("foo/bar.json", props);

      const readProps = readProperties("foo/bar.json");
      expect(readProps).toEqual(props);
    });
  });

  describe("writeText", () => {
    it("should write text to a file correctly", () => {
      const text = "Hello, world!";
      writeText("hello.txt", text);

      const readText = fs.readFileSync(path.join(tempDir, "hello.txt"), "utf8");
      expect(readText).toBe(text);
    });
  });

  describe("deletePath", () => {
    it("should delete a file or directory correctly", () => {
      const filePath = path.join(tempDir, "toDelete.txt");
      fs.writeFileSync(filePath, "Delete me!");

      deletePath("toDelete.txt");
      expect(fs.existsSync(filePath)).toBe(false);
    });
  });
});
