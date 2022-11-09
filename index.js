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
async function run() {
  try {
    const servicesCollection = client
      .db("servicesReview")
      .collection("services");
    const reviewCollection = client.db("servicesReview").collection("reviews");
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
    // app.get("/reviews", async (req, res) => {
    //   const query = {};
    //   const cursor = reviewCollection.find(query);
    //   const reviews = await cursor.toArray();
    //   res.send(reviews);
    // });
    // app.get("/reviews", async (req, res) => {
    //   let query = {};
    //   const id = req.query.serviceID;

    //   if (id) {
    //     query = {
    //       serviceID: id,
    //     };
    //   }
    //   const cursor = reviewCollection.find(query).sort({ timestamp: -1 });
    //   const review = await cursor.toArray();

    //   res.send(review);
    // });
    app.get("/reviews", async (req, res) => {
      let query = {};
      const email = req.query.email;
      console.log(email);

      if (email) {
        query = {
          email: email,
        };
      }
      const cursor = reviewCollection.find(query).sort({ timestamp: -1 });
      const review = await cursor.toArray();

      res.send(review);
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
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
