const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};

//middlewares
app.use(cors(corsOptions));
app.use(express.json());
// app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nrdgddr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();

    const assignmentCollection = client
      .db("academiaAlliance")
      .collection("assignments");

    const submittedAssignmentCollection = client
      .db("academiaAlliance")
      .collection("submittedAssignment");

    // create assignment crud api's

    app.post("/add-assignment", async (req, res) => {
      const data = req.body;
      // return console.log(data)
      const result = await assignmentCollection.insertOne(data);
      res.send(result);
    });

    app.get("/assignments", async (req, res) => {
      const result = await assignmentCollection.find().toArray();
      res.send(result);
    });

    app.get("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });

    app.delete("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/update-assignment/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...data,
        },
      };
      const result = await assignmentCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    //submit assignment crud api's

    app.post("/submit-assignment", async (req, res) => {
      const data = req.body;
      const result = await submittedAssignmentCollection.insertOne(data);
      res.send(result);
    });

    app.get("/mySubmitted", async (req, res) => {
      const email = req.query.email;
      const query = { examineeEmail: email };
      const result = await submittedAssignmentCollection.find(query).toArray();
      res.send(result);
    });

    //get pending assignments
    app.get("/pending-assignments", async (req, res) => {
      const queryStatus = req.query.status;
      const query = { status: queryStatus };
      const result = await submittedAssignmentCollection.find(query).toArray();
      res.send(result);
    });

    //update seen assignment
    app.put("/update-marks/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          obtainedMarks: data.obtainedMarks,
          feedback: data.feedback,
          status: data.status,
        },
      };
      const result = await submittedAssignmentCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
  res.send("Hello from Academia Alliance server!");
});

app.listen(port, () => {
  console.log(`my app is listening on port ${port}`);
});
