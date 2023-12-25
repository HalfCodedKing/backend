const express = require("express");
const { db } = require('./db');
const cors = require("cors");
const usersRoutes = require('./Routes/user');
const adminRoutes = require('./Routes/admin');
const franchiseRoutes = require('./Routes/franchise');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const jwtSecret = 'lecturevecture';

const app = express();
app.use(cors({
  origin: ["http://localhost:3000"],
  methods: ['GET', 'POST','PUT','DELETE'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use('/users/', usersRoutes);
app.use('/admin/', adminRoutes);
app.use('/franchise/', franchiseRoutes);

app.post('/register', async (req, res) => {
  const { name, email, username, password } = req.body;

  // Check if the email is already registered
  const emailCheckSql = 'SELECT * FROM user WHERE email = ?';
  db.query(emailCheckSql, [email], async (err, rows) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ Error: 'Error in checking email' });
    }

    if (rows.length > 0) {
      return res.status(400).json({ Error: 'Email is already registered' });
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the user with the hashed password
      const insertSql = 'INSERT INTO user (name, email, username, password) VALUES (?, ?, ?, ?)';
      db.query(insertSql, [name, email, username, hashedPassword], (err, result) => {
        if (err) {
          console.error('Error in inserting data:', err);
          return res.status(500).json({ Error: 'Error in inserting data' });
        }

        return res.json({ Status: 'Registration Successfull' });
      });
    }
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM user WHERE email = ?';

  db.query(sql, [email], (err, data) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ Error: 'Login Error' });
    }

    if (data.length > 0) {
      const user = data[0];
      console.log('Input Password:', password);
      console.log('DB Password:', user.password);
      const passwordMatch = bcrypt.compareSync(password, user.password);
      console.log('Output:', passwordMatch);

      if (!passwordMatch) {
        const token = jwt.sign({ user }, jwtSecret, { expiresIn: '2h' });
        res.cookie('token', token);
        return res.status(200).json({ Status: 'Success', user, token });
      } else {
        return res.status(401).json({ Error: 'Wrong Password!' });
      }
    } else {
      return res.status(404).json({ Error: 'Please Register First! ' });
    }
  });
});





app.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  return res.json({ Status: 'Success' });
});

const subscription = '/'



app.listen(8081, () => {
  console.log('Server is running on port 8081');
  console.log(`subcriptions running at ${subscription}`);
});
