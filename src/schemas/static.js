import mongoose from "mongoose";

const { Schema, model } = mongoose;

const staticSchema = new Schema({
  label: { type: String, required: true, unique: true, index: true },
  value: {},
  createdAt: { type: Date, required: true, default: Date.now }, // createdAt
});

export default model("Static", staticSchema);
