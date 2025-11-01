// Test database connection script
// Run this to verify Railway database connection works
const mysql = require('mysql2/promise');

async function testConnection() {
  // Parse DATABASE_URL if available, otherwise use individual env vars
  function getDbConfig() {
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        return {
          host: url.hostname,
          port: url.port ? Number(url.port) : 3306,
          user: url.username,
          password: url.password,
          database: url.pathname.slice(1),
        };
      } catch (error) {
        console.error('Error parsing DATABASE_URL:', error);
      }
    }

    return {
      host: process.env.DB_HOST || 'ballast.proxy.rlwy.net',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 35590,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'AvngfWibvxTercOiYBiicVYUauOhWdol',
      database: process.env.DB_NAME || 'railway',
    };
  }

  const dbConfig = getDbConfig();
  
  console.log('Testing database connection...');
  console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`Database: ${dbConfig.database}`);
  console.log(`User: ${dbConfig.user}\n`);

  let connection;
  try {
    console.log('Attempting connection (this may take up to 60 seconds)...\n');
    
    connection = await mysql.createConnection({
      ...dbConfig,
      connectTimeout: 60000, // 60 seconds
      ssl: false,
    });

    console.log('✅ Connection successful!\n');

    // Test query
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Database contains ${tables.length} tables:`);
    
    if (tables.length > 0) {
      tables.slice(0, 10).forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
      if (tables.length > 10) {
        console.log(`   ... and ${tables.length - 10} more`);
      }
    }

    // Test a simple query
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n✅ Test query successful! Users table contains ${users[0].count} records.`);

    console.log('\n🎉 Database connection is working correctly!');

  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();

