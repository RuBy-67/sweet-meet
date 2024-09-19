const { EmbedBuilder, PermissionsBitField } = require('discord.js');

// Fonction pour récupérer aléatoirement un waifu ou un husbando depuis l'API Nekos.best
async function getRandomCharacter() {
  const fetch = (await import('node-fetch')).default;
  const randomChoice = Math.random() < 0.5 ? 'waifu' : 'husbando';

  // Sélectionner l'URL en fonction du type de personnage
  const apiUrl = randomChoice === 'waifu' 
    ? 'https://nekos.best/api/v2/waifu'
    : 'https://nekos.best/api/v2/husbando';

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // Extraction des données importantes du personnage
    const character = {
      imageUrl: data.results[0].url,  // URL de l'image
      type: randomChoice === 'waifu' ? 'Waifu' : 'Husbando'  // Type du personnage
    };

    return character;

  } catch (error) {
    console.error('Erreur lors de la récupération du personnage :', error);
    throw error;
  }
}

module.exports = {
  name: 'smash',
  description: 'Lancer un Smash or Pass avec un personnage',

  run: async (client, interaction) => {
    // Vérification des permissions : Administrateurs ou Modérateurs
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && 
        !interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ content: 'Seuls les administrateurs et modérateurs peuvent utiliser cette commande.', ephemeral: true });
    }

    try {
      // Récupérer aléatoirement un waifu ou un husbando
      const character = await getRandomCharacter();

      // Créer l'embed avec les informations du personnage
      const embed = new EmbedBuilder()
        .setTitle(`${character.type} Smash or Pass?`)
        .setImage(character.imageUrl)
        .setColor(0xff0000)
        .setDescription('Réagissez avec 🟢 pour Smash ou 🔴 pour Pass. Vous avez 3 heures !');

      const message = await interaction.reply({ embeds: [embed], fetchReply: true });
      
      await message.react('🟢');  // Smash
      await message.react('🔴');  // Pass

      // Attendre 3 heures pour compter les votes
      setTimeout(async () => {
        const messageFetched = await interaction.channel.messages.fetch(message.id);
        const reactions = messageFetched.reactions.cache;

        const smashVotes = reactions.get('🟢') ? reactions.get('🟢').count - 1 : 0;
        const passVotes = reactions.get('🔴') ? reactions.get('🔴').count - 1 : 0;

        if (smashVotes > passVotes) {
          interaction.followUp(`Le personnage est un **Smash** avec ${smashVotes} votes contre ${passVotes} Pass.`);
        } else if (passVotes > smashVotes) {
          interaction.followUp(`Le personnage est un **Pass** avec ${passVotes} votes contre ${smashVotes} Smash.`);
        } else {
          interaction.followUp(`C'est un **Égalité** avec ${smashVotes} Smash et ${passVotes} Pass.`);
        }
      }, 3 * 60 * 60 * 1000);  // 3 heures en millisecondes

    } catch (error) {
      console.error('Erreur dans la commande Smash or Pass :', error);
      interaction.reply({ content: 'Une erreur est survenue lors de la récupération du personnage.', ephemeral: true });
    }
  },
};
