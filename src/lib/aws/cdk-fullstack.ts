import { Toolkit } from "@aws-cdk/toolkit-lib";
import { App, RemovalPolicy, Stack } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as rds from "aws-cdk-lib/aws-rds";
import * as cdk from "aws-cdk-lib/core";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

// Hard coded port for testing
const PORT = 80;

export async function deployFSApp(): Promise<void> {
  const toolkit = new Toolkit();

  const cloudAssemblySource = await toolkit.fromAssemblyBuilder(async () => {
    const app = new App();
    const stack = new Stack(app, "fullstack-deployment");

    const bucket = new s3.Bucket(stack, "MyBucket", {
      versioned: true,
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(stack, "DeployFiles", {
      // "DeployFiles" is a descriptor ID
      sources: [s3deploy.Source.asset("../../../test-site")], // path to your build
      destinationBucket: bucket,
    });
    const vpc = new ec2.Vpc(stack, "MyVpc", {
      maxAzs: 2, // Use 2 availability zones
    });

    // Bandaid solution, look into fixing 'exactOptionalPropertyTypes' error
    const cluster = new ecs.Cluster(stack, "VizierFargateCluster", {
      vpc: vpc as ec2.IVpc,
      enableFargateCapacityProviders: true,
    });

    new ecsPatterns.ApplicationLoadBalancedFargateService(
      stack,
      "VizierFargateService",
      {
        cluster: cluster as ecs.ICluster,
        memoryLimitMiB: 1024,
        desiredCount: 1,
        cpu: 512,
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry("nginxdemos/hello"), // test image
          containerPort: PORT,
        },
        minHealthyPercent: 100,
      }
    );

    // Create the RDS instance
    const dbInstance = new rds.DatabaseInstance(stack, "DatabaseInstance", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_6,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.SMALL
      ),
      vpc: vpc as ec2.IVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      securityGroups: [], // We will add this next
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
      databaseName: "mydatabase",
      credentials: rds.Credentials.fromGeneratedSecret("postgres"), // Username 'postgres' and an auto-generated password
    });

    // Output the auto-generated password and the DB instance endpoint
    new cdk.CfnOutput(stack, "DBEndpoint", {
      value: dbInstance.dbInstanceEndpointAddress,
    });

    new cdk.CfnOutput(stack, "DBPassword", {
      value: dbInstance.secret?.secretValue.toString() ?? "NO_SECRET", // '?? NO_SEC' Bandaid solution
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);
}
