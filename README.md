# Vizier

Vizier is a CLI tool for deploying web applications to a user's own AWS account.

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

### Deploying Static Site

All commands must be run in the project root.

Setup:

- `vizier init -n <project-name> -d <asset-directory>`  
  e.g. `vizier init -n TopShop -d dist`
- `vizier deploy`

Syncing:

- `vizier deploy`

Teardown:

- `vizier destroyStack`
- `rm -rf .vizier`

### Deploying Static Site (Deprecated Way)

Setup:

- `vizier create my-bucket`

Syncing:

- `vizier sync -b my-bucket-213451254 -d path-to-local-directory`

Teardown:

- `vizier destroy my-bucket-213451254`
