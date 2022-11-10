const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();

const port = process.env.PORT || 5000;

//middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ouw6pvz.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "Unauthenticated" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const servicesCollection = client
      .db("servicesReview")
      .collection("services");
    const reviewCollection = client.db("servicesReview").collection("reviews");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.get("/services", async (req, res) => {
      const size = parseInt(req.query.size);
      // console.log("size:", size);
      const query = {};
      const cursor = servicesCollection.find(query).sort({ timestamp: -1 });
      const services = await cursor.limit(size).toArray();
      res.send(services);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await servicesCollection.findOne(query);

      res.send(service);
    });

    //review api

    app.get("/my-reviews", auth, async (req, res) => {
      if (req.decoded.email !== req.query.email) {
        res.status(403).send({ message: "invalid token" });
      }
      let query = {};
      const email = req.query.email;

      if (email) {
        query = {
          email: email,
        };
      }
      const cursor = reviewCollection.find(query).sort({ timestamp: -1 });
      const review = await cursor.toArray();

      res.send(review);
    });

    app.get("/reviews", async (req, res) => {
      let query = {};
      if (req.query.serviceID) {
        query = {
          serviceID: req.query.serviceID,
        };
      }
      const cursor = reviewCollection.find(query).sort({ timestamp: -1 });
      const review = await cursor.toArray();
      res.send(review);
    });
    app.get("/reviews", async (req, res) => {
      const query = {};
      const result = await reviewCollection.find(query);
      res.send(result);
    });
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const review = await reviewCollection.findOne(query);

      res.send(review);
    });
    //update reviews

    app.patch("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          status: status,
        },
      };
      const result = await reviewCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    //delete reviews

    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/reviews", async (req, res) => {
      const reviews = req.body;
      const result = await reviewCollection.insertOne(reviews);
      res.send(result);
    });
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await servicesCollection.insertOne(service);
      res.send(result);
    });
  } catch (error) {}
}
run().catch((error) => console.error(error.bgRed));

app.get("/", (req, res) => {
  res.send("review server is running");
});

app.listen(port, () => {
  console.log(`server running on port: ${port}`);
});
