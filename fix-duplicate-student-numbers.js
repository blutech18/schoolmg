const mysql = require('mysql2/promise');

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

async function fixDuplicateStudentNumbers() {
  let connection;
  
  try {
    const dbConfig = getDbConfig();
    console.log('Connecting to database...');
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`Database: ${dbConfig.database}\n`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!\n');

    // Find duplicate StudentNumbers
    console.log('Scanning for duplicate StudentNumbers...\n');
    const [duplicates] = await connection.query(`
      SELECT StudentNumber, COUNT(*) as count, GROUP_CONCAT(StudentID ORDER BY StudentID) as student_ids
      FROM students
      WHERE StudentNumber IS NOT NULL AND StudentNumber != ''
      GROUP BY StudentNumber
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate StudentNumbers found!\n');
    } else {
      console.log(`Found ${duplicates.length} duplicate StudentNumber(s):\n`);
      
      for (const dup of duplicates) {
        console.log(`  - ${dup.StudentNumber}: appears ${dup.count} times`);
        const studentIds = dup.student_ids.split(',').map(id => parseInt(id));
        console.log(`    StudentIDs: ${studentIds.join(', ')}`);
      }

      console.log('\nFixing duplicates...\n');

      // Fix each duplicate (keep the first one, regenerate the rest)
      for (const dup of duplicates) {
        const studentIds = dup.student_ids.split(',').map(id => parseInt(id)).sort((a, b) => a - b);
        const keepId = studentIds[0]; // Keep the first (lowest ID)
        const fixIds = studentIds.slice(1); // Fix the rest

        console.log(`Processing ${dup.StudentNumber}:`);
        console.log(`  Keeping StudentID ${keepId} with StudentNumber ${dup.StudentNumber}`);
        
        for (const studentId of fixIds) {
          try {
            // Get the year from the duplicate student number
            const yearMatch = dup.StudentNumber.match(/^(\d{4})-/);
            const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

            // Generate a new unique StudentNumber using the function
            const [result] = await connection.query(
              'SELECT GetNextStudentNumber(?) AS new_number',
              [year]
            );
            const newNumber = result[0].new_number;

            // Update the student record
            await connection.query(
              'UPDATE students SET StudentNumber = ? WHERE StudentID = ?',
              [newNumber, studentId]
            );

            console.log(`  ✅ Updated StudentID ${studentId} to StudentNumber ${newNumber}`);
          } catch (error) {
            console.error(`  ❌ Error updating StudentID ${studentId}:`, error.message);
          }
        }
      }
    }

    // Now try to add the UNIQUE constraint
    console.log('\n' + '='.repeat(60));
    console.log('Adding UNIQUE constraint on students.StudentNumber...\n');

    try {
      await connection.query('ALTER TABLE students ADD UNIQUE KEY uq_students_studentnumber (StudentNumber)');
      console.log('✅ Successfully added UNIQUE constraint on students.StudentNumber!\n');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⏭️  Constraint already exists.\n');
      } else if (error.code === 'ER_DUP_ENTRY') {
        console.error('❌ Still have duplicate StudentNumbers. Please run this script again.');
        console.error(`   Error: ${error.message}\n`);
      } else {
        console.error(`❌ Error adding constraint: ${error.message}`);
        console.error(`   Code: ${error.code}\n`);
      }
    }

    // Verify the constraint exists
    console.log('Verifying constraints...\n');
    const [indexes] = await connection.query(
      "SHOW INDEXES FROM students WHERE Key_name = 'uq_students_studentnumber'"
    );

    if (indexes.length > 0) {
      console.log('✅ UNIQUE constraint verified on students.StudentNumber');
    } else {
      console.log('⚠️  UNIQUE constraint not found on students.StudentNumber');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Duplicate cleanup completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Script failed!');
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

fixDuplicateStudentNumbers();





