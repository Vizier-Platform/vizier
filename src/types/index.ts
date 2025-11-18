import { z } from "zod";

export type StackType = "front"; // | "front+back" | "front+back+db";

// properties for every config
export const configBaseSchema = z.object({
  projectName: z.string(),
  projectId: z.string(),
});

// extension for static site config
export const configFrontSchema = configBaseSchema.extend({
  assetDirectory: z.string(),
});

export const outputsSchema = z.object({
  bucketName: z.string(),
});

export type ConfigBase = z.infer<typeof configBaseSchema>;
export type ConfigFront = z.infer<typeof configFrontSchema>;
export type Outputs = z.infer<typeof outputsSchema>;
