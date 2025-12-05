import { jest } from "@jest/globals";
import sh from "./sh.js";

describe("sh", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should run a command and print stdout", async () => {
    await sh("echo", ["hello"]);
    expect(console.log).toHaveBeenCalledWith("hello\n");
  });

  it("should print stderr on error and rethrow", async () => {
    await expect(sh("ls", ["/nonexistentpath"])).rejects.toThrow();
    expect(console.error).toHaveBeenCalled();
  });
});
