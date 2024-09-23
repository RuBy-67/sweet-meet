const { Client } = require('discord.js');

const GUILD_ID = '1216037978795937874';
const CHANNEL_ID = '1216037981576761379';

// Fonction pour vérifier les événements et envoyer un message de partage 1 heure avant l'événement
async function checkEvents(client) {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
      console.error(`Erreur : Le serveur avec l'ID ${GUILD_ID} n'a pas été trouvé.`);
      return;
    }

    const scheduledEvents = await guild.scheduledEvents.fetch();
    console.log(`Nombre d'événements récupérés : ${scheduledEvents.size}`);

    // Itérer sur chaque événement planifié
    scheduledEvents.forEach(event => {
      const now = new Date();
      const startTime = new Date(event.scheduledStartTimestamp);
      const timeUntilStart = startTime - now;

      // Si l'événement commence dans moins d'une heure
      if (timeUntilStart > 0 && timeUntilStart <= 3600000) {
        console.log(`Événement : ${event.name}, commence dans : ${timeUntilStart / 1000 / 60} minutes`);
        shareEvent(client, event);
      } else if (timeUntilStart <= 0) {
        console.log(`L'événement ${event.name} a déjà commencé.`);
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification des événements :', error);
  }
}

// Fonction pour partager un événement directement dans le chat
async function shareEvent(client, event) {
  try {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
      console.error(`Erreur : Le channel avec l'ID ${CHANNEL_ID} n'a pas été trouvé.`);
      return;
    }

    if (!channel.permissionsFor(client.user).has('SEND_MESSAGES')) {
      console.error(`Erreur : Le bot n'a pas la permission d'envoyer des messages dans le channel ${channel.name}.`);
      return;
    }

    // Partager l'événement dans le channel (Discord le formate automatiquement)
    channel.send(`https://discord.com/events/${GUILD_ID}/${event.id}`).catch(error => {
      console.error(`Erreur lors du partage de l'événement dans le channel ${channel.name} :`, error);
    });
  } catch (error) {
    console.error('Erreur lors du partage de l\'événement :', error);
  }
}

module.exports = {
  name: 'eventChecker',
  description: 'Vérifie les événements sur un serveur et partage l\'événement une heure avant le début.',
  checkEvents
};
