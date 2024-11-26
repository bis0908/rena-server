import * as queryService from "./query-service.js";

import axios from "axios";
import dotenv from "dotenv";
import { load } from "cheerio";
import logger from "../config/logger.js";
import nodemailer from "nodemailer";
import pool from "../config/dbConfig.js";
import schedule from "node-schedule";

dotenv.config({ path: "config.env" });

let flag = 1;

const queryScheduled = `
    SELECT mds.*, msg.title, msg.contents
    FROM mail_delivery_schedule AS mds LEFT JOIN mail_sender_group AS msg
    ON mds.sender_group = msg.\`no\`
    WHERE mds.send_status = 'scheduled'
    AND mds.reservation_sent = 'Y' 
    AND mds.dispatch_registration_time <= NOW()
    AND msg.group_suspend = 'N'
    LIMIT 1
    FOR UPDATE`;

const queryImmediately = `
    SELECT mds.*, msg.title, msg.contents
    FROM mail_delivery_schedule AS mds LEFT JOIN mail_sender_group AS msg
    ON mds.sender_group = msg.\`no\`
    WHERE mds.send_status = 'immediately' 
    AND mds.reservation_sent = 'N'
    AND msg.group_suspend = 'N'
    ORDER BY mds.no
    LIMIT 1
    FOR UPDATE`;

const footer = (comment, to) => {
  // Confidential
};

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/115.0.5790.130 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/115.0.5790.130 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPod; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/115.0.5790.130 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-A102U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-N960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; LM-Q720) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; LM-X420) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; LM-Q710(FGN)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13.4; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (X11; Linux i686; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/115.0 Mobile/15E148 Safari/605.1.15",
  "Mozilla/5.0 (iPad; CPU OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/115.0 Mobile/15E148 Safari/605.1.15",
  "Mozilla/5.0 (iPod touch; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) FxiOS/115.0 Mobile/15E148 Safari/605.1.15",
  "Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/115.0 Firefox/115.0",
  "Mozilla/5.0 (Android 13; Mobile; LG-M255; rv:115.0) Gecko/115.0 Firefox/115.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPod touch; CPU iPhone 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
];

// temp, save
let emailSendTime = (time) => {
  return `이 메일은 ${time}에 캠페인과 관련된 블로그에서 공개되어 있는 정보를 활용하여 발송하였습니다.`;
};

export function getDate() {
  let today = new Date();
  let year = today.getFullYear();
  let month = ("0" + (today.getMonth() + 1)).slice(-2);
  let day = ("0" + today.getDate()).slice(-2);
  let hours = ("0" + today.getHours()).slice(-2);
  let minutes = ("0" + today.getMinutes()).slice(-2);
  let seconds = ("0" + today.getSeconds()).slice(-2);

  let dateString = year + "-" + month + "-" + day;
  let timeString = hours + ":" + minutes + ":" + seconds;
  return dateString + " " + timeString;
}

function makeTransport(userAccount, pw) {
  const smtpConfig = dynamicSMTP(userAccount);
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    service: smtpConfig.service,
    secure: smtpConfig.port === 465,
    requireTLS: true,
    auth: {
      user: userAccount,
      pass: pw,
    },
    logger: true,
    tls: {
      ciphers: "SSLv3",
    },
  });
}

/**
 * Dynamically store SMTP information based on the sending account.
 * @param {string} senderEmail
 * @returns {Object} SMTP configuration
 */
function dynamicSMTP(senderEmail) {
  const email = senderEmail.split("@")[1];
  let smtpConfig = {};

  switch (email) {
    case "gmail.com":
      smtpConfig = {
        host: "smtp.gmail.com",
        port: 587,
        service: "Gmail",
      };
      break;

    case "naver.com":
      smtpConfig = {
        host: "smtp.naver.com",
        port: 587,
        service: "Naver",
      };
      break;

    case "daum.net":
      smtpConfig = {
        host: "smtp.daum.net",
        port: 465,
        service: "Daum",
      };
      break;

    default:
      smtpConfig = {
        host: "smtps.hiworks.com",
        port: 465,
        service: "Hiworks",
      };
      break;
  }

  return smtpConfig;
}

function generateRandomString() {
  // Confidential
}

function addRandom(text) {
  // Confidential
}

