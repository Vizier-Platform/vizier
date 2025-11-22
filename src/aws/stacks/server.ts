import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, Stack } from "aws-cdk-lib";
import requireDocker from "../../utils/requireDocker.js";
import { defineVpc } from "./partials/vpc.js";
import {
  defineCluster,
  defineFargateSecurityGroup,
  defineFargateService,
} from "./partials/fargate.js";
import {
  serverOutputsSchema,
  type ConfigBack,
  type ServerOutputs,
} from "../../types/index.js";
import path from "path";
import { getOutputsFromStack } from "../getOutputFromStack.js";
import { writeProperties } from "../../utils/outputs.js";

export async function deployServerFromConfig({
  projectId,
  dockerfileDirectory,
}: ConfigBack) {
  const absoluteDockerfileDirectory = path.join(
    process.cwd(),
    dockerfileDirectory
  );

  const returnedOutputs = deployServer({
    stackName: projectId,
    dockerfilePath: absoluteDockerfileDirectory,
    containerPort: 3000,
  });

  writeProperties("outputs.json", returnedOutputs);
}

interface ServerOptions {
  stackName: string;
  dockerfilePath: string;
  containerPort: number;
}

export async function deployServer({
  stackName,
  dockerfilePath,
  containerPort,
}: ServerOptions): Promise<ServerOutputs> {
  await requireDocker();

  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, stackName);

    const vpc = defineVpc(stack);

    const cluster = defineCluster(stack, vpc);

    const fargateSecurityGroup = defineFargateSecurityGroup(stack, vpc);

    defineFargateService(stack, cluster, fargateSecurityGroup, {
      dockerfilePath,
      containerPort,
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);

  return serverOutputsSchema.parse(
    await getOutputsFromStack(stackName, ["repositoryUri", "repositoryName"])
  );
}
