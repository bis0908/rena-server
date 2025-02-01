import pool from "../config/dbConfig.js";
import logger from "../config/logger.js";

export async function serverLogin(password) {
  try {
    const query = "SELECT * FROM l_r WHERE `password` = SHA2(?, 256);";
    const result = await pool.query(query, [password]);

    if (result[0].length > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

export async function changePassword(currentPw, newPw) {
  try {
    let query = "SELECT * FROM l_r WHERE `password` = SHA2(?, 256);";
    let result = await pool.query(query, [currentPw]);

    if (result[0].length > 0) {
      query =
        "UPDATE l_r SET `password` = SHA2(?, 256) WHERE `password` = SHA2(?, 256);";
      await pool.query(query, [newPw, currentPw]);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logger.error(error.stack);
    return false;
  }
}
