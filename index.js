const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
require("dotenv").config();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://academia-alliance.web.app",
    "https://academia-alliance.firebaseapp.com",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

//middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

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

//my middlewares
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }
    req.user = decoded;
    next();
  });
};

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

    app.post("/add-assignment", verifyToken, async (req, res) => {
      const data = req.body;
      // return console.log(data)
      if (req.user.email !== data.assignment_creator) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const result = await assignmentCollection.insertOne(data);
      res.send(result);
    });

    app.get("/assignments", async (req, res) => {
      const page = parseFloat(req.query.page);
      const size = parseFloat(req.query.size);
      const filter = req.query.filter;
      let query = {};
      if (filter) query.difficulty = filter;
      const result = await assignmentCollection
        .find(query)
        .skip(page * size)
        .limit(size)
        .toArray();
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

    app.put("/update-assignment/:id", verifyToken, async (req, res) => {
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

    app.post("/submit-assignment", verifyToken, async (req, res) => {
      const data = req.body;
      if (req.user.email !== data.examineeEmail) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const result = await submittedAssignmentCollection.insertOne(data);
      res.send(result);
    });

    app.get("/mySubmitted", verifyToken, async (req, res) => {
      const email = req.query.email;
      if (req.user.email !== email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const query = { examineeEmail: email };
      const result = await submittedAssignmentCollection.find(query).toArray();
      res.send(result);
    });

    //get pending assignments
    app.get("/pending-assignments", verifyToken, async (req, res) => {
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

    app.get("/submitted-assignments", async (req, res) => {
      const result = await submittedAssignmentCollection.find().toArray();
      res.send(result);
    });

    // auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res
        .clearCookie("token", {
          maxAge: 0,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          secure: true,
        })
        .send({ success: true });
    });

    //pagination related api
    //get assignment count
    app.get("/getCount", async (req, res) => {
      const filter = req.query.filter;
      let query = {};
      if (filter) query.difficulty = filter;
      const count = await assignmentCollection.countDocuments(query);
      res.send({ count });
    });

    //get filtered jobs for filtering and pagination
    // app.get("/all-job", async (req, res) => {
    //   const page = parseFloat(req.query.page);
    //   const size = parseFloat(req.query.size);
    //   const filter = req.query.filter;
    //   const sort = req.query.sort;
    //   const search = req.query.search;
    //   let query = {
    //     job_title: { $regex: search, $options: "i" },
    //   };
    //   if (filter) query.category = filter;
    //   let options = {};
    //   if (sort) options = { sort: { deadline: sort === "asc" ? 1 : -1 } };
    //   const result = await jobCollection
    //     .find(query, options)
    //     .skip(page * size)
    //     .limit(size)
    //     .toArray();
    //   res.send(result);
    // });

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
