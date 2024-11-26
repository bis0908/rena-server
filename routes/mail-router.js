import express from "express";
import logger from "../config/logger.js";
import { checkInformation } from "../models/mail-service.js";

export const mailRouter = express.Router();

mailRouter.post("/testAll", async (req, res) => {
  const { id: senderId, pw: senderPw, testId, senderName } = req.body;
  // const senderId = req.body.id;
  // const senderPw = req.body.pw;
  // const testId = req.body.testId;
  // const senderName = req.body.senderName;

  try {
    const results = await checkInformation(senderId, senderPw, testId, senderName);
    res.status(200).json(results);
  } catch (error) {
    logger.error(`mailRouter.post("/testAll": ` + error);
    res.status(500).send(error);
  }
});
