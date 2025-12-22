import express from "express";
import mongoose from "mongoose";
const router = express.Router();

router.get("/api/accounts", async (req, res) => {
  const collection = mongoose.connection.db.collection("wallets");
  const data = await collection
    .find({}, { projection: { _id: 0, a: 1, b: 1, n: 1 } })
    .skip(0)
    .limit(100)
    .sort({ _id: -1 })
    .toArray();
  const total = await collection.countDocuments();
  return res.json({ data, total });
});

router.get("/api/transactions", async (req, res) => {
  const collection = mongoose.connection.db.collection("txns");
  const data = await collection
    .find({}, { projection: { _id: 0, th: 1, v: 1, f: 1, t: 1, gu: 1, ca: 1 } })
    .skip(0)
    .limit(100)
    .sort({ _id: -1 })
    .toArray();
  const total = await collection.countDocuments();
  return res.json({ data, total });
});

router.get("/api/blocks", async (req, res) => {
  const collection = mongoose.connection.db.collection("blocks");
  const data = await collection
    .find(
      {},
      {
        projection: {
          _id: 0,
          bh: 1,
          ph: 1,
          bn: 1,
          ph: 1,
          tsx: 1,
          ts: 1,
          ca: 1,
        },
      }
    )
    .skip(0)
    .limit(100)
    .sort({ _id: -1 })
    .toArray();
  const total = await collection.countDocuments();
  return res.json({ data, total });
});

router.post("/pocker-api/create-room", (req, res) => {
  // "number_of_players": 4,
  // "names": ["Alice", "Bob", "Chloe", "Dan"],
  // "max_amount": 200,
  // "min_amount":

  if (req?.body?.names?.length < 2 && req?.body?.names?.length > 9)
    return res.status(400).json({ error: "Invalid Count" });

  const acccounts = [];

  for (let i = 0; i < req?.body?.names.length; i++) {
    const name = req?.body?.names[i];
    acccounts.push({
      id: i,
      name: name,
      address: "Ox000000000000000000000000000000000000000" + i,
    });
  }

  const result = {
    room_id: "12345",
    acccounts,
  };
  return res.json(result);
});

export default router;
