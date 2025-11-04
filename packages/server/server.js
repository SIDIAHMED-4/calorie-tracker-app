// server.js
const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ Middleware
app.use(bodyParser.json());
app.use(cors());

// ✅ Database (SQLite in-memory)
const db = new sqlite3.Database(":memory:", (err) => {
  if (err) return console.error(err.message);
  console.log("Connected to SQLite database (in-memory).");
});

// ✅ Setup database
const setupDb = () => {
  db.run(
    "CREATE TABLE calorie_records (id INTEGER PRIMARY KEY AUTOINCREMENT, r_date text, r_meal text, r_food text, r_cal integer)",
    (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Table created.");

        const sampleData = [
          { date: "2025-09-05", meal: "Breakfast", food: "Omelette", calories: 300 },
          { date: "2025-09-05", meal: "Lunch", food: "Chicken Salad", calories: 450 },
          { date: "2025-09-05", meal: "Dinner", food: "Grilled Fish", calories: 500 },
        ];

        let stmt = db.prepare(
          "INSERT INTO calorie_records (r_date, r_meal, r_food, r_cal) VALUES (?, ?, ?, ?)"
        );
        sampleData.forEach((item) => {
          stmt.run(item.date, item.meal, item.food, item.calories);
        });
        stmt.finalize();

        console.log("Sample records inserted.");
      }
    }
  );
};

setupDb();

/* ========================
   ✅ CRUD APIs
======================== */

// Get all records (or filter by date ?date=2025-09-05)
app.get("/records", (req, res) => {
  let sql = "SELECT * FROM calorie_records";
  const params = [];

  if (req.query.date) {
    sql += " WHERE r_date = ?";
    params.push(req.query.date);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json({ result: rows });
  });
});

// Get one record
app.get("/records/:id", (req, res) => {
  db.get("SELECT * FROM calorie_records WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).send(err.message);
    if (row) res.json(row);
    else res.status(404).send("Record not found");
  });
});

// Add record
app.post("/records", (req, res) => {
  const { r_date, r_meal, r_food, r_cal } = req.body;
  if (!r_date || !r_meal || !r_food || !r_cal) {
    return res.status(400).send("Please provide all record fields.");
  }
  db.run(
    "INSERT INTO calorie_records (r_date, r_meal, r_food, r_cal) VALUES (?, ?, ?, ?)",
    [r_date, r_meal, r_food, r_cal],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.status(200).json({ message: "Record inserted.", id: this.lastID });
    }
  );
});

// Update record
app.put("/records/:id", (req, res) => {
  const { r_date, r_meal, r_food, r_cal } = req.body;
  if (!r_date || !r_meal || !r_food || !r_cal) {
    return res.status(400).send("Please provide all record fields.");
  }

  db.run(
    "UPDATE calorie_records SET r_date = ?, r_meal = ?, r_food = ?, r_cal = ? WHERE id = ?",
    [r_date, r_meal, r_food, r_cal, req.params.id],
    function (err) {
      if (err) return res.status(500).send(err.message);
      if (this.changes > 0) res.json({ message: "Record updated.", id: req.params.id });
      else res.status(404).send("Record not found");
    }
  );
});

// Delete record
app.delete("/records/:id", (req, res) => {
  db.run("DELETE FROM calorie_records WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).send(err.message);
    if (this.changes > 0) res.json({ message: "Record deleted.", id: req.params.id });
    else res.status(404).send("Record not found");
  });
});

/* ========================
   ✅ Serve React build
======================== */
const clientBuildPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientBuildPath));

// أي route غير معروف → رجع React index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

/* ========================
   ✅ Start server
======================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server + React running on http://localhost:${PORT}`);
});


