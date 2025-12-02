import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, CfnOutput, Stack } from "aws-cdk-lib";
import requireDocker from "../../utils/requireDocker.js";
import { defineVpc } from "./partials/vpc.js";
import {
  defineCluster,
  defineFargateSecurityGroup,
  defineFargateService,
} from "./partials/fargate.js";
import {
  serverOutputsSchema,
  type ConfigBack,
  type DomainConfig,
  type ServerOutputs,
} from "../../types/index.js";
import path from "path";
import { getOutputsFromStack } from "../getOutputFromStack.js";
import { writeProperties } from "../../utils/readWrite.js";
import { defineDistribution } from "./partials/cloudfront.js";
import { printDnsRecordInstructions } from "../../commands/domainSetup.js";

export async function deployServerFromConfig(
  { projectId, dockerfileDirectory }: ConfigBack,
  domainConfig?: DomainConfig | undefined
) {
  const absoluteDockerfileDirectory = path.join(
    process.cwd(),
    dockerfileDirectory
  );

  const returnedOutputs = await deployServer({
    stackName: projectId,
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

interface ServerOptions {
  stackName: string;
  dockerfilePath: string;
  containerPort: number;
  domainConfig?: DomainConfig | undefined;
}

export async function deployServer({
  stackName,
  dockerfilePath,
  containerPort,
  domainConfig,
}: ServerOptions): Promise<ServerOutputs> {
  await requireDocker();

  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, stackName);

    const vpc = defineVpc(stack);

    const cluster = defineCluster(stack, vpc);

    const fargateSecurityGroup = defineFargateSecurityGroup(stack, vpc);

    const fargateService = defineFargateService(
      stack,
      cluster,
      fargateSecurityGroup,
      {
        dockerfilePath,
        containerPort,
      }
    );

    const distribution = defineDistribution(stack, {
      fargateService,
      domainConfig,
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);

  return serverOutputsSchema.parse(
    await getOutputsFromStack(stackName, [
      "repositoryUri",
      "clusterName",
      "serviceName",
      "cloudfrontDomain",
    ])
  );
}
