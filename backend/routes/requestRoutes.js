const express = require("express");
const { createRequest, matchDonors, getRequests, updateRequestStatus, deleteRequest } = require("../controllers/requestControllers");

const router = express.Router();

router.post("/", createRequest);
router.get("/", getRequests);
router.get("/match/:bloodGroup", matchDonors);
router.put("/:id", updateRequestStatus);
router.delete("/:id", deleteRequest);

module.exports = router;
