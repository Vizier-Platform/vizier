# Vizier

Vizier is a CLI tool for deploying web applications to a user's own AWS account.

## Installation

### Prerequisites

- install AWS CLI and configure AWS credentials
- install AWS CDK CLI and run `cdk bootstrap aws://<aws-id-number>/<aws-region>`

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

- `vizier init` and follow prompts
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

## Supported Configuration

### Project Structure

- Each project must be in a single repository
- Automatic deployment on push to GitHub requires that the `vizier init`-generated `.vizier/` and `.github/` folders be tracked by git.

### Server

- User must provide Dockerfile
- Server must run on port 3000
- Health checks are performed at `/health` and expect status code 2xx-3xx. Successful deployment depends on these health checks.
- If using static frontend and server, paths matching `api/*` are routed to the server

### Database

- Database is PostgreSQL version 17
- Database credentials are provided as environmental variables to the server
  <!-- TODO: elaborate -->
