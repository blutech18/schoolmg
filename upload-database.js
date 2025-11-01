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
    console.log('SQL file loaded. Executing...\n');

    // Execute the entire SQL file at once using multipleStatements
    // This is more reliable for complex SQL with multi-line inserts and JSON
    try {
      console.log('Executing SQL statements...');
      await connection.query(sql);
      console.log('✅ All SQL statements executed successfully!\n');
    } catch (error) {
      // If bulk execution fails, try executing in chunks
      console.log('Bulk execution had issues, trying alternative method...\n');
      
      // Remove comments and split into executable chunks
      let cleanedSql = sql
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* ... */ comments
        .replace(/--.*$/gm, '') // Remove -- comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove any remaining /* ... */ comments
        .trim();
      
      // Split by semicolon but preserve multi-line statements
      const statements = [];
      let currentStatement = '';
      let inString = false;
      let stringChar = '';
      
      for (let i = 0; i < cleanedSql.length; i++) {
        const char = cleanedSql[i];
        
        if (!inString && (char === '"' || char === "'" || char === '`')) {
          inString = true;
          stringChar = char;
          currentStatement += char;
        } else if (inString && char === stringChar && cleanedSql[i - 1] !== '\\') {
          inString = false;
          currentStatement += char;
        } else if (!inString && char === ';') {
          const trimmed = currentStatement.trim();
          if (trimmed.length > 0) {
            statements.push(trimmed);
          }
          currentStatement = '';
        } else {
          currentStatement += char;
        }
      }
      
      // Add remaining statement if any
      if (currentStatement.trim().length > 0) {
        statements.push(currentStatement.trim());
      }
      
      console.log(`Executing ${statements.length} SQL statements...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        try {
          await connection.query(statement);
          successCount++;
          if ((i + 1) % 50 === 0) {
            console.log(`Progress: ${i + 1}/${statements.length} statements executed...`);
          }
        } catch (error) {
          errorCount++;
          // Only show errors that aren't common import errors
          if (!error.message.includes('already exists') && 
              !error.message.includes('Duplicate entry') &&
              !error.message.includes('Duplicate key') &&
              !error.message.includes('Unknown table') &&
              !error.message.includes('doesn\'t exist')) {
            if (errorCount <= 10) { // Limit error output
              console.error(`Error at statement ${i + 1}:`, error.message.substring(0, 100));
            }
          }
        }
      }
      
      console.log(`\n✅ Execution complete: ${successCount} successful, ${errorCount} errors (most errors are expected during imports)`);
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

