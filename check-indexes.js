const mysql = require('mysql2/promise');

async function checkIndexes() {
  const conn = await mysql.createConnection({
    host: 'ballast.proxy.rlwy.net',
    port: 35590,
    user: 'root',
    password: 'AvngfWibvxTercOiYBiicVYUauOhWdol',
    database: 'railway'
  });

  try {
    const [uIndexes] = await conn.query("SHOW INDEXES FROM users WHERE Key_name LIKE 'uq_%'");
    console.log('Users table unique indexes:');
    if (uIndexes.length === 0) {
      console.log('  (none found)');
    } else {
      uIndexes.forEach(idx => console.log(`  ✅ ${idx.Key_name} on ${idx.Column_name}`));
    }

    const [sIndexes] = await conn.query("SHOW INDEXES FROM students WHERE Key_name LIKE 'uq_%'");
    console.log('\nStudents table unique indexes:');
    if (sIndexes.length === 0) {
      console.log('  (none found)');
    } else {
      sIndexes.forEach(idx => console.log(`  ✅ ${idx.Key_name} on ${idx.Column_name}`));
    }

    await conn.end();
  } catch(e) {
    console.error(e.message);
    await conn.end();
  }
}

checkIndexes();





