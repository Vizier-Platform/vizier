// Import required packages
import { StackSelectionStrategy, Toolkit } from "@aws-cdk/toolkit-lib";
import { App, RemovalPolicy, Stack } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export async function deployS3Stack(baseName: string): Promise<void> {
  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, "VizierStack2");

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
      sources: [s3deploy.Source.asset("test-site")], // path to your build
      destinationBucket: bucket,
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);
}

export async function destroyStack(stackName: string) {
  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    new Stack(app, stackName);
    return app.synth();
  });

  await toolkit.destroy(cloudAssemblySource, {
    stacks: {
      strategy: StackSelectionStrategy.PATTERN_MUST_MATCH,
      patterns: [stackName],
    },
  });
}
