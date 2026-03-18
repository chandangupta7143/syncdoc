const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/syncdoc';

// Enable SSL for production (Neon, Supabase, Render managed Postgres)
const isProduction = connectionString.includes('neon.tech') ||
                     connectionString.includes('supabase') ||
                     connectionString.includes('render.com') ||
                     (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

// Test connection
pool.query('SELECT NOW()')
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch((err) => console.error('❌ PostgreSQL connection failed:', err.message));

module.exports = pool;
