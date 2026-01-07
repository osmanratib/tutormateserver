// index.js
require('dotenv').config(); // Load .env variables at the very top

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ---------- CLOUDINARY CONFIG ----------
cloudinary.config({
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
 api_key: process.env.CLOUDINARY_API_KEY,
 api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Debug: check if Cloudinary keys loaded
console.log("Cloudinary Config:", {
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
 api_key: process.env.CLOUDINARY_API_KEY,
 api_secret: process.env.CLOUDINARY_API_SECRET ? 'loaded' : 'missing'
});

// ---------- MONGODB CONFIG ----------
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASSWORD_DB}@cluster0.vxwdk0h.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
 serverApi: {
  version: ServerApiVersion.v1,
  strict: true,
  deprecationErrors: true,
 }
});

// ---------- MULTER SETUP ----------
const upload = multer({ storage: multer.memoryStorage() });

// ---------- HELPER FUNCTION TO UPLOAD TO CLOUDINARY ----------
const uploadToCloudinary = (buffer) => {
 return new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
   { folder: "tutors" },
   (error, result) => {
    if (result) resolve(result);
    else reject(error);
   }
  );
  streamifier.createReadStream(buffer).pipe(stream);
 });
};

// ---------- MAIN FUNCTION ----------
async function run() {
 try {
  const tutorCollections = client.db("TutorsDB").collection("Tutors");
  const confirmTutorCollection = client.db("confirmDB").collection("confirmTutors");
  const userCollection = client.db("userDB").collection("users");
  const studentCollection = client.db("studentDB").collection("students");


  // Root
  app.get('/', (req, res) => {
   res.send('User management server is running');
  });

  // tutors
  app.get('/tutors', async (req, res) => {
   const tutors = await tutorCollections.find().toArray();
   res.send(tutors);
  });

  app.get('/tutors/:id', async (req, res) => {
   const id = req.params.id;
   const tutor = await tutorCollections.findOne({ _id: new ObjectId(id) });
   res.send(tutor);
  });

  app.delete('/tutors/:id', async (req, res) => {
   const id = req.params.id;
   const result = await tutorCollections.deleteOne({ _id: new ObjectId(id) });
   res.send(result);
  });

  // Upload tutor with image
  app.post('/tutors', upload.single('file'), async (req, res) => {
   console.log("REQ FILE:", req.file);
   console.log("REQ BODY:", req.body);

   if (!req.file) return res.status(400).send({ error: 'No file uploaded' });

   try {
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
    console.log("Cloudinary Result:", cloudinaryResult);

    const tutor = {
     name: req.body.name,
     dept: req.body.dept,
     university: req.body.university,
     college: req.body.college,
     exp: req.body.exp,
     phone: req.body.phone,
     image: cloudinaryResult.secure_url,
    };

    const result = await tutorCollections.insertOne(tutor);
    res.send(result);
   } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    res.status(500).send({ error: 'Image upload failed', details: error.message });
   }
  });

  // confirm tutor 
  app.get('/confirm', async (req, res) => {
   const confirms = await confirmTutorCollection.find().toArray();
   res.send(confirms);
  });

  app.post('/confirm', async (req, res) => {
   const result = await confirmTutorCollection.insertOne(req.body);
   res.send(result);
  });

  app.delete('/confirm/:id', async (req, res) => {
   const id = req.params.id;
   const result = await confirmTutorCollection.deleteOne({ _id: new ObjectId(id) });
   res.send(result);
  });

  // users
  app.get('/users', async (req, res) => {
   const users = await userCollection.find().toArray();
   res.send(users);
  });

  app.post('/users', async (req, res) => {
   const result = await userCollection.insertOne(req.body);
   res.send(result);
  });

  app.delete('/users/:id', async (req, res) => {
   const id = req.params.id;
   const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
   res.send(result);
  });

  // students  

  app.get('/students', async (req, res) => {
   const users = await studentCollection.find().toArray();
   res.send(users);
  })

  app.post('/students', async (req, res) => {
   const user = req.body;
   const result = await studentCollection.insertOne(user);
   res.send(result);
  })




 } finally {
  // Keep MongoDB client open
 }
}

run().catch(console.error);

// Start server
app.listen(port, () => {
 console.log(`Server running on port ${port}`);
});
