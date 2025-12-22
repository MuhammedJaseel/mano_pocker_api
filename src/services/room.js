import Rooms from "../schemas/room.js";
import Players from "../schemas/player.js";

export const checkAndUpdatePoolWin = async (roomId) => {
  try {
    const players = await Players.find({ roomId }, { status: "PLAYING" });
    if (players.length === 1) {
      const room = await Rooms.findOne({ roomId }, { status: "STARTED" });
      if (!room) return;
      players[0];
    }
  } catch (error) {}
};
