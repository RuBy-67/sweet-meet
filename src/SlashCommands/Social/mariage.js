const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();

module.exports = {
  name: "mariage",
  description:
    "Demander en mariage un autre utilisateur (coûte 20 000 points de puissance).",
  options: [
    {
      name: "membre",
      description: "L'utilisateur que vous souhaitez épouser.",
      type: 6,
      required: true,
    },
  ],
  run: async (client, interaction, args) => {
    const target = interaction.options.getMember("membre");
    const targetUser = await client.users.fetch(target.user.id);
    const authorId = interaction.user.id;
    const targetId = targetUser.id;

    // Verify if the author has enough power to get married
    const authorStats = await dbManager.getStats(authorId);
    if (authorStats.power < 20000) {
      return interaction.reply({
        content: `Vous n'avez pas suffisamment de puissance pour vous marier. Vous avez besoin de 20 000 points de puissance.`,
        ephemeral: true,
      });
    }

    if (authorId === targetId) {
      return interaction.reply({
        content: `Vous ne pouvez pas vous marier avec vous-même.`,
        ephemeral: true,
      });
    }

    // Verify if the author and the target are already married
    const authorMarriage = await dbManager.getMarriage(authorId);
    const targetMarriage = await dbManager.getMarriage(targetId);
    if (authorMarriage.length > 0 || targetMarriage.length > 0) {
      return interaction.reply({
        content: `Vous ne pouvez pas vous marier car l'un des deux utilisateurs est déjà marié.`,
        ephemeral: true,
      });
    }
    dbManager.updatePower(authorId, -20000);
    const temps = Math.floor(Date.now() / 1000) + 60;
    const embed = new EmbedBuilder()
      .setTitle(
        `Demande en mariage de ${interaction.user.username} à ${targetUser.username}`
      )
      .setColor(color.pink)
      .setDescription(
        `Un mariage coûte 20 000 points de puissance. Les avantages et inconvénients du mariage seront partagés entre les deux utilisateurs. Voulez-vous accepter cette demande en mariage ? \n\nFin <t:${temps}:R> `
      )
      .setFooter({
        text: `demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    const confirmButton = new ButtonBuilder()
      .setCustomId("accepter")
      .setLabel("Accepter")
      .setStyle(ButtonStyle.Success);

    const refuseButton = new ButtonBuilder()
      .setCustomId("refuser")
      .setLabel("Refuser")
      .setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder().addComponents(
      confirmButton,
      refuseButton
    );

    const message = await interaction.reply({
      content: `<@${targetId}> ... <@${authorId}> souhaite t'épouser !`,
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    const filter = (interaction) => interaction.user.id === targetId;
    const collector = message.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();

      if (interaction.customId === "accepter") {
        dbManager.setMarriage(authorId, targetId);

        await interaction.editReply({
          content: `Félicitations, <@${targetId}> et <@${authorId}> sont maintenant mariés !`,
          embeds: [],
          components: [],
        });
      } else if (interaction.customId === "refuser") {
        dbManager.updatePower(authorId, 5000);
        await interaction.editReply({
          content: `La demande en mariage de <@${authorId}> à <@${targetId}> a été refusée, 5000 ont été rendus à <@${authorId}>`,
          embeds: [],
          components: [],
        });
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        dbManager.updatePower(authorId, 19000);
        interaction.editReply({
          content: `La demande en mariage a expiré car <@${targetId}> n'a pas répondu dans le temps imparti, 19000 on été rendu à <@${authorId}>.`,
          components: [],
          embeds: [],
        });
      }
    });
  },
};
