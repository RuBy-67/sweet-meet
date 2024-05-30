const { Client, EmbedBuilder } = require("discord.js");
const { activityInterval } = require("../../jsons/config.json");
const dbManager = require("../../class/dbManager");
const os = require("os-utils");
const color = require("../../jsons/color.json");
const db = new dbManager();
const config = require("../../jsons/config.json");

module.exports = (client) => {
  os.cpuUsage(async (v) => {
    const cpuUsage = (v * 100).toFixed(2);
    const totalMemory = (os.totalmem() / 1024).toFixed(2);
    const freeMemory = (os.freemem() / 1024).toFixed(2);
    const usedMemory = (totalMemory - freeMemory).toFixed(2);
    const duelCount = await db.countDuel();
    const [powerTotal] = await db.getAllPower();
    const materialCounts = await db.getTotalMateriauByRarete();
    const averagePower = await db.getAveragePower();
    const [joueurs] = await db.getAllUser();
    const [bestPlayers] = await db.getTopUsers("power", 1);
    const bestPlayerId = bestPlayers.discordId;
    const bestPlayerPower = bestPlayers.power;
    const WinRate =
      (bestPlayers.winCounter /
        (bestPlayers.winCounter + bestPlayers.loseCounter)) *
      100;
    const nbJoueurs = joueurs.count;
    const nbDuels = duelCount.count;
    const nbPowerTotal = powerTotal.power;
    const nbLegendaries = materialCounts.legendary;
    const nbEpics = materialCounts.epic;
    const nbRares = materialCounts.rare;
    const nbTresRares = materialCounts.veryRare;
    const nbCommons = materialCounts.common;
    const puissanceMoyenne = Math.round(averagePower.avgPower);
    const temps = Math.floor(Date.now() / 1000); ///<t:${temps}:R>

    const embed = new EmbedBuilder()
      .setTitle("Sweet Meet est en ligne !")
      .setColor(color.blue)
      .setDescription(`⌚ Sweet Meet Uptime [<t:${temps}:R>]`)
      .addFields(
        {
          name: "📈 Statistiques: Duel",
          value: `> Nombre de joueurs: **${nbJoueurs}**\n> Nombre de duels joués: **${nbDuels}**\n> Puissance totale (Distribué): **${nbPowerTotal}**\n> Puissance moyenne: **${puissanceMoyenne}**\n\n🏆 **Best Player:**\n> <@${bestPlayerId}> avec **${bestPlayerPower}** points de puissance\n> WinRate : **${WinRate}%** (${bestPlayers.winCounter}) \n__~~**----------------------------------**~~__`,
        },
        {
          name: "📈 Statistiques: Materiaux (Possédés)",
          value: `> Légendaires: **${nbLegendaries}**\n> Epique: **${nbEpics}**\n> Très Rares: **${nbTresRares}**\n> Rares: **${nbRares}**\n> Communs: **${nbCommons}**\n__~~**----------------------------------**~~__`,
        },
        {
          name: "📈 Statistiques: Système",
          value: `Utilisation CPU: **${cpuUsage}%**\nMémoire utilisée: **${usedMemory} GB** / **${totalMemory} GB**`,
        }
      )
      .setFooter({
        text: `Created by RuBy_67 for SweetMeet`,
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();
    const logChannel = config.error_logs;
    if (logChannel) {
      client.channels.cache.get(logChannel).send({ embeds: [embed] });
    } else {
      console.log("Log channel not found");
    }
  });

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
      `/help | Watching sweeties`,
      `Created by RuBy_67`,
      `Surveille ${allMembers.size} membres`,
    ];
    setInterval(() => {
      const status = activities[Math.floor(Math.random() * activities.length)];
      client.user.setActivity(status);
    }, activityInterval * 1000);
  }
};
