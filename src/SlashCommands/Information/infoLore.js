const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const config = require("../../jsons/config.json");

module.exports = {
  name: "infolore",
  description: "Information sur le lore de Valoria",
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
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const embed = new EmbedBuilder()
      .setTitle("InfoLore - Valoria")
      .setColor(color.pink)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setDescription()
      .addFields(
        {
          name: "📖 - Histoire",
          value:
            "Les origines de Valoria remontent à une époque oubliée, où les dieux marchaient parmi les mortels et où la magie régnait en maître. Les premières civilisations ont émergé des profondeurs de l'histoire, construisant des cités majestueuses et érigeant des temples dédiés aux puissances divines. Mais avec le pouvoir est venu le conflit, et les guerres ont ravagé les terres de Valoria, laissant derrière elles des ruines et des cicatrices.",
        },
        {
          name: "🧙‍♂️ - Magie",
          value:
            "La magie est le tissu même de Valoria, imprégnant chaque pierre, chaque arbre et chaque souffle de vent. Les arcanes sont étudiés et maîtrisés par ceux qui cherchent le savoir et la puissance. Des sorciers solitaires aux ordres mystiques, les praticiens de la magie utilisent leurs dons pour façonner le monde selon leur volonté, invoquant des tempêtes et des étoiles, guérissant les malades et invoquant des démons.",
        },
        {
          name: "⛰️ - Géographie",
          value:
            "Les terres de Valoria sont aussi vastes que variées, allant des sommets enneigés des montagnes de l'Est aux jungles luxuriantes de l'Ouest. Au nord, les déserts brûlants abritent des tribus nomades et des ruines anciennes, tandis qu'au sud, les vastes étendues des plaines fertiles sont le berceau de villes prospères et de cultures florissantes. Les océans entourent Valoria, offrant des voies commerciales et des mystères insondables.",
        },
        {
          name: "📕 - Culture",
          value:
            "La culture de Valoria est aussi diverse que ses habitants. Des festivals colorés célèbrent les saisons et les traditions, tandis que les guildes d'artisans et de marchands prospèrent dans les rues animées des villes. Les légendes et les chansons sont transmises de génération en génération, immortalisant les exploits des héros et les chutes des tyrans. C'est dans ce kaléidoscope de cultures et de croyances que l'histoire de Valoria se déroule, tissée de fils de destinée et de choix.",
        },
        {
          name: `${emoji(emo.power)} - Fragments de Protection`,
          value:
            "Ces fragments, représente l'énergie vitale et la force de défense des habitants du royaume, sont convoités par tous. Ils sont utilisés comme monnaie pour acquérir des biens, des services et des compétences. Les joueurs se lancent dans des duels acharnés pour obtenir ces précieux fragments et renforcer leur position dans le royaume.",
        }
      )
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });
    return interaction.reply({ embeds: [embed] });
  },
};
