import sh from "./sh.js";

export default async function requireDocker() {
  try {
    await sh("docker", ["-v"]);
  } catch (error) {
    console.error(error);
    throw new Error(
      "Docker does not appear to be running. Please start the Docker daemon and try again."
    );
  }
}
