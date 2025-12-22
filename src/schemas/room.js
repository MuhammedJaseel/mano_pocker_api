import mongoose from "mongoose";

const { Schema, model } = mongoose;

const roomsSchema = new Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  max: { type: Number, required: true },
  min: { type: Number, required: true },
  winPlayerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Players",
  },
  status: { type: String, required: true, default: "INITATED" }, // STATED, COMPLATED
  createdAt: { type: Date, required: true, default: Date.now }, // createdAt
});

export default model("Rooms", roomsSchema);
