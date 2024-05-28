const {
  Client,
  Collection,
  GatewayIntentBits,
  EmbedBuilder,
} = require("discord.js");
const { loadEvents } = require("./src/handlers/loadEvents");
const { loadSlashCommands } = require("./src/handlers/loadSlashCommands");
const { botToken, auth } = require("./src/jsons/config.json");
const connection = require("./src/db");

const { name } = require("./src/SlashCommands/Social/social");

// Declaring our Discord Client
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
  ],
});

// Stuff that will be very useful in our project
client.slash = new Collection();
client.auth = auth;

// Declaring Slash Command and Events
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
