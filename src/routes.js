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
import { sendToGroup } from "./index.js";

const router = express.Router();

router.post("/api/room", async (req, res) => {
  // { "number_of_players": 4, "names": ["Alice", "Bob", "Chloe", "Dan"], "max_amount": 200, "min_amount": 5 }
  const body = req.body;
  const max = body?.max_amount;
  const min = body?.min_amount;

  try {
    if (body?.names?.length < 2 && body?.names?.length > 9)
      return res.status(400).json({ error: "Invalid Count" });

    const roomId = new Date().getTime().toString(36);
    const room = await Rooms.create({ roomId, users: [], max, min });

    const acccounts = [];
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
    const room = await Rooms.findOne(
      { roomId: req.query.roomId },
      {
        roomId: 1,
        max: 1,
        min: 1,
        winPlayerId: 1,
        round: 1,
        status: 1,
        createdAt: 1,
      }
    );
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
        openToBet: 1,
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
      { status: "JOINED", userAddress: body?.userAddress }
    );

    if (!updatedPlayer)
      return res.status(400).json({ error: "Played Already Joined" });

    sendToGroup(body.roomId, "updated");
    res.json(room);
  } catch (error) {
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

router.post("/api/join/joined", async (req, res) => {
  // { "roomId": "1234", "userId": "45GH578" }
  const body = req.body;

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

  try {
    const room = await Rooms.findOne({ roomId: body?.roomId });
    if (!room) return res.status(400).json({ error: "Wrong roomId" });

    const players = await Players.find({ roomId: body?.roomId });

    let status = "STARTED";

    for (let it of players) {
      let walletBalance = await getWalletBalance(it.poolAddress);

      if (walletBalance >= room.max) {
        const updated = await Players.findOneAndUpdate(
          { _id: it._id, status: "JOINED" },
          { status: "PLAYING", walletBalance }
        );
        console.log(updated);
        it.walletBalance = walletBalance;
      }
      if (it.walletBalance < room.max) status = "INITATED";
    }

    if (status === "STARTED")
      await Rooms.findByIdAndUpdate(room._id, { status });

    sendToGroup(body.roomId);

    res.json({ status, players, roomId: body.roomId, max: room.max });
  } catch (error) {
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

router.put("/api/player/raise", async (req, res) => {
  // { "roomId": "1234", "userId": "0", "amount": 0, action: "CALL"|| "BET || RAISE }
  const body = req.body;

  try {
    const room = await Rooms.findOne({ roomId: body.roomId });
    if (!room) return res.status(400).json({ error: "Wrong roomId" });

    let _id = new mongoose.Types.ObjectId(body.userId);

    const player = await Players.findOne({
      _id,
      roomId: body.roomId,
      status: "PLAYING",
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

    if (body.action !== "CALL")
      await Players.updateMany(
        { roomId: body.roomId },
        { $set: { openToBet: true } }
      );

    sendToGroup(body.roomId, "updated");

    if (updatedPlayer) return res.json({ succes: true });
    throw {};
  } catch (error) {
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

router.put("/api/player/drop", async (req, res) => {
  // { "roomId": "1234", "userId": "0" }
  const body = req.body;

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

    sendToGroup(body.roomId, "updated");

    res.json({ succes: true });
  } catch (error) {
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

router.put("/api/player/move", async (req, res) => {
  // { "roomId": "1234", "userId": "0" }
  const body = req.body;

  try {
    const room = await Rooms.findOne({ roomId: body.roomId });
    if (!room) return res.status(400).json({ error: "Wrong roomId" });

    if (room.round === "SHOWDOWN")
      return res.status(400).json({ error: "All round completed" });

    let _id = new mongoose.Types.ObjectId(body.userId);

    const players = await Players.find({ roomId: body.roomId });

    let maxRised = 0;
    let player = null;
    let isNextRound = true;
    for (let it of players) {
      if (it.raised > maxRised) maxRised = it.raised;
      if (String(it._id) === body.userId) player = it;
      else if (it.openToBet) isNextRound = false;
    }

    // const player = await Players.findOne({ _id, roomId: body.roomId });
    if (!player) return res.status(400).json({ error: "Wrong playeId" });

    if (player.raised < maxRised)
      return res.status(400).json({ error: "Other have more rase amount" });

    await Players.findOneAndUpdate(
      { _id, roomId: body.roomId },
      { openToBet: false }
    );

    if (isNextRound) {
      // PREFLOP, FLOP, TURN, RIVER, SHOWDOWN.
      let round = "PREFLOP";
      if (room.round === "PREFLOP") round = "FLOP";
      else if (room.round === "FLOP") round = "TURN";
      else if (room.round === "TURN") round = "RIVER";
      else if (room.round === "RIVER") round = "SHOWDOWN";
      await Rooms.findByIdAndUpdate(room._id, { round });
      await Players.updateMany({ roomId: body.roomId }, { openToBet: true });
    }

    sendToGroup(body.roomId, "updated");

    res.json({ succes: true });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

router.post("/api/player/failed", async (req, res) => {
  // { "roomId": "1234", "userId": "0" }
  const body = req.body;
  try {
    const room = await Rooms.findOne({ roomId: body.roomId });
    if (!room) return res.status(400).json({ error: "Wrong roomId" });

    let _id = new mongoose.Types.ObjectId(body.userId);

    const player = await Players.findByIdAndUpdate(_id, { status: "FAILED" });

    await refundBalanceAfter(
      player.poolAddressIndex,
      player.userAddress,
      player.raised
    );

    checkAndUpdatePoolWin(body.roomId);

    sendToGroup(body.roomId, "updated");

    res.json({ succes: true });
  } catch (error) {
    return res.status(400).json({ error: "Something Went Wrong" });
  }
});

export default router;
