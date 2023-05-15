// Import necessary packages
const express = require("express");
const path = require("path");
const pool = require("../config");
const fs = require("fs");
const Joi = require("joi");

// Define a router
router = express.Router();

// Set up multer for file upload
const multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./static/uploads");
  },
  filename: function (req, file, callback) {
    callback(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer(
  {
    storage: storage,
    limits: { fileSize: 1000000 },
  });

// Handle POST request to create a blog post
router.post("/blogs", upload.array("myImage", 5), async function (req, res, next) {
  try {
    // Validate the request body using Joi schema
    await createblog.validateAsync(req.body, { abortEarly: false })
  } catch (err) {
    // If validation fails, send an error response
    return res.status(400).json(err.message)
  }

  if (req.method == "POST") {
    const file = req.files;
    let pathArray = [];

    if (file.length === 0) {
      return res.status(400).send("Please upload a file" );
    }

    // Extract data from request body
    const title = req.body.title;
    const content = req.body.content;
    const status = req.body.status == "status_public"? "01" : "02";
    const pinned = req.body.pinned;
    const reference = req.body.reference;
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;

    // Get a database connection and begin a transaction
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // Insert the blog post into the database
      let results = await conn.query(
        "INSERT INTO blogs(title, content, status, pinned, `like`,create_date, start_date, end_date, reference) VALUES(?, ?, ?, ?, 0,CURRENT_TIMESTAMP, ?, ?, ?);",
        [title, content, status, pinned, start_date, end_date, reference]
      );
      const blogId = results[0].insertId;

      // Insert the file paths into the database
      req.files.forEach((file, index) => {
        let path = [blogId, file.path.substring(6), index == 0 ? 1 : 0];
        pathArray.push(path);
      });
      await conn.query(
        "INSERT INTO images(blog_id, file_path, main) VALUES ?;",
        [pathArray]
      );

      // Commit the transaction and send a success response
      await conn.commit();
      res.send("success!");
    } catch (err) {
      // If an error occurs, rollback the transaction and send an error response
      await conn.rollback();
      return res.status(400).json(err.toString());
    } finally {
      // Release the database connection
      conn.release();
    }
  }
});


// This code uses the multer middleware to handle file uploads. When a POST request is made to the /blogs endpoint, the upload.array("myImage", 5) function is called, which tells multer to expect an array of up to 5 files with the field name "myImage". These uploaded files are stored on disk using the diskStorage function, which specifies the destination directory and filename format for each uploaded file.

// Once the files are uploaded, the code checks if any files were actually uploaded by checking the length of the req.files array. If no files were uploaded, the code returns a 400 error with a message asking the user to upload a file.

// If files were uploaded, the code extracts the relevant information from the request body (title, content, status, pinned, reference, start_date, end_date) and begins a database transaction. The forEach loop then iterates over each uploaded file and creates an array of tuples that contain the blog ID, file path, and a flag indicating whether the file is the main image or not.

// Finally, the code inserts the blog and image data into the database using prepared statements, commits the transaction if everything was successful, and returns a "success!" message to the client. If an error occurs during any part of the process, the transaction is rolled back and an error message is returned instead.