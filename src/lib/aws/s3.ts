import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  paginateListObjectsV2,
  S3Client,
} from "@aws-sdk/client-s3";

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
}
