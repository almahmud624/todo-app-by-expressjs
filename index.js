const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
var ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 4000;
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.get("/", (req, res) => {
  res.send("Todo App is Running");
});

const uri = process.env.DB_URL;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const todosCollection = client.db("todo-app").collection("todos");

    // create new todos
    try {
      app.post("/todo", async (req, res) => {
        const newTodo = req.body;
        newTodo.status = "pending";
        // add id on todo with auto increment
        const updateId = await todosCollection.updateMany(
          {},
          { $inc: { id: 1 } }
        );
        const result = await todosCollection.insertOne(newTodo);
        res.status(201).send({ message: "New todo created" });
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({ err: "Something went wrong" });
    }
  } catch {
    // client.close()
  }
}

run().catch((error) => console.log(error));

app.listen(port, () => {
  console.log("Todo App Running on", port);
});
