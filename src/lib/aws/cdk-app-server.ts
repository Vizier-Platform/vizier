import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, Stack } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
// Hard coded port for testing
const PORT = 80;

export async function deployAppServer(): Promise<void> {
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

    new ecsPatterns.ApplicationLoadBalancedFargateService(
      stack,
      "VizierFargateService",
      {
        cluster: cluster as ecs.ICluster,
        memoryLimitMiB: 1024,
        desiredCount: 1,
        cpu: 512,
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry("nginxdemos/hello"), // test image
          containerPort: PORT,
        },
        minHealthyPercent: 100,
      }
    );

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);
}
