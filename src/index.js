import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./database.js";
import cors from "cors";
import routes from "./routes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors());

await connectDB();

app.get("", async (req, res) => {
  return res.json({
    app: "POCKER api API's",
    status: "WORKING",
    version: "0.0.2",
  });
});

app.use("/", routes);


const PORT = process.env.PORT;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);