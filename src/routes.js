import express from "express";
import Rooms from "./schemas/room.js";
import Players from "./schemas/player.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/api/room", async (req, res) => {
  // "number_of_players": 4,
  // "names": ["Alice", "Bob", "Chloe", "Dan"],
  // "max_amount": 200,
  // "min_amount":

  if (req?.body?.names?.length < 2 && req?.body?.names?.length > 9)
    return res.status(400).json({ error: "Invalid Count" });

  const acccounts = [];
  const roomId = new Date().getTime().toString(36);
  const room = await Rooms.create({
    roomId,
    users: acccounts,
    max: req?.body?.max_amount,
    min: req?.body?.min_amount,
  });

  for (let i = 0; i < req?.body?.names.length; i++) {
    const name = req?.body?.names[i];
    const poolAddress = "Ox000000000000000000000000000000000000000" + i;
    const player = await Players.create({
      room_Id: room._id,
      roomId,
      name,
      poolAddress,
    });
    acccounts.push({
      id: player._id,
      name: player.name,
      address: player.poolAddress,
    });
  }

  const result = { room_id: roomId, acccounts };

  return res.json(result);
});

router.get("/api/room", async (req, res) => {
  // req.params.roomId
  const room = await Rooms.findOne({ roomId: req.query.roomId });
  if (!room) return res.status(400).json({ error: "Wrong roomId" });
  const players = await Players.find({ roomId: req.query.roomId });
  return res.json({ ...room._doc, players });
});

router.post("/api/join", async (req, res) => {
  // "roomId": "1234",
  // "userId": "0",
  // "userAddress":"Ox0000000000000000000000000000000000000000"

  const body = req.body;

  console.log(body);

  const room = await Rooms.findOne({ roomId: body?.roomId });
  if (!room) return res.status(400).json({ error: "Wrong roomId" });

  let _id = new mongoose.Types.ObjectId(body?.userId);
  const player = await Players.findOne({ _id, roomId: body?.roomId });
  if (!player) return res.status(400).json({ error: "Wrong roomId" });

  const updatedPlayer = await Players.findOneAndUpdate(
    { _id, status: "" },
    { status: "PLAYIING", userAddress: body?.userAddress }
  );

  if (!updatedPlayer)
    return res.status(400).json({ error: "Played Already Joined" });

  res.json(room);
});

router.post("/api/join/joined", async (req, res) => {
  // "roomId": "1234",
  // "userId": "0"

  const body = req.body;
  console.log(body);

  const room = await Rooms.findOne({ roomId: body?.roomId });
  if (!room) return res.status(400).json({ error: "Wrong roomId" });

  let _id = new mongoose.Types.ObjectId(body?.userId);
  const player = await Players.findOne({ _id, roomId: body?.roomId });
  if (!player) return res.status(400).json({ error: "Wrong roomId" });

  res.json(room);
});

router.put("/api/player/drop", async (req, res) => {
  // "roomId": "1234",
  // "userId": "0",
  // "userAddress": "Ox0000000000000000000000000000000000000000",
  const room = await Rooms.findOne({ roomId: req.body.roomId });
  if (!room) return res.status(400).json({ error: "Wrong roomId" });

  let _id = mongoose.Types.ObjectId(req.body.userId);

  await Players.findOneAndUpdate(
    { _id, roomId: req.body.roomId, userAddress: req.body.userAddress },
    { status: "DROPPED" }
  );

  res.json({ succes: true });
});

export default router;
