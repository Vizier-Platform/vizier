// Import required packages
import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, CfnOutput, RemovalPolicy, Stack } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import path from "node:path";
import S3ClientService from "./s3.js";
import { readStoredOutputs, writeStoredOutputs } from "../outputs.js";

const STACK_NAME = "VizierStack2";
const ASSET_DIRECTORY = path.join(process.cwd(), "test-site");

async function getBucketNameFromStack(
  stackName: string
): Promise<string | undefined> {
  const client = new CloudFormationClient({});
  const result = await client.send(
    new DescribeStacksCommand({ StackName: stackName })
  );

  const stack = result.Stacks?.[0];
  const bucketOutput = stack?.Outputs?.find(
    (output) => output.OutputKey === "BucketName"
  );

  return bucketOutput?.OutputValue;
}

async function syncAssetsToBucket(bucketName: string): Promise<void> {
  const s3Service = new S3ClientService();
  await s3Service.syncDirectory(bucketName, ASSET_DIRECTORY);
}

export async function deployS3Stack(baseName: string): Promise<void> {
  const storedOutputs = readStoredOutputs();

  if (storedOutputs?.bucketName) {
    await syncAssetsToBucket(storedOutputs.bucketName);
    return;
  }

  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, STACK_NAME);

    const bucket = new s3.Bucket(stack, baseName, {
      versioned: true,
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(stack, "DeployFiles", {
      // "DeployFiles" is a descriptor ID
      sources: [s3deploy.Source.asset(ASSET_DIRECTORY)], // path to your build
      destinationBucket: bucket,
    });

    new CfnOutput(stack, "BucketName", {
      value: bucket.bucketName,
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);

  const bucketName = await getBucketNameFromStack(STACK_NAME);

  if (!bucketName) {
    throw new Error("Unable to determine deployed bucket name");
  }

  writeStoredOutputs({ bucketName });
}
