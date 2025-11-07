import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  DeletePublicAccessBlockCommand,
  paginateListObjectsV2,
  PutBucketPolicyCommand,
  PutBucketWebsiteCommand,
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

  async enableStaticHosting(bucketName: string): Promise<void> {
    await this.client.send(
      new PutBucketWebsiteCommand({
        Bucket: bucketName,
        WebsiteConfiguration: {
          IndexDocument: {
            Suffix: `index.html`, // HARD-CODED FOR TESTING
          },
        },
      })
    );
    await this.client.send(
      new DeletePublicAccessBlockCommand({ Bucket: bucketName })
    );

    await this.client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: `{
      "Version":"2012-10-17",
      "Statement":[{
        "Sid":"PublicReadGetObject",
        "Effect":"Allow",
        "Principal":"*",
        "Action":["s3:GetObject"],
        "Resource":["arn:aws:s3:::${bucketName}/*"]
      }]
    }`,
      })
    );
    console.log("Static hosting enabled");
    // FIXME: hard coded region
    console.log(
      `Static website available at http://${bucketName}.s3-website-us-east-1.amazonaws.com`
    );
  }
}
