import express from "express";
import Rooms from "./schemas/room.js";
import Players from "./schemas/player.js";
import mongoose from "mongoose";
import {
  getWalletBalance,
  makeRandomAddress,
  makeWalletAddress,
} from "./services/chain.js";
import { refundBalanceAfter } from "./services/wallet.js";
import { checkAndUpdatePoolWin } from "./services/room.js";

const router = express.Router();

router.post("/api/room", async (req, res) => {
  // {} "number_of_players": 4, "names": ["Alice", "Bob", "Chloe", "Dan"], "max_amount": 200, "min_amount": 5 }
  const body = req.body;
  console.log(body);

  try {
    if (body?.names?.length < 2 && body?.names?.length > 9)
      return res.status(400).json({ error: "Invalid Count" });

    const acccounts = [];
    const roomId = new Date().getTime().toString(36);
    const room = await Rooms.create({
      roomId,
      users: acccounts,
      max: body?.max_amount,
      min: body?.min_amount,
    });

    for (let i = 0; i < body?.names.length; i++) {
      const name = body?.names[i];
      const rWaller = await makeRandomAddress();

      const poolAddress = rWaller.address;
      const poolAddressIndex = rWaller.index;
      const player = await Players.create({
        room_Id: room._id,
        roomId,
        name,
        poolAddress,
        poolAddressIndex,
      });
      acccounts.push({
        id: player._id,
        name: player.name,
        address: player.poolAddress,
      });
    }

    return res.json({ room_id: roomId, acccounts });
  } catch (error) {
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

router.get("/api/room", async (req, res) => {
  // req.params.roomId
  try {
    const room = await Rooms.findOne({ roomId: req.query.roomId });
    if (!room) return res.status(400).json({ error: "Wrong roomId" });
    const players = await Players.find(
      { roomId: req.query.roomId },
      {
        name: 1,
        poolAddress: 1,
        poolAddressIndex: 1,
        userAddress: 1,
        walletBalance: 1,
        userBalance: 1,
        status: 1,
        raises: 1,
        raised: 1,
      }
    );
    return res.json({ ...room._doc, players });
  } catch (error) {
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

router.post("/api/join", async (req, res) => {
  // { "roomId": "1234", "userId": "0", "userAddress":"Ox00...00" }
  const body = req.body;
  console.log(body);

  try {
    let userAddress = makeWalletAddress(body.userAddress);

    if (!userAddress)
      return res.status(400).json({ error: "Wrong user address" });

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
  } catch (error) {
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

router.post("/api/join/joined", async (req, res) => {
  // { "roomId": "1234", "userId": "45GH578" }
  const body = req.body;
  console.log(body);

  try {
    const room = await Rooms.findOne({ roomId: body?.roomId });
    if (!room) return res.status(400).json({ error: "Wrong roomId" });

    let _id = new mongoose.Types.ObjectId(body?.userId);
    const player = await Players.findOne({ _id, roomId: body?.roomId });
    if (!player) return res.status(400).json({ error: "Wrong roomId" });

    res.json(room);
  } catch (error) {
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

router.post("/api/room/start", async (req, res) => {
  // { "roomId": "1234" }
  const body = req.body;
  console.log(body);

  try {
    const room = await Rooms.findOne({ roomId: body?.roomId });
    if (!room) return res.status(400).json({ error: "Wrong roomId" });

    const players = await Players.find({ roomId: body?.roomId });

    let status = "STARTED";

    for (let it of players) {
      let walletBalance = await getWalletBalance(it.poolAddress);

      if (it.walletBalance !== walletBalance) {
        await Players.findOneAndUpdate(
          { _id: it._id, status: "" },
          { walletBalance }
        );
        it.walletBalance = walletBalance;
      }
      if (it.walletBalance < room.max) status = "INITATED";
    }

    if (status === "STARTED")
      await Rooms.findByIdAndUpdate(room._id, { status });

    res.json({ status, players, roomId: body.roomId, max: room.max });
  } catch (error) {
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

router.put("/api/player/raise", async (req, res) => {
  // { "roomId": "1234", "userId": "0", "amount": 0, action: "CALL"|| "BET || RAISE }
  const body = req.body;
  console.log(body);

  try {
    const room = await Rooms.findOne({ roomId: body.roomId });
    if (!room) return res.status(400).json({ error: "Wrong roomId" });

    let _id = new mongoose.Types.ObjectId(body.userId);

    const player = await Players.findOne({
      _id,
      roomId: body.roomId,
      status: "PLAYIING",
    });
    if (!player) return res.status(400).json({ error: "Wrong playeId" });

    if (player.raises.length === 0 && (body?.amount || 0) < room.min) {
      return res.status(400).json({ error: "Minumum is " + room.min });
    }
    if ((body?.amount || 0) + player.raised > room.max) {
      return res.status(400).json({ error: "Maximum is " + room.max });
    }

    // TODO: need to manage the paralel request
    const updatedPlayer = await Players.findOneAndUpdate(
      { _id, roomId: body.roomId, raised: player.raised },
      {
        $push: { raises: { amount: body.amount, action: body.action } },
        raised: body.amount + player.raised,
      }
    );

    res.json({ succes: true });
  } catch (error) {
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

router.put("/api/player/drop", async (req, res) => {
  // { "roomId": "1234", "userId": "0" }
  const body = req.body;
  console.log(body);
  try {
    const room = await Rooms.findOne({ roomId: body.roomId });
    if (!room) return res.status(400).json({ error: "Wrong roomId" });

    let _id = new mongoose.Types.ObjectId(body.userId);

    const player = await Players.findOne({ _id, roomId: body.roomId });
    if (!player) return res.status(400).json({ error: "Wrong playeId" });

    await refundBalanceAfter(
      player.poolAddressIndex,
      player.userAddress,
      player.raised
    );

    await Players.findOneAndUpdate(
      { _id, roomId: body.roomId },
      { status: "DROPED" }
    );

    checkAndUpdatePoolWin(body.roomId);

    res.json({ succes: true });
  } catch (error) {
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

export default router;
