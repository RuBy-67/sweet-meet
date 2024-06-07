const divertissementCommands = require("../../devs/command");

module.exports = {
  name: "divertissement",
  description: "Choisissez une commande de divertissement",
  options: [
    {
      name: "commande",
      description: "Choisissez une commande de divertissement",
      type: 3,
      required: true,
      choices: Object.values(divertissementCommands).map((command) => ({
        name: command.name,
        value: command.name,
      })),
    },
    {
      name: "utilisateur",
      description: "Choisissez un utilisateur",
      type: 6,
      required: true,
    },
    {
      name: "confession",
      description: "Votre confession",
      type: 3,
      required: false,
    },
  ],
  run: async (client, interaction, args) => {
    const commandName = interaction.options.getString("commande");
    const command = divertissementCommands[commandName];
    if (!command) {
      return interaction.reply({
        content: "Cette commande n'existe pas",
        ephemeral: true,
      });
    }
    await command.run(client, interaction, args);
  },
};