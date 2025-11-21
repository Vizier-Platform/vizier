import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

export async function getOutputFromStack(
  stackName: string,
  outputKey: string
): Promise<string | undefined> {
  const client = new CloudFormationClient({});
  const result = await client.send(
    new DescribeStacksCommand({ StackName: stackName })
  );

  const stack = result.Stacks?.[0];
  const output = stack?.Outputs?.find(
    (output) => output.OutputKey === outputKey
  );

  return output?.OutputValue;
}
