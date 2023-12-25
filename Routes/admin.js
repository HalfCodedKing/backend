const express = require("express");
const router = express.Router();
const { db } = require("../db");
const multer = require("multer"); // for image handling
const Busboy = require('busboy');
const cloudinary = require("cloudinary").v2;
const fs = require("fs"); // for image deleting and editing
const path = require("path");
const app = express();
const staticPath = path.join(__dirname, "../images/products");
console.log("static ", staticPath);
app.use('/images', express.static(staticPath));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/products"); // Destination directory for uploaded files
  },
  filename: (req, file, cb) => {
    // Generate a unique filename for each uploaded file
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + file.mimetype.split("/")[1]);
  },
});

const upload = multer({ storage: storage });

cloudinary.config({
  cloud_name: "deadcpd0c",
  api_key: "668199629764616",
  api_secret: "OeophGyONgMzxqGQ63XLc6EN_H8",
});

const uploadMiddleware = upload.single('image');
// Add Ranks
// Add Ranks with Cloudinary for image upload
router.post('/add-record', (req, res) => {
  // Use the uploadMiddleware to handle the file upload
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      console.error("Error uploading image:", err);
      return res.status(500).json({ message: "Error uploading image" });
    }

    try {
      const { path } = req.file; // Path to the uploaded image on your server

      // Upload the image to Cloudinary
      const cloudinaryUpload = await cloudinary.uploader.upload(path);

      // Delete the local file after uploading to Cloudinary
      fs.unlinkSync(path);

      const { secure_url } = cloudinaryUpload; // Cloudinary URL for the uploaded image

      const { Name, Rank, date } = req.body;
      const sql = 'INSERT INTO ranks(image, Name, Rank, date) VALUES (?, ?, ?, ?)';
      const params = [secure_url, Name, Rank, date];

      db.query(sql, params, (err, result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).json({ message: "Error adding record" });
        }
        return res.status(200).json({ message: "Record added successfully" });
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      return res.status(500).json({ message: "Error uploading image" });
    }
  });
});

router.post('/add-comment', (req, res) => {
  const { name, comments } = req.body;
  const sql = `INSERT INTO comments (name, comments) VALUES (?,?)`
  const params = [name, comments];
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error adding record" });
    }
    return res.status(200).json({ message: "Record added successfully" });
  });
})
router.get('/comments', (req, res) => {
  const sql = 'SELECT * FROM comments';

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error fetching records" });
    }

    return res.status(200).json(result);
  });
});
router.put('/update-comments/:id', (req, res) => {
  const recordId = req.params.id;
  const { name, comments } = req.body;

  const sql = 'UPDATE comments SET name=?, comments=? WHERE id=?';
  const params = [name, comments];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error updating record" });
    }

    return res.status(200).json({ message: "Record updated successfully" });
  });
});
router.delete('/delete-comments/:id', (req, res) => {
  const recordId = req.params.id;

  const sql = 'DELETE FROM comments WHERE id=?';
  const params = [recordId];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error deleting record" });
    }

    return res.status(200).json({ message: "Record deleted successfully" });
  });
});
router.get('/records', (req, res) => {
  const sql = 'SELECT * FROM ranks';

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error fetching records" });
    }

    return res.status(200).json(result);
  });
});

// Update a record
router.put('/update-record/:id', (req, res) => {
  const recordId = req.params.id;
  const { image, Name, Rank, date } = req.body;

  const sql = 'UPDATE ranks SET image=?, Name=?, Rank=?, date=? WHERE id=?';
  const params = [image, Name, Rank, date, recordId];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error updating record" });
    }

    return res.status(200).json({ message: "Record updated successfully" });
  });
});

// Delete a record
router.delete('/delete-record/:id', (req, res) => {
  const recordId = req.params.id;

  const sql = 'DELETE FROM ranks WHERE id=?';
  const params = [recordId];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error deleting record" });
    }

    return res.status(200).json({ message: "Record deleted successfully" });
  });
});


// Add course

