const express = require("express");
const { addDonor, getDonors, deleteDonor } = require("../controllers/donorControllers");

const router = express.Router();

router.post("/", addDonor);
router.get("/", getDonors);
router.delete("/:id", deleteDonor);

module.exports = router;
