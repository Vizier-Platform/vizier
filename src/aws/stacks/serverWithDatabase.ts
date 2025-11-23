import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, CfnOutput, Stack } from "aws-cdk-lib";
import { defineDb } from "./partials/db.js";
import {
  defineCluster,
  defineFargateSecurityGroup,
  defineFargateService,
} from "./partials/fargate.js";
import requireDocker from "../../utils/requireDocker.js";
import { defineVpc } from "./partials/vpc.js";
import {
  serverOutputsSchema,
  type ConfigBackDb,
  type ServerOutputs,
} from "../../types/index.js";
import path from "path";
import { getOutputsFromStack } from "../getOutputFromStack.js";
import { writeProperties } from "../../utils/outputs.js";

export async function deployServerWithDatabaseFromConfig({
  projectId,
  dockerfileDirectory,
}: ConfigBackDb) {
  const absoluteDockerfileDirectory = path.join(
    process.cwd(),
    dockerfileDirectory
  );

  const returnedOutputs = await deployServerWithDatabase({
    stackName: projectId,
    dockerfilePath: absoluteDockerfileDirectory,
    containerPort: 3000,
  });

  writeProperties("outputs.json", returnedOutputs);
}

interface DBServerOptions {
  stackName: string;
  dockerfilePath: string;
  containerPort: number;
}

export async function deployServerWithDatabase({
  stackName,
  dockerfilePath,
  containerPort,
}: DBServerOptions): Promise<ServerOutputs> {
  await requireDocker();

  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, stackName);

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

    new CfnOutput(stack, "DBEndpoint", {
      value: dbInstance.dbInstanceEndpointAddress,
    });

    new CfnOutput(stack, "AlbUrl", {
      value: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);

  return serverOutputsSchema.parse(
    await getOutputsFromStack(stackName, [
      "repositoryUri",
      "clusterName",
      "serviceName",
    ])
  );
}