router.post('/add-course', (req, res) => {
  const {
    courseName,
    courseSubjects,
    courseCategories,
    courseSubCategories,
    courseAuthors,
  } = req.body;

  // Convert arrays to JSON strings
  const subjectsJSON = JSON.stringify(courseSubjects);
  const categoriesJSON = JSON.stringify(courseCategories);
  const subCategoriesJSON = JSON.stringify(courseSubCategories);
  const authorsJSON = JSON.stringify(courseAuthors);

  // Define your SQL query and values here.
  const sql = `
    INSERT INTO courses (courseName, courseSubjects, courseCategories, courseSubCategories, courseAuthors)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [courseName, subjectsJSON, categoriesJSON, subCategoriesJSON, authorsJSON];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error adding course" });
    }

    return res.status(200).json({ message: "Course added successfully" });
  });
});



// Route to fetch all users from the "user" table
router.get('/users', (req, res) => {
  const sql = 'SELECT * FROM user';

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error fetching users" });
    }

    return res.status(200).json(result);
  });
});

// Route to display all users
router.get('/display-users', (req, res) => {
  const sql = 'SELECT * FROM user';

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error fetching users" });
    }

    // Here, you can render an HTML view or send the user data as JSON to the client-side for display.
    // Below is an example of sending JSON data to the client:

    return res.status(200).json(result);
  });
});

router.get('/courses', (req, res) => {
  const sql = 'SELECT * FROM courses';

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error fetching courses" });
    }

    return res.status(200).json(result);
  });
});

router.put('/update-course/:id', (req, res) => {
  const courseId = req.params.id; // Course ID passed as a URL parameter
  const {
    courseName,
    courseSubjects,
    courseCategories,
    courseSubCategories,
    courseAuthors,
  } = req.body;

  // Define your SQL query to update the course
  const sql = `
    UPDATE courses
    SET courseName = ?,
        courseSubjects = JSON_ARRAY(?),
        courseCategories = JSON_ARRAY(?),
        courseSubCategories = JSON_ARRAY(?),
        courseAuthors = JSON_ARRAY(?)
    WHERE id = ?
  `;

  const values = [courseName, courseSubjects, courseCategories, courseSubCategories, courseAuthors, courseId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error updating course" });
    }

    return res.status(200).json({ message: "Course updated successfully" });
  });
});
router.get('/courses/:id', (req, res) => {
  const courseId = req.params.id; // Course ID passed as a URL parameter

  // Define your SQL query to fetch the course by ID
  const sql = 'SELECT * FROM courses WHERE id = ?';

  db.query(sql, courseId, (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Error fetching course by ID' });
    }

    if (result.length === 0) {
      // If no course is found with the given ID, return a 404 Not Found response
      return res.status(404).json({ message: 'Course not found' });
    }

    // Return the course data as JSON
    return res.status(200).json(result[0]);
  });
});
router.delete('/delete-course/:id', (req, res) => {
  const courseId = req.params.id; // Course ID passed as a URL parameter

  // Define your SQL query to delete the course by ID
  const sql = 'DELETE FROM courses WHERE id = ?';

  db.query(sql, courseId, (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Error deleting course' });
    }

    if (result.affectedRows === 0) {
      // If no course is deleted (no matching ID found), return a 404 Not Found response
      return res.status(404).json({ message: 'Course not found' });
    }

    // Return a success message
    return res.status(200).json({ message: 'Course deleted successfully' });
  });
});


/* --------------------------------

 Products

 --------------------------------*/
//add product
router.post("/add-product", upload.array("productImage", 4), async (req, res) => {

  try {
    const {
      productUrl,
      productName,
      facultyName,
      productID,
      productType,
      course,
      deliveryType,
      isFranchise,
      isWhatsapp,
      priceUpdate,
      price,
      discountPrice,
      description,
      shortDescription,
      subject,
      category_id,
      featured,
      slug,
      mrpText,
      discountText,
      rank,
      topLeft,
      topRight,
      bottomLeft,
      bottomRight,
      highlights,
      productDetails,
      variants,
      youtubeLink,
      author,
      subCategory,
      category,
      tabs,
      finalPrice,
      variantCombinations
    } = req.body;

    const imagePaths = []; // To store either Multer paths or Cloudinary URLs

    // Upload images to Cloudinary
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path);

      // Check if Cloudinary upload was successful
      if (result && result.secure_url) {
        imagePaths.push(result.secure_url);
      } else {
        // Handle upload failure (you can choose to return an error or continue without the image)
        console.error("Cloudinary upload failed for file:", file);
      }
    }

    // Check if at least one image was successfully uploaded
    if (imagePaths.length === 0) {
      return res.status(400).json({ message: "No files uploaded to Cloudinary" });
    }

    const variantsJSON = JSON.stringify(variants);

    const sql = `
    INSERT INTO products (productName, facultyName, productID, productType, course, subject, productUrl, priceUpdate, deliveryType, isFranchise, isWhatsapp, price, discountPrice, description, shortDescription, featured, slug, category_id, image, mrpText, discountText, rank, topLeft, topRight, bottomLeft, bottomRight, highlights, productDetails, variants, youtubeLink, author, subCategory, category,tabs,finalPrice,variantCombinations) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const values = [
      productName,
      facultyName,
      productID,
      productType,
      course,
      subject,
      productUrl,
      priceUpdate,
      deliveryType,
      isFranchise,
      isWhatsapp,
      price,
      discountPrice,
      description,
      shortDescription,
      featured,
      slug,
      category_id,
      imagePaths.join(","),
      mrpText,
      discountText,
      rank,
      topLeft,
      topRight,
      bottomLeft,
      bottomRight,
      highlights,
      productDetails,
      variantsJSON,
      youtubeLink,
      author,
      subCategory,
      category,
      tabs,
      finalPrice,
      variantCombinations
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ message: "Error no file data" });
      }

      // Delete Multer-uploaded images after Cloudinary upload
      for (const file of req.files) {
        fs.unlinkSync(file.path);
      }

      return res.json({ message: "Product added successfully" });
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});





