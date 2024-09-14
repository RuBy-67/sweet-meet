const { Events } = require("discord.js");
const DatabaseManager = require("../../class/dbManager");
const db = new DatabaseManager();
const userLastMessage = new Map();
const config = require("../../jsons/config.json");
const guild = require("../../SlashCommands/guild/guild");
const param = require("../../jsons/param.json");

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

      //Ignorer les messages envoyés en moins de 60 secondes
      if (timeDiff < 60000) return;
    }
    userLastMessage.set(userId, currentTime);
    const ranges = [
      { min: 15, max: 30, probability: 0.3 }, // 30%
      { min: 31, max: 60, probability: 0.4 }, // 40%
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
      return ranges[ranges.length - 1]; // Retourne la dernière plage si aucune n'est sélectionnée
    }
    const selectedRange = selectRange();
    let powerIncrement =
      Math.floor(Math.random() * (selectedRange.max - selectedRange.min + 1)) +
      selectedRange.min;

    const longMessageThreshold = 50;
    const extraPointsForLongMessage = Math.floor(message.content.length * 0.5);

    if (message.content.length > longMessageThreshold) {
      powerIncrement += extraPointsForLongMessage;
    }

    try {
      await db.updatePower(userId, powerIncrement);
      const stats = await db.getStats(userId);
      if (stats.guildId != null) {
        // à verifier si c'est pas trop

        const GuildStat = await db.getGuildById(stats.guildId);

        if (GuildStat[0].xp < param.xp[GuildStat[0].level]) {
          await db.updateGuildXp(stats.guildId, powerIncrement * 2);
        }

        await db.addGuildBank(stats.guildId, powerIncrement);
      }
    } catch (error) {
      console.error(
        `Failed to add Fragments of Protection to user ${userId}:`,
        error
      );
    }
  },
};
