# Vercel Deployment Configuration

## Quick Setup Checklist

### ✅ 1. Railway Database Configuration
The database configuration has been updated in:
- `app/lib/db.ts` - Now supports port configuration
- `.env` - Railway connection details (local development)

### ⚠️ 2. Upload Database to Railway

**Important:** You need to upload the database when you have access to the Railway database.

The connection might be timing out due to:
- Network/firewall restrictions
- Railway database not yet ready
- Need to whitelist your IP in Railway

**Try these methods:**

1. **Node.js Script (Recommended):**
   ```bash
   npm run upload-db
   ```

2. **Using MySQL Workbench or DBeaver:**
   - Host: `ballast.proxy.rlwy.net`
   - Port: `35590`
   - Username: `root`
   - Password: `AvngfWibvxTercOiYBiicVYUauOhWdol`
   - Database: `railway`
   - Then import `schoolmgtdb.sql`

3. **From Railway Dashboard:**
   - Go to your Railway project
   - Open the MySQL service
   - Use the built-in query editor or connect via Railway's proxy

### ✅ 3. Vercel Environment Variables

Go to your Vercel project settings and add these environment variables:

#### Production Environment Variables:
```
DB_HOST=ballast.proxy.rlwy.net
DB_PORT=35590
DB_USER=root
DB_PASSWORD=AvngfWibvxTercOiYBiicVYUauOhWdol
DB_NAME=railway
DATABASE_URL=mysql://root:AvngfWibvxTercOiYBiicVYUauOhWdol@ballast.proxy.rlwy.net:35590/railway
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
```

#### Steps:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New** for each variable above
5. Select all environments (Production, Preview, Development)
6. Save and redeploy

### ✅ 4. Generate NEXTAUTH_SECRET

Generate a secure secret:

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Or use online generator:**
- Visit: https://generate-secret.vercel.app/32
- Or: https://www.random.org/strings/

### ✅ 5. Update NEXTAUTH_URL

After deployment, update `NEXTAUTH_URL` with your actual Vercel URL:
- Example: `https://schoolmgt-system.vercel.app`

### ✅ 6. Deploy to Vercel

If not already connected:

1. **Via GitHub (Recommended):**
   ```bash
   # Push to GitHub first
   git push origin main
   
   # Then in Vercel:
   # - Import your GitHub repository
   # - Add environment variables
   # - Deploy
   ```

2. **Via Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

### ⚠️ 7. Railway Connection Issues

If you're getting connection timeouts:

1. **Check Railway Status:**
   - Make sure the MySQL service is running in Railway
   - Check if the service is publicly accessible

2. **Try from Railway Dashboard:**
   - Railway provides a web-based query interface
   - Use that to upload the SQL file

3. **Use Railway Proxy:**
   - Railway might provide a better connection method
   - Check your Railway project dashboard for connection options

4. **Network Configuration:**
   - Railway databases are accessible from the internet
   - Make sure your firewall allows outbound connections on port 35590
   - Some corporate networks block these connections

### ✅ 8. Test Connection

After deployment, test the database connection:

1. Visit your Vercel app
2. Try to log in (this will test the database connection)
3. Check Vercel logs for any connection errors

### 📝 Notes

- `.env` file is in `.gitignore` - won't be committed to GitHub
- Always add environment variables in Vercel dashboard
- Railway connection strings might change - update if needed
- Consider using Railway's private networking if available for better security

