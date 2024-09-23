const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');

// Fonction pour récupérer l'horoscope du jour depuis l'API Astroo
async function getDailyHoroscope() {
  const response = await axios.get('https://kayoo123.github.io/astroo-api/jour.json');
  if (!response.data) {
    throw new Error('Pas de données reçues de l\'API');
  }
  return response.data;
}

module.exports = {
  name: 'horoscope',
  description: 'Affiche l\'horoscope du jour pour tous les signes astrologiques',

  run: async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ content: 'Seuls les administrateurs et modérateurs peuvent utiliser cette commande.', ephemeral: true });
    }

    // Récupérer l'horoscope du jour
    const horoscopeData = await getDailyHoroscope();

    // Créer l'embed avec les informations de l'horoscope
    const embed = new EmbedBuilder()
      .setTitle('Horoscope du jour')
      .setColor(0x00AE86)
      .setDescription('Voici les prédictions astrologiques pour chaque signe du zodiaque :')
      .setThumbnail('https://giphy.com/gifs/WmtnVfTNbDigG32A8u');

    // Ajouter chaque signe astrologique et ses prédictions dans l'embed
    Object.keys(horoscopeData).forEach((sign) => {
      const prediction = horoscopeData[sign].substring(0, 1024); // Limiter chaque prédiction à 1024 caractères
      embed.addFields({ name: sign, value: prediction, inline: false });
    });

    await interaction.reply({ embeds: [embed] });
  },
};