router.get("/admin/products/:id", (req, res) => {
  const productId = req.params.id;

  const sql = "SELECT * FROM products WHERE id = ?";
  const values = [productId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error fetching product details" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = result[0];

    // Check if the 'image' property exists before applying the replacement
    if (product.image) {
      // Replace backslashes with forward slashes in image paths
      product.image = product.image.replace(/\\/g, '/');
    }

    return res.json(product);
  });
});


// Fetch all products
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

//delete product
// const db = require("../path/to/db");

router.delete("/products/:id", (req, res) => {
  const id = req.params.id;


        // Now delete the product from the database
        const sqlDeleteProduct = "DELETE FROM products WHERE id = ?";

        db.query(sqlDeleteProduct, [id], (deleteProductError, deleteResult) => {
          if (deleteProductError) {
            console.error("Database query error:", deleteProductError);
            return res.status(500).json({ message: "Error deleting product" });
          }

          return res.status(200).json({ message: "Product deleted successfully" });
        });
      });
    





// edit product
router.put("/updateproducts/:id", async (req, res) => {
  const id = req.params.id;
  const {
    productName,
    facultyName,
    productType,
    productID,
    course,
    deliveryType,
    isFranchise,
    isWhatsapp,
    priceUpdate,
    price,
    discountPrice,
    description,
    shortDescription,
    subject,
    category_id,
    featured,
    slug,
    mrpText,
    discountText,
    rank,
    topLeft,
    topRight,
    bottomLeft,
    bottomRight,
    highlights,
    productDetails,
    variants,
    youtubeLink,
    author,
    subCategory,
    category,
    tabs,
    finalPrice,
    variantCombinations,
  } = req.body;

  let image;
  if (req.file) {
    try {
      // Upload the new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      // Check if Cloudinary upload was successful
      if (result && result.secure_url) {
        image = result.secure_url;

        // Delete the old image from Cloudinary (if it exists)
        if (req.body.image) {
          const public_id = req.body.image.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(public_id);
        }

        // Delete the old image from the local filesystem
        fs.unlinkSync(req.file.path);
      } else {
        // Handle upload failure
        console.error("Cloudinary upload failed for file:", req.file);
        return res.status(500).json({ message: "Error updating product image" });
      }
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.status(500).json({ message: "Error updating product image" });
    }
  }

  const variantsJSON = JSON.stringify(variants);

  const updateQuery = `
    UPDATE products 
    SET productName=?, facultyName=?, productID=?, productType=?, course=?, subject=?, 
        deliveryType=?, isFranchise=?, isWhatsapp=?, priceUpdate=?, price=?, discountPrice=?, 
        description=?, shortDescription=?, featured=?, slug=?, category_id=?, image=?, 
        mrpText=?, discountText=?, rank=?, topLeft=?, topRight=?, bottomLeft=?, bottomRight=?, 
        highlights=?, productDetails=?, variants=?, youtubeLink=?, author=?, subCategory=?, 
        category=?, tabs=?, finalPrice=?, variantCombinations=?
    WHERE id=?
  `;

  const updateValues = [
    productName,
    facultyName,
    productID,
    productType,
    course,
    subject,
    deliveryType,
    isFranchise,
    isWhatsapp,
    priceUpdate,
    price,
    discountPrice,
    description,
    shortDescription,
    featured,
    slug,
    category_id,
    image || req.body.image,
    mrpText,
    discountText,
    rank,
    topLeft,
    topRight,
    bottomLeft,
    bottomRight,
    highlights,
    productDetails,
    variantsJSON,
    youtubeLink,
    author,
    subCategory,
    category,
    tabs,
    finalPrice,
    variantCombinations,
    id,
  ];

  db.query(updateQuery, updateValues, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error updating product" });
    }

    return res.json({ message: "Product updated successfully" });
  });
});

