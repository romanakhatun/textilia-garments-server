require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true },
});

async function run() {
  try {
    // await client.connect();

    const db = client.db("textila_db");

    const users = db.collection("users");
    const products = db.collection("products");
    const orders = db.collection("orders");
    const tracking = db.collection("tracking");

    // -----------------------------
    // USER APIS
    // -----------------------------

    // Register User (Firebase Auth handled client side)
    app.post("/users", async (req, res) => {
      const user = req.body;

      const exists = await users.findOne({ email: user.email });
      if (exists) return res.send({ message: "User already exists" });

      user.status = "pending";
      user.role = user.role || "buyer";
      user.createdAt = new Date();

      const result = await users.insertOne(user);
      res.send(result);
    });

    // All Users (Admin Only on Frontend)
    app.get("/users", async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });

    // Update User Role or Suspend
    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;

      const result = await users.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            role: body.role,
            status: body.status,
            suspendReason: body.suspendReason || "",
          },
        }
      );

      res.send(result);
    });

    // Get Role / Status by Email
    app.get("/users/role/:email", async (req, res) => {
      const user = await users.findOne({ email: req.params.email });
      res.send(user || {});
    });

    // -----------------------------
    // DEFAULT
    // -----------------------------
    app.get("/", (req, res) => {
      res.send("Textila Garments Order & Production API Running");
    });

    console.log("Server connected to MongoDB");
  } finally {
  }
}

run().catch(console.error);

app.listen(port, () => {
  console.log(`Smart server is running on port: ${port}`);
});
