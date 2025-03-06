import assert from "assert";
import dotenv from "dotenv";
import { getDate } from "./mail-service.js";
import logger from "../config/logger.js";
import pool from "../config/dbConfig.js";

dotenv.config();

/**
 * @description Check the DB for sending history.
 * @param {Array} idList
 * @param {string} agent_no
 * @returns id from DB
 */
export async function realTimeIdCheck(idList, agent_no) {
  assert(Array.isArray(idList), "idList is not an array");

  const rows = await getSuperIds();
  const filteredArr = rows.map((ids) => ids.super_id);

  if (filteredArr.includes(idList[0])) {
    return [];
  }

  const placeholders = idList.map(() => "?").join(",");
  const query = `
    SELECT id
    FROM mail_sendlist
    WHERE agent_no = ?
    AND id IN (${placeholders})`;

  const values = [agent_no, ...idList];

  try {
    const [rows, fields] = await pool.query(query, values);
    if (rows.length > 0) {
      return rows;
    } else {
      return [];
    }
  } catch (error) {
    logger.error("realTimeIdCheck(): " + error);
    return false;
  }
}

/**
 * @description Get the allowed sending time range.
 * @returns {Object} startTime, endTime
 */
export async function getAllowedSendingTimeRange() {
  const [rows, fields] = await pool.query(
    "SELECT start_time, end_time FROM mail_delivery_timezone LIMIT 1"
  );
  if (rows.length > 0) {
    return { startTime: rows[0].start_time, endTime: rows[0].end_time };
  }
  return false;
}

/**
 * @description Add a sent list to the database.
 * @param {string} id
 * @param {string} senderId
 * @param {string} senderEmail
 * @returns {boolean}
 */
export async function addSentList(id, senderId, senderEmail) {
  const query = `INSERT IGNORE INTO mail_sendlist (id, regdate, agent_no, sender_id) values (?,?,?,?);`;
  try {
    const result = await pool.query(query, [
      id,
      getDate(),
      senderId,
      senderEmail,
    ]);

    if (result[0].affectedRows >= 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logger.error("addSentList(): Error querying database:" + error.stack);
    return false;
  }
}

/**
 * @description Update the server name.
 * @param {string} newServerName
 * @param {number} rowNo
 * @returns {boolean}
 */
export async function updateServerName(newServerName, rowNo) {
  const query = `UPDATE mail_server_status
                  SET \`server_name\` = ?
                  WHERE \`no\` = ?;`;
  try {
    const result = await pool.query(query, [newServerName, rowNo]);
    if (result[0].affectedRows > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logger.error(error.stack);
    return false;
  }
}

/**
 * @description Delete the server name.
 * @param {number} rowNo
 * @returns {boolean}
 */
export async function deleteServerName(rowNo) {
  const query = `DELETE FROM mail_server_status
  WHERE \`no\` = ?`;

  try {
    const result = await pool.query(query, [rowNo]);
    if (result[0].affectedRows > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logger.error(error.stack);
    return false;
  }
}

/**
 * @description Get the super IDs.
 * @returns {Array} superIds
 */
export async function getSuperIds() {
  const query = "select super_id from super_id_list";
  try {
    const [rows, fields] = await pool.query(query);
    // return array of object
    return rows;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

/**
 * @description Get the mail unsubscribe.
 * @param {string} email
 * @returns {Array}
 */
export async function getMailUnsubscribe(email) {
  const query = `select email from mail_unsubscribe where email = ? limit 1`;
  try {
    const superID = await getSuperIds();
    const filteredArr = superID.map((ids) => ids.super_id);

    if (filteredArr.includes(email.split("@")[0])) {
      return [];
    }

    const [rows, fields] = await pool.query(query, [email]);
    return rows;
  } catch (error) {
    logger.error(error.stack);
    return false;
  }
}

/**
 * @description Add a black list to the database.
 * @param {string} id
 * @returns {boolean}
 */
export async function addBlackList(id) {
  const query = `INSERT IGNORE INTO mail_unsubscribe (email, reg_date) values (?, now());`;
  try {
    const result = await pool.query(query, [id]);
    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error("addBlackList(): Error querying database:" + error.stack);
    throw error;
  }
}
