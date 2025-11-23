import { Stack, Duration } from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import type { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import type { Bucket } from "aws-cdk-lib/aws-s3";

const API_BEHAVIOR_PATH = "api/*";

type options =
  | { bucket: Bucket; fargateService: ApplicationLoadBalancedFargateService }
  | { bucket: Bucket }
  | { fargateService: ApplicationLoadBalancedFargateService };

export function defineDistribution(stack: Stack, props: options) {
  const defaultOrigin =
    "bucket" in props
      ? new origins.S3StaticWebsiteOrigin(props.bucket)
      : new origins.LoadBalancerV2Origin(props.fargateService.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        });

  const distribution = new cloudfront.Distribution(
    stack,
    "FullStackDistribution",
    {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: defaultOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
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

  if ("bucket" in props && "fargateService" in props) {
    distribution.addBehavior(
      API_BEHAVIOR_PATH,
      new origins.LoadBalancerV2Origin(props.fargateService.loadBalancer, {
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

  return distribution;
}
