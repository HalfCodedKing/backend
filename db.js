const mysql = require('mysql');

const db = mysql.createConnection({
    host: "bfsofbiaa6phf3jaa8ca-mysql.services.clever-cloud.com",
    user: "uwgvhv1dmcvvkcs5",
    password: "7AAGD79CqVqSe1kRyNlC",
    database: "bfsofbiaa6phf3jaa8ca",
})

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to the database');
});

module.exports = { db };
