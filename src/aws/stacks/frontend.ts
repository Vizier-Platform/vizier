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
import { printDnsRecordInstructions } from "../../commands/domainSetup.js";

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

  if (domainConfig) {
    printDnsRecordInstructions(
      "To direct traffic to your custom domain, make sure you create the following DNS record:",
      {
        Type: "CNAME",
        Name: domainConfig.domainName,
        Value: returnedOutputs.cloudfrontDomain,
      }
    );
  }
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

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);

  return bucketOutputsSchema.parse(
    await getOutputsFromStack(stackName, ["bucketName", "cloudfrontDomain"])
  );
}
