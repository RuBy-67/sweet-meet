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
      .setTitle("Info Bot")
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
**URL Git**: [GitHub Repository](${info.url_git})
  `
      )
      .addFields({
        name: "📚 ChangeLog (MAJ) V 0.1.0 -> V 0.1.01",
        value: `>>> 📉 Rewiew à la baisse des ajouts de power lors des discussions\n🏪 Ajout du rôle Manquant dans la boutique Hunter\n📍Ajout Ping lancement duel\n👽 Correction de beug mineur`,
        inline: true,
      })
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    return interaction.reply({ embeds: [embed] });
  },
};
