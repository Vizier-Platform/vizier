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

export async function deployServerFromConfig({
  projectId,
  dockerfileDirectory,
}: ConfigBack) {
  const absoluteDockerfileDirectory = path.join(
    process.cwd(),
    dockerfileDirectory
  );

  return deployServer({
    stackName: projectId,
    isImageLocal: true,
    imagePath: absoluteDockerfileDirectory,
    containerPort: 3000,
  });
}

interface ServerOptions {
  stackName: string;
  isImageLocal: boolean;
  imagePath: string;
  containerPort: number;
}

export async function deployServer({
  stackName,
  isImageLocal,
  imagePath,
  containerPort,
}: ServerOptions): Promise<ServerOutputs> {
  if (isImageLocal) {
    await requireDocker();
  }

  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, stackName);

    const vpc = defineVpc(stack);

    const cluster = defineCluster(stack, vpc);

    const fargateSecurityGroup = defineFargateSecurityGroup(stack, vpc);

    defineFargateService(stack, cluster, fargateSecurityGroup, {
      isImageLocal,
      imagePath,
      containerPort,
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);

  return serverOutputsSchema.parse(
    await getOutputsFromStack(stackName, ["repositoryUri", "repositoryName"])
  );
}
