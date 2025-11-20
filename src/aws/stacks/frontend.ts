import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, CfnOutput, Stack } from "aws-cdk-lib";
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import path from "node:path";
import S3ClientService from "../s3.js";
import { readProperties, writeProperties } from "../../utils/outputs.js";
import {
  type Outputs,
  configFrontSchema,
  outputsSchema,
} from "../../types/index.js";
import { defineBucket } from "./partials/bucket.js";
import { defineDistribution } from "./partials/cloudfront.js";

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

export async function deployFrontendFromConfig() {
  const { projectId, assetDirectory } = configFrontSchema.parse(
    readProperties("config.json")
  );
  const absoluteAssetDirectory = path.join(process.cwd(), assetDirectory);
  const existingOutputs = readProperties("outputs.json");
  const parsedOutputs = outputsSchema.safeParse(existingOutputs);

  if (parsedOutputs.success) {
    const s3Service = new S3ClientService();

    await s3Service.syncDirectory(
      parsedOutputs.data.bucketName,
      absoluteAssetDirectory
    );
  } else {
    const returnedOutputs = await deployFrontend({
      stackName: projectId,
      assetDirectory: absoluteAssetDirectory,
    });

    writeProperties("outputs.json", returnedOutputs);
  }
}

interface FrontendOptions {
  stackName: string;
  assetDirectory: string;
}

export async function deployFrontend({
  stackName,
  assetDirectory,
}: FrontendOptions): Promise<Outputs> {
  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, stackName);

    const bucket = defineBucket(stack, assetDirectory);

    const distribution = defineDistribution(stack, bucket);

    new CfnOutput(stack, "BucketName", {
      value: bucket.bucketName,
    });

    new CfnOutput(stack, "CloudFrontUrl", {
      value: `https://${distribution.domainName}`,
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);

  const bucketName = await getBucketNameFromStack(stackName);

  if (!bucketName) {
    throw new Error("Unable to determine deployed bucket name");
  }

  return { bucketName };
}
