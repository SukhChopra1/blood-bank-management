const express = require("express");
const { getBloodStock } = require("../controllers/bloodStockController");

const router = express.Router();

router.get("/", getBloodStock);

module.exports = router;
