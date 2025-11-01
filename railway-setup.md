# Railway & Vercel Setup Guide

## Railway Database Setup

### 1. Upload Database to Railway

You have several options to upload the database:

#### Option A: Using Node.js Script (Recommended) ⭐
This is the easiest and most reliable method:

```bash
npm run upload-db
```

Or directly:
```bash
node upload-database.js
```

#### Option B: Using MySQL Command Line (Windows)
```bash
mysql -h ballast.proxy.rlwy.net -u root -pAvngfWibvxTercOiYBiicVYUauOhWdol --port 35590 --protocol=TCP railway < schoolmgtdb.sql
```

Or use the provided batch file:
```bash
upload-database.bat
```

#### Option B: Using MySQL Command Line (Linux/Mac)
```bash
mysql -h ballast.proxy.rlwy.net \
      -u root \
      -p'AvngfWibvxTercOiYBiicVYUauOhWdol' \
      --port 35590 \
      --protocol=TCP \
      railway < schoolmgtdb.sql
```

Or use the provided shell script:
```bash
chmod +x upload-database.sh
./upload-database.sh
```

#### Option C: Using MySQL Workbench or phpMyAdmin
1. Connect to Railway MySQL using the connection string:
   - Host: ballast.proxy.rlwy.net
   - Port: 35590
   - Username: root
   - Password: AvngfWibvxTercOiYBiicVYUauOhWdol
   - Database: railway

2. Import the `schoolmgtdb.sql` file

### 2. Verify Database Connection

Test the connection:
```bash
mysql -h ballast.proxy.rlwy.net -u root -pAvngfWibvxTercOiYBiicVYUauOhWdol --port 35590 --protocol=TCP railway -e "SHOW TABLES;"
```

## Vercel Setup

### 1. Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

```
DB_HOST=ballast.proxy.rlwy.net
DB_PORT=35590
DB_USER=root
DB_PASSWORD=AvngfWibvxTercOiYBiicVYUauOhWdol
DB_NAME=railway
DATABASE_URL=mysql://root:AvngfWibvxTercOiYBiicVYUauOhWdol@ballast.proxy.rlwy.net:35590/railway
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-app.vercel.app
```

### 2. Steps to Configure Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add each environment variable:
   - `DB_HOST` = `ballast.proxy.rlwy.net`
   - `DB_PORT` = `35590`
   - `DB_USER` = `root`
   - `DB_PASSWORD` = `AvngfWibvxTercOiYBiicVYUauOhWdol`
   - `DB_NAME` = `railway`
   - `DATABASE_URL` = `mysql://root:AvngfWibvxTercOiYBiicVYUauOhWdol@ballast.proxy.rlwy.net:35590/railway`
   - `NEXTAUTH_SECRET` = (generate a secure random string)
   - `NEXTAUTH_URL` = (your Vercel deployment URL)

### 3. Generate NEXTAUTH_SECRET:

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

### 4. Important Notes:

- **Never commit your `.env` file** - It's already in `.gitignore`
- Make sure to add environment variables in Vercel for all environments (Production, Preview, Development)
- After adding environment variables, redeploy your application
- Railway might have connection limits, so use connection pooling (already configured in `app/lib/db.ts`)

### 5. Test the Connection:

After deployment, test if the database connection works by checking the API routes that use the database.

