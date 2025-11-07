import {
  CreateBucketCommand,
  DeleteBucketCommand,
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
}

/*
From a particular command, such as create, the action handler will do client=new S3ClientService class instance.
As part of that new instance, it will create a new connection. That object will have the properties of 
different commands that we define. 
*/
