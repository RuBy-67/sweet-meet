const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const info = require(`../../jsons/info.json`);

module.exports = {
  name: "infobot",
  description: "info sur le bot",
  options: null,
  run: async (client, interaction, args) => {
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const embed = new EmbedBuilder()
      .setTitle("Info Bot VERSION BETA-TESTING")
      .setColor("#FFC0CB") // Code couleur pour rose
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `
**Nom**: ${info.nom}
**Version**: ${info.version}
**Créatrice**:  ${info.creatrice}
**Hébergement**: ${info.hebergement}
**Langage**: ${info.langage}
**Framework**: ${info.framework}
**Base de Données**: ${info.base_de_donnees}
**URL Git**: [GitHub Repository](${info.url_git})\n\n__~~**----------------------------------------**~~__
  `
      )
      .addFields(
        {
          name: "📚 V 0.1.2 -> V 1.0.0 Sortie de béta",
          value: `>>> - Ajout des DayBox et Randombox dans la boutique\n- Reset des Fragements\n- Ajout des Dayli free box\n- Ajout Roulette Russe (Admin) et solo \n- 👽 Correction de beug mineur\n__~~**----------------------------------------**~~__`,
        },
        {
          name: "📚 V 1.0.0-> ...",
          value: `>>> - Ajout d'une campagne solo\n- Ajout des royaumes (Empereur)\n- Ajout Duel 'Publique'\n- Ajout de l'utilité des role, badge, mariage \n- 👽 Correction de beug mineur\n__~~**----------------------------------------**~~__`,
        }
      )
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    return interaction.reply({ embeds: [embed] });
  },
};
