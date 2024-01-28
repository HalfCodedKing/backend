const express = require('express');
const router = express.Router();
const { db } = require('../db');
const multer = require("multer"); // for image handling
const fs = require("fs"); // for image deleting and editing
const verifyToken = require('../verifyToken');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');



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

function sendEmail(auth, to, subject, body) {
  const gmail = google.gmail({ version: 'v1', auth });
  const raw = makeEmail('your.email@gmail.com', to, subject, body);

  gmail.users.messages.send({
    userId: 'me',
    resource: {
      raw: raw,
    },
  }, (err, res) => {
    if (err) return console.error('The API returned an error:', err.message);
    console.log('Email sent:', res.data);
  });
}


function makeEmail(sender, to, subject, body) {
  const email = [
    `From: ${sender}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    body,
  ].join('\n');

  const encodedEmail = Buffer.from(email).toString('base64');
  return encodedEmail;
}
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send'],
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token:', err);
      oAuth2Client.setCredentials(token);

      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });

      callback(oAuth2Client);
    });
  });
}
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
router.post("/add-student/:franchiseId", upload.single('avatar'), (req, res) => {
  const franchiseId = req.params.franchiseId;
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


router.get('/wbalance/:email',(req,res)=>{
  const email = req.params.email;
  const sql = `Select id,wBalance,mode_of_payment from franchises where email=?`;
  db.query(sql,email,(e,r)=>{
    if(e){
      console.log('error fetching wallet')
      res.status(500).send('records not found')
    }
    res.status(200).send(r)
  })

})

router.post('/send-email', verifyToken, async (req, res) => {
  try {
    const userEmail = req.email;
    const { to, subject, body } = req.body;

    db.query('SELECT id FROM franchises WHERE email = ?', [userEmail], (error, results) => {
      if (error) {
        console.error('Error fetching franchise ID:', error);
        res.status(500).send('Internal Server Error');
      } else {
        if (results.length === 0) {
          res.status(404).send('Franchise not found for the given email');
        } else {
          const franchiseId = results[0].id;

          db.query('SELECT * FROM gmail_credentials WHERE franchise_id = ?', [franchiseId], (error, results) => {
            if (error) {
              console.error('Error fetching Gmail credentials:', error);
              res.status(500).send('Internal Server Error');
            } else {
              if (results.length === 0) {
                res.status(404).send('Gmail credentials not found for the given franchise');
              } else {
                const gmailCredentials = results[0];

                authorize(gmailCredentials, (auth) => {
                  sendEmail(auth, to, subject, body);
                  res.status(200).send('Email sent successfully');
                });
              }
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
