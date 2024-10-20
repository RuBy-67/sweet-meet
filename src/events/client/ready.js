const {
  Client,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require("discord.js");
const { activityInterval } = require("../../jsons/config.json");
const dbManager = require("../../class/dbManager");
const Player = require("../../class/player");
const player = new Player();
const os = require("os-utils");
const color = require("../../jsons/color.json");
const db = new dbManager();
const param = require("../../jsons/param.json");
const emo = require("../../jsons/emoji.json");
const config = require("../../jsons/config.json");
const {
  buyMaterial,
  daysBox,
  randomLootBox,
  openShop,
  closeShop,
  buyRole,
} = require("../../devs/shop");
let shopMessage;

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
          value: `> Nombre de joueurs: **${nbJoueurs}**\n> Nombre de duels joués: **${nbDuels}**\n> Fragments de Protection (Possédés): **${nbPowerTotal}**\n> Fragments de Protection moyen : **${puissanceMoyenne}**\n\n🏆 **Best Player:**\n> <@${bestPlayerId}> avec **${bestPlayerPower}** Fragments de Protection\n> WinRate : **${WinRate}%** (${bestPlayers.winCounter}) \n__~~**----------------------------------**~~__`,
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
  openShop(client);

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === "select-item") {
      const selectedItem = interaction.values[0];
      const userId = interaction.user.id;
      if (selectedItem.startsWith("material_")) {
        const materialId = selectedItem.split("_")[1];
        const level = selectedItem.split("_")[2];
        await buyMaterial(client, interaction, materialId, level);
      } else if (selectedItem.startsWith("role_")) {
        const roleId = selectedItem.split("_")[1];
        await buyRole(client, interaction, userId, roleId);
      } else if (selectedItem === "randomlootbox") {
        const selectedMaterials = await player.randomBox();
        const materialIds = selectedMaterials.map((material) => material.id);
        const nbCarte = Math.floor(Math.random() * 15) + 1;
        function getRandomWeightedNumber() {
          const weightedNumbers = [
            { number: 1, weight: 1 },
            { number: 7, weight: 1 },
            { number: 8, weight: 1 },
            { number: 9, weight: 1 },
            { number: 2, weight: 2 },
            { number: 3, weight: 2 },
            { number: 4, weight: 2 },
            { number: 5, weight: 2 },
            { number: 6, weight: 2 },
            { number: 10, weight: 2 },
            { number: 11, weight: 2 },
            { number: 12, weight: 5 },
            { number: 13, weight: 5 },
            { number: 14, weight: 5 },
            { number: 15, weight: 5 },
            { number: 16, weight: 5 },
            { number: 17, weight: 5 },
            { number: 18, weight: 10 },
            { number: 19, weight: 10 },
            { number: 20, weight: 10 },
            { number: 21, weight: 10 },
            { number: 22, weight: 10 },
          ];

          // Calcul de la somme totale des poids
          const totalWeight = weightedNumbers.reduce(
            (sum, item) => sum + item.weight,
            0
          );

          // Générer un nombre aléatoire entre 0 et le total des poids
          let randomWeight = Math.random() * totalWeight;

          // Sélection du chiffre basé sur le poids
          for (let item of weightedNumbers) {
            if (randomWeight < item.weight) {
              return item.number;
            }
            randomWeight -= item.weight;
          }
        }
        const bossId = getRandomWeightedNumber();
        await randomLootBox(
          client,
          interaction,
          bossId,
          nbCarte,
          ...materialIds
        );
      } else if (selectedItem.startsWith("daysbox_")) {
        const materialId = selectedItem.split("_")[4];
        const power = selectedItem.split("_")[1];
        const nbCarte = selectedItem.split("_")[2];
        const bossId = selectedItem.split("_")[3];
        await daysBox(client, interaction, power, nbCarte, bossId, materialId);
      } else {
        await interaction.reply(`Sélection invalide.`);
      }
    }
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
      `/duel | Watching Valoria`,
      `Created by RuBy_67`,
      `Surveille ${allMembers.size} Valorien`,
    ];
    setInterval(() => {
      const status = activities[Math.floor(Math.random() * activities.length)];
      client.user.setActivity(status);
    }, activityInterval * 1000);
  }
};
