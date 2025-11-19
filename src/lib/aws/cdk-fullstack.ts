import { App, Stack, CfnOutput } from "aws-cdk-lib";
import { Toolkit } from "@aws-cdk/toolkit-lib";
import { defineBucket } from "./partials/bucket.js";
import { defineVpc } from "./partials/vpc.js";
import { defineCluster, defineFargateService } from "./partials/fargate.js";
import { defineDb } from "./partials/db.js";
import { defineDistribution } from "./partials/cloudfront.js";

// Hard coded port for testing
// const PORT = 80;

export async function deployFSApp(
  site_dr: string,
  image_url: string,
  db_name: string,
  containerPort: number
): Promise<void> {
  const toolkit = new Toolkit();
  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, "fullstack-deployment");

    const bucket = defineBucket(stack, site_dr);
    const vpc = defineVpc(stack);

    const cluster = defineCluster(stack, vpc);

    const { fargateSecurityGroup, dbInstance, dbSecret } = defineDb(
      stack,
      vpc,
      db_name
    );

    const fargateService = defineFargateService(
      stack,
      cluster,
      fargateSecurityGroup,
      image_url,
      dbInstance,
      db_name,
      dbSecret,
      containerPort
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
