import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, CfnOutput, Stack } from "aws-cdk-lib";
import { defineDb } from "./partials/db.js";
import {
  defineCluster,
  defineFargateSecurityGroup,
  defineFargateService,
} from "./partials/fargate.js";
import requireDocker from "../../utils/requireDocker.js";
import { defineVpc } from "./partials/vpc.js";

interface DBServerOptions {
  stackName: string;
  isImageLocal: boolean;
  imagePath: string;
  dbName: string;
  containerPort: number;
}

export async function deployServerWithDatabase({
  stackName,
  isImageLocal,
  imagePath,
  dbName,
  containerPort,
}: DBServerOptions): Promise<void> {
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

    const { dbInstance, dbSecret } = defineDb(
      stack,
      vpc,
      dbName,
      fargateSecurityGroup
    );

    const fargateService = defineFargateService(
      stack,
      cluster,
      fargateSecurityGroup,
      {
        isImageLocal,
        imagePath,
        containerPort,
        dbConfig: { dbInstance, dbName, dbSecret },
      }
    );

    new CfnOutput(stack, "DBEndpoint", {
      value: dbInstance.dbInstanceEndpointAddress,
    });

    new CfnOutput(stack, "AlbUrl", {
      value: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);
}
