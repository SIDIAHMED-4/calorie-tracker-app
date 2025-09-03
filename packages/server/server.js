const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const app = express();
const generateRecords = require("./data-generator");

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

// Database setup in memory
const db = new sqlite3.Database(":memory:", (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connected to the in-memory SQlite database.");
});

// Create table and populate with initial data
const setupDb = () => {
  db.run(
    "CREATE TABLE calorie_records (id INTEGER PRIMARY KEY AUTOINCREMENT, r_date text, r_meal text, r_food text, r_cal integer)",
    (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Table created.");
        console.log("Generating random records");
        const data = generateRecords();
        console.log("Inserting random data into table");
        let stmt = db.prepare(
          "INSERT INTO calorie_records (r_date, r_meal, r_food, r_cal) VALUES (?, ?, ?, ?)"
        );
        for (let i = 0; i < data.length; i++) {
          const { date, meal, content, calories } = data[i];
          stmt.run(date, meal, content, calories);
        }
        stmt.finalize();
        console.log("Records inserted successfully.");
      }
    }
  );
};

setupDb();

const domainWhiteList = JSON.parse(process.env.DOMAIN_WHITELIST || "[]");
console.log(domainWhiteList);

// Allow receiving requests from React server
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || domainWhiteList.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

/* ===============================
   ✅ إضافة جزء React build
================================= */
const clientBuildPath = path.join(__dirname, "packages/client/dist");
app.use(express.static(clientBuildPath));

// أي route غير معروف → يرجع index.html تبع React
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});
/* ================================= */

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});

// ---- باقي API كما عندك (records CRUD) ----
