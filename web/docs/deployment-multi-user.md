# Deploying the Industry Engagement CRM for Multiple Users

---

## Option 1: Azure App Service (Recommended for your stack)

This is the natural fit since you're already on Azure SQL.

### Step-by-step

**1. Prerequisites**
- Azure subscription (same one as your SQL database)
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed, or use the Azure Portal

**2. Create the App Service**

```bash
# Login to Azure
az login

# Create a resource group (skip if you already have one)
az group create --name IndustryEngagement-RG --location centralus

# Create an App Service plan (B1 = cheapest always-on tier, ~$13/mo)
az appservice plan create \
  --name IE-CRM-Plan \
  --resource-group IndustryEngagement-RG \
  --sku B1 \
  --is-linux

# Create the web app
az webapp create \
  --name industry-engagement-crm \
  --resource-group IndustryEngagement-RG \
  --plan IE-CRM-Plan \
  --runtime "NODE:20-lts"
```

**3. Set environment variables**

```bash
az webapp config appsettings set \
  --name industry-engagement-crm \
  --resource-group IndustryEngagement-RG \
  --settings \
    AZURE_SQL_SERVER="industryrelations-coe.database.windows.net" \
    AZURE_SQL_DATABASE="Industry Engagement" \
    AZURE_SQL_USER="CloudSAf0e78173" \
    AZURE_SQL_PASSWORD="Mizzou23!"
```

> **Security note:** For production, use Azure Key Vault references instead of plaintext passwords. See [App Service Key Vault integration](https://learn.microsoft.com/en-us/azure/app-service/app-service-key-vault-references).

**4. Add the App Service's outbound IP to your SQL firewall**

```bash
# Get the app's outbound IPs
az webapp show --name industry-engagement-crm \
  --resource-group IndustryEngagement-RG \
  --query outboundIpAddresses --output tsv

# For each IP, add a firewall rule (or use the Portal → SQL Server → Networking)
az sql server firewall-rule create \
  --server industryrelations-coe \
  --resource-group <your-sql-resource-group> \
  --name AppService-IP-1 \
  --start-ip-address <IP> \
  --end-ip-address <IP>
```

**Or in the Portal:** Go to your SQL Server → Networking → Add the App Service IPs, or toggle "Allow Azure services and resources to access this server" to Yes.

**5. Deploy the app**

From the `web/` directory:

```bash
# Build the production app
npm run build

# Option A: Deploy via ZIP
zip -r deploy.zip .next package.json node_modules public next.config.ts
az webapp deploy --name industry-engagement-crm \
  --resource-group IndustryEngagement-RG \
  --src-path deploy.zip --type zip

# Option B: Deploy via GitHub Actions (recommended for ongoing updates)
# See "CI/CD with GitHub" section below.
```

**6. Set the startup command**

```bash
az webapp config set \
  --name industry-engagement-crm \
  --resource-group IndustryEngagement-RG \
  --startup-file "node_modules/.bin/next start -p 8080"
```

**7. Access the app**

Your CRM is now live at: `https://industry-engagement-crm.azurewebsites.net`

Share this URL with all users. No installation needed — they just open it in a browser.

---

## Option 2: Vercel (Fastest to deploy)

Vercel is the company behind Next.js. Deployment is near-instant.

### Step-by-step

**1. Push code to GitHub**

```bash
cd web
git init
git add .
git commit -m "Industry Engagement CRM"
git remote add origin https://github.com/YOUR_USERNAME/industry-engagement-crm.git
git push -u origin main
```

**2. Connect to Vercel**

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **Import Project** → Select your repo
3. Set the root directory to `web` (if the repo includes the parent folder)
4. Add environment variables:

| Key | Value |
|-----|-------|
| `AZURE_SQL_SERVER` | `industryrelations-coe.database.windows.net` |
| `AZURE_SQL_DATABASE` | `Industry Engagement` |
| `AZURE_SQL_USER` | `CloudSAf0e78173` |
| `AZURE_SQL_PASSWORD` | `Mizzou23!` |

5. Click **Deploy**

**3. Add Vercel's IPs to your SQL firewall**

Vercel uses dynamic IPs. You have two options:
- Toggle "Allow Azure services" on your SQL server (broadest)
- Use Vercel's [static IP add-on](https://vercel.com/docs/security/deployment-protection) (enterprise feature)
- Use a VPN/private endpoint between Vercel and Azure (advanced)

**4. Share the URL**

Vercel gives you a URL like `industry-engagement-crm.vercel.app`. Share it directly. You can also add a custom domain.

---

## Option 3: Run locally on a shared network

For a small team on the same university network:

```bash
cd web
npm run build
npm start -- -H 0.0.0.0 -p 3000
```

Other users access it at `http://YOUR-IP:3000`. Find your IP with `ipconfig getifaddr en0` (Mac).

> This only works while your machine is running. Not recommended for production.

---

## Adding the SQL Firewall Rule (required for all options)

The error you'll see until this is done:

> "Client with IP address 'X.X.X.X' is not allowed to access the server"

**To fix in Azure Portal:**

1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to **SQL servers** → `industryrelations-coe`
3. Click **Networking** in the left sidebar
4. Under **Firewall rules**, click **+ Add your client IPv4 address**
5. For deployment servers, also add those IPs or toggle **"Allow Azure services and resources to access this server"** to **Yes**
6. Click **Save**

**To fix via CLI:**

```bash
# Add your current IP
az sql server firewall-rule create \
  --server industryrelations-coe \
  --resource-group <your-sql-resource-group> \
  --name MyIP \
  --start-ip-address 174.34.15.25 \
  --end-ip-address 174.34.15.25

# Allow all Azure services (convenient for App Service)
az sql server firewall-rule create \
  --server industryrelations-coe \
  --resource-group <your-sql-resource-group> \
  --name AllowAzure \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

---

## CI/CD with GitHub Actions (optional)

Create `.github/workflows/deploy.yml` in your repo:

```yaml
name: Deploy to Azure
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: web
      - run: npm run build
        working-directory: web
      - uses: azure/webapps-deploy@v3
        with:
          app-name: industry-engagement-crm
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
          package: web
```

Add your Azure publish profile as a GitHub secret (download from Azure Portal → App Service → Deployment Center).

---

## Adding Authentication (future)

The app is structured for easy auth addition:

1. **Microsoft Entra ID (Azure AD)**: Use `next-auth` with the Azure AD provider. University users log in with their @missouri.edu accounts.
2. **NextAuth.js setup**:
   ```bash
   npm install next-auth
   ```
   Configure the Azure AD provider with your tenant ID. Wrap the app in a `SessionProvider`.
3. **Middleware**: Add `middleware.ts` at the project root to protect all routes.

---

## User Access Summary

| Deployment | URL users visit | Requires install? | Cost |
|------------|----------------|-------------------|------|
| Azure App Service | `https://your-app.azurewebsites.net` | No | ~$13/mo |
| Vercel | `https://your-app.vercel.app` | No | Free tier available |
| Local | `http://your-ip:3000` | No (same network) | $0 |

**For all options:** Users just need a web browser. No software installation required.
