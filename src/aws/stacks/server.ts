import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, CfnOutput, Stack } from "aws-cdk-lib";
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
import { defineDistribution } from "./partials/cloudfront.js";

export async function deployServerFromConfig({
  projectId,
  dockerfileDirectory,
}: ConfigBack) {
  const absoluteDockerfileDirectory = path.join(
    process.cwd(),
    dockerfileDirectory
  );

  const returnedOutputs = await deployServer({
    stackName: projectId,
    dockerfilePath: absoluteDockerfileDirectory,
    containerPort: 3000,
  });

  writeProperties(".vizier/outputs.json", returnedOutputs);
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

    const fargateService = defineFargateService(
      stack,
      cluster,
      fargateSecurityGroup,
      {
        dockerfilePath,
        containerPort,
      }
    );

    const distribution = defineDistribution(stack, { fargateService });

    new CfnOutput(stack, "CloudFrontUrl", {
      value: `http://${distribution.domainName}`,
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);

  return serverOutputsSchema.parse(
    await getOutputsFromStack(stackName, [
      "repositoryUri",
      "clusterName",
      "serviceName",
    ])
  );
}