// for random string in <a></a> tag
const HANGUL_UNICODE_RANGE = {
  start: 0xac00,
  end: 0xd7af,
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAlphaNumeric() {
  // Confidential
}

function randomKeyValue() {
  // Confidential
}

function addRandomUrlQueryString(url) {
  // Confidential
}

/**
 *
 * @param {Object} objectOfInfo
 * @param {string[]} testId
 * @param {String} senderName
 */
export function checkInformation(senderId, senderPw, testId, senderName) {
  return new Promise((resolve, reject) => {
    try {
      const newId = testId + "@naver.com";
      const result = sendMailTest(
        senderId,
        senderPw,
        senderName,
        newId,
        testSubject,
        testBody
      );
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

async function sendMailTest(senderEmail, pw, from, to, subject, body) {
  let smtpTransport = null;

  const newBody = addRandomHiddenSpans(
    body + footer(emailSendTime(getDate()), to)
  );
  try {
    smtpTransport = makeTransport(senderEmail, pw);
    await smtpTransport.sendMail({
      from: `"${from}" <${senderEmail}>`,
      to: to,
      subject: subject,
      html: newBody,
    });
    return true;
  } catch (error) {
    logger.error("sendMail Error: " + error);
    throw new Error(error);
  } finally {
    if (smtpTransport) {
      smtpTransport.close();
      // console.log("smtpTransport.close()");
    } else {
      logger.error("smtpTransport has problem.");
    }
  }
}

/**
 *
 * @param {string} no
 * @param {string} sender_id
 * @param {string} sender_pw
 * @param {string} from
 * @param {string} subject
 * @param {string} body
 * @param {string} collection_id
 * @param {string} agentNo
 * @param sender_group
 * @returns
 */
async function sendMail(
  no,
  sender_id,
  sender_pw,
  from,
  subject,
  body,
  collection_id,
  agentNo,
  sender_group
) {
  let smtpTransport = null;

  try {
    smtpTransport = makeTransport(sender_id, sender_pw);
  } catch (error) {
    throw error;
  }

  const mailReadUrl = null; // Confidential

  try {
    const newBody = prepareMailContent(body, mailReadUrl, collection_id);
    const customerId = collection_id.split("@")[0];
    const checkedArr = await queryService.realTimeIdCheck(
      [customerId],
      agentNo
    );
    const isUnsubscribed = await queryService.getMailUnsubscribe(collection_id);

    // console.log("mail-service.js:348 / isUnsubscribed: ", isUnsubscribed);

    if (checkedArr.length === 0 && isUnsubscribed.length === 0) {
      await new Promise((resolve, reject) => {
        smtpTransport.sendMail(
          {
            from: `"${from}" <${sender_id}>`,
            to: collection_id,
            subject: subject,
            html: newBody,
          },
          async (error, info) => {
            if (error) {
              reject(error);
            } else {
              resolve(info);
            }
          }
        );
      });
      
    } else if (isUnsubscribed.length > 0) {
      // queryService.addBlackList(collection_id);
      console.timeEnd("sendMail()");
      throw new Error("수신 거부: " + collection_id);
    } else if (checkedArr.length > 0) {
      console.timeEnd("sendMail()");
      throw new Error("이미 발송함: " + customerId);
    }
    await pool.query(
      "UPDATE mail_delivery_schedule SET send_status = 'finished', dispatch_finish_time = NOW() WHERE no = ?",
      [no]
    );
  } catch (error) {
    logger.error(error);
    console.timeEnd("sendMail()");
    await handleSendError(error, sender_group, no);
    throw error;
  } finally {
    if (smtpTransport) {
      smtpTransport.close();
      console.log("closing smtpTransport");
    } else {
      logger.error("smtpTransport has problem");
    }
  }
}

// 슈퍼계정에 대한 작업
export async function superUserProcess() {
  const query = `
    SELECT 
      mds.*, msg.title, msg.contents 
    FROM 
      mail_delivery_schedule AS mds 
      LEFT JOIN mail_sender_group AS msg ON mds.sender_group = msg.\`no\` 
    WHERE 
      mds.collection_id in (
        SELECT 
          CONCAT(super_id, "@naver.com") 
        FROM 
          super_id_list
        where
          is_emergency = 'Y'
      ) 
      AND (
        mds.send_status = "immediately" 
        OR mds.send_status = "scheduled"
      ) 
      AND msg.group_suspend = 'N'
    ORDER BY mds.no 
    LIMIT 1 FOR update`;

  try {
    const [rows, fields] = await pool.query(query);

    if (rows.length > 0) {
      logger.info("running superUserProcess() - " + getDate());
      const mailData = rows[0];
      await processMailSend(mailData);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

let sendFlag = false;

export async function mailSendProcess() {
  //슈퍼계정에 대한 발송 시도 후 성공하면 그냥 리턴 (슈퍼 계정 작업을 이번 턴에 했으므로.)
  // if (await superUserProcess()) {
  //   return;
  // }

  try {
    const [rows, fields] = await pool.query(queryImmediately);

    if (rows.length > 0 && !sendFlag) {
      logger.info("running immediate in mailSendProcess()");
      sendFlag = true;
      const mailData = rows[0];
      if (await processMailSend(mailData)) {
        return 1;
      }
    } else {
      const [rows, fields] = await pool.query(queryScheduled);

      if (rows.length > 0 && !sendFlag) {
        logger.info("running scheduled in mailSendProcess()");
        sendFlag = true;
        const mailData = rows[0];
        if (await processMailSend(mailData)) {
          return 1;
        }
      }
    }
  } catch (error) {
    logger.error(error);
  } finally {
    sendFlag = false;
  }
}

let sendReverseFlag = false;

export async function mailSendProcessReverse() {
  //슈퍼계정에 대한 발송 시도 후 성공하면 그냥 리턴 (슈퍼 계정 작업을 이번 턴에 했으므로.)
  // if (await superUserProcess()) {
  //   return;
  // }
  // check scheduled

  try {
    const [rows, fields] = await pool.query(queryScheduled);

    if (rows.length > 0 && !sendReverseFlag) {
      logger.info("running scheduled in mailSendProcessReverse()");
      sendReverseFlag = true;
      const mailData = rows[0];
      if (await processMailSend(mailData)) {
        return 1;
      }
    } else {
      const [rows, fields] = await pool.query(queryImmediately);

      if (rows.length > 0 && !sendReverseFlag) {
        logger.info("running immediate in mailSendProcessReverse()");
        sendReverseFlag = true;
        const mailData = rows[0];
        if (await processMailSend(mailData)) {
          return 1;
        }
      }
    }
  } catch (error) {
    logger.error(error);
  } finally {
    sendReverseFlag = false;
  }
}

async function processMailSend(mailData) {
  const {
    no,
    sender_name,
    title,
    contents,
    collection_id,
    sender_id,
    sender_pw,
    mail_agent,
    sender_group,
  } = mailData;

  const conn = await pool.getConnection();
  try {
    await pool.query(
      "UPDATE mail_delivery_schedule SET send_status = 'sending', send_start_time = NOW() WHERE no = ?",
      [no]
    );
    
    await conn.beginTransaction();


    const { isSame, email } = await idMisMatchCheck(collection_id);
    logger.info(`isSame: ${isSame} / email: ${email}`);

    if (!isSame && isSame !== null) {
      await updateTargetEmail(no, email);
      console.log("done updateTargetEmail()");
    }

    console.time("sendMail()");
    await sendMail(
      no,
      sender_id,
      sender_pw,
      sender_name,
      title,
      contents,
      // collection_id,
      email,
      mail_agent,
      sender_group
    );
    console.timeEnd("sendMail()");

    await conn.commit();

    return true;
  } catch (error) {
    await conn.rollback();
    logger.error(error);
    await pool.query(
      "UPDATE mail_delivery_schedule SET send_status = 'failed', error_message = ? WHERE no = ?",
      [error.message, no]
    );
    return false;
  } finally {
    conn.release();
  }
}

let regularMailJob, superUserMailJob;

export async function checkMailDeliveryTimeZone() {
  const allowedTimeRange = await queryService.getAllowedSendingTimeRange();

  const [startHour, startMinute, startSecond] = allowedTimeRange.startTime
    .split(":")
    .map(Number);
  const [endHour, endMinute, endSecond] = allowedTimeRange.endTime
    .split(":")
    .map(Number);

  const now = new Date();
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const nowSecond = now.getSeconds();

  const isNowInRange =
    // Check if current time is greater than start time
    (nowHour > startHour ||
      (nowHour === startHour && nowMinute > startMinute) ||
      (nowHour === startHour &&
        nowMinute === startMinute &&
        nowSecond >= startSecond)) &&
    // And, check if current time is less than end time
    (nowHour < endHour ||
      (nowHour === endHour && nowMinute < endMinute) ||
      (nowHour === endHour &&
        nowMinute === endMinute &&
        nowSecond <= endSecond));

  return {
    startHour,
    startMinute,
    startSecond,
    endHour,
    endMinute,
    endSecond,
    isNowInRange,
  };
}

async function scheduleJobs() {
  try {
    finishJob();

    const {
      startHour,
      startMinute,
      startSecond,
      endHour,
      endMinute,
      endSecond,
      isNowInRange,
    } = await checkMailDeliveryTimeZone();

    let startRule = new schedule.RecurrenceRule();
    startRule.hour = startHour;
    startRule.minute = startMinute;
    startRule.second = startSecond;
    startRule.tz = "Asia/Seoul";

    let endRule = new schedule.RecurrenceRule();
    endRule.hour = endHour;
    endRule.minute = endMinute;
    endRule.second = endSecond;
    endRule.tz = "Asia/Seoul";

    if (isNowInRange) {
      logger.info("job start");
      scheduleRegularMailJob();
    }

    schedule.scheduleJob(startRule, scheduleRegularMailJob);
    schedule.scheduleJob(endRule, finishJob);
  } catch (error) {
    console.error("Failed to schedule jobs: ", error);
    logger.error(error.stack);
  }
}

function scheduleJobTask24h() {
  console.log("Run 24h task");
  let isJob24hRunning = false;

  superUserMailJob = schedule.scheduleJob("*/7 * * * * *", async function () {
    if (isJob24hRunning) {
      return;
    }

    isJob24hRunning = true;
    try {
      if (await superUserProcess()) {
        return true;
      }
    } catch (err) {
      logger.error(err);
    } finally {
      isJob24hRunning = false;
    }
  });
}

function scheduleRegularMailJob() {
  let isJobRunning = false;

  regularMailJob = schedule.scheduleJob("*/3 * * * * *", async function () {
    if (isJobRunning) {
      logger.warn("job already running");

      const { isNowInRange } = await checkMailDeliveryTimeZone();
      logger.info("isNowInRange ? : " + isNowInRange);
      if (!isNowInRange) {
        logger.warn("This is not an acceptable time to send mail.");
        finishJob();
      }
      return;
    }

    isJobRunning = true;

    try {
      if (flag === 1) {
        await mailSendProcess();
      }
      if (flag === -1) {
        await mailSendProcessReverse();
      }
      flag *= -1;
    } catch (err) {
      logger.error(err);
    } finally {
      isJobRunning = false;
    }
  });
}

function finishJob() {
  logger.info("finishJob start");
  if (regularMailJob) {
    try {
      logger.info("Finishing job");
      regularMailJob.cancel();
      regularMailJob = null;
      logger.info("Job finished");
    } catch (error) {
      logger.error("Fail to stop job");
    }
    logger.info("finishJob done");
  } else {
    logger.warn("there is no job");
  }
}

// At server start
await scheduleJobs();
scheduleJobTask24h();

async function idMisMatchCheck(userEmail) {
  const userId = userEmail.split("@")[0];

  let scriptTag;
  let match;
  let $;
  const url = `https://blog.naver.com/PostList.naver?blogId=${userId}&categoryNo=0&from=postList`;
  try {
    // 먼저 DB에서 기존 불일치 여부 확인
    const existingNaverId = await checkExistingMismatch(userId);
    if (existingNaverId) {
      logger.info(`기존 불일치 ID 발견: ${userId} -> ${existingNaverId}`);
      return { isSame: false, email: `${existingNaverId}@naver.com` };
    }

    $ = await getHTML(url);
    scriptTag = $.text();
    match = scriptTag.match(feedIdRegex);
    if (match) {
      const naverId = match[1];
      if (userId !== naverId) {
        logger.info(
          `새로운 MisMatch 발견 / ID: ${userId} / NaverID: ${naverId}`
        );
        const isNewMismatch = await insertDiffIds(naverId, userId);
        if (isNewMismatch) {
          logger.info(`새로운 불일치 ID 쌍 등록됨: ${naverId} - ${userId}`);
        } else {
          logger.warn(`이미 등록된 불일치 ID 쌍: ${naverId} - ${userId}`);
        }
        return { isSame: false, email: `${naverId}@naver.com` };
      }
      return { isSame: true, email: userEmail };
    } else {
      // 정규표현식 일치값이 없을때
      return { isSame: null, email: userEmail };
    }
  } catch (error) {
    logger.error("주소를 알 수 없는 ID가 있습니다: " + userId);
    logger.error(error.stack);
    return { isSame: null, email: userEmail };
  }
}

/**
 * @description 블로그 아이디와 네이버 메일이 일치하지 않을 경우 db에 기록하는 함수
 * @param {string} original - 네이버 본 계정 아이디
 * @param {string} blog - 블로그 아이디
 * @returns {Promise<boolean>} - 새로운 레코드가 삽입되었으면 true, 이미 존재하면 false
 */
async function insertDiffIds(original, blog) {
  const query = `
    INSERT IGNORE INTO mail_id_mismatch (naver_id, blog_id) 
    VALUES (?, ?)
  `;

  try {
    const [result] = await pool.query(query, [original, blog]);

    if (result.affectedRows === 1) {
      logger.info(`새로운 불일치 ID 쌍 추가됨: ${original} - ${blog}`);
      return true;
    } else {
      logger.info(`이미 존재하는 불일치 ID 쌍: ${original} - ${blog}`);
      return false;
    }
  } catch (e) {
    logger.error(`ID 불일치 정보 저장 중 오류 발생: ${e.message}`);
    throw e;
  }
}

/**
 * @description DB에서 불일치 ID 쌍이 존재하는지 확인하는 함수
 * @param {string} blog - 블로그 아이디
 * @returns {Promise<string|null>} - 일치하는 네이버 ID가 있으면 해당 ID 반환, 없으면 null 반환
 */
async function checkExistingMismatch(blog) {
  const query = `
    SELECT naver_id FROM mail_id_mismatch 
    WHERE blog_id = ?
  `;

  try {
    const [rows] = await pool.query(query, [blog]);

    if (rows.length > 0) {
      return rows[0].naver_id;
    } else {
      return null;
    }
  } catch (e) {
    logger.error(`ID 불일치 정보 확인 중 오류 발생: ${e.message}`);
    throw e;
  }
}

async function getHTML(url) {
  try {
    const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
    const options = {
      headers: {
        "User-Agent": ua,
        Referer: "https://m.search.naver.com",
        Origin: "https://m.search.naver.com",
      },
    };

    const { data } = await axios.get(url, options).catch((error) => {
      if (error.response) {
        logger.error("Response Data: " + error.response.data);
        logger.error("Response Status: " + error.response.status);
        logger.error("Response Headers: " + error.response.headers);
        logger.error("Config: " + JSON.stringify(error.config));
      } else if (error) {
        logger.error(
          "No response was received: " + JSON.stringify(error.toJSON())
        );
      } else {
        logger.error("Error message: " + error.message);
      }
    });
    // logger.info("axios get data: " + data);
    return load(data);
  } catch (error) {
    logger.error(error.stack);
    logger.error(url);

    throw error;
  }
}

async function updateTargetEmail(no, email) {
  const query = `update mail_delivery_schedule set collection_id = ? where no = ?`;
  try {
    const [result] = await pool.query(query, [email, no]);

    const response = result.changedRows > 0;
    console.log(
      "🔥 / file: mail-service.js:815 / updateTargetEmail / result.changedRows > 0:",
      response
    );
    if (!response) {
      throw new Error(`네이버 ID 변경 시도 실패: ${email}`);
    }
  } catch (e) {
    throw e;
  }
}

function prepareMailContent(body, mailReadUrl, collection_id) {
  const linkStr = body.match(hrefRegex2);
  if (!linkStr) {
    throw new Error("본문에 링크가 포함되어 있지 않습니다.");
  }
  let bodyStrWithoutLink = body.replace(hrefRegex2, "[LINK]");

  const newLinkStr = linkStr.map((link) => {
    //임시방편
    //return addRandom(link);
    return link;
  });

  let totalBodyStr =
    bodyStrWithoutLink +
    mailReadUrl +
    footer(emailSendTime(getDate()), collection_id);

  //임시 방편
  //let replaceStr = totalBodyStr.replace(hangulRegex, "$&$");
  let replaceStr = totalBodyStr;

  newLinkStr.forEach((randomLink) => {
    replaceStr = replaceStr.replace("[LINK]", randomLink);
  });

  return addRandom(replaceStr);
}

async function handleSendError(error, sender_group, no) {
  if (error.message.includes("rejected")) {
    await pool.query(
      `UPDATE mail_delivery_schedule SET send_status = 'rejected', error_message = ? WHERE no = ?`,
      [error.message, no]
    );
    // 발송 group 정지
    const query = `UPDATE mail_sender_group SET group_suspend = 'Y' WHERE no = ?`;

    try {
      const [rows] = await pool.query(query, [sender_group]);
      if (rows.affectedRows > 0) {
        logger.info("메일 계정 블랙 -> 발송 중단 성공");
      } else {
        logger.error("메일 계정 블랙 -> 발송 중단 실패");
      }
    } catch (error) {
      logger.error("발송 중단 처리 중 오류 발생: " + error);
      throw error;
    }
  }
}