const { Events } = require("discord.js");
const DatabaseManager = require("../../class/dbManager");
const db = new DatabaseManager();
const param = require("../../jsons/param.json");
const userVoiceTimes = new Map();

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(client, oldState, newState) {
    const userId = newState.id;
    const currentTime = Date.now();
    if (param.maintenance) return;
    // Handle user joining a voice channel
    if (!oldState.channelId && newState.channelId) {
      userVoiceTimes.set(userId, { joinTime: currentTime, totalTime: 0 });
    }

    // Handle user leaving a voice channel
    if (oldState.channelId && !newState.channelId) {
      const userVoiceData = userVoiceTimes.get(userId);
      if (userVoiceData) {
        const sessionTime = currentTime - userVoiceData.joinTime;
        userVoiceData.totalTime += sessionTime;
        userVoiceData.joinTime = null;
        userVoiceTimes.set(userId, userVoiceData);

        await handleVoiceReward(
          userId,
          userVoiceData.totalTime,
          oldState.channel
        );
      }
    }
  },
};

async function handleVoiceReward(userId, totalTime, channel) {
  const totalMinutes = Math.floor(totalTime / 60000);
  const fiveMinuteChunks = Math.floor(totalMinutes / 5);
  const powerIncrement = fiveMinuteChunks * 105;
  if (powerIncrement > 0) {
    try {
      await db.updatePower(userId, powerIncrement);
      const stats = await db.getStats(userId);
      if (stats.guildId != null) {
        // à verifier si c'est pas trop

        const [GuildStat] = db.getGuildById(stats.guildId);
        if (parseInt(GuildStat.xp) < parseInt(param.xp[GuildStat.level])) {
          await db.updateGuildXp(stats.guildId, powerIncrement * 2);
        }
        console.log("powerIncrement", powerIncrement * 2);

        await db.addGuildBank(stats.guildId, powerIncrement);
      }
    } catch (error) {
      console.error(
        `Failed to add Fragments of Protection to user ${userId}:`,
        error
      );
    }
  }
  //}
}
