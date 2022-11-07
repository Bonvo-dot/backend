const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const path = require("path");
const { Storage } = require("@google-cloud/storage");
const Multer = require("multer");
const { project_id } = require("./bonvo.json");

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // No larger than 5mb, change as you need
  },
});

const keyFilename = "bonvo.json"; // Get this from Google Cloud -> Credentials -> Service Accounts
const storage = new Storage({
  project_id,
  keyFilename,
});

const bucket = storage.bucket("bonvo-bucket"); // Get this from Google Cloud -> Storage

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Gets all files in the defined bucket
app.get("/upload", async (req, res) => {
  try {
    const [files] = await bucket.getFiles();
    const lastUrl = files.slice(-1)[0].publicUrl();
    const response = {
      lastUrl,
      files: files.map((file) => file.publicUrl()),
    };
    res.send(response);
    console.log("response", response);
    console.log("Success");
  } catch (error) {
    res.send("Error:" + error);
  }
});

// Streams file upload to Google Storage
app.post("/upload", multer.single("image"), (req, res) => {
  console.log("Made it /upload");
  try {
    if (req.file) {
      console.log("File found, trying to upload...");
      const blob = bucket.file(req.file.originalname);
      const blobStream = blob.createWriteStream();

      blobStream.on("finish", () => {
        console.log("Success");
        res.status(200).send("Success");
      });
      blobStream.end(req.file.buffer);
    } else throw "error with img";
  } catch (error) {
    console.log("Error:" + error);
    res.status(500).send(error);
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start the server on port 8080 or as defined
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
