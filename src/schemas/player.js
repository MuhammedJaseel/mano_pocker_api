import mongoose from "mongoose";

const { Schema, model } = mongoose;

const playersSchema = new Schema({
  room_Id: { type: mongoose.Schema.Types.ObjectId, ref: "Rooms" },
  roomId: { type: String, required: true },
  name: { type: String, required: true },
  poolAddress: { type: String, required: true },
  userAddress: { type: String },
  amount: { type: String, default: "0" },
  status: { type: String, default: "" }, // PLAYIING, DROPED, FAILED, WIN
  createdAt: { type: Date, required: true, default: Date.now },
});

export default model("Players", playersSchema);
