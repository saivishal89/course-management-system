const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  console.log('--- Initializing Course Management System MySQL Database ---');
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'root';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const database = process.env.DB_NAME || 'course_management';

  try {
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true
    });

    console.log(`Connected to MySQL server at ${host}:${port}.`);

    // Read and run schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Executing schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('✓ Schema and relational tables created successfully.');
    }

    // Read and run seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('Executing seed.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('✓ Seed data inserted successfully.');
    }

    await connection.end();
    console.log(`✓ Database '${database}' is fully initialized and ready!`);
  } catch (err) {
    console.error(`Error initializing MySQL database:`, err.message);
    console.log('Please check your DB_PASSWORD or MySQL service settings in .env.');
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = run;
