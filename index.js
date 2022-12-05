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
    const todosCounterCollection = client.db("todo-app").collection("counter");

    // create new todo
    app.post("/todo", async (req, res) => {
      const newTodo = req.body;
      // todo description missing handel
      if (!newTodo.description) {
        res.status(400).send({ message: "Todo description missing" });
        return;
      }

      // add id on todo with auto increment
      todosCounterCollection.findOneAndUpdate(
        { _id: "todoId" },
        { $inc: { id: 1 } },
        { new: true },
        (error, cd) => {
          // id increment set
          let count;
          if (cd?.value === null) {
            const newid = todosCounterCollection.insertOne({
              _id: "todoId",
              id: 1,
            });
            count = 1;
          } else {
            count = cd?.value?.id + 1;
          }
          newTodo.status = "pending";
          newTodo.id = count;
          const result = todosCollection.insertOne(newTodo);
          res.status(201).send({ message: "New todo created" });
        }
      );
    });

    // get all todos
    app.get("/todos", async (req, res) => {
      const todos = await todosCollection.find({}).toArray();
      if (todos.length > 0) {
        res.status(202).send({ message: "success", data: todos });
      } else {
        res.status(400).send({ message: "Data not found" });
      }
    });

    // get single todo
    app.get("/todo/:id", async (req, res) => {
      const todo = await todosCollection.findOne({
        id: Number(req.params.id),
      });
      if (todo) {
        res.status(202).send({ message: "success", data: todo });
      } else {
        res.status(404).send({ message: "Data not found" });
      }
    });

    // update todo status
    app.post("/todo/:id/done", async (req, res) => {
      const status = req.path.split("/")[3];
      const updateStatus = {
        $set: {
          status: status,
        },
      };
      const todo = await todosCollection.updateOne(
        {
          id: Number(req.params.id),
        },
        updateStatus
      );

      if (todo.modifiedCount > 0) {
        res.status(200).send({ message: "Status Updated" });
      } else {
        res.status(400).send({ error: "Status update failed" });
      }
    });

    // delete todo
    try {
      app.delete("/todo/:id/delete", async (req, res) => {
        const todo = await todosCollection.deleteOne({
          id: Number(req.params.id),
        });
        if (todo.deletedCount > 0) {
          res.status(200).send({ message: "Delete Success" });
        } else {
          res.status(400).send({ error: "Operation failed" });
        }
      });
    } catch (error) {
      console.log(error);
      res.status(400).send({ error: "Operation failed" });
    }
  } catch {
    // client.close()
  }
}

run().catch((error) => console.log(error));

app.listen(port, () => {
  console.log("Todo App Running on", port);
});
