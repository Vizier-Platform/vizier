# Vizier

Vizier is a CLI tool for deploying web applications to AWS, deploying to a user's own account.

## Installation

### Prerequisites

- install AWS CLI and configure AWS credentials
- install AWS CDK CLI and run `cdk bootstrap aws://<aws-id-number> us-east-1`

### Installing Vizier

In the future: NPM install globally.

Currently:

- clone vizier repository
- navigate to vizier directory
- `npm install`
- `npm run build`
- `npm link`
- OPTIONAL: exit and re-enter folder (?)

## Use

`vizier help` for command descriptions

### Deploying Static Site on S3 Bucket

(Deprecated)

Setup:

`vizier create my-bucket`  
`my-bucket-213451254 was created`

Syncing:

`vizier sync -b my-bucket-213451254 -d path-to-local-directory`

Teardown:

`vizier destroy my-bucket-213451254`

### Deploying Static Site With CDK

Hard code local directory of code to be deployed, with `/vizier/` as the root

`vizier deploy my-stack-name`

`vizier destroyStack my-stack-name`
