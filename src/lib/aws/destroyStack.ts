import { StackSelectionStrategy, Toolkit } from "@aws-cdk/toolkit-lib";
import { App, Stack } from "aws-cdk-lib";
import { clearOutputs, readProperties } from "../outputs.js";
import { configSchema } from "../../types/index.js";

export async function destroyStackFromConfig() {
  const { projectId } = configSchema.parse(readProperties("config.json"));

  await destroyStack(projectId);
}

export async function destroyStack(stackName: string) {
  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    new Stack(app, stackName);
    return app.synth();
  });

  await toolkit.destroy(cloudAssemblySource, {
    stacks: {
      strategy: StackSelectionStrategy.PATTERN_MUST_MATCH,
      patterns: [stackName],
    },
  });

  clearOutputs();
}
