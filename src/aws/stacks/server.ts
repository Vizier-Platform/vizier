import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, Stack } from "aws-cdk-lib";
import requireDocker from "../../utils/requireDocker.js";
import { defineVpc } from "./partials/vpc.js";
import {
  defineCluster,
  defineFargateSecurityGroup,
  defineFargateService,
} from "./partials/fargate.js";

interface AppServerOptions {
  stackName: string;
  isImageLocal: boolean;
  imagePath: string;
  containerPort: number;
}

export async function deployAppServer({
  stackName,
  isImageLocal,
  imagePath,
  containerPort,
}: AppServerOptions): Promise<void> {
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
}
