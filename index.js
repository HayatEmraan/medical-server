const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1ki0ifk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("doctorMedical").collection("doctorBook");
    app.post("/orderbook", async (req, res) => {
      const book = req.body;
      const result = await database.insertOne(book);
      res.send(result);
    });
    app.get(
      "/orderbook/booking",
      function (req, res, next) {
        const authorization = req.headers.authorization;
        if (!authorization) {
          return res.status(401).send("Unauthorized Access");
        }
        const token = authorization.split(" ")[1];
        jwt.verify(token, process.env.DB_ACCESS_KEY, function (error, decoded) {
          if (error) {
            return res.status(401).send("Unauthorized Access");
          }
          req.decoded = decoded;
          next();
        });
      },
      async (req, res) => {
        if (req.decoded.email !== req.query.email) {
          return res.status(401).send("Unauthorized Access");
        }
        const query = req.query;
        // console.log(query);
        const result = await database.find({ email: query.email }).toArray();
        res.send(result);
      }
    );
    app.delete("/orderbook/booking/:id", async (req, res) => {
      const params = req.params.id;
      const result = await database.deleteOne({ _id: new ObjectId(params) });
      res.send(result);
    });

    app.post("/twt", (req, res) => {
      const data = req.body;
      const token = jwt.sign(data, process.env.DB_ACCESS_KEY, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port);
