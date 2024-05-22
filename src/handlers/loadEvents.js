const clientEvent = (event) => require(`../events/client/${event}`);
const guildEvent = (event) => require(`../events/guild/${event}`);

function loadEvents(client) {
  client.on("ready", () => clientEvent("ready")(client));
  client.on("interactionCreate", (m) => guildEvent("slashCommands")(m, client));
  client.on("guildMemberAdd", async (member) => {
    const event = guildEvent("guildMemberAdd");
    await event.execute(member);
  });
  client.on("guildMemberRemove", async (member) => {
    const event = guildEvent("guildMemberRemove");
    await event.execute(member);
  });
}

module.exports = {
  loadEvents,
};
