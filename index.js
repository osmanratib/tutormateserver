const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

// middle ware 
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/images/uploads')));


const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASSWORD_DB}@cluster0.vxwdk0h.mongodb.net/?appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
 serverApi: {
  version: ServerApiVersion.v1,
  strict: true,
  deprecationErrors: true,
 }
});

async function run() {
 try {
  // Connect the client to the server	(optional starting in v4.7)
  // await client.connect();


  const tutorCollections = client.db("TutorsDB").collection("Tutors");
  const confirmTutorCollection = client.db("confirmDB").collection("confirmTutors");
  const userCollection = client.db('userDB').collection('users');

  //tutors
  app.get('/tutors', async (req, res) => {
   const cursor = tutorCollections.find();
   const result = await cursor.toArray();
   res.send(result);
  })

  app.get('/tutors/:id', async (req, res) => {
   const id = req.params.id
   const query = { _id: new ObjectId(id) };
   const result = await tutorCollections.findOne(query);
   res.send(result);
  })

  // delete tutors 
  app.delete('/tutors/:id', async (req, res) => {
   const id = req.params.id;
   const query = { _id: new ObjectId(id) };
   const result = await tutorCollections.deleteOne(query);
   res.send(result);
  })


  // image disk storage 
  const storage = multer.diskStorage({
   destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
   },
   filename: function (req, file, cb) {
    crypto.randomBytes(12, function (err, bytes) {
     const fn = bytes.toString("hex") + path.extname(file.originalname);
     cb(null, fn)
    })
   }
  })
  const upload = multer({ storage: storage })

  app.post('/tutors', upload.single('file'), async (req, res) => {
   console.log(req.file);
   const user = {
    name: req.body.name,
    dept: req.body.dept,
    university: req.body.university,
    college: req.body.college,
    exp: req.body.exp,
    phone: req.body.phone,
    image: req.file.filename,
   };
   const result = await tutorCollections.insertOne(user);
   res.send(result);
  });


  // confirm tutors ,
  app.get('/confirm', async (req, res) => {
   const cursor = confirmTutorCollection.find();
   const result = await cursor.toArray();
   res.send(result)
  })

  app.post('/confirm', async (req, res) => {
   const user = req.body;
   console.log(req.body);
   const result = await confirmTutorCollection.insertOne(user);
   res.send(result);
  })

  app.delete('/confirm/:id', async (req, res) => {
   const id = req.params.id;
   const result = await confirmTutorCollection.deleteOne({ _id: id });
   res.send(result);
  });

  // users 

  app.get('/users', async (req, res) => {
   const cursor = userCollection.find();
   const result = await cursor.toArray();
   res.send(result);
  })

  app.post('/users', async (req, res) => {
   const user = req.body;
   console.log(user);
   const result = await userCollection.insertOne(user);
   res.send(result);
  });

  app.delete('/users/:id', async (req, res) => {
   const id = req.params.id;
   const query = { _id: new ObjectId(id) };
   const result = await userCollection.deleteOne(query);
   res.send(result);
  })



  // Send a ping to confirm a successful connection
  // await client.db("admin").command({ ping: 1 });
  // console.log("Pinged your deployment. You successfully connected to MongoDB!");
 } finally {
  // Ensures that the client will close when you finish/error
  // await client.close();
 }
}
run().catch(console.dir);


app.get('/', (req, res) => {
 res.send('user management server is running ');
})

app.listen(port, () => {
 console.log(`server is running on port ${port}`);
})

