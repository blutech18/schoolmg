//for postgres
// import { Pool } from 'pg';

// export const db = new Pool({
//   host: process.env.DB_HOST,        
//   port: Number(process.env.DB_PORT), 
//   user: process.env.DB_USER,         
//   password: process.env.DB_PASSWORD, 
//   database: process.env.DB_NAME,     
// });

//For mysql
import mysql from 'mysql2/promise';

// Parse DATABASE_URL if available, otherwise use individual env vars
function getDbConfig() {
  // Check if DATABASE_URL is provided (common in Railway/Vercel)
  if (process.env.DATABASE_URL) {
    try {
      // Parse mysql://user:password@host:port/database
      const url = new URL(process.env.DATABASE_URL);
      const config: any = {
        host: url.hostname,
        port: url.port ? Number(url.port) : 3306,
        user: url.username,
        database: url.pathname.slice(1), // Remove leading slash
      };
      
      // Only include password if it's actually set (not empty)
      if (url.password && url.password.trim() !== '') {
        config.password = url.password;
      }
      
      return config;
    } catch (error) {
      console.error('Error parsing DATABASE_URL:', error);
    }
  }

  // Fallback to individual environment variables
  const config: any = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'schoolmgtdb',
  };
  
  // Only include password if it's actually set (not empty, not undefined, not null)
  const password = process.env.DB_PASSWORD;
  if (password !== undefined && password !== null && String(password).trim() !== '') {
    config.password = password;
  }
  
  // Debug logging (remove in production if needed)
  console.log('DB Config:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    hasPassword: !!config.password,
  });
  
  return config;
}

const dbConfig = getDbConfig();

export const db = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // MySQL 9.4.0 compatibility
  authPlugins: {
    mysql_native_password: () => () => Buffer.alloc(0),
  },
  // Add SSL configuration for Railway
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined,
});

