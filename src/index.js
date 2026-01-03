import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./database.js";
import cors from "cors";
import routes from "./routes.js";
import { WebSocketServer } from "ws";

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

const middleWare1 = (req, res, next) => {
  console.log(req.url);
  console.log(req.body);
  next();
};

app.use("/", middleWare1, routes);

const PORT = process.env.PORT;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

// const wss = new WebSocketServer({ server });

// const groups = new Map();

// wss.on("connection", (ws, req) => {
//   console.log(".............");
//   const roomId = req.url?.split("=")?.[1];
//   if (!roomId) return;

//   if (!groups.has(roomId)) {
//     groups.set(roomId, new Set());
//   }

//   groups.get(roomId).add(ws);

//   console.log("Client joined group:", roomId);

//   ws.on("message", (msg) => {});
//   ws.on("close", () => {
//     groups.get(roomId).delete(ws);
//     console.log("Client left:", roomId);

//     // clean empty groups
//     if (groups.get(roomId).size === 0) {
//       groups.delete(roomId);
//     }
//   });
// });

export function sendToGroup(roomId, message) {
  // try {
  //   if (!groups.has(roomId)) return;

  //   for (const client of groups.get(roomId)) {
  //     if (client.readyState === 1) {
  //       client.send(message);
  //     }
  //   }
  // } catch (error) {}
}
