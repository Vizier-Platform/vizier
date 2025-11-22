import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

export async function getOutputsFromStack(
  stackName: string,
  outputKeys: string[]
): Promise<Array<string | undefined>> {
  const client = new CloudFormationClient({});
  const description = await client.send(
    new DescribeStacksCommand({ StackName: stackName })
  );

  const stack = description.Stacks?.[0];

  return outputKeys.map((key) => {
    const output = stack?.Outputs?.find((output) => output.OutputKey === key);
    return output?.OutputValue;
  });
}
