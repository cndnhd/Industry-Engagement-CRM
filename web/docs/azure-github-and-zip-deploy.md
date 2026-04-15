# Azure App Service: GitHub Deploy vs Manual Zip

Both methods deploy the **same Next.js application** to **Azure App Service (Linux)**. After deployment, users get the **same URL**, **same UI**, **same API routes**, and **same Azure SQL connection**. The only difference is *how* you upload code and how you update it later (Git push vs uploading a zip).

---

## Prerequisites (both methods)

1. An **Azure subscription** and permission to create App Service + set SQL firewall rules.
2. **Azure SQL** already running with the `Industry Engagement` database and the same credentials you use locally (in `.env.local`).
3. Your CRM code lives in the **`web/`** folder of this repo (where `package.json` and `next.config.ts` are).

---

## One-time: Create the App Service (Portal)

If you do not already have a web app:

1. Azure Portal → **Create a resource** → **Web App**.
2. **Publish:** Code.
3. **Runtime stack:** Node **20 LTS** (or latest LTS shown).
4. **Operating System:** Linux.
5. **Region:** Prefer the same region as your SQL server.
6. **App Service plan:** e.g. **B1** (Basic) for a small team; scale up later if needed.
7. Create the resource. Note the default URL: `https://<your-app-name>.azurewebsites.net`.

---

## Environment variables (both methods)

In the Web App → **Configuration** → **Application settings**, add (names must match what `src/lib/db.ts` expects):

| Name | Example value |
|------|----------------|
| `AZURE_SQL_SERVER` | `industryrelations-coe.database.windows.net` |
| `AZURE_SQL_DATABASE` | `Industry Engagement` |
| `AZURE_SQL_USER` | Your SQL login |
| `AZURE_SQL_PASSWORD` | Your SQL password |

Click **Save**. Azure will restart the app.

**Do not commit passwords to Git.** Use App Service settings or Key Vault references for production.

---

## SQL firewall (both methods)

The hosted app must be allowed to connect to Azure SQL:

1. **Easiest:** SQL server → **Networking** → enable **Allow Azure services and resources to access this server** → **Save**.
2. **More restrictive:** Under **Firewall rules**, add the **outbound IP addresses** of your App Service (App Service → **Properties** or **Networking** → copy **Outbound IP addresses** / **Possible outbound IP addresses** and add rules on the SQL server).

---

## Startup command (both methods)

Linux App Service expects the app to listen on the port in the **`PORT`** environment variable (often **8080**).

In **Configuration** → **General settings** → **Startup Command**, set:

```bash
node node_modules/next/dist/bin/next start -p ${PORT:-8080}
```

If your plan uses a fixed port, Azure often sets `PORT=8080`; the line above works in both cases.

Alternatively:

```bash
npm run start -- -p ${PORT:-8080}
```

(Ensure `package.json` has `"start": "next start"`.)

---

## Method A: Deploy from GitHub (CI/CD)

**What you get:** Push to `main` (or your branch) automatically builds and deploys. Same app, easier updates.

### A1. Push the repo to GitHub

From your machine (adjust paths if needed):

```bash
cd "/path/to/Azure and Power"
git init   # if not already a repo
git add .
git commit -m "Industry Engagement CRM"
# Create an empty repo on github.com, then:
git remote add origin https://github.com/YOUR_ORG/YOUR_REPO.git
git push -u origin main
```

If only the **`web`** folder should be the app root, either:

- Put the repo root so that `web/` is a subfolder and set **App Service root** to `web` in Deployment Center (see below), or  
- Use a separate GitHub repo that contains only `web/` as the root.

### A2. Connect App Service to GitHub

1. Azure Portal → your **Web App** → **Deployment Center**.
2. **Source:** GitHub → authorize Azure → pick **Organization**, **Repository**, **Branch** (e.g. `main`).
3. **Build provider:** If offered, choose **GitHub Actions** (recommended) or **App Service build** depending on what the portal shows for Node on Linux.

### A3. GitHub Actions workflow (if you use Actions)

If Azure generates a workflow, it may need a small adjustment so builds run inside **`web/`** and use Node 20.

