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

    // Not working
    // const cluster = new ecs.Cluster(stack, "Cluster", {
    //   vpc,
    // });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);
}

deployAppServer();
