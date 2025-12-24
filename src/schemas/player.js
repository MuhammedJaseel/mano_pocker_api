import mongoose from "mongoose";

const { Schema, model } = mongoose;

const playersSchema = new Schema({
  room_Id: { type: mongoose.Schema.Types.ObjectId, ref: "Rooms" },
  roomId: { type: String, required: true },
  name: { type: String, required: true },
  poolAddress: { type: String, required: true, unique: true },
  poolAddressIndex: { type: Number, required: true, unique: true },
  userAddress: { type: String },
  walletBalance: { type: String, default: "0" },
  status: { type: String, default: "" }, // JOINED, PLAYING, DROPED, FAILED, WIN
  raises: {
    type: [{ action: String, amount: Number }],
    default: [],
  },
  raised: { type: Number, default: 0 },
  openToBet: { type: Boolean, default: true },
  createdAt: { type: Date, required: true, default: Date.now },
});

export default model("Players", playersSchema);
