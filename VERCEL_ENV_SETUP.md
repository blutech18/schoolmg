# Vercel Environment Variables Setup

To connect your Vercel deployment with Railway database, you need to add these environment variables in your Vercel project settings.

## Steps to Add Environment Variables in Vercel:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Settings:**
   - Click on "Settings" tab
   - Click on "Environment Variables" in the sidebar

3. **Add Each Environment Variable:**

   Click "Add New" for each of the following:

   ### Required Variables:

   | Variable Name | Value | Description |
   |--------------|-------|-------------|
   | `DB_HOST` | `ballast.proxy.rlwy.net` | Railway database host |
   | `DB_PORT` | `35590` | Railway database port |
   | `DB_USER` | `root` | Railway database username |
   | `DB_PASSWORD` | `AvngfWibvxTercOiYBiicVYUauOhWdol` | Railway database password |
   | `DB_NAME` | `railway` | Railway database name |
   | `DATABASE_URL` | `mysql://root:AvngfWibvxTercOiYBiicVYUauOhWdol@ballast.proxy.rlwy.net:35590/railway` | Full database connection URL |

4. **Select Environments:**
   - For each variable, select:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click "Save"

5. **Important - Generate NEXTAUTH_SECRET:**

   Generate a secure secret key:

   **Windows PowerShell:**
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

   **Or use online generator:**
   - Visit: https://generate-secret.vercel.app/32

   Add this as `NEXTAUTH_SECRET` environment variable.

6. **Add NEXTAUTH_URL:**

   After deployment, Vercel will provide you with a URL like:
   `https://your-project.vercel.app`

   Add this as `NEXTAUTH_URL` environment variable.

7. **Redeploy:**
   - After adding all environment variables
   - Go to "Deployments" tab
   - Click the "..." menu on the latest deployment
   - Select "Redeploy"
   - Or push a new commit to trigger redeployment

## Verification:

After deployment, test the connection by:
1. Visiting your Vercel app URL
2. Try to log in (this tests database connection)
3. Check Vercel logs for any connection errors

## Troubleshooting:

If you see database connection errors:
- Verify all environment variables are added correctly
- Check variable names match exactly (case-sensitive)
- Ensure all environments (Production/Preview/Development) are selected
- Redeploy after adding variables
- Check Vercel function logs for detailed error messages

## Quick Copy-Paste Values:

```
DB_HOST=ballast.proxy.rlwy.net
DB_PORT=35590
DB_USER=root
DB_PASSWORD=AvngfWibvxTercOiYBiicVYUauOhWdol
DB_NAME=railway
DATABASE_URL=mysql://root:AvngfWibvxTercOiYBiicVYUauOhWdol@ballast.proxy.rlwy.net:35590/railway
NEXTAUTH_SECRET=<generate-your-own-secure-secret>
NEXTAUTH_URL=https://your-project.vercel.app
```

