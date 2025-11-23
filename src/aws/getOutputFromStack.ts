import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

export async function getOutputsFromStack(
  stackName: string,
  outputKeys: string[]
): Promise<Record<string, string>> {
  const client = new CloudFormationClient({});
  const description = await client.send(
    new DescribeStacksCommand({ StackName: stackName })
  );

  const stack = description.Stacks?.[0];
  if (!stack) {
    throw new Error(`Stack ${stackName} not found`);
  }

  const values: Record<string, string> = {};

  outputKeys.forEach((key) => {
    const output = stack?.Outputs?.find((output) => output.OutputKey === key);
    const value = output?.OutputValue;
    if (!value) {
      throw new Error(`Output key ${key} not found in stack ${stackName}`);
    }
    values[key] = value;
  });

  return values;
}
