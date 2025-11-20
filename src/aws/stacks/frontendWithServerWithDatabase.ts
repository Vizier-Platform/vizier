import { App, Stack, CfnOutput } from "aws-cdk-lib";
import { Toolkit } from "@aws-cdk/toolkit-lib";
import { defineBucket } from "./partials/bucket.js";
import { defineVpc } from "./partials/vpc.js";
import {
  defineCluster,
  defineFargateSecurityGroup,
  defineFargateService,
} from "./partials/fargate.js";
import { defineDb } from "./partials/db.js";
import { defineDistribution } from "./partials/cloudfront.js";

export async function deployFSApp(
  assetDirectory: string,
  isImageLocal: boolean,
  imagePath: string,
  dbName: string,
  containerPort: number
): Promise<void> {
  const toolkit = new Toolkit();
  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, "fullstack-deployment");

    const bucket = defineBucket(stack, assetDirectory);
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

    const distribution = defineDistribution(stack, bucket, fargateService);

    new CfnOutput(stack, "DBEndpoint", {
      value: dbInstance.dbInstanceEndpointAddress,
    });

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
