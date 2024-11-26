import express from "express";
import logger from "../config/logger.js";
import * as authService from "../models/auth-service.js";

export const authRouter = express.Router();

authRouter.post("/login", async (req, res) => {
  let password = req.body.password;
  try {
    const result = await authService.serverLogin(password);
    if (result) {
      req.session.loggedin = true;
      res.status(200).send({ success: result });
    } else {
      res.status(200).send({ success: result });
    }
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});

authRouter.post("/changePassword", async (req, res) => {
  const { currentPw, newPw } = req.body;

  try {
    const result = await authService.changePassword(currentPw, newPw);
    res.status(200).send(result);
  } catch (error) {
    logger.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});
