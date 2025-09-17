const express = require("express");
const protect = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { roadmapId, step, completed } = req.body;

    if (!roadmapId || step === undefined) {
      return res.status(400).json({ success: false, message: "roadmapId and step are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const progressIndex = user.progress.findIndex(
      (p) => p.roadmapId === roadmapId && p.step === step
    );

    if (progressIndex >= 0) {
      user.progress[progressIndex].completed = completed;
    } else {
      user.progress.push({ roadmapId, step, completed });
    }

    await user.save();

    res.json({ success: true, message: "Progress updated", progress: user.progress });
  } catch (err) {
    console.error(" Save Progress Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/:roadmapId", protect, async (req, res) => {
  try {
    const { roadmapId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const progress = user.progress.filter((p) => p.roadmapId === roadmapId);

    res.json({ success: true, progress });
  } catch (err) {
    console.error(" Fetch Progress Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
