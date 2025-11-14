import sh from "./sh.js";

export default function requireDocker() {
  try {
    sh("docker", ["-v"]);
  } catch (error) {
    console.error(
      "Docker does not appear to be running. Please start the Docker daemon and try again."
    );
    throw error;
  }
}
