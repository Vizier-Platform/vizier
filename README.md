# vizier

## Create .github/workflows/deploy.yml at top level of user repo with this code

name: Deploy static site

on:
push:
branches: - main

jobs:
deploy:
runs-on: ubuntu-latest
env:
AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
AWS_REGION: ${{ secrets.AWS_REGION }}
DEPLOY_BUCKET: ${{ secrets.DEPLOY_BUCKET }}
DEPLOY_DIR: ${{ secrets.DEPLOY_DIR }}
steps: - name: Checkout repository
uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install repo dependencies
        run: npm ci

      - name: Checkout Vizier CLI
        uses: actions/checkout@v4
        with:
          repository: Vizier-Platform/vizier
          token: ${{ secrets.VIZIER_REPO_TOKEN }} #can delete this line if the repo is public
          path: vizier-cli
          ref: githubconnect-caleb #can delete this line (or change to ref: main) after pushing to main

      - name: Install Vizier dependencies
        run: npm ci
        working-directory: vizier-cli

      - name: Build Vizier CLI
        run: npm run build
        working-directory: vizier-cli

      - name: Deploy with vizier
        run: |
          if [ -z "$DEPLOY_BUCKET" ]; then
            echo "DEPLOY_BUCKET secret must be set." >&2
            exit 1
          fi
          DEPLOY_PATH="${DEPLOY_DIR:-.}"
          node vizier-cli/dist/index.js sync --bucket "$DEPLOY_BUCKET" --directory "$DEPLOY_PATH"

---
