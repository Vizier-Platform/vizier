import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, CfnOutput, Stack } from "aws-cdk-lib";
import path from "node:path";
import { writeProperties } from "../../utils/readWrite.js";
import {
  type ConfigFront,
  type BucketOutputs,
  bucketOutputsSchema,
  type DomainConfig,
} from "../../types/index.js";
import { defineBucket } from "./partials/bucket.js";
import { defineDistribution } from "./partials/cloudfront.js";
import { getOutputsFromStack } from "../getOutputFromStack.js";

export async function deployFrontendFromConfig(
  { projectId, assetDirectory }: ConfigFront,
  domainConfig?: DomainConfig | undefined
) {
  const absoluteAssetDirectory = path.join(process.cwd(), assetDirectory);

  const returnedOutputs = await deployFrontend({
    stackName: projectId,
    assetDirectory: absoluteAssetDirectory,
    domainConfig,
  });

  writeProperties(".vizier/outputs.json", returnedOutputs);
}

interface FrontendOptions {
  stackName: string;
  assetDirectory: string;
  domainConfig?: DomainConfig | undefined;
}

export async function deployFrontend({
  stackName,
  assetDirectory,
  domainConfig,
}: FrontendOptions): Promise<BucketOutputs> {
  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, stackName);

    const bucket = defineBucket(stack, assetDirectory);

    const distribution = defineDistribution(stack, { bucket, domainConfig });

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
