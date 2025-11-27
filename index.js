const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.qwpevua.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("shop");
    const productsCollection = db.collection("products");
    console.log("MongoDB Connected!");

    // GET all products
    app.get("/products", async (req, res) => {
      const category = req.query.category;
      const query = category
        ? { category: { $regex: new RegExp(`^${category}$`, "i") } }
        : {};
      const products = await productsCollection.find(query).limit(50).toArray();
      res.json(products);
    });

    // GET single product
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id.trim();
      let query;
      if (ObjectId.isValid(id) && id.length === 24)
        query = { _id: new ObjectId(id) };
      else query = { _id: id };

      const product = await productsCollection.findOne(query);
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      res.json(product);
    });

    // POST Add Product
    app.post("/products", async (req, res) => {
      try {
        const {
          title,
          shortDescription,
          description,
          price,
          date,
          priority,
          image,
          userEmail,
          category,
          rating,
        } = req.body;

        if (!title || !price || !description || !userEmail)
          return res.status(400).json({ message: "Missing required fields" });

        const newProduct = {
          title,
          shortDescription: shortDescription || "",
          description,
          price,
          date: date || new Date(),
          priority: priority || "Normal",
          image: image || "",
          category: category || "Uncategorized",
          rating: rating || 0,
          userEmail,
          createdAt: new Date(),
        };

        const result = await productsCollection.insertOne(newProduct);
        res.status(201).json({
          message: "Product added successfully",
          productId: result.insertedId,
        });
      } catch (err) {
        console.error("Add Product Error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const query = ObjectId.isValid(id)
          ? { _id: new ObjectId(id) }
          : { _id: id };

        const result = await productsCollection.deleteOne(query);

        if (result.deletedCount === 0)
          return res.status(404).json({ message: "Product not found" });

        res.json({ message: "Product deleted successfully" });
      } catch (err) {
        res.status(500).json({ message: "Delete failed" });
      }
    });

    app.get("/", (req, res) => res.send("Shopigo Server Running!"));
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
