import { App, Stack } from "aws-cdk-lib";
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
  type DomainConfig,
} from "../../types/index.js";
import path from "path";
import { writeProperties } from "../../utils/readWrite.js";
import { getOutputsFromStack } from "../getOutputFromStack.js";
import { printDnsRecordInstructions } from "../../commands/domainSetup.js";

export async function deployFrontendWithServerWithDatabaseFromConfig(
  { projectId, assetDirectory, dockerfileDirectory }: ConfigFrontBackDb,
  domainConfig?: DomainConfig | undefined
) {
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

interface FullstackOptions {
  stackName: string;
  assetDirectory: string;
  dockerfilePath: string;
  containerPort: number;
  domainConfig?: DomainConfig | undefined;
}

export async function deployFrontendWithServerWithDatabase({
  stackName,
  assetDirectory,
  dockerfilePath,
  containerPort,
  domainConfig,
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

    defineDistribution(stack, {
      bucket,
      fargateService,
      domainConfig,
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
      "cloudfrontDomain",
    ])
  );
}
