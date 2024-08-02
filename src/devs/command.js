// Command "Fun"  (with another user)

const { EmbedBuilder } = require("discord.js");
const emo = require(`../jsons/emoji.json`);
const color = require(`../jsons/color.json`);
const gifs = require(`../jsons/gif.json`);

module.exports = {
  slap: {
    name: "slap",
    description: "Donne une tape à un(e) utilisateur(trice)",
    run: async (client, interaction, args) => {
      const user = interaction.options.getUser("utilisateur");
      const keys = Object.keys(gifs.slap);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const embed = new EmbedBuilder()
        .setTitle(
          `${interaction.user.username} a donné une tape à ${user.username}`
        )
        .setColor(color.pink)
        .setImage(gifs.slap[randomKey]);
      interaction.reply({ embeds: [embed] });
    },
  },
  hug: {
    name: "hug",
    description: "Prend un(e) utilisateur(trice) dans ses bras",
    run: async (client, interaction, args) => {
      const user = interaction.options.getUser("utilisateur");
      const keys = Object.keys(gifs.hug);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const embed = new EmbedBuilder()
        .setTitle(
          `${interaction.user.username} a pris ${user.username} dans ses bras`
        )
        .setColor(color.pink)
        .setImage(gifs.hug[randomKey]);
      interaction.reply({ embeds: [embed] });
    },
  },
  kiss: {
    name: "kiss",
    description: "Embrasse un(e) utilisateur(trice)",
    run: async (client, interaction, args) => {
      const user = interaction.options.getUser("utilisateur");
      const keys = Object.keys(gifs.kiss);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username} embrasse ${user.username}`)
        .setColor(color.pink)
        .setImage(gifs.kiss[randomKey]);
      interaction.reply({ embeds: [embed] });
    },
  },
  pat: {
    name: "pat",
    description: "Fait une tape amicale sur l'épaule un(e) utilisateur(trice)",
    run: async (client, interaction, args) => {
      const user = interaction.options.getUser("utilisateur");
      const keys = Object.keys(gifs.pat);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const embed = new EmbedBuilder()
        .setTitle(
          `${interaction.user.username} tape amicalement ${user.username}`
        )
        .setColor(color.pink)
        .setImage(gifs.pat[randomKey]);
      interaction.reply({ embeds: [embed] });
    },
  },
  pout: {
    name: "pout",
    description: "Fait la moue à un(e) utilisateur(trice)",
    run: async (client, interaction, args) => {
      const user = interaction.options.getUser("utilisateur");
      const keys = Object.keys(gifs.pout);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const embed = new EmbedBuilder()
        .setTitle(
          `${interaction.user.username} fait la moue à ${user.username}`
        )
        .setColor(color.pink)
        .setImage(gifs.pout[randomKey]);
      interaction.reply({ embeds: [embed] });
    },
  },
  stare: {
    name: "stare",
    description: "Fixe du regard un(e) utilisateur(trice)",
    run: async (client, interaction, args) => {
      const user = interaction.options.getUser("utilisateur");
      const keys = Object.keys(gifs.stare);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const embed = new EmbedBuilder()
        .setTitle(
          `${interaction.user.username} fixe du regard ${user.username}`
        )
        .setColor(color.pink)
        .setImage(gifs.stare[randomKey]);
      interaction.reply({ embeds: [embed] });
    },
  },
  smile: {
    name: "smile",
    description: "Sourit à un(e) utilisateur(trice)",
    run: async (client, interaction, args) => {
      const user = interaction.options.getUser("utilisateur");
      const keys = Object.keys(gifs.smile);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username} sourit à ${user.username}`)
        .setColor(color.pink)
        .setImage(gifs.smile[randomKey]);
      interaction.reply({
        embeds: [embed],
      });
    },
  },
  confession: {
    name: "confession",
    description: "Confession à un(e) utilisateur(trice)",
    run: async (client, interaction, args) => {
      const user = interaction.options.getUser("utilisateur");
      const confession = interaction.options.getString("confession");
      const keys = Object.keys(gifs.confession);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const embed = new EmbedBuilder()
        .setColor(color.pink)
        .setDescription("```" + confession + "```");
      interaction.channel.send({
        embeds: [embed],
        content: `***${gifs.confession[randomKey]}***\n\n On dirais que quelqu'un souhaite se confesser à : <@${user.id}>`,
      });
      interaction.reply({
        content: "Confession envoyée avec succès !! comme c'est mimsy 😊",
        ephemeral: true,
      });
    },
  },
  //..& more..//
};
