import Rooms from "../schemas/room.js";
import Players from "../schemas/player.js";
import { refundBalanceAfter } from "./wallet.js";
import { sendToGroup } from "../index.js";

export const checkAndUpdatePoolWin = async (roomId) => {
  try {
    let room = await Rooms.findOne({ roomId }, { status: "STARTED" });
    if (!room) return;
    const players = await Players.find({ roomId, status: "PLAYING" });
    if (players.length === 1) {
      await Players.findByIdAndUpdate(players[0]._id, { status: "WIN" });
      await Rooms.findByIdAndUpdate(room._id, {
        winPlayerId: players[0]._id,
        status: "COMPLATED",
      });
      sendToGroup(roomId, "updated");
      const players_ = await Players.find({ roomId });
      for (let player of players_)
        await refundBalanceAfter(
          player.poolAddressIndex,
          players[0].userAddress,
          0
        );
    }
  } catch (error) {}
};
