# vizier

---DEPLOYING STATIC SITE ON S3 CONTAINER---

Set up AWS CLI with your AWS account
Navigate to vizier folder

npm install
//OPTIONAL: exit and re-enter folder

npm link
tsc

vizier create my-bucket
`my-bucket-213451254 was created`

vizier sync -b my-bucket-213451254 -d
path-to-local-directory

vizier destroy my-bucket-213451254
