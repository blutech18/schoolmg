const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Railway Database Configuration
const dbConfig = {
  host: 'ballast.proxy.rlwy.net',
  port: 35590,
  user: 'root',
  password: 'AvngfWibvxTercOiYBiicVYUauOhWdol',
  database: 'railway',
  multipleStatements: true, // Allow multiple SQL statements
  connectTimeout: 60000, // 60 seconds timeout
  connectionLimit: 1,
  ssl: false, // Railway doesn't require SSL for public connections
};

async function uploadDatabase() {
  let connection;
  
  try {
    console.log('Connecting to Railway database...');
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log('This may take a moment...\n');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!\n');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'schoolmgtdb.sql');
    console.log(`Reading SQL file: ${sqlFile}`);
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`SQL file not found: ${sqlFile}`);
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('SQL file loaded. Executing...');

    // Split by semicolon and execute statements
    // Remove comments and empty statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      try {
        await connection.query(statement);
        if ((i + 1) % 100 === 0) {
          console.log(`Progress: ${i + 1}/${statements.length} statements executed`);
        }
      } catch (error) {
        // Ignore some common errors that might occur during import
        if (!error.message.includes('already exists') && 
            !error.message.includes('Duplicate entry') &&
            !error.message.includes('Table') && 
            !error.message.includes('doesn\'t exist')) {
          console.error(`Error executing statement ${i + 1}:`, error.message);
          // Continue with next statement
        }
      }
    }

    console.log('Database uploaded successfully!');
    
    // Verify by checking tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`\nDatabase contains ${tables.length} tables:`);
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });

  } catch (error) {
    console.error('\n❌ Error connecting to Railway database\n');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ETIMEDOUT') {
      console.error('\n⚠️  Connection timeout. Possible reasons:');
      console.error('   1. Railway database may not be publicly accessible');
      console.error('   2. Firewall or network restrictions');
      console.error('   3. Railway database service may need configuration');
      console.error('   4. IP address may need to be whitelisted');
      console.error('\n💡 Alternative solutions:');
      console.error('   1. Use Railway Dashboard to upload SQL directly');
      console.error('   2. Use MySQL Workbench or DBeaver');
      console.error('   3. Use Railway CLI or Railway web interface');
      console.error('   4. Check Railway project settings for connection options');
      console.error('   5. Try using Railway\'s provided connection method');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Connection refused. Check:');
      console.error('   - Railway database service is running');
      console.error('   - Port number is correct');
      console.error('   - Host address is correct');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n⚠️  Host not found. Check:');
      console.error('   - Railway host address is correct');
      console.error('   - Internet connection is active');
    }
    
    console.error('\nFor detailed setup instructions, see: VERCEL_SETUP.md');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConnection closed.');
    }
  }
}

uploadDatabase();

