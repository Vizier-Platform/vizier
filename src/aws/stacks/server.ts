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
  isImageLocal: boolean;
  imagePath: string;
  containerPort: number;
}

export async function deployAppServer({
  isImageLocal,
  imagePath,
  containerPort,
}: AppServerOptions): Promise<void> {
  // fromAsset requires docker to be installed with daemon running
  if (isImageLocal) {
    await requireDocker();
  }

  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, "app-server-stack");

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
