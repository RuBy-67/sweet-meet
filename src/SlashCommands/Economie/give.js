const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);

module.exports = {
  name: "give",
  description: "[admin] donner power / materiel / badge à un joueur",
  options: [
    {
      name: "type",
      description: "Type de donnée",
      type: 3,
      required: true,
      choices: [
        {
          name: "power",
          value: "power",
        },
        {
          name: "materiel",
          value: "materiel",
        },
        {
          name: "badge",
          value: "badge",
        },
      ],
    },
    {
      name: "utilisateur",
      description: "Utilisateur à qui donner",
      type: 6,
      required: true,
    },
    {
      name: "valeur",
      description: "Valeur à donner",
      type: 4,
      required: false,
    },
  ],
  run: async (client, interaction, args) => {
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const embed = new EmbedBuilder()
      .setTitle("Give - Commande Admin")
      .setColor(color.pink)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setDescription()
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });
    return interaction.reply({ embeds: [embed] });
  },
};
