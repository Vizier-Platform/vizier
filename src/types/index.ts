import { z } from "zod";

export const configSchema = z.object({
  projectName: z.string(),
  projectId: z.string(),
  assetDirectory: z.string(),
});

export const outputsSchema = z.object({
  bucketName: z.string(),
});

export type Config = z.infer<typeof configSchema>;
export type Outputs = z.infer<typeof outputsSchema>;
