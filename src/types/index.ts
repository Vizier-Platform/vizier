import { z } from "zod";

const stackTypes = [
  "front",
  "front+back",
  "back",
  "back+db",
  "front+back+db",
] as const;
const stackTypeSchema = z.enum(stackTypes);
export type StackType = z.infer<typeof stackTypeSchema>;

export const configBaseSchema = z.object({
  projectName: z.string(),
  projectId: z.string(),
  stackType: stackTypeSchema,
});
export type ConfigBase = z.infer<typeof configBaseSchema>;

export const configFrontSchema = configBaseSchema.extend({
  stackType: z.literal("front"),
  assetDirectory: z.string(),
});
export type ConfigFront = z.infer<typeof configFrontSchema>;

export const configBackSchema = configBaseSchema.extend({
  stackType: z.literal("back"),
  dockerfileDirectory: z.string(),
});
export type ConfigBack = z.infer<typeof configBackSchema>;

export const configFrontBackSchema = configFrontSchema.extend({
  stackType: z.literal("front+back"),
  dockerfileDirectory: z.string(),
});
export type ConfigFrontBack = z.infer<typeof configFrontBackSchema>;

export const configBackDbSchema = configBackSchema.extend({
  stackType: z.literal("back+db"),
});
export type ConfigBackDb = z.infer<typeof configBackDbSchema>;

export const configFrontBackDbSchema = configFrontBackSchema.extend({
  stackType: z.literal("front+back+db"),
});
export type ConfigFrontBackDb = z.infer<typeof configFrontBackDbSchema>;

export const configSchema = z.discriminatedUnion("stackType", [
  configFrontSchema,
  configBackSchema,
  configFrontBackSchema,
  configBackDbSchema,
  configFrontBackDbSchema,
]);
export type Config = z.infer<typeof configSchema>;

export const outputsSchema = z.object({
  bucketName: z.string(),
});

export type Outputs = z.infer<typeof outputsSchema>;
