const express = require("express");
const router = express.Router();

// Example: return a fixed delivery fee
router.get("/", (req, res) => {
  res.json({ delivery_fee: 10 });
});

module.exports = router;
