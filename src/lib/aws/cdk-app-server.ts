import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, Stack } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import requireDocker from "../requireDocker.js";

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
    requireDocker();
  }

  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, "app-server-stack");

    const vpc = new ec2.Vpc(stack, "MyVpc", {
      maxAzs: 2, // Use 2 availability zones
    });

    // Bandaid solution, look into fixing 'exactOptionalPropertyTypes' error
    const cluster = new ecs.Cluster(stack, "VizierFargateCluster", {
      vpc: vpc as ec2.IVpc,
      enableFargateCapacityProviders: true,
    });

    const image = isImageLocal
      ? ecs.ContainerImage.fromAsset(imagePath)
      : ecs.ContainerImage.fromRegistry(imagePath);

    new ecsPatterns.ApplicationLoadBalancedFargateService(
      stack,
      "VizierFargateService",
      {
        cluster: cluster as ecs.ICluster,
        memoryLimitMiB: 1024,
        desiredCount: 1,
        cpu: 512,
        taskImageOptions: {
          image: image,
          containerPort: containerPort,
        },
        minHealthyPercent: 100,
      }
    );

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);
}
