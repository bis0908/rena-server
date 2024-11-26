// import path from "path";

import { authRouter } from "./routes/auth-router.js";
import cryptoRandomString from "crypto-random-string";
import express from "express";
import fs from "fs";
import { getDate } from "./models/mail-service.js";
import logger from "./config/logger.js";
import os from "os";
import pool from "./config/dbConfig.js";
import { queryRouter } from "./routes/db-router.js";
import session from "express-session";
import { vendorsRouter } from "./routes/vendors-router.js";

const app = express();
const PORT = 8080;
let rowNum = "";

// session
app.use(
  session({
    secret: cryptoRandomString({ length: 48, type: "base64" }),
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true },
  })
);

function getMacAddress(interfaceName) {
  const networkInterfaces = os.networkInterfaces();
  let macAddress = null;

  // 특정 인터페이스 이름이 주어진 경우
  if (interfaceName && networkInterfaces[interfaceName]) {
    macAddress = networkInterfaces[interfaceName][0]?.mac;
  } else {
    // 윈도우 또는 다른 OS에서 인터페이스 이름을 알 수 없는 경우
    for (let key in networkInterfaces) {
      if (networkInterfaces.hasOwnProperty(key)) {
        const interfaceDetail = networkInterfaces[key][0];
        if (interfaceDetail && !interfaceDetail.internal) {
          macAddress = interfaceDetail.mac;
          break; // 첫 번째 외부 인터페이스의 MAC 주소를 사용
        }
      }
    }
  }

  return macAddress;
}

async function isRegisteredSender() {
  // const networkInterfaces = os.networkInterfaces();
  // const macAddress = networkInterfaces["eth0"][0]?.mac;
  const macAddress = getMacAddress("eth0");

  const filepath = "./sender.info";
  if (fs.existsSync(filepath)) {
    fs.readFile(filepath, "utf8", (err, data) => {
      if (err) throw err;
      console.log("file 내용: ", data);
      rowNum = data;
    });
  } else {
    console.log(".info not found");

    const query = `select * from mail_server_status where mac_address = ?`;
    const result = await pool.query(query, [macAddress]);

    if (result[0].length > 0) {
      console.log("result[0]: ", result[0][0].no);
      rowNum = String(result[0][0].no);
      fs.writeFile(filepath, rowNum, (err) => {
        if (err) {
          throw err;
        }
      });
    } else {
      const query = `INSERT INTO mail_server_status (server_name, server_status, server_last_update, mac_address) VALUES (?,?,?,?);`;
      const result = await pool.query(query, [
        "init_sender",
        "1",
        getDate(),
        macAddress,
      ]);
      const insertId = result[0].insertId;

      fs.writeFile(filepath, insertId, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  }
}

await isRegisteredSender();

app.use(express.urlencoded({ extended: true }));

app.use(
  express.json({
    limit: "400mb",
  })
);

app.use(express.static("public"));

app.set("view engine", "ejs");

// routes
app.use("/vendors", vendorsRouter);
app.use("/db", queryRouter);
// app.use("/mail", mailRouter);
app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

app.get("/login", function (req, res) {
  res.render("login");
});

function checkAuthenticated(req, res, next) {
  if (req.session.loggedin) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.get("/", checkAuthenticated, (req, res) => {
  try {
    res.render("sender-management");
    // console.log("loading mailDeliverySchedule.ejs");
  } catch (e) {
    console.log(e.message);
    logger.error(e.message);
  }
});

app.post("/api/mail_server_status", async (req, res) => {
  try {
    const [rows, fields] = await pool.query("SELECT * FROM mail_server_status");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

setInterval(async () => {
  if (rowNum !== "") {
    try {
      await pool.query(
        "UPDATE mail_server_status SET server_status = ?, server_last_update = ? WHERE no = ?",
        ["1", getDate(), rowNum]
      );
      // console.log("Updated");
    } catch (error) {
      console.error(error);
    }
  }
}, 10000);

app.post("/logout", async (req, res) => {
  try {
    if (req.session.loggedin) {
      req.session.destroy(function (err) {
        if (err) {
          throw err;
        }
        res.redirect("/");
      });
    }
  } catch (error) {}
});
