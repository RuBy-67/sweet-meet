const { Client } = require("discord.js");
const { activityInterval } = require("../../jsons/config.json");

module.exports = (client) => {
  client.user.setPresence({ status: "online" });

  let allMembers = new Set();
  client.guilds.cache.each((guild) => {
    guild.members.cache.each((member) => {
      allMembers.add(member.user.id);
    });
  });

  let allChannels = new Set();
  client.guilds.cache.each((guild) => {
    guild.channels.cache.each((channel) => {
      allChannels.add(channel.id);
    });
  });

  console.log(
   ` ${client.channels.cache.size} channels \n ${allMembers.size} members `
  );
  updateActivity(client);

  /**
   * @param {Client} client
   */
  async function updateActivity(client) {
    const activities = [
      `/help | Watching Trading Boys`,
      `Created by RuBy#0822`,
      `look ${allMembers.size} members`,
    ];
    setInterval(() => {
      const status = activities[Math.floor(Math.random() * activities.length)];
      client.user.setActivity(status);
    }, activityInterval * 1000);
  }
};