const fs = require("fs");
const path = require("path");
const { jsonrepair } = require("jsonrepair");
const User = require("../models/User");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const mockPath = path.join(__dirname, "../data/mockRoadmap.json");
const mockRoadmap = JSON.parse(fs.readFileSync(mockPath, "utf-8"));


const generateRoadmap = async (req, res) => {
  try {
    const { skillLevel, aoi, pace, goal } = req.body;
    let roadmap;

    try {
      const response = await openai.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a JSON generator. ALWAYS respond with valid JSON only. No explanations, no extra text.",
          },
          {
            role: "user",
            content: `Generate a learning roadmap for ${aoi} in JSON format.
Skill level: ${skillLevel}, Pace: ${pace}, Goal: ${goal}.
Output must be a valid JSON array of steps with fields:
time, topic, youtube, docs, practice, progress.
Respond ONLY with the JSON array.`,
          },
        ],
        max_tokens: 700,
      });

      let content = response.choices[0].message.content.trim();

      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      let safeContent = jsonMatch ? jsonMatch[0] : content;

      
      safeContent = safeContent.replace(/,(\s*[\]}])/g, "$1");

      try {
        roadmap = JSON.parse(safeContent);
      } catch (parseErr) {
        console.warn(" JSON.parse failed, trying jsonrepair:", parseErr.message);

        try {
          roadmap = JSON.parse(jsonrepair(safeContent));
        } catch (repairErr) {
          console.error("jsonrepair failed, falling ", repairErr.message);

          
          fs.writeFileSync("last_bad_response.json", safeContent);

          roadmap = mockRoadmap;
        }
      }
    } catch (err) {
      console.error("AI generation failed, using mock:", err.message);
      roadmap = mockRoadmap;
    }

    if (!Array.isArray(roadmap)) {
      roadmap = mockRoadmap;
    }

    const roadmapId = Date.now().toString();

    res.json({
      success: true,
      message: "Roadmap generated",
      roadmapId,
      input: { skillLevel, aoi, pace, goal },
      roadmap,
    });
  } catch (error) {
    console.error("Roadmap Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const saveProgress = async (req, res) => {
  try {
    const { userId, roadmapId, stepIndex, completed } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const progressIndex = user.progress.findIndex(
      (p) => p.roadmapId === roadmapId && p.step === stepIndex
    );

    if (progressIndex >= 0) {
      user.progress[progressIndex].completed = completed;
    } else {
      user.progress.push({ roadmapId, step: stepIndex, completed });
    }

    await user.save();

    res.json({ success: true, message: "Progress saved successfully", progress: user.progress });
  } catch (error) {
    console.error("Save Progress Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to save progress" });
  }
};

const getProgress = async (req, res) => {
  try {
    const { userId, roadmapId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const progress = user.progress.filter((p) => p.roadmapId === roadmapId);

    res.json({ success: true, roadmapId, progress });
  } catch (error) {
    console.error("Get Progress Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch progress" });
  }
};

module.exports = { generateRoadmap, saveProgress, getProgress };