Example `.github/workflows/main_<your-app-name>.yml` pattern (verify paths against your repo):

```yaml
# Example — adjust app name, branch, and resource group to match Azure-generated file
name: Build and deploy Node.js to Azure Web App

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Install, build
        working-directory: web
        run: |
          npm ci
          npm run build

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: '<YOUR_APP_SERVICE_NAME>'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: web
```

**Publish profile:** In Azure → Web App → **Get publish profile** → download XML → add as GitHub repo secret `AZURE_WEBAPP_PUBLISH_PROFILE`.

**Note:** Some deployments zip the **`web`** folder contents only; the `package` path above must match what Azure expects (folder that contains `.next`, `package.json`, `node_modules` after install). If the generated workflow uses `npm ci && npm run build` at repo root, either move commands into `working-directory: web` or set the repo so `web` is the root.

After the first successful run, the **same capabilities** as local: full CRM, API, SQL.

---

## Method B: Manual zip deploy

**What you get:** Same running app; you upload a new zip when you want to update. No GitHub required.

### B1. Build on your computer

```bash
cd "/path/to/Azure and Power/web"
npm ci
npm run build
```

Confirm `npm run build` completes with no errors.

### B2. Prepare the zip

The zip must include everything needed to run **`next start`** on the server, including **`node_modules`** and **`.next`**.

From inside **`web/`**:

```bash
# macOS / Linux — zip the project (exclude dev-only junk if you want)
cd "/path/to/Azure and Power/web"
zip -r ../deploy.zip . -x "*.git*" -x ".next/cache/*"
```

Or zip manually: include at minimum:

- `.next/` (production build output)
- `node_modules/` (production dependencies)
- `package.json`, `package-lock.json`
- `next.config.ts` (or `.js`)
- `public/` if you use static assets
- `src/` is **not** required at runtime if `.next` is complete, but including the full `web` folder is simplest.

**Smaller alternative:** Zip only `node_modules`, `.next`, `package.json`, `package-lock.json`, `next.config.*`, `public` — then on App Service run `npm install --omit=dev` is not needed if `node_modules` was copied from `npm ci`.

### B3. Deploy the zip

**Option 1 — Azure CLI:**

```bash
az login
az webapp config appsettings set \
  --resource-group <YOUR_RG> \
  --name <YOUR_APP_NAME> \
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false

az webapp deploy \
  --resource-group <YOUR_RG> \
  --name <YOUR_APP_NAME> \
  --src-path "/path/to/deploy.zip" \
  --type zip
```

**Option 2 — Portal:**  
**Deployment Center** → **FTPS credentials** or **Advanced Tools (Kudu)** → **Zip Push Deploy** / drag-and-drop upload (varies by portal version; search for “zip deploy App Service” in the current Microsoft docs).

### B4. Restart

After upload, **Restart** the Web App in the Portal and browse `https://<your-app-name>.azurewebsites.net`.

---

## GitHub vs Zip: are capabilities the same?

| Topic | GitHub deploy | Manual zip |
|--------|----------------|------------|
| Next.js app | Same | Same |
| API routes (`/api/*`) | Same | Same |
| Azure SQL connection | Same (env vars on App Service) | Same |
| Edit / delete / settings | Same | Same |
| HTTPS URL | Same | Same |
| Updates | Push to Git → auto (or manual workflow run) | Rebuild zip + redeploy |

**Yes — both produce the same type of deployment** (Node process running `next start` on App Service). Choose GitHub for repeatable updates; choose zip for a one-off or air-gapped workflow.

---

## Troubleshooting

| Symptom | What to check |
|--------|----------------|
| 500 / SQL errors | Env vars on App Service; SQL firewall; server name and database name (spaces in DB name must match exactly). |
| App won’t start | Startup command; `PORT`; `node_modules` and `.next` included in zip. |
| Old UI after deploy | Hard refresh; restart App Service; confirm new zip/Git commit deployed. |

---

## Optional: custom domain

App Service → **Custom domains** → add your university domain and TLS certificate per Microsoft’s guide.
