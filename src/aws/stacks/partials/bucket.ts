import { Stack, RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export function defineBucket(stack: Stack, assetDirectory: string) {
  const bucket = new s3.Bucket(stack, "static-files", {
    versioned: true,
    websiteIndexDocument: "index.html",
    publicReadAccess: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
  });

  new s3deploy.BucketDeployment(stack, "DeployFiles", {
    // "DeployFiles" is a descriptor ID
    sources: [s3deploy.Source.asset(assetDirectory)],
    destinationBucket: bucket,
  });
  return bucket;
}