// Fetch a single product
router.get("/products/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM products WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error fetching Product" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ products: result[0] });
  });
});

/* --------------------------------

 Franchise

 --------------------------------*/

let franchiseId;
// Add franchise
router.post("/add-franchise", (req, res) => {
  const {
    name,
    email,
    phone_number,
    password,
    gst_number,
    franchise_type,
    mode_of_payment,
  } = req.body;

  // Insert the franchise data into the "franchises" table
  const franchiseSql =
    "INSERT INTO franchises (name, email, phone_number, password, gst_number, franchise_type, mode_of_payment) VALUES (?, ?, ?, ?, ?, ?, ?)";

  const franchiseValues = [
    name,
    email,
    phone_number,
    password,
    gst_number,
    franchise_type,
    mode_of_payment,
  ];

  db.query(franchiseSql, franchiseValues, (err, franchiseResult) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error creating franchise" });
    }
    franchiseId = franchiseResult.insertId;

    // Insert the franchise's email and password into the "user" table
    const userSql =
      "INSERT INTO user (name,email, password, role) VALUES (?, ?, ?,?)";

    const userValues = [name, email, password, "franchise"];

    db.query(userSql, userValues, (userErr, userResult) => {
      if (userErr) {
        console.error("Database query error:", userErr);
        return res
          .status(500)
          .json({ message: "Error creating franchise user account" });
      }

      return res
        .status(200)
        .json({ message: "Franchise created successfully", franchiseId });
    });
  });
});

// select products
router.post('/select', (req, res) => {
  const { selectedProducts, enteredPrices, enteredDiscountPrices } = req.body;

  if (!franchiseId) {
    return res.status(400).json({ message: "Franchise ID not found" });
  }

  // Prepare the SQL query dynamically with placeholders for each value
  const insertQuery = 'INSERT INTO selected_product (franchise_id, product_id, price, discount_price) VALUES ' +
    selectedProducts.map(productId => '(?, ?, ?, ?)').join(', ');

  // Flatten the array of values for the query (franchiseId, productId, price, discountPrice)
  const flattenedValues = [];
  selectedProducts.forEach(productId => {
    flattenedValues.push(franchiseId, productId, enteredPrices[productId], enteredDiscountPrices[productId]);
  });

  db.query(insertQuery, flattenedValues, (insertErr) => {
    if (insertErr) {
      console.error('Database query error:', insertErr);
      return res.status(500).json({ message: 'Error saving selected products' });
    }

    return res.status(200).json({ message: 'Selected products saved successfully' });
  });
});

// Fetch products for select
router.get("/product", (req, res) => {
  const sql = "SELECT * FROM products WHERE isFranchise = 1";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error fetching products" });
    }

    return res.json(result);
  });
});

// Fetch all franchise
router.get("/franchise", (req, res) => {
  const sql = "SELECT * FROM franchises";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error fetching franchise" });
    }

    return res.json(result);
  });
});

