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
   ✅ Serve React build
================================= */
const clientBuildPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientBuildPath));

// أي route غير معروف → يرجع index.html تبع React
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});
/* ================================= */

// ---- CRUD APIs ----

// List records
app.get("/records", (req, res) => {
  console.log("Received 'List' request");
  let sql;
  if (req.query.date) {
    sql = `SELECT * FROM calorie_records WHERE r_date = ?`;
    db.all(sql, [req.query.date], (err, rows) => {
      if (err) {
        res.status(500).send(err.message);
        return console.error(err.message);
      }
      res.json({ result: rows });
    });
  } else {
    sql = "SELECT * FROM calorie_records";
    db.all(sql, [], (err, rows) => {
      if (err) {
        res.status(500).send(err.message);
        return console.error(err.message);
      }
      res.json({ result: rows });
    });
  }
});

// Get single record
app.get("/records/:id", (req, res) => {
  console.log("Received 'Detail' request");
  const { id } = req.params;
  let sql = "SELECT * FROM calorie_records WHERE id = ?";
  db.get(sql, [id], (err, row) => {
    if (err) {
      res.status(500).send(err.message);
      return console.error(err.message);
    }
    if (row) {
      res.send(row);
    } else {
      res.status(404).send("Record not found");
    }
  });
});

// Create record
app.post("/records", (req, res) => {
  console.log("Received 'Create' request");
  const { r_date, r_meal, r_food, r_cal } = req.body;
  if (!r_date || !r_meal || !r_food || !r_cal) {
    return res.status(400).send("Please provide all record fields.");
  }
  let sql =
    "INSERT INTO calorie_records (r_date, r_meal, r_food, r_cal) VALUES (?, ?, ?, ?)";
  db.run(sql, [r_date, r_meal, r_food, r_cal], function (err) {
    if (err) {
      res.status(500).send(err.message);
      return console.error(err.message);
    }
    res.status(200).send({ message: "Record inserted.", id: this.lastID });
  });
});

// Update record
app.put("/records/:id", (req, res) => {
  console.log("Received 'Update' request");
  const { r_date, r_meal, r_food, r_cal } = req.body;
  const { id } = req.params;
  if (!r_date || !r_meal || !r_food || !r_cal) {
    return res.status(400).send("Please provide all record fields.");
  }
  let sql = "SELECT * FROM calorie_records WHERE id = ?";
  db.get(sql, [id], (err, row) => {
    if (err) {
      res.status(500).send(err.message);
      return console.error(err.message);
    }
    if (row) {
      sql = `UPDATE calorie_records SET r_date = ?, r_meal = ?, r_food = ?, r_cal = ? WHERE id = ?`;
      db.run(sql, [r_date, r_meal, r_food, r_cal, id], function (err) {
        if (err) {
          res.status(500).send(err.message);
          return console.error(err.message);
        }
        res.send({ message: "Record updated.", id: id });
      });
    } else {
      res.status(404).send("Record not found");
    }
  });
});

// Delete record
app.delete("/records/:id", (req, res) => {
  console.log("Received 'Delete' request");
  const { id } = req.params;
  let sql = "SELECT * FROM calorie_records WHERE id = ?";
  db.get(sql, [id], (err, row) => {
    if (err) {
      res.status(500).send(err.message);
      return console.error(err.message);
    }
    if (row) {
      sql = "DELETE FROM calorie_records WHERE id = ?";
      db.run(sql, [id], (err) => {
        if (err) {
          res.status(500).send(err.message);
          return console.error(err.message);
        }
        res.send({ message: "Record deleted.", id: id });
      });
    } else {
      res.status(404).send("Record not found");
    }
  });
});

// Start server
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});

