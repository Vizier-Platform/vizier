import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  paginateListObjectsV2,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import path from "node:path";
import mime from "mime";
import { forFileInDirectory } from "../files.js";

export default class S3ClientService {
  client: S3Client;
  constructor() {
    this.client = new S3Client({});
  }
  async createBucket(bucketName: string): Promise<void> {
    await this.client.send(new CreateBucketCommand({ Bucket: bucketName }));
    console.log(`${bucketName} was created.`);
  }

  async destroyBucket(bucketName: string): Promise<void> {
    await this.client.send(new DeleteBucketCommand({ Bucket: bucketName }));
    console.log(`${bucketName} was destroyed`);
  }

  async emptyBucket(bucketName: string): Promise<void> {
    const paginator = paginateListObjectsV2(
      { client: this.client },
      { Bucket: bucketName }
    );

    for await (const page of paginator) {
      if (page.Contents) {
        for (const obj of page.Contents) {
          console.log(`Deleting ${obj.Key}`);
          await this.client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: obj.Key,
            })
          );
        }
      }
    }
  }

  async syncDirectory(
    bucketName: string,
    localDirectory: string
  ): Promise<void> {
    await forFileInDirectory(
      localDirectory,
      async (relativePath: string, contents: string) => {
        const Key = relativePath.split(path.sep).join("/");

        console.log(`Uploading ${Key}`);
        await this.client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key,
            Body: contents,
            ContentType: mime.getType(Key) || undefined,
          })
        );
      }
    );
  }
}
