import { Stack, Duration, CfnOutput } from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import type { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import type { Bucket } from "aws-cdk-lib/aws-s3";
import type { DomainConfig } from "../../../types/index.js";

const API_BEHAVIOR_PATH = "api/*";

type OriginOptions =
  | { bucket: Bucket; fargateService: ApplicationLoadBalancedFargateService }
  | { bucket: Bucket }
  | { fargateService: ApplicationLoadBalancedFargateService };

type DistributionOptions = OriginOptions & {
  domainConfig?: DomainConfig | undefined;
};

export function defineDistribution(stack: Stack, options: DistributionOptions) {
  const defaultOrigin =
    "bucket" in options
      ? new origins.S3StaticWebsiteOrigin(options.bucket)
      : new origins.LoadBalancerV2Origin(options.fargateService.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        });

  let distributionProps: cloudfront.DistributionProps = {
    defaultBehavior: {
      origin: defaultOrigin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
    },
  };

  if ("bucket" in options) {
    distributionProps = {
      ...distributionProps,
      defaultRootObject: "index.html",
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
    };
  }

  if (options.domainConfig) {
    const certificate = acm.Certificate.fromCertificateArn(
      stack,
      "VizierCertificate",
      options.domainConfig.certArn
    );

    distributionProps = {
      ...distributionProps,
      domainNames: [options.domainConfig.domainName],
      certificate: certificate,
    };
  }

  const distribution = new cloudfront.Distribution(
    stack,
    "VizierDistribution",
    distributionProps
  );

  if ("bucket" in options && "fargateService" in options) {
    distribution.addBehavior(
      API_BEHAVIOR_PATH,
      new origins.LoadBalancerV2Origin(options.fargateService.loadBalancer, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      }),
      {
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      }
    );
  }

  new CfnOutput(stack, "cloudfrontDomain", {
    value: distribution.domainName,
  });

  new CfnOutput(stack, "CloudFrontUrl", {
    value: `https://${distribution.domainName}`,
  });

  return distribution;
}
