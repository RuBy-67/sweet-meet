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
  name: "upgrade",
  description: "Ameliorer un matériau",

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
    const rarityMap = {
      Commun: params.updatePrice.commun,
      Rare: params.updatePrice.rare,
      "Très Rare": params.updatePrice.tresRare,
      Épique: params.updatePrice.epique,
      Legendaire: params.updatePrice.legendaire,
    };

    const typeMultiplierMap = {
      feu: params.updatePrice.feu,
      eau: params.updatePrice.eau,
      terre: params.updatePrice.terre,
      vent: params.updatePrice.vent,
    };
    const userId = interaction.user.id;
    const ownedMaterials = await dbManager.getMateriauByUserId(userId);
    if (ownedMaterials.length === 0) {
      return interaction.reply("Aucun matériau disponible.");
    }
    async function component() {
      const ownedMaterials2 = await dbManager.getMateriauByUserId(userId);
      let components = [];
      if (ownedMaterials.length > 0) {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("material_select")
          .setPlaceholder("Upgrade")
          .setMinValues(1)
          .addOptions(
            ownedMaterials2.map((material) => {
              const emoji = emo[material.nom];
              const baseRarity = rarityMap[material.rarete] || 1;
              const typeMultiplier = typeMultiplierMap[material.type] || 1;
              const rarity = baseRarity * typeMultiplier;
              const calculLevelPrice = Math.round(
                params.updatePrice.levels *
                  material.lvl *
                  ownedMaterials2.length *
                  rarity *
                  params.updatePrice.multiplicateur
              );

              const label =
                material.lvl > 4
                  ? `${material.nom} (lvl: ${material.lvl}) Up : Max`
                  : `${material.nom} (lvl: ${material.lvl}) Up: ${calculLevelPrice} Fragments`;
              const value = material.mid.toString();

              return new StringSelectMenuOptionBuilder()
                .setEmoji(emoji)
                .setLabel(label)
                .setValue(value);
            })
          );
        const actionRow = new ActionRowBuilder().addComponents(selectMenu);
        components.push(actionRow);
      }
      return components;
    }

    await interaction.reply({
      content: `**Comment le prix est calculé ? :**\n
🔹 **Facteurs :**\n> Nombre de matériaux possédés\n> Niveaux des matériaux\n> Types des matériaux\n> Raretés des matériaux\n\n*Améliorer un matériau apportera une amélioration des bonus du materiaux.*\n\n**Sélectionnez un matériau à améliorer**`,
      components: await component(),
    });
    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) => i.user.id === userId && i.customId === "material_select",
      time: 72000,
    });
    collector.on("collect", async (i) => {
      const selectedMaterials = i.values;
      const selectedMaterialId = selectedMaterials[0];

      if (i.customId === "material_select") {
        const stats = await player.getStats(userId);
        const power = stats.power;
        const [material] = await dbManager.getMateriauById(selectedMaterials);

        if (!material) {
          return i.reply("Matériau non trouvé.");
        }
        const baseRarity = rarityMap[material.rarete] || 1;
        const typeMultiplier = typeMultiplierMap[material.type] || 1;
        const rarity = baseRarity * typeMultiplier;
        const upgradePrice = Math.round(
          params.updatePrice.levels *
            material.lvl *
            ownedMaterials.length *
            rarity *
            params.updatePrice.multiplicateur
        );

        if (power < upgradePrice) {
          return i.update({
            content: `Vous n'avez pas assez de Fragments pour améliorer **${material.nom}**.\n(Prix:** ${upgradePrice})**\n**Vous avez :** ${power} Fragments de Protection**\n\n**Sélectionnez un matériau à améliorer**`,
            components: await component(),
          });
        }

        const newLevel = material.lvl + 1;
        if (newLevel > params.maxLevel) {
          return i.update({
            content: `Le niveau maximal pour **${material.nom}** est atteint. max : **(${params.maxLevel})**\n\n**Sélectionnez un matériau à améliorer**`,
            components: await component(),
          });
        }
        const upgrade = await dbManager.updateMaterialLevel(
          userId,
          selectedMaterialId,
          newLevel
        );
        if (upgrade) {
          await dbManager.setPowerById(userId, -upgradePrice);
          return i.update({
            content: `Le matériau **${material.nom}** a été amélioré au niveau **${newLevel}**.\n**Sélectionnez le matériau à améliorer**`,
            components: await component(),
          });
        } else {
          return i.reply("Échec de la mise à jour du matériau.");
        }
      }
      collector.on("end", (collected, reason) => {
        if (reason === "time") {
          interaction.followUp(
            "La sélection est terminée car le délai a expiré."
          );
        }
      });
    });
  },
};
