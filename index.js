require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nbrbbe5.mongodb.net/?appName=Cluster0`;

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

    // Update Role (Only Admin)
    app.patch("/users/:id/role", async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;

      const result = await users.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } }
      );

      res.send(result);
    });

    // Update Approve User
    app.patch("/users/:id/approve", async (req, res) => {
      const id = req.params.id;

      const result = await users.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "approved", suspendReason: "" } }
      );

      res.send(result);
    });

    // Update Suspend User (Only Admin)
    app.patch("/users/:id/suspend", async (req, res) => {
      const id = req.params.id;
      const { reason } = req.body;

      const result = await users.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "suspended", suspendReason: reason } }
      );

      res.send(result);
    });

    // Get Role / Status by Email
    app.get("/users/role/:email", async (req, res) => {
      const user = await users.findOne({ email: req.params.email });
      res.send(user || {});
    });

    // -----------------------------
    // PRODUCT APIS
    // -----------------------------

    // Add Product (Manager Only)
    app.post("/products", async (req, res) => {
      const p = req.body;

      p.createdAt = new Date();
      p.showOnHome = Boolean(p.showOnHome);

      const result = await products.insertOne(p);
      res.send(result);
    });

    // Get All Products
    app.get("/products", async (req, res) => {
      const result = await products.find().sort({ createdAt: -1 }).toArray();
      res.send(result);
    });

    // Get Home Products (limit = 6)
    app.get("/products/home", async (req, res) => {
      const result = await products
        .find({ showOnHome: true })
        .limit(6)
        .toArray();

      res.send(result);
    });

    // Get Product by ID
    app.get("/products/:id", async (req, res) => {
      const result = await products.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // Update Product (Admin or Manager)
    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;

      const result = await products.updateOne(
        { _id: new ObjectId(id) },
        { $set: body }
      );

      res.send(result);
    });

    // Delete Product
    app.delete("/products/:id", async (req, res) => {
      const result = await products.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // -----------------------------
    // ORDER APIS
    // -----------------------------

    // Create Order (Buyer)
    app.post("/orders", async (req, res) => {
      const order = req.body;

      order.status = "pending";
      order.createdAt = new Date();

      const result = await orders.insertOne(order);
      res.send(result);
    });

    // Get Orders by User Email
    app.get("/orders/user/:email", async (req, res) => {
      const result = await orders
        .find({ email: req.params.email })
        .sort({ createdAt: -1 })
        .toArray();
      res.send(result);
    });

    // Get All Orders (Admin Only)
    app.get("/orders", async (req, res) => {
      const result = await orders.find().sort({ createdAt: -1 }).toArray();
      res.send(result);
    });

    // Approve / Reject Order (Manager)
    app.patch("/orders/:id/status", async (req, res) => {
      const update = req.body;

      const result = await orders.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: update }
      );

      res.send(result);
    });

    // Cancel Order (Buyer)
    app.delete("/orders/:id", async (req, res) => {
      const result = await orders.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // -----------------------------
    // TRACKING APIS
    // -----------------------------

    // Add Tracking Step (Manager)
    app.post("/tracking/:orderId", async (req, res) => {
      const step = {
        orderId: req.params.orderId,
        ...req.body,
        timestamp: new Date(),
      };

      const result = await tracking.insertOne(step);
      res.send(result);
    });

    // Get Tracking Timeline
    app.get("/tracking/:orderId", async (req, res) => {
      const result = await tracking
        .find({ orderId: req.params.orderId })
        .sort({ timestamp: 1 })
        .toArray();
      res.send(result);
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
