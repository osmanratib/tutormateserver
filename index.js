const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "public/images/uploads")));

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASSWORD_DB}@cluster0.vxwdk0h.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
 serverApi: {
  version: ServerApiVersion.v1,
  strict: true,
  deprecationErrors: true,
 },
});

let tutorCollections;
let confirmTutorCollection;
let userCollection;

async function connectDB() {
 if (!tutorCollections) {
  await client.connect();
  tutorCollections = client.db("TutorsDB").collection("Tutors");
  confirmTutorCollection = client.db("confirmDB").collection("confirmTutors");
  userCollection = client.db("userDB").collection("users");
 }
}
connectDB();

const storage = multer.diskStorage({
 destination: function (req, file, cb) {
  cb(null, "./public/images/uploads");
 },
 filename: function (req, file, cb) {
  crypto.randomBytes(12, function (err, bytes) {
   const fn = bytes.toString("hex") + path.extname(file.originalname);
   cb(null, fn);
  });
 },
});

const upload = multer({ storage });

app.get("/api", (req, res) => {
 res.send("TutorMate server running");
});

app.get("/api/tutors", async (req, res) => {
 const result = await tutorCollections.find().toArray();
 res.send(result);
});

app.get("/api/tutors/:id", async (req, res) => {
 const id = req.params.id;
 const result = await tutorCollections.findOne({ _id: new ObjectId(id) });
 res.send(result);
});

app.post("/api/tutors", upload.single("file"), async (req, res) => {
 const user = {
  name: req.body.name,
  dept: req.body.dept,
  university: req.body.university,
  college: req.body.college,
  exp: req.body.exp,
  phone: req.body.phone,
  image: req.file?.filename || "",
 };
 const result = await tutorCollections.insertOne(user);
 res.send(result);
});

app.delete("/api/tutors/:id", async (req, res) => {
 const id = req.params.id;
 const result = await tutorCollections.deleteOne({ _id: new ObjectId(id) });
 res.send(result);
});

app.get("/api/confirm", async (req, res) => {
 const result = await confirmTutorCollection.find().toArray();
 res.send(result);
});

app.post("/api/confirm", async (req, res) => {
 const result = await confirmTutorCollection.insertOne(req.body);
 res.send(result);
});

app.delete("/api/confirm/:id", async (req, res) => {
 const id = req.params.id;
 const result = await confirmTutorCollection.deleteOne({ _id: new ObjectId(id) });
 res.send(result);
});

app.get("/api/users", async (req, res) => {
 const result = await userCollection.find().toArray();
 res.send(result);
});

app.post("/api/users", async (req, res) => {
 const result = await userCollection.insertOne(req.body);
 res.send(result);
});

app.delete("/api/users/:id", async (req, res) => {
 const id = req.params.id;
 const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
 res.send(result);
});

module.exports = app;
