import { z } from "zod";

const stackTypes = ["front", "front+back"] as const;
const stackTypeSchema = z.enum(stackTypes);
export type StackType = z.infer<typeof stackTypeSchema>;

export const configBaseSchema = z.object({
  projectName: z.string(),
  projectId: z.string(),
  stackType: stackTypeSchema,
});
export type ConfigBase = z.infer<typeof configBaseSchema>;

export const configFrontSchema = configBaseSchema.extend({
  assetDirectory: z.string(),
});
export type ConfigFront = z.infer<typeof configFrontSchema>;

export const configFrontBackSchema = configFrontSchema.extend({
  dockerfileDirectory: z.string(),
});
export type ConfigFrontBack = z.infer<typeof configFrontBackSchema>;

export const configSchema = z.discriminatedUnion("stackType", [
  configFrontSchema,
  configFrontBackSchema,
  // future extensions can go here
]);
export type Config = z.infer<typeof configSchema>;

export const outputsSchema = z.object({
  bucketName: z.string(),
});

export type Outputs = z.infer<typeof outputsSchema>;
