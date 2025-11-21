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
import type { ConfigFrontBackDb, Outputs } from "../../types/index.js";
import path from "path";
import { writeProperties } from "../../utils/outputs.js";
import { getOutputFromStack } from "../getOutputFromStack.js";

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
    isImageLocal: true,
    imagePath: absoluteDockerfileDirectory,
    dbName: "database",
    containerPort: 3000,
  });

  writeProperties("outputs.json", returnedOutputs);
}

interface FullstackOptions {
  stackName: string;
  assetDirectory: string;
  isImageLocal: boolean;
  imagePath: string;
  dbName: string;
  containerPort: number;
}

export async function deployFrontendWithServerWithDatabase({
  stackName,
  assetDirectory,
  isImageLocal,
  imagePath,
  dbName,
  containerPort,
}: FullstackOptions): Promise<Outputs> {
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

    new CfnOutput(stack, "BucketName", {
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

  const bucketName = await getOutputFromStack(stackName, "BucketName");

  if (!bucketName) {
    throw new Error("Unable to determine deployed bucket name");
  }

  return { bucketName };
}
