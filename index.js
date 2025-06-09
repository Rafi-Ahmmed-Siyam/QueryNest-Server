require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 7000;

// Middlewear
app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Custom Middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).send({ message: 'Unauthoeized Access' })

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) return res.status(401).send({ message: 'Unauthoeized Access' });
    req.user = decoded

    
  })
  next();
}

const verifyEmailMatch = ()=>{
  return (req,res,next)=>{
    const emailFromParams = req.params.email;
    const emailFromToken = req?.user?.email;
    if(emailFromParams !== emailFromToken) return res.status(403).send({ message: "Forbidden Access" });

    next()
  }
}

// mongoDB
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.wsg3r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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

    const queryCollection = client.db("QueryNestCollection").collection("queries");
    const recommendationCollection = client.db("QueryNestCollection").collection("Recommendations");

    // Create jwtToken
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = await jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ message: "Login Successfull" });

    })

    // DeleteToken from httpOnly cookie
    app.get('/logOut', async (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ message: "LogOut Successfull" })
    })

    // Add Query
    app.post('/add-query', async (req, res) => {
      const query = req.body;

      const result = await queryCollection.insertOne(query);
      res.send(result)
    })

    // Get all queries
    app.get('/queries', async (req, res) => {
      const { home, category } = req.query;

      let query = {}
      if (category) {
        query.queryCategory = category;
      }
      const option = { sort: { 'queryPoster.currentDateAndTime': -1 } };
      if (home) {
        option.limit = 7;
      }
      const result = await queryCollection.find(query, option).toArray()
      res.send(result);
    })

    // Get user posted query by email and sort in decending order;
    app.get('/queries/:email', verifyToken, verifyEmailMatch(), async (req, res) => {
      const email = req.params.email;
      const query = { 'queryPoster.email': email };
      const option = { sort: { 'queryPoster.currentDateAndTime': -1 } }
      const result = await queryCollection.find(query, option).toArray();
      res.send(result);
    })

    // Get one query by ID------
    app.get('/query/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await queryCollection.findOne(query);
      res.send(result)
    })

    // Delete a posted query--
    app.delete('/delete-query/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await queryCollection.deleteOne(query);
      res.send(result)
    })

    // update query------->
    app.put('/update-query/:id', async (req, res) => {
      const id = req.params.id;
      const updateQuery = req.body;
      const filter = { _id: new ObjectId(id) }
      const option = { upsert: true }
      const updatedDocs = {
        $set: updateQuery,
      }
      const result = await queryCollection.updateOne(filter, updatedDocs, option);
      res.send(result);
    })

    // Add Recommendation
    app.post('/add-recommendation', async (req, res) => {
      const recommendData = req.body;

      if (recommendData?.recommenderEmail === recommendData?.queryCreator) return res.status(403).send({ message: "You cannot recommend on your own query." })

      const result = await recommendationCollection.insertOne(recommendData); // Recommendation store in db

      const filter = { _id: new ObjectId(recommendData?.queryId) }
      const update = {
        $inc: {
          'queryPoster.recommendationCount': 1
        }
      }
      const updateRecoCount = await queryCollection.updateOne(filter, update)
      res.send(result)
    })
    // Get all recommendation
    app.get('/recommendations', async (req, res) => {
      const result = await recommendationCollection.find().toArray();
      res.send(result)
    })

    // get Recommendation By id 
    app.get('/recommendation/:id', async (req, res) => {
      const queryId = req.params.id;
      const filter = { queryId: queryId };
      const result = await recommendationCollection.find(filter).toArray()
      res.send(result)

    })

    // Get Recomender Recmmendation data
    app.get('/recommender-data/:email', async (req, res) => {
      const email = req.params.email;
      const { recommender } = req.query;

      const query = {};
      if (recommender) {
        query.recommenderEmail = email;
      } else {
        query.queryCreator = email;
      }
      const option = { sort: { recommendedAt: -1 } }
      const result = await recommendationCollection.find(query, option).toArray();
      res.send(result)

    })
    // Delete Recommendation
    app.delete('/delete-recommendetion/:id', async (req, res) => {
      const id = req.params.id;
      const queryId = req.query.queryId
      const query = { _id: new ObjectId(id) }
      const filter = { _id: new ObjectId(queryId) }

      const update = {
        $inc: {
          'queryPoster.recommendationCount': -1
        }
      }

      const dicRecoValue = await queryCollection.updateOne(filter, update);
      const result = await recommendationCollection.deleteOne(query)
      res.send(result)
    })

    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);








app.get('/', (req, res) => {
  res.send("This server is for QueryNest");
});

app.listen(port, () => {
  console.log(`The Port is now running in ${port}`);
});


// queryNest246810KTd
// Query-Nest