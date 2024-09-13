const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { loadEvents } = require("./src/handlers/loadEvents");
const { loadSlashCommands } = require("./src/handlers/loadSlashCommands");
const createDateProfil = require('./src/SlashCommands/User/createDateprofil');
const dateProfilCommand = require('./src/SlashCommands/User/dateProfil');
const {
  botToken,
  botToken2Test,
  botToken3Test,
  auth,
} = require("./src/jsons/config.json");

// Déclaration du client
const client = new Client({
  allowedMentions: { parse: ["users", "roles"] },
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
  ],
});

client.slash = new Collection();
client.auth = auth;

// Load Events & Slash Commands
loadEvents(client);
loadSlashCommands(client);

// Error Handling
process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception: " + err);
  console.log(err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log(
    "[FATAL] Possibly Unhandled Rejection at: Promise ",
    promise,
    " reason: ",
    reason.message
  );
});

client.login(botToken).then(() => {
  console.log(
    ` Successfully logged in as: ${client.user.username}#${client.user.discriminator} `
  );
});

createDateProfil.registerEvent(client);

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'dateprofil') {
      await dateProfilCommand.run(client, interaction);
  }
});
