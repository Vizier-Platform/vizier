import type { Stack } from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import type { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";

export function defineCluster(stack: Stack, vpc: ec2.Vpc) {
  return new ecs.Cluster(stack, "VizierFargateCluster", {
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

export function defineFargateService(
  stack: Stack,
  cluster: ecs.Cluster,
  fargateSecurityGroup: ec2.SecurityGroup,
  isImageLocal: boolean,
  imagePath: string,
  dbInstance: DatabaseInstance,
  dbName: string,
  dbSecret: ISecret,
  containerPort: number
) {
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
        environment: {
          DB_HOST: dbInstance.dbInstanceEndpointAddress,
          DB_PORT: "5432",
          DB_NAME: dbName,
          DB_USER: "postgres",
          NODE_ENV: "production",
        },
        secrets: {
          DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, "password"),
        },
        containerPort: containerPort,
      },
      minHealthyPercent: 100,
    }
  );

  fargateService.targetGroup.configureHealthCheck({
    path: "/health",
    healthyHttpCodes: "200-399",
  });
  return fargateService;
}
