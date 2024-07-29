const { Events } = require("discord.js");
const DatabaseManager = require("../../class/dbManager");
const db = new DatabaseManager();
const userLastMessage = new Map();
const config = require("../../jsons/config.json");
const guild = require("../../SlashCommands/guild/guild");

module.exports = {
  name: Events.MessageCreate,
  async execute(client, message) {
    // Ignore bot messages
    if (message.author.bot) return;
    if (config.maintenance) return;

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
      { min: 15, max: 30, probability: 0.4 }, // 40%
      { min: 31, max: 60, probability: 0.3 }, // 30%
      { min: 61, max: 120, probability: 0.2 }, // 20%
      { min: 121, max: 240, probability: 0.1 }, // 10%
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
      const stats = await db.getStats(userId);
      if ((stats.guildId = !null)) {
        // à verifier si c'est pas trop
        await db.updateGuildXp(stats.guildId, powerIncrement * 7);
      }
    } catch (error) {
      console.error(
        `Failed to add Fragments of Protection to user ${userId}:`,
        error
      );
    }
  },
};
