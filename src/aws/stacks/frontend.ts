import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, CfnOutput, Stack } from "aws-cdk-lib";
import path from "node:path";
import S3ClientService from "../s3.js";
import { readProperties, writeProperties } from "../../utils/outputs.js";
import {
  type ConfigFront,
  type BucketOutputs,
  bucketOutputsSchema,
} from "../../types/index.js";
import { defineBucket } from "./partials/bucket.js";
import { defineDistribution } from "./partials/cloudfront.js";
import { getOutputsFromStack } from "../getOutputFromStack.js";

export async function deployFrontendFromConfig({
  projectId,
  assetDirectory,
}: ConfigFront) {
  const absoluteAssetDirectory = path.join(process.cwd(), assetDirectory);
  const existingOutputs = readProperties("outputs.json");
  const parsedOutputs = bucketOutputsSchema.safeParse(existingOutputs);

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
}: FrontendOptions): Promise<BucketOutputs> {
  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, stackName);

    const bucket = defineBucket(stack, assetDirectory);

    const distribution = defineDistribution(stack, { bucket });

    new CfnOutput(stack, "bucketName", {
      value: bucket.bucketName,
    });

    new CfnOutput(stack, "CloudFrontUrl", {
      value: `https://${distribution.domainName}`,
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);

  return bucketOutputsSchema.parse(
    await getOutputsFromStack(stackName, ["bucketName"])
  );
}
