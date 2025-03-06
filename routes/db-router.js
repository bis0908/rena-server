import express from "express";
import logger from "../config/logger.js";
import * as queryService from "../models/query-service.js";

export const queryRouter = express.Router();

queryRouter.get("/mailDeliverySchedule", async (req, res) => {
  try {
    const result = await queryService.getDeliverySchedule();
    res.status(200).send(result);
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.patch("/updateMailDeliverySchedule", async (req, res) => {
  try {
    const { no, newSendStartTime } = req.body;
    const result = await queryService.updateMailDeliverySchedule(
      no,
      newSendStartTime
    );
    res.status(200).send(result);
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/dbMailingRegistration", async (req, res) => {
  const { transInfo } = req.body;
  try {
    const result = await queryService.dbMailingRegistration(transInfo);
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(sendReservationEmail: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.post("/addSentList", async (req, res) => {
  const { idList, senderId, senderEmail } = req.body;
  try {
    const result = await queryService.addSentList(
      idList,
      senderId,
      senderEmail
    );
    res.status(200).send(result);
  } catch (error) {
    logger.error("queryRouter.post(/addSentList: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.get("/getAllowedTimeZone", async (req, res) => {
  try {
    const result = await queryService.getAllowedSendingTimeRange();
    res.status(200).json(result);
  } catch (error) {
    logger.error("queryRouter.post(/getAllowedTimeZone: " + error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.patch("/updateServerName", async (req, res) => {
  const { newSenderName, rowNo } = req.body;
  try {
    const result = await queryService.updateServerName(newSenderName, rowNo);
    res.status(200).json(result);
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});

queryRouter.delete("/deleteServerName", async (req, res) => {
  const { rowNo } = req.body;
  try {
    const result = await queryService.deleteServerName(rowNo);
    res.status(200).json(result);
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});
