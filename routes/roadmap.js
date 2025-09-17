const express = require("express");
const protect = require("../middleware/auth");
const { generateRoadmap, saveProgress, getProgress } = require("../controllers/roadmapController");
const router = express.Router();

router.post("/", protect, generateRoadmap);
router.post("/generate", protect, generateRoadmap);
router.post("/progress/save", protect, saveProgress);

router.get("/progress/:userId?/:roadmapId", protect, getProgress);

module.exports = router;
