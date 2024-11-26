import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: 'config.env' });


const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_UID,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  idleTimeout: 60000,
  queueLimit: 0,
});

export default pool;
