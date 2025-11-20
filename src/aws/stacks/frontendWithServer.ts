import { App, Stack, CfnOutput } from "aws-cdk-lib";
import { Toolkit } from "@aws-cdk/toolkit-lib";
import { defineBucket } from "./partials/bucket.js";
import { defineVpc } from "./partials/vpc.js";
import {
  defineCluster,
  defineFargateSecurityGroup,
  defineFargateService,
} from "./partials/fargate.js";
import { defineDistribution } from "./partials/cloudfront.js";
import requireDocker from "../../utils/requireDocker.js";
import type { ConfigFrontBack } from "../../types/index.js";
import path from "path";

export async function deployFrontendWithServerFromConfig({
  projectId,
  assetDirectory,
  dockerfileDirectory,
}: ConfigFrontBack) {
  const absoluteAssetDirectory = path.join(process.cwd(), assetDirectory);
  const absoluteDockerfileDirectory = path.join(
    process.cwd(),
    dockerfileDirectory
  );

  await deployFrontendWithServer({
    stackName: projectId,
    assetDirectory: absoluteAssetDirectory,
    isImageLocal: true,
    imagePath: absoluteDockerfileDirectory,
    containerPort: 3000,
  });
}

interface FrontendWithServerOptions {
  stackName: string;
  assetDirectory: string;
  isImageLocal: boolean;
  imagePath: string;
  containerPort: number;
}

export async function deployFrontendWithServer({
  stackName,
  assetDirectory,
  isImageLocal,
  imagePath,
  containerPort,
}: FrontendWithServerOptions): Promise<void> {
  if (isImageLocal) {
    await requireDocker();
  }

  const toolkit = new Toolkit();
  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, stackName);

    const bucket = defineBucket(stack, assetDirectory);
    const vpc = defineVpc(stack);

    const cluster = defineCluster(stack, vpc);

    const fargateSecurityGroup = defineFargateSecurityGroup(stack, vpc);

    const fargateService = defineFargateService(
      stack,
      cluster,
      fargateSecurityGroup,
      {
        isImageLocal,
        imagePath,
        containerPort,
      }
    );

    const distribution = defineDistribution(stack, bucket, fargateService);

    new CfnOutput(stack, "CloudFrontUrl", {
      value: `https://${distribution.domainName}`,
    });

    new CfnOutput(stack, "AlbUrl", {
      value: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);
}
