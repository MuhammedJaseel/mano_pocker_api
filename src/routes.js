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
  const room = await Rooms.findOne({ roomId: req.params.roomId });
  if (!room) return res.status(400).json({ error: "Wrong roomId" });
  const players = await Rooms.find({ roomId: req.params.roomId });
  return res.json({ ...room, players });
});

router.post("/api/join", async (req, res) => {
  // "roomId": "1234",
  // "userId": 0,
  // "userAddress":"Ox0000000000000000000000000000000000000000"
  const room = await Rooms.findOne({ roomId: req.body.roomId });
  if (!room) return res.status(400).json({ error: "Wrong roomId" });

  let _id = mongoose.Types.ObjectId(req.body.userId);
  const player = await Players.findOne({ _id, roomId: req.body.roomId });
  if (!player) return res.status(400).json({ error: "Wrong roomId" });

  await Players.findOneAndUpdate({ _id }, { status: "PLAYIING" });

  res.json(room);
});

export default router;
