import { Stack, RemovalPolicy } from "aws-cdk-lib";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export function defineDb(stack: Stack, vpc: ec2.Vpc, dbName: string) {
  const dbSecurityGroup = new ec2.SecurityGroup(stack, "DbSecurityGroup", {
    vpc: vpc as ec2.IVpc,
    description: "Allow Postgres from Fargate tasks",
    allowAllOutbound: true,
  });

  const fargateSecurityGroup = new ec2.SecurityGroup(
    stack,
    "FargateSecurityGroup",
    {
      vpc: vpc as ec2.IVpc,
      description: "Fargate tasks security group",
      allowAllOutbound: true,
    }
  );

  dbSecurityGroup.addIngressRule(
    fargateSecurityGroup,
    ec2.Port.tcp(5432),
    "Allow Postgres from Fargate tasks"
  );

  const dbInstance = new rds.DatabaseInstance(stack, "DatabaseInstance", {
    engine: rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.VER_17_6, // perhaps allow user to choose psql ver?
    }),
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.BURSTABLE3, // consider altering instanceClass to server wider range of apps
      ec2.InstanceSize.SMALL // as above
    ),
    vpc: vpc as ec2.IVpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    },
    allocatedStorage: 20,
    maxAllocatedStorage: 100,
    securityGroups: [dbSecurityGroup],
    deleteAutomatedBackups: true,
    removalPolicy: RemovalPolicy.DESTROY, // might want to remove for prod apps
    databaseName: dbName,
    credentials: rds.Credentials.fromGeneratedSecret("postgres"),
  });

  const dbSecret = dbInstance.secret;
  if (!dbSecret) {
    throw new Error("Database secret is undefined");
  }
  return { fargateSecurityGroup, dbInstance, dbSecret };
}
