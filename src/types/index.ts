import { z } from "zod";

const stackTypes = ["front"] as const;
const stackTypeSchema = z.enum(stackTypes);
export type StackType = z.infer<typeof stackTypeSchema>;

// properties for every config
export const configBaseSchema = z.object({
  projectName: z.string(),
  projectId: z.string(),
  stackType: stackTypeSchema,
});

// extension for static site config
export const configFrontSchema = configBaseSchema.extend({
  assetDirectory: z.string(),
});

export type ConfigBase = z.infer<typeof configBaseSchema>;

export type ConfigFront = z.infer<typeof configFrontSchema>;
export type FullConfig = ConfigFront | object; // | ConfigFrontBack | ConfigFrontBackDb;

export const outputsSchema = z.object({
  bucketName: z.string(),
});

export type Outputs = z.infer<typeof outputsSchema>;