// Delete franchise
router.delete("/franchise/:id", (req, res) => {
  const franchiseId = req.params.id;

  // Get the franchise email first
  const getEmailQuery = "SELECT email FROM franchises WHERE id = ?";
  db.query(getEmailQuery, [franchiseId], (getEmailErr, getEmailResult) => {
    if (getEmailErr) {
      console.error("Database query error:", getEmailErr);
      return res.status(500).json({ message: "Error getting franchise email" });
    }

    if (getEmailResult.length === 0) {
      return res.status(404).json({ message: "Franchise not found" });
    }

    const franchiseEmail = getEmailResult[0].email;

    // Delete franchise from franchises table
    const deleteFranchiseQuery = "DELETE FROM franchises WHERE id = ?";
    db.query(deleteFranchiseQuery, [franchiseId], (err, franchiseResult) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ message: "Error deleting franchise" });
      }

      // Delete related records from users and selected_product tables based on email
      const deleteUsersQuery = "DELETE FROM user WHERE email = ?";
      const deleteSelectedProductsQuery =
        "DELETE FROM selected_product WHERE franchise_id = ?";

      // Execute the delete queries
      db.query(deleteUsersQuery, [franchiseEmail], (userErr, userResult) => {
        if (userErr) {
          console.error("Database query error:", userErr);
          return res
            .status(500)
            .json({ message: "Error deleting related user records" });
        }

        db.query(
          deleteSelectedProductsQuery,
          [franchiseId],
          (selectedProductErr, selectedProductResult) => {
            if (selectedProductErr) {
              console.error("Database query error:", selectedProductErr);
              return res
                .status(500)
                .json({ message: "Error deleting related selected products" });
            }

            return res
              .status(200)
              .json({
                message: "Franchise and related records deleted successfully",
              });
          }
        );
      });
    });
  });
});

// Update franchise
router.put("/franchise/:id", (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone_number,
    password,
    gst_number,
    franchise_type,
    mode_of_payment,
  } = req.body;

  // Fetch the previous email associated with the franchise
  const getEmailQuery = "SELECT email FROM franchises WHERE id = ?";
  db.query(getEmailQuery, [id], (getEmailErr, getEmailResult) => {
    if (getEmailErr) {
      console.error("Database query error:", getEmailErr);
      return res.status(500).json({ message: "Error getting franchise email" });
    }

    if (getEmailResult.length === 0) {
      return res.status(404).json({ message: "Franchise not found" });
    }

    const prevEmail = getEmailResult[0].email;

    // Update the franchise data in the database based on the provided id
    const franchiseSql =
      "UPDATE franchises SET name = ?, email = ?, phone_number = ?, password = ?, gst_number = ?, franchise_type = ?, mode_of_payment = ? WHERE id = ?";

    const franchiseValues = [
      name,
      email,
      phone_number,
      password,
      gst_number,
      franchise_type,
      mode_of_payment,
      id,
    ];

    db.query(franchiseSql, franchiseValues, (err, franchiseResult) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ message: "Error updating franchise" });
      }

      // Update the corresponding user's email and password in the "user" table
      const userSql =
        "UPDATE user SET name =?, email = ?, password = ? WHERE email = ?";

      const userValues = [name, email, password, prevEmail];

      db.query(userSql, userValues, (userErr, userResult) => {
        if (userErr) {
          console.error("Database query error:", userErr);
          return res.status(500).json({ message: "Error updating user" });
        }

        return res
          .status(200)
          .json({ message: "Franchise and user updated successfully" });
      });
    });
  });
});

// Fetch a single franchise
router.get("/franchise/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM franchises WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error fetching franchise" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Franchise not found" });
    }

    return res.status(200).json({ franchise: result[0] });
  });
});

// Fetch already associated products
router.get("/product/:id", (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM selected_product WHERE franchise_id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res
        .status(500)
        .json({ message: "Error fetching selected products" });
    }

    const selectedProducts = result.reduce((acc, row) => {
      const { product_id, price, discount_price } = row;
      acc[product_id] = { price, discountPrice: discount_price };
      return acc;
    }, {});
    return res.json(selectedProducts);
  });
});

