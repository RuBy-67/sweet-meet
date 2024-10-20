const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const param = require("../../jsons/param.json");
const Player = require("../../class/player");
const player = new Player();
const Cooldown = require("../../class/cooldown");
const cooldown = new Cooldown();
const config = require("../../jsons/config.json");
const boss = require("../../class/bossManager");
const bossManager = new boss();

module.exports = {
  name: "freedaylibox",
  description: "Réclamez votre free daily box",
  options: null,
  run: async (client, interaction, args) => {
    if (config.maintenance) {
      const embed = new EmbedBuilder()
        .setTitle("⚒️ Maintenance ⚒️")
        .setColor(color.error)
        .setDescription(
          `> Le bot est actuellement en maintenance, veuillez réessayer plus tard.`
        )
        .setColor(color.error);
      return interaction.reply({ embeds: [embed] });
    }
    const user = await dbManager.getStats(userId);
    if (!user) {
      const embed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(color.error)
        .setDescription(
          `Vous n'avez pas encore commencé votre aventure. Tapez \`/createAccount\` pour commencer.`
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    const commandName = "freedaylibox";
    const cooldownDuration = param.cooldownBox;
    const cooldownMessage = `Vous avez déjà réclamé votre free daily box. Veuillez réessayer dans quelques heures.`;
    const cooldownInfo = await cooldown.handleCooldown(
      interaction,
      commandName,
      cooldownDuration,
      cooldownMessage
    );
    if (cooldownInfo) return;

    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const userId = interaction.user.id;
    const colors = await dbManager.getColor(userId);
    const { material, power, nbCarte, bossId } = await player.freeDayliBox(
      userId
    );

    const embed = new EmbedBuilder()
      .setTitle("Votre Free Daily Box")
      .setColor(colors)
      .setDescription(`Voici ce que vous avez reçu dans votre free daily box:`);
    if (material) {
      embed.addFields({
        name: "Matériau",
        value: `${emoji(emo[material.nom])} ${material.nom}`,
        inline: true,
      });
      await player.addMaterialToUser(userId, material.id);
    } else {
      embed.addFields({
        name: "Matériau",
        value: "Aucun matériau reçu",
        inline: true,
      });
    }
    if (nbCarte) {
      const infoBoss = await bossManager.getInfoBossById(bossId);
      const possedeBoss = await dbManager.getBossByUserByBossId(userId, bossId);
      if (possedeBoss.length === 0) {
        embed.addFields({
          name: "Carte - Boss",
          value: `Vous avez obtenu le boss **${infoBoss.nom}**`,
          inline: true,
        });
        await dbManager.addBossId(userId, bossId, 1);
      } else {
        embed.addFields({
          name: "Carte - Boss",
          value: `Vous avez obtenu **${nbCarte}** cartes du boss ${infoBoss.nom}`,
          inline: true,
        });
        await dbManager.addBossId(userId, bossId, nbCarte);
      }
    } else {
      embed.addFields({
        name: "Carte",
        value: "Aucune carte reçue",
        inline: true,
      });
    }

    embed.addFields({
      name: "Fragment",
      value: `**${power}** ${emoji(emo.power)}`,
      inline: true,
    });
    function getRandomWeightedNumber() {
      const weightedNumbers = [
        { number: 1, weight: 4 }, // Beaucoup de chances
        { number: 2, weight: 3 }, // Un peu moins de chances
        { number: 3, weight: 2 }, // Encore moins de chances
        { number: 4, weight: 1 }, // Le moins de chances
      ];

      const totalWeight = weightedNumbers.reduce(
        (sum, item) => sum + item.weight,
        0
      );
      let randomWeight = Math.random() * totalWeight;

      for (let item of weightedNumbers) {
        if (randomWeight < item.weight) {
          return item.number;
        }
        randomWeight -= item.weight;
      }
    }
    const nbPoussiere = Math.floor(Math.random() * (30 - 5 + 1)) + 5;
    const map = {
      1: "poussiereCommune",
      2: "poussiereRare",
      3: "poussiereEpique",
      4: "poussiereLegendaire",
    };
    const typePoussiere = getRandomWeightedNumber();
    const string = map[typePoussiere];
    embed
      .addFields({
        name: "Poussière",
        value: `${nbPoussiere}, ${string} ${emoji(emo[string])}`,
        inline: true,
      })

      .setTimestamp()
      .setFooter({
        text: "Le royaume de Valoria vous remercie !",
        iconURL: client.user.avatarURL(),
      });
    await dbManager.upgradePoussiere(userId, nbPoussiere, typePoussiere);
    await player.updatePower(userId, power);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
