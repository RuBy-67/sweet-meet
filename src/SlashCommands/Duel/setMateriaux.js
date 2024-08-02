const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const Player = require("../../class/player");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const player = new Player();
const params = require("../../jsons/param.json");
const config = require("../../jsons/config.json");

module.exports = {
  name: "setmateriaux",
  description: "setActiveMateriaux",
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
    const userId = interaction.user.id;
    const materialsUsed = await player.getMaterialsById(userId);
    const materials = await player.getMaterialsByIdEtat0(userId);
    if (materials.length === 0 && materialsUsed.length === 0) {
      return interaction.reply("Aucun matériau disponible.");
    }
    if (materialsUsed.length > 4) {
      return interaction.reply(
        "Vous Avez déjà 4 matériaux actifs, veuillez en désactiver un pour en activer un autre."
      );
    }

    async function component() {
      const etat0Materials = await player.getMaterialsByIdEtat0(userId);
      const userIdMaterials = await player.getMaterialsById(userId);
      let components = [];

      if (etat0Materials.length > 0) {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("material_select")
          .setPlaceholder("SetMateriaux")
          .setMinValues(1)
          .addOptions(
            (await player.getMaterialsStringSelect(userId, 0, true))
              .split("\n")
              .map((material) => {
                const [emo, nom, lvl, id] = material.split("_");
                return new StringSelectMenuOptionBuilder()
                  .setEmoji(emo)
                  .setLabel(`${nom} (lvl: ${lvl})`)
                  .setValue(id);
              })
          );
        const maxSelectOptions = Math.min(
          await (
            await player.getMaterialsByIdEtat0(userId)
          ).length,
          4
        );
        selectMenu.setMaxValues(maxSelectOptions);
        const row = new ActionRowBuilder().addComponents(selectMenu);
        components.push(row);
      }
      if (userIdMaterials.length > 0) {
        const unselectMenu = new StringSelectMenuBuilder()
          .setCustomId("material_unselect")
          .setPlaceholder("UnsetMateriaux")
          .setMinValues(1)
          .addOptions(
            (await player.getMaterialsStringSelect(userId, 1, true))
              .split("\n")
              .map((material) => {
                const [emo, nom, lvl, id] = material.split("_");
                return new StringSelectMenuOptionBuilder()
                  .setEmoji(emo)
                  .setLabel(`${nom} (lvl: ${lvl}`)
                  .setValue(id);
              })
          );

        const maxOptions = Math.min(
          await (
            await player.getMaterialsById(userId)
          ).length,
          4
        );
        unselectMenu.setMaxValues(maxOptions);
        const row2 = new ActionRowBuilder().addComponents(unselectMenu);

        components.push(row2);
      }

      return components;
    }

    async function stringMat() {
      const materiauxArray = await player.getMaterialsStringMessage(userId);

      let materiauxString = "";
      for (const materiau of materiauxArray) {
        materiauxString += `- ${emoji(emo[materiau.nom])} \`${
          materiau.nom
        }\`\ (lvl: ${materiau.lvl}) \n> **Rareté:** ${
          materiau.rarete
        },\n> **Type:** ${materiau.type}\n> **Bonus:** 💚 ${
          materiau.bonusSante
        }% - ⚔️ ${materiau.bonusAttaque}% - 🛡️ ${materiau.bonusDefense}%\n`;
      }
      if (materiauxString === "") {
        materiauxString = "Aucun matériau";
      }
      return materiauxString;
    }

    await interaction.reply({
      content: `Matériaux Actuellement Actifs : \n${await stringMat()}`,
      components: await component(),
    });
    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) =>
        i.user.id === userId &&
        (i.customId === "material_select" ||
          i.customId === "material_unselect"),
      max: 4,
      time: 72000,
    });
    collector.on("collect", async (i) => {
      const selectedMaterials = i.values;
      const selectedMaterialId = selectedMaterials[0];

      if (i.customId === "material_select") {
        await dbManager.updateMaterialState(userId, selectedMaterialId, "1");
        const materialsInUse = await player.getMaterialsById(userId);
        if (materialsInUse.length > 4) {
          await dbManager.updateMaterialState(userId, selectedMaterialId, "0");
          await i.update({
            content:
              "Nombre maximal de matériaux atteint! Veuillez réduire vos sélections.",
            components: [],
          });
          return;
        } else {
          await i.update({
            content: `Matériaux sélectionnés ajouté à votre inventaire de bataille!\nMatériaux Actuellement Actifs : \n${await stringMat()}`,
            components: await component(),
          });
        }
      } else if (i.customId === "material_unselect") {
        const selectedMaterials = i.values;
        const selectedMaterialId = selectedMaterials[0];
        await dbManager.updateMaterialState(userId, selectedMaterialId, "0");
        await i.update({
          content: `Matériaux sélectionnés retiré de votre inventaire de bataille!\nMatériaux Actuellement Actifs : \n${await stringMat()}`,
          components: await component(),
        });
      } else {
        await interaction.followUp("La sélection est terminée");
      }
    });
    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        interaction.followUp(
          "La sélection est terminée car le délai a expiré."
        );
      }
    });
  },
};
