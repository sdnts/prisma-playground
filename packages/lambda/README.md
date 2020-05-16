# Lambda

The Playground's "backend" is a single lambda that manages CRUD operations on workspaces

The root handler for the lambda is the `index.ts` file

### API Methods

API Gateway is used to proxy 5 methods to invoke this lambda:

- OPTIONS /workspace

  - For CORS preflight requests. Configured on API Gateway.

- POST /workspace

  - Creates a workspace. This includes:
    - Setting up a Prisma project in a temporary directory. This includes a default schema & `@prisma/client` & `@prisma/cli` NPM packages.
    - Creating a database on the RDS instance
    - Migrating up the provisioned database above to the default schema
    - Generating Prisma Client for the provisioned database above
    - Uploading this temporary directory to S3 for persistence. This allows us to reuse the generated Prisma Client for running code for all future requests. This is also needed to persist migration steps so Prisma Migrate can pick up where it left off in case the schema changes in a future request
    - Creating a record in the `Workspace` table of our own database

- GET /workspace/{id}

  - Fetches a workspace from our own database. Does not run code or migrate schemas or anything

- PUT /workspace/{id}

  - Makes a change to an existing workspace. This includes:
    - Downloading the workspace file system from S3
    - If a schema change is requested, the provisioned database is migrated to the new schema, Prisma Client is regenerated, and these changed are uploaded back to S3.
    - Running saved code. If a code change is requested, then the changed code is run
    - Updating the corresponding record in the `Workspace` table of our own database

- DELETE /workspace/{id}
  - Deletes a workspace. This includes:
    - Deleting the workspace's file system from S3
    - Deleting the provisioned database
    - Deleting the corresponding record in the `Workspace` table of our own database

### Development

The `test` NPM script can be run to run a Jest test that can be used to see if the lambda behaves correctly.
NOTE: These are not real tests, it was just simplest to set Jest up for local development

### Deployment

Any changes to this lambda are automatically deployed when you push to master via a Github Action
