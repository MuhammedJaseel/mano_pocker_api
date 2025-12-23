import Rooms from "../schemas/room.js";
import Players from "../schemas/player.js";
import { refundBalanceAfter } from "./wallet.js";

export const checkAndUpdatePoolWin = async (roomId) => {
  try {
    const players = await Players.find({ roomId, status: "PLAYING" });
    console.log(players);
    if (players.length === 1) {
      const room = await Rooms.findOne({ roomId }, { status: "STARTED" });
      console.log(room);
      if (!room) return;

      const players_ = await Players.find({ roomId });
      for (let player of players_)
        await refundBalanceAfter(
          player.poolAddressIndex,
          players[0].userAddress,
          0
        );
      await Rooms.findByIdAndUpdate(room._id, {
        winPlayerId: players[0]._id,
        status: "COMPLATED",
      });
    }
  } catch (error) {}
};
