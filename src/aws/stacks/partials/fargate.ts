import type { Stack } from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import type { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";

const HEALTH_CHECK_PATH = "/health";

export function defineCluster(stack: Stack, vpc: ec2.Vpc) {
  return new ecs.Cluster(stack, "ServerCluster", {
    vpc: vpc as ec2.IVpc,
    enableFargateCapacityProviders: true,
  });
}

export function defineFargateSecurityGroup(stack: Stack, vpc: ec2.Vpc) {
  return new ec2.SecurityGroup(stack, "FargateSecurityGroup", {
    vpc: vpc as ec2.IVpc,
    description: "Fargate tasks security group",
    allowAllOutbound: true,
  });
}

interface DbConfig {
  dbInstance: DatabaseInstance;
  dbName: string;
  dbSecret: ISecret;
}

interface FargateServiceOptions {
  isImageLocal: boolean;
  imagePath: string;
  containerPort: number;
  dbConfig?: DbConfig;
}

export function defineFargateService(
  stack: Stack,
  cluster: ecs.Cluster,
  fargateSecurityGroup: ec2.SecurityGroup,
  options: FargateServiceOptions
) {
  const { isImageLocal, imagePath, containerPort, dbConfig } = options;

  const environment = dbConfig
    ? {
        DB_HOST: dbConfig.dbInstance.dbInstanceEndpointAddress,
        DB_PORT: "5432",
        DB_NAME: dbConfig.dbName,
      }
    : {};

  const secrets = dbConfig
    ? {
        DB_USER: ecs.Secret.fromSecretsManager(dbConfig.dbSecret, "username"),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(
          dbConfig.dbSecret,
          "password"
        ),
      }
    : {};

  const image = isImageLocal
    ? ecs.ContainerImage.fromAsset(imagePath)
    : ecs.ContainerImage.fromRegistry(imagePath);

  const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
    stack,
    "VizierFargateService",
    {
      cluster: cluster as ecs.ICluster,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      cpu: 512,
      securityGroups: [fargateSecurityGroup],
      publicLoadBalancer: true,
      taskSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      taskImageOptions: {
        image,
        environment,
        secrets,
        containerPort,
      },
      minHealthyPercent: 100,
    }
  );

  fargateService.targetGroup.configureHealthCheck({
    path: HEALTH_CHECK_PATH,
    healthyHttpCodes: "200-399",
  });
  return fargateService;
}
