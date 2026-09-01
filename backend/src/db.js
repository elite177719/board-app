const mysql = require('mysql2/promise');
const logger = require('./logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4_unicode_ci',
});

const originalQuery = pool.query.bind(pool);
pool.query = async (sql, params) => {
  const start = Date.now();
  try {
    const result = await originalQuery(sql, params);
    logger.info(`SQL_QUERY sql="${sql}" params=${JSON.stringify(params || [])} duration=${Date.now() - start}ms status=SUCCESS`);
    return result;
  } catch (err) {
    logger.error(`SQL_QUERY sql="${sql}" params=${JSON.stringify(params || [])} duration=${Date.now() - start}ms status=FAILED error="${err.message}"`);
    throw err;
  }
};

const originalExecute = pool.execute.bind(pool);
pool.execute = async (sql, params) => {
  const start = Date.now();
  try {
    const result = await originalExecute(sql, params);
    logger.info(`SQL_QUERY sql="${sql}" params=${JSON.stringify(params || [])} duration=${Date.now() - start}ms status=SUCCESS`);
    return result;
  } catch (err) {
    logger.error(`SQL_QUERY sql="${sql}" params=${JSON.stringify(params || [])} duration=${Date.now() - start}ms status=FAILED error="${err.message}"`);
    throw err;
  }
};

module.exports = pool;
