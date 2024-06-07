const { Events } = require("discord.js");
const DatabaseManager = require("../../class/dbManager");
const db = new DatabaseManager();
const userLastMessage = new Map();

module.exports = {
  name: Events.MessageCreate,
  async execute(client, message) {
    // Ignore bot messages
    if (message.author.bot) return;

    const userId = message.author.id;
    const currentTime = Date.now();
    if (userLastMessage.has(userId)) {
      const lastMessageTime = userLastMessage.get(userId);
      const timeDiff = currentTime - lastMessageTime;

      // If the user has sent a message in the last 60 seconds, ignore it
      if (timeDiff < 60000) return;
    }
    userLastMessage.set(userId, currentTime);
    const ranges = [
      { min: 25, max: 50, probability: 0.4 }, // 40%
      { min: 51, max: 150, probability: 0.3 }, // 30%
      { min: 151, max: 300, probability: 0.2 }, // 20%
      { min: 301, max: 500, probability: 0.1 }, // 10%
    ];
    function selectRange() {
      const rand = Math.random();
      let cumulativeProbability = 0;

      for (const range of ranges) {
        cumulativeProbability += range.probability;
        if (rand <= cumulativeProbability) {
          return range;
        }
      }
      return ranges[ranges.length - 1]; // Fallback to the last range
    }
    const selectedRange = selectRange();
    const powerIncrement =
      Math.floor(Math.random() * (selectedRange.max - selectedRange.min + 1)) +
      selectedRange.min;

    const longMessageThreshold = 100;
    const extraPointsForLongMessage = Math.floor(message.content.length * 0.1);

    if (message.content.length > longMessageThreshold) {
      powerIncrement += extraPointsForLongMessage;
    }

    try {
      await db.updatePower(userId, powerIncrement);
    } catch (error) {
      console.error(`Failed to add power to user ${userId}:`, error);
    }
  },
};
