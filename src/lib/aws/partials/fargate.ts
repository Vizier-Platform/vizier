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

export function defineFargateService(
  stack: Stack,
  cluster: ecs.Cluster,
  fargateSecurityGroup: ec2.SecurityGroup,
  image_url: string,
  dbInstance: DatabaseInstance,
  db_name: string,
  dbSecret: ISecret,
  containerPort: number
) {
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
        image: ecs.ContainerImage.fromRegistry(image_url), // test image
        environment: {
          DB_HOST: dbInstance.dbInstanceEndpointAddress,
          DB_PORT: "5432",
          DB_NAME: db_name,
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
