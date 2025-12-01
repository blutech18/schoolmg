const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database Configuration (same as upload-database.js)
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
        multipleStatements: true,
        connectTimeout: 60000,
        ssl: false,
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
    multipleStatements: true,
    connectTimeout: 60000,
    ssl: false,
  };
}

async function runMigration() {
  let connection;
  
  try {
    const dbConfig = getDbConfig();
    console.log('Connecting to database...');
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`Database: ${dbConfig.database}\n`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!\n');

    // Read the migration SQL file
    const migrationFile = path.join(__dirname, 'migration', 'add_unique_sequences.sql');
    console.log(`Reading migration file: ${migrationFile}`);
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }

    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log('Migration file loaded.\n');

    // Extract function definitions separately (they use DELIMITER)
    const functionBlocks = [];
    const remainingSQL = sql.replace(/DELIMITER \$\$\s*DROP FUNCTION IF EXISTS (\w+);\s*DELIMITER \$\$\s*(CREATE FUNCTION[\s\S]*?)\$\$\s*DELIMITER ;/gi, (match, funcName, funcBody) => {
      functionBlocks.push({
        name: funcName,
        sql: `DROP FUNCTION IF EXISTS ${funcName}; ${funcBody}`.replace(/\$\$/g, '')
      });
      return ''; // Remove from remaining SQL
    });

    // Extract function blocks more carefully
    const funcRegex = /DROP FUNCTION IF EXISTS (\w+);\s*DELIMITER \$\$\s*(CREATE FUNCTION[\s\S]*?)\$\$\s*DELIMITER ;/gi;
    let match;
    const extractedFunctions = [];
    let processedSQL = sql;
    
    while ((match = funcRegex.exec(sql)) !== null) {
      const funcName = match[1];
      let funcBody = match[2];
      // Remove DELIMITER markers from function body
      funcBody = funcBody.replace(/\$\$/g, '');
      extractedFunctions.push({
        name: funcName,
        sql: `DROP FUNCTION IF EXISTS ${funcName}; ${funcBody}`
      });
      // Remove the function block from processed SQL
      processedSQL = processedSQL.replace(match[0], '');
    }

    // Now process remaining SQL statements
    const statements = processedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.includes('DELIMITER'));

    console.log(`Found ${extractedFunctions.length} function(s) and ${statements.length} SQL statement(s) to execute.\n`);
    console.log('Executing migration...\n');

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // First, execute functions
    for (const func of extractedFunctions) {
      try {
        await connection.query(func.sql);
        successCount++;
        console.log(`✅ Function ${func.name} created successfully`);
      } catch (error) {
        if (error.code === 'ER_DUP_TABLE' || 
            error.code === 'ER_DUP_KEYNAME' ||
            error.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
            error.message.includes('already exists')) {
          skippedCount++;
          console.log(`⏭️  Function ${func.name} skipped (already exists)`);
        } else {
          errorCount++;
          console.error(`❌ Error creating function ${func.name}:`, error.message);
          console.error(`   Code: ${error.code}`);
        }
      }
    }

    // Then execute regular statements
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        await connection.query(statement);
        successCount++;
        console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (error) {
        if (error.code === 'ER_DUP_TABLE' || 
            error.code === 'ER_DUP_KEYNAME' ||
            error.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
            error.code === 'ER_DUP_ENTRY' ||
            error.message.includes('already exists')) {
          skippedCount++;
          console.log(`⏭️  Statement ${i + 1}/${statements.length} skipped (already exists): ${error.code}`);
        } else {
          errorCount++;
          console.error(`❌ Error in statement ${i + 1}/${statements.length}:`, error.message.substring(0, 100));
          console.error(`   Code: ${error.code}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ⏭️  Skipped (already exists): ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\nUnique constraints are now enabled:');
      console.log('  - users.PrefixedID');
      console.log('  - students.PrefixedStudentID');
      console.log('  - students.StudentNumber');
    } else {
      console.log(`\n⚠️  Migration completed with ${errorCount} error(s).`);
      console.log('Please review the errors above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

runMigration();
