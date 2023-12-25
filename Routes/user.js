const express = require('express');
const router = express.Router();
const { db } = require('../db');


// Define your routes here
router.get("/products", (req, res) => {
    const sql = "SELECT * FROM products";
  
    db.query(sql, (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ message: "Error fetching products" });
      }
  
      return res.json(result);
    });
  });

module.exports = router;
