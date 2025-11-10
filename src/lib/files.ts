import fsPromises from "node:fs/promises";
import path from "path";

// traverse all files in a directory and call callback for each file
export const forFileInDirectory = async (
  rootDirectoryPath: string,
  callback: (relativeFilePath: string, contents: string) => Promise<void>
) => {
  const absoluteRoot = path.resolve(rootDirectoryPath);
  const absoluteFilePaths = await getAllFilePaths(absoluteRoot);

  await Promise.all(
    absoluteFilePaths.map(async (file) => {
      const relativePath = path.relative(absoluteRoot, file);

      const data = await fsPromises.readFile(file, "utf8");
      return callback(relativePath, data);
    })
  );
};

// recursively traverse a directory and return all file paths
// returned paths are absolute
export const getAllFilePaths = async (
  directoryPath: string
): Promise<string[]> => {
  const filePaths: string[] = [];

  const files = await fsPromises.readdir(directoryPath);

  await Promise.all(
    files.map(async (file) => {
      if (file === ".git" || file === "node_modules") return;
      const absolutePath = path.resolve(directoryPath, file);
      const stats = await fsPromises.stat(absolutePath);
      if (stats.isFile()) {
        filePaths.push(absolutePath);
      } else if (stats.isDirectory()) {
        const subdirectoryFiles = await getAllFilePaths(absolutePath);
        filePaths.push(...subdirectoryFiles);
      }
    })
  );

  return filePaths;
};
