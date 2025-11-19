import type { Stack } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export function defineVpc(stack: Stack) {
  return new ec2.Vpc(stack, "MyVpc", {
    maxAzs: 2,
  });
}
