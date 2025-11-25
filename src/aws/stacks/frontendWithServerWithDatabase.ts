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
import requireDocker from "../../utils/requireDocker.js";
import {
  type ConfigFrontBackDb,
  bucketAndServerOutputsSchema,
  type BucketAndServerOutputs,
} from "../../types/index.js";
import path from "path";
import { writeProperties } from "../../utils/readWrite.js";
import { getOutputsFromStack } from "../getOutputFromStack.js";

export async function deployFrontendWithServerWithDatabaseFromConfig({
  projectId,
  assetDirectory,
  dockerfileDirectory,
}: ConfigFrontBackDb) {
  const absoluteAssetDirectory = path.join(process.cwd(), assetDirectory);
  const absoluteDockerfileDirectory = path.join(
    process.cwd(),
    dockerfileDirectory
  );

  const returnedOutputs = await deployFrontendWithServerWithDatabase({
    stackName: projectId,
    assetDirectory: absoluteAssetDirectory,
    dockerfilePath: absoluteDockerfileDirectory,
    containerPort: 3000,
  });

  writeProperties(".vizier/outputs.json", returnedOutputs);
}

interface FullstackOptions {
  stackName: string;
  assetDirectory: string;
  dockerfilePath: string;
  containerPort: number;
}

export async function deployFrontendWithServerWithDatabase({
  stackName,
  assetDirectory,
  dockerfilePath,
  containerPort,
}: FullstackOptions): Promise<BucketAndServerOutputs> {
  await requireDocker();

  const toolkit = new Toolkit();
  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, stackName);

    const bucket = defineBucket(stack, assetDirectory);
    const vpc = defineVpc(stack);

    const cluster = defineCluster(stack, vpc);

    const fargateSecurityGroup = defineFargateSecurityGroup(stack, vpc);

    const { dbInstance, dbName, dbSecret } = defineDb(
      stack,
      vpc,
      fargateSecurityGroup
    );

    const fargateService = defineFargateService(
      stack,
      cluster,
      fargateSecurityGroup,
      {
        dockerfilePath,
        containerPort,
        dbConfig: { dbInstance, dbName, dbSecret },
      }
    );

    const distribution = defineDistribution(stack, { bucket, fargateService });

    new CfnOutput(stack, "bucketName", {
      value: bucket.bucketName,
    });

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

  return bucketAndServerOutputsSchema.parse(
    await getOutputsFromStack(stackName, [
      "bucketName",
      "repositoryUri",
      "clusterName",
      "serviceName",
    ])
  );
}
