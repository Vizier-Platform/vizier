# Vizier

Vizier is a CLI tool for deploying web applications to a user's own AWS account.

## Installation

### Prerequisites

- install AWS CLI and configure AWS credentials
  - Keep your AWS Access Key ID and your AWS Secret Access Key on-hand for later setup.
- install AWS CDK CLI and run `cdk bootstrap aws://<aws-id-number>/<aws-region>`

### Installing Vizier

In the future: NPM install globally.  
Currently:

- clone vizier repository
- navigate to vizier directory
- `npm install`
- `npm run build`
- `npm link`

## Use

`vizier help` for command descriptions

### Project Requirements

If deploying a Server:

- User must provide Dockerfile
- Server must run on port 3000
- Health checks are performed at `/health` and expect status code 2xx-3xx. Successful deployment depends on these health checks.
- If using static frontend and server, paths matching `api/*` are routed to the server

If deploying a Database:

- Database is PostgreSQL version 17
- Database credentials are provided by Vizier as environmental variables to the server

### Initializing a Project

Once vizier is installed, navigate to the root of your project.

- `vizier init`  
  Answer prompts regarding project type.

Project types include:

- `static site`  
  Basic frontend-only website served via a combination of an S3 bucket and Cloudfront distribution.
- `static frontend + server`  
  Combines the frontend S3 Bucket with Cloudfront, VPC, ECS, and Fargate.
- `server only`  
  Can be used for projects where the frontend is served within the backend or backend-only projects. Uses the same stack of Cloudfront, VPC, ECS, Fargate, without the S3 bucket.
- `server with database`  
  Combines the server stack with an RDS instance, assumes postgres for the database.
- `static frontend + server with database`  
  Combines all of the above into a full stack: S3 bucket, Cloudfront distribution, VPC, ECS, Fargate, and an RDS instance.
  This will create a `.vizier/` folder at your project root, containing your project configuration & information.

### Deploying a Site

Once initialized, you can deploy your site, again from the root of your project directory.

- `vizier deploy`  
  This process can take 7-12 minutes on average. The current status of deployment will print in your terminal. You can also view this within your AWS console under the newly created Cloudformation Stack.

Once the deployment is complete, the information of your project will be displayed at the end of the terminal message. This will always include a Cloudfront URL. This will be your initial URL for your website.

Depending on your project type, it may also include the S3 bucket name, the database endpoint, and the fargate load balancer URL.

### Updating via Github

You are able to manually update your AWS resources by re-running:

- `vizier deploy`  
  This will redeploy your site, but is an unnecessary manual step if you enable the GitHub actions workflow described below.

Vizier utilizes Github Actions to automate your deployment process, so you can simply run:

- `git push`  
  The workflow files will be created within your project's `.github` folder upon `vizier deploy`. The specific Vizier file created is `.github/workflows/vizier.yml`. The new or updated `.github` folder will be pushed to Github on your next `git push`, updating your Github Actions.
  Follow the instructions below to facilitate GH actions' deployment.

### Allowing Github Actions to Function

You must add your AWS account information as Repository Secrets.

- Navigate to your Github Repo's Settings tab.
- In the "Security" section, click on "Secrets and variables"
- Click on "Actions"
- Scroll to the box labeled "Repository secrets" with the large green button labeled "New repository secret"
- Create 3 of these secrets with the following names as typed (without quote marks):  
   `AWS_ACCESS_KEY_ID`
  - If you do not know yours/have one: in the AWS console, navigate to your username in the top-right corner. Select "security credentials" and you'll be able to create/view your Access keys.  
    `AWS_SECRET_ACCESS_KEY`
  - If you do not know yours/have one: Create an IAM user in the AWS console. On the created user's page, select "Security credentials" and create an access key.  
    `AWS_REGION`
  - The region of AWS you intend to deploy the site in, such as `us-east-1`.  
    Once these secrets are created within your corresponding Github Repo, vizier will automatically update your AWS resources when you run `git push`.

### Custom Domain

To deploy your project on a custom domain, you must:

- have a domain registered
- be able to create new DNS (CNAME) records for that domain

#### Setting Up a Custom Domain

Initialize project:

- `vizier init`
- `vizier deploy`  
  (Skip if you wish to immediately set up a domain, without first testing your deployment.)

Set up domain:

- `vizier domain-setup`  
  Provisions a TLS certificate and instructs you to create a DNS record for it.
- `vizier deploy`  
  Updates the stack to use the certificate, and instructs you to create a DNS record pointing your domain at the Cloudfront domain.

#### Removing a Custom Domain

Either:

- `vizier domain-remove`  
  Removes the domain but leaves resources deployed.

OR

- `vizier destroy`  
  Removes the domain while destroying deployed resources.

### Teardown

To destroy a project deployed by Vizier, run:

- `vizier destroy`  
   This WILL DESTROY ALL ASSOCIATED RESOURCES WITH THE STACK, INCLUDING YOUR DATABASE.  
   This action cannot be undone.  
   Depending on the size of the project, this process can take 10-15 minutes on average.  
   You will see a `Stack destroyed.` when the process is complete.  
  At this point, your initial configuration from `vizier init` is still intact, and you can run `vizier deploy` to redeploy the same project.

### Removing Vizier

To fully remove vizier, run:

- `vizier remove`  
  You will be prompted to confirm this action, as it deletes the `.vizier` folder within your project directory, as well as the corresponding configuration files. Type "y" to confirm, "N" to cancel out.
  This will also delete the `.github` vizier-specific workflows. It will NOT remove any other workflows from your `.github` folder.  
  In order to redeploy, you must start the process back over with `vizier init`.
