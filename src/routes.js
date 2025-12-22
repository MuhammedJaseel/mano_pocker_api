import express from "express";

const router = express.Router();

router.post("/api/room", (req, res) => {
  // "number_of_players": 4,
  // "names": ["Alice", "Bob", "Chloe", "Dan"],
  // "max_amount": 200,
  // "min_amount":

  if (req?.body?.names?.length < 2 && req?.body?.names?.length > 9)
    return res.status(400).json({ error: "Invalid Count" });

  const acccounts = [];

  for (let i = 0; i < req?.body?.names.length; i++) {
    const name = req?.body?.names[i];
    acccounts.push({
      id: i,
      name: name,
      address: "Ox000000000000000000000000000000000000000" + i,
    });
  }

  const roomId = new Date().getTime().toString(36);

  const result = {
    room_id: roomId,
    acccounts,
  };
  return res.json(result);
});

router.get("/api/room", (req, res) => {
  return res.json({});
});

router.post("/api/join", (req, res) => {
  // "roomId": "1234",
  // "userId": 0,
  // "userAddress":"Ox0000000000000000000000000000000000000000"

  res.json({});
});

export default router;
