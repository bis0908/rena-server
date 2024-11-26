import express from "express";
import path from "path";

export const vendorsRouter = express.Router();
const __dirname = path.resolve(); // for ES module

vendorsRouter.use(
  "/bootstrap",
  express.static(path.join(__dirname, "/node_modules/bootstrap/dist"))
);

vendorsRouter.use(
  "/bootstrap-icons",
  express.static(path.join(__dirname, "/node_modules/bootstrap-icons/font"))
);

vendorsRouter.use("/jquery", express.static(path.join(__dirname, "/node_modules/jquery/dist")));

vendorsRouter.use(
  "/popperjs",
  express.static(path.join(__dirname, "/node_modules/@popperjs/core/dist"))
);
