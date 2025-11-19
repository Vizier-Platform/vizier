import { App, RemovalPolicy, Stack, CfnOutput, Duration } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Toolkit } from "@aws-cdk/toolkit-lib";

// Hard coded port for testing
// const PORT = 80;

export async function deployFSApp(
  site_dr: string,
  image_url: string,
  db_name: string
): Promise<void> {
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
      sources: [s3deploy.Source.asset(site_dr)], // path to your build
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
      databaseName: db_name,
      credentials: rds.Credentials.fromGeneratedSecret("postgres"),
    });

    const dbSecret = dbInstance.secret;
    if (!dbSecret) {
      throw new Error("Database secret is undefined");
    }

    const fargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
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
            containerPort: 3001,
          },
          minHealthyPercent: 100,
        }
      );

    fargateService.targetGroup.configureHealthCheck({
      path: "/health",
      healthyHttpCodes: "200-399",
    });

    const distribution = new cloudfront.Distribution(
      stack,
      "FullStackDistribution",
      {
        defaultRootObject: "index.html",
        defaultBehavior: {
          origin: new origins.S3Origin(bucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        additionalBehaviors: {
          "api/*": {
            origin: new origins.LoadBalancerV2Origin(
              fargateService.loadBalancer,
              {
                protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
              }
            ),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          },
        },
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: Duration.seconds(0),
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: Duration.seconds(0),
          },
        ],
      }
    );
    new CfnOutput(stack, "DBEndpoint", {
      value: dbInstance.dbInstanceEndpointAddress,
    });

    new CfnOutput(stack, "CloudFrontUrl", {
      value: `https://${distribution.domainName}`,
    });

    new CfnOutput(stack, "AlbUrl", {
      value: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
    });

    return app.synth();
  });

  await toolkit.deploy(cloudAssemblySource);
}