router.post("/update_selected_products", async (req, res) => {
  const { id, selectedProductIds, updatedProducts } = req.body;

  if (!id || !Array.isArray(selectedProductIds) || !Array.isArray(updatedProducts)) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  try {
    // Delete existing selected products for this franchise
    await db.query("DELETE FROM selected_product WHERE franchise_id = ?", [id]);

    // Insert the updated selected products
    const insertQuery = 'INSERT INTO selected_product (franchise_id, product_id, price, discount_price) VALUES ' +
      selectedProductIds.map((productId, index) => '(?, ?, ?, ?)').join(', ');

    // Flatten the array of values for the query (franchiseId, productId, price, discountPrice)
    const flattenedValues = [];
    selectedProductIds.forEach((productId, index) => {
      flattenedValues.push(id, productId, updatedProducts[index].price, updatedProducts[index].discountPrice);
    });

    await db.query(insertQuery, flattenedValues);

    return res
      .status(200)
      .json({ message: "Selected products updated successfully" });
  } catch (error) {
    console.error("Error updating selected products:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});



/* --------------------------------

 Order

 --------------------------------*/


router.get('/order-details', async (req, res) => {
  try {
    // Fetch student details
    db.query('SELECT * FROM student', async (error, studentsResults, fields) => {
      if (error) {
        console.error('Error executing the query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        const students = studentsResults.map(row => ({
          franchise_id: row.franchise_id,
          product_id: row.product_id,
          student_name: row.name,
        }));

        const promises = students.map(student => {
          const franchiseQuery = 'SELECT name, email FROM franchises WHERE id = ?';
          const productQuery = 'SELECT productName FROM products WHERE id = ?';

          const franchisePromise = new Promise((resolve, reject) => {
            db.query(franchiseQuery, [student.franchise_id], (error, franchiseResults) => {
              if (error) {
                reject(error);
              } else {
                resolve(franchiseResults[0]);
              }
            });
          });

          const productPromise = new Promise((resolve, reject) => {
            db.query(productQuery, [student.product_id], (error, productResults) => {
              if (error) {
                reject(error);
              } else {
                // Check if productResults is defined and has the expected structure
                if (productResults && productResults.length > 0 && productResults[0].hasOwnProperty('productName')) {
                  resolve(productResults[0]);
                } else {
                  resolve({ productName: 'Unknown' }); // Set a default value or handle accordingly
                }
              }
            });
          });

          return Promise.all([franchisePromise, productPromise])
            .then(([franchise, product]) => ({
              franchise_name: franchise.name,
              franchise_email: franchise.email,
              product_name: product.productName,
              student_name: student.student_name,
            }));
        });

        Promise.all(promises)
          .then(data => {
            res.status(200).json(data);
          })
          .catch(error => {
            console.error('Error:', error);
            res.status(500).send('Internal Server Error');
          });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});



router.post('/api/add-to-cart', (req, res) => {
  const newItem = req.body;
  cartItems.push(newItem);
  res.json({ success: true, message: 'Item added to cart' });
});

router.get('/api/cart', (req, res) => {
  res.json(cartItems);
});

router.post('/add-privacy', (req, res) => {
  const { policy, details } = req.body;

  const sql = 'INSERT INTO privacy_info (policy, details) VALUES (?, ?)';
  const params = [policy, details];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error adding privacy information" });
    }

    return res.status(201).json({ message: "Privacy information added successfully", insertedId: result.insertId });
  });
});

router.get('/privacy', (req, res) => {
  const sql = 'SELECT * FROM privacy_info';

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error fetching privacy information" });
    }

    return res.status(200).json(result);
  });
});

// Update privacy-related information by ID
router.put('/update-privacy/:id', (req, res) => {
  const privacyId = req.params.id;
  const { policy, details } = req.body;

  const sql = 'UPDATE privacy_info SET policy=?, details=? WHERE id=?';
  const params = [policy, details, privacyId];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error updating privacy information" });
    }

    return res.status(200).json({ message: "Privacy information updated successfully" });
  });
});

// Delete privacy-related information by ID
router.delete('/delete-privacy/:id', (req, res) => {
  const privacyId = req.params.id;

  const sql = 'DELETE FROM privacy_info WHERE id=?';
  const params = [privacyId];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error deleting privacy information" });
    }

    return res.status(200).json({ message: "Privacy information deleted successfully" });
  });
});

router.get('/terms', (req, res) => {
  const sql = 'SELECT * FROM terms';

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error fetching terms" });
    }

    return res.status(200).json(result);
  });
});

// Add new term
router.post('/add-term', (req, res) => {
  const { title, description } = req.body;
  const sql = 'INSERT INTO terms (title, description) VALUES (?, ?)';
  const params = [title, description];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error adding term" });
    }

    return res.status(200).json({ message: "Term added successfully" });
  });
});

// Update term
router.put('/update-term/:id', (req, res) => {
  const termId = req.params.id;
  const { title, description } = req.body;

  const sql = 'UPDATE terms SET title=?, description=? WHERE id=?';
  const params = [title, description, termId];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error updating term" });
    }

    return res.status(200).json({ message: "Term updated successfully" });
  });
});

// Delete term
router.delete('/delete-term/:id', (req, res) => {
  const termId = req.params.id;

  const sql = 'DELETE FROM terms WHERE id=?';
  const params = [termId];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Error deleting term" });
    }

    return res.status(200).json({ message: "Term deleted successfully" });
  });
});




module.exports = router;
