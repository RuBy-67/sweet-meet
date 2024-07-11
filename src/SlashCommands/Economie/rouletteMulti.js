const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const dbManager = require("../../class/dbManager");
const db = new dbManager();
const param = require("../../jsons/param.json");
const Cooldown = require("../../class/cooldown");
const cooldown = new Cooldown();
const config = require("../../jsons/config.json");

module.exports = {
  name: "roulette2",
  description: "[ADMIN] Roulette russe pour tous les membres !",
  options: [
    {
      name: "nombre_de_perdants",
      description: "Combien de personnes vont perdre ?",
      type: 4,
      required: true,
    },
  ],
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
    const commandName = "roulette2";
    const cooldownDuration = param.cooldownroulette;
    const cooldownInfo = await cooldown.handleCooldown(
      interaction,
      commandName,
      cooldownDuration
    );
    if (cooldownInfo) return;
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const gameMasterIds = Object.values(param.gameMaster);
    const colors = await db.getColor(interaction.user.id);
    if (!gameMasterIds.includes(interaction.user.id)) {
      const role = interaction.guild.roles.cache.find(
        (role) => role.name === "GameMaster"
      );
      if (!role || !interaction.member.roles.cache.has(role.id)) {
        const errorEmbed = new EmbedBuilder()
          .setTitle("Erreur")
          .setColor(color.error)
          .setDescription(
            "Vous n'avez pas la permission d'utiliser cette commande. Tricheur 👀!"
          )
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }

    const numLosers = interaction.options.getInteger("nombre_de_perdants");
    const members = await interaction.guild.members.fetch();
    const memberArray = Array.from(members.values());

    // Shuffle the array
    const shuffledMembers = memberArray.sort(() => 0.5 - Math.random());

    if (!Array.isArray(shuffledMembers)) {
      return interaction.reply({
        content:
          "Une erreur s'est produite lors de la récupération des membres.",
        ephemeral: true,
      });
    }
    const losers = shuffledMembers.slice(0, numLosers);
    const powerLosses = [];
    for (const member of losers) {
      const userPower = await db.getStats(member.id);
      const powerLoss = Math.floor(userPower.power * 0.05);
      await db.updatePower(member.id, -powerLoss);
      try {
        await member.timeout(30 * 60 * 1000, "Perdu à la roulette russe");
      } catch (error) {
        console.error(
          `Impossible d'appliquer le mute à ${member.user.tag}: ${error}`
        );
      }
      powerLosses.push({
        name: member.user.username, // Nom du membre
        value: `> Fragments perdus  : **${powerLoss}** ${emoji(emo.power)}`, // Quantité de puissance perdue
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("Roulette Russe")
      .setColor(colors)
      .addFields(...powerLosses) // Ajoute les pertes de puissance comme champs dans l'embed
      .setDescription(
        `Les membres suivants ont été choisis par la roulette russe :\n\nIls seront mutés pendant 30 minutes et perdront 5% de leur puissance.`
      )
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    await interaction.reply({ embeds: [embed] });
  },
};
