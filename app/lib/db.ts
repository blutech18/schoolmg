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
      return {
        host: url.hostname,
        port: url.port ? Number(url.port) : 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
      };
    } catch (error) {
      console.error('Error parsing DATABASE_URL:', error);
    }
  }

  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'schoolmgtdb',
  };
}

const dbConfig = getDbConfig();

export const db = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

