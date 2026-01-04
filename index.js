const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('multer-streamifier');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

// middle ware 
app.use(cors());
app.use(express.json());

// configure cloudinary
cloudinary.config({
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
 api_key: process.env.CLOUDINARY_API_KEY,
 api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB setup
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASSWORD_DB}@cluster0.vxwdk0h.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
 serverApi: {
  version: ServerApiVersion.v1,
  strict: true,
  deprecationErrors: true,
 }
});

// multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

// helper to upload to cloudinary
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

async function run() {
 try {
  const tutorCollections = client.db("TutorsDB").collection("Tutors");
  const confirmTutorCollection = client.db("confirmDB").collection("confirmTutors");
  const userCollection = client.db('userDB').collection('users');

  // Get all tutors
  app.get('/tutors', async (req, res) => {
   const cursor = tutorCollections.find();
   const result = await cursor.toArray();
   res.send(result);
  });

  // Get tutor by id
  app.get('/tutors/:id', async (req, res) => {
   const id = req.params.id;
   const query = { _id: new ObjectId(id) };
   const result = await tutorCollections.findOne(query);
   res.send(result);
  });

  // Delete tutor
  app.delete('/tutors/:id', async (req, res) => {
   const id = req.params.id;
   const query = { _id: new ObjectId(id) };
   const result = await tutorCollections.deleteOne(query);
   res.send(result);
  });

  // Upload tutor (Cloudinary)
  app.post('/tutors', upload.single('file'), async (req, res) => {
   try {
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer);

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
    console.error(error);
    res.status(500).send({ error: 'Image upload failed' });
   }
  });

  // Confirm tutors
  app.get('/confirm', async (req, res) => {
   const cursor = confirmTutorCollection.find();
   const result = await cursor.toArray();
   res.send(result);
  });

  app.post('/confirm', async (req, res) => {
   const user = req.body;
   const result = await confirmTutorCollection.insertOne(user);
   res.send(result);
  });

  app.delete('/confirm/:id', async (req, res) => {
   const id = req.params.id;
   const result = await confirmTutorCollection.deleteOne({ _id: id });
   res.send(result);
  });

  // Users
  app.get('/users', async (req, res) => {
   const cursor = userCollection.find();
   const result = await cursor.toArray();
   res.send(result);
  });

  app.post('/users', async (req, res) => {
   const user = req.body;
   const result = await userCollection.insertOne(user);
   res.send(result);
  });

  app.delete('/users/:id', async (req, res) => {
   const id = req.params.id;
   const query = { _id: new ObjectId(id) };
   const result = await userCollection.deleteOne(query);
   res.send(result);
  });

 } finally {
  // client.close(); // leave commented
 }
}
run().catch(console.dir);

app.get('/', (req, res) => {
 res.send('user management server is running ');
});

app.listen(port, () => {
 console.log(`server is running on port ${port}`);
});
