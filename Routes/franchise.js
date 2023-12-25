const express = require('express');
const router = express.Router();
const { db } = require('../db');
const multer = require("multer"); // for image handling
const fs = require("fs"); // for image deleting and editing
const verifyToken = require('../verifyToken');
const jwt = require('jsonwebtoken');



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/student");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".jpg");
  },
});
const upload = multer({ storage });



router.get('/products', verifyToken, (req, res) => {
  const userEmail = req.email; // Access the email from the request object

  // Use userEmail to fetch the franchise ID from the database
  db.query('SELECT id FROM franchises WHERE email = ?', [userEmail], (error, results) => {
    if (error) {
      console.error('Error fetching franchise ID:', error);
      res.status(500).send('Internal Server Error');
    } else {
      if (results.length === 0) {
        res.status(404).send('Franchise not found for the given email');
      } else {
       const franchiseId = results[0].id;
        // Now you have the franchise ID, you can use it in your logic
        db.query('SELECT * FROM selected_product WHERE franchise_id = ?', [franchiseId], (error, productResults) => {
          if (error) {
            console.error('Error fetching selected products:', error);
            res.status(500).send('Internal Server Error');
          } else {
            // Map and format the results to include price and discount_price
            const formattedProductResults = productResults.map(result => ({
              product_id: result.product_id,
              franchise_id: result.franchise_id,
              price: result.price,
              discount_price: result.discount_price
              // Add other fields as needed
            }));
            res.status(200).json(formattedProductResults);
          }
        });
      }
    }
  });
});



let productId;

// Route to get product details by ID
router.get('/products/:id', (req, res) => {
   productId = req.params.id;
  db.query('SELECT * FROM products WHERE id = ?', [productId], (error, results) => {
    if (error) {
      console.error('Error fetching product details:', error);
      res.status(500).send('Internal Server Error');
    } else {
      if (results.length === 0) {
        res.status(404).send('Product not found');
      } else {
        const product = results[0];  // Assuming there's only one product with the given ID
        res.status(200).json(product);
      }
    }
  }); 
});

// add student   
router.post("/add-student", upload.single('avatar'), (req, res) => {
  const {
    name,
    mobileNumber,
    email,
    address,
    city,
    state,
    pinCode,
    serial_key,
  } = req.body;


  const avatar = req.file;

  const sql = `INSERT INTO student 
  (avatar, name, mobileNumber, email, address, city, state, pinCode, serial_key, franchise_id, product_id, isUsed) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    avatar,
    name,
    mobileNumber,
    email,
    address,
    city,
    state,
    pinCode,
    serial_key,
    franchiseId,
    productId,
    false,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error inserting data" });
    }

    return res.json({ message: "Student added successfully" });
  });
});


router.get('/order-details', verifyToken, async (req, res) => {
  try {
    const userEmail = req.email; // Access the email from the request object

    // Use userEmail to fetch the franchise ID from the database
    db.query('SELECT id FROM franchises WHERE email = ?', [userEmail], (error, results) => {
      if (error) {
        console.error('Error fetching franchise ID:', error);
        res.status(500).send('Internal Server Error');
      } else {
        if (results.length === 0) {
          res.status(404).send('Franchise not found for the given email');
        } else {
          const franchiseId = results[0].id;
          db.query(`SELECT name, email, mobileNumber, city, product_id, address 
                    FROM student 
                    WHERE franchise_id = ?`, [franchiseId], (error, results) => {
            if (error) {
              console.error('Error fetching student data:', error);
              res.status(500).send('Internal Server Error');
            } else {
              // Extract the data from the results
              const orderDetails = results.map(result => ({
                name: result.name,
                email: result.email,
                mobileNumber: result.mobileNumber,
                city: result.city,
                product_id: result.product_id,
                address: result.address,
              }));
              res.status(200).json(orderDetails);
            }
          });
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});









module.exports = router;
