import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, Stack } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";

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

    const taskDefinition = new ecs.FargateTaskDefinition(
      stack,
      "VizierFargateClusterTask"
    );

    taskDefinition.addContainer("web", {
      image: ecs.ContainerImage.fromRegistry("nginxdemos/hello"),
    });

    new ecs.FargateService(stack, "FargateService", {
      cluster: cluster as ecs.ICluster,
      taskDefinition,
      minHealthyPercent: 100,
      capacityProviderStrategies: [
        {
          capacityProvider: "FARGATE_SPOT",
          weight: 2,
        },
        {
          capacityProvider: "FARGATE",
          weight: 1,
        },
      ],
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);
}

deployAppServer();
