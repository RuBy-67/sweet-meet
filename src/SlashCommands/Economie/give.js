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
const param = require("../../jsons/param.json");

module.exports = {
  name: "give",
  description: "[admin] donner power / materiel / badge à un joueur",
  options: [
    {
      name: "type",
      description: "Type de donnée",
      type: 3,
      required: true,
      choices: [
        {
          name: "Fragments de Protection",
          value: "power",
        },
        {
          name: "Materiel",
          value: "materiel",
        },
        {
          name: "Badge",
          value: "badge",
        },
      ],
    },
    {
      name: "membre",
      description: "Utilisateur à qui donner",
      type: 6,
      required: true,
    },
    {
      name: "nombre",
      description: "Nombre de Fragments",
      type: 4,
      max: 100000,
      required: false,
    },
  ],
  run: async (client, interaction, args) => {
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const gameMasterIds = Object.values(param.gameMaster);
    if (!gameMasterIds.includes(interaction.user.id)) {
      const role = interaction.guild.roles.cache.find(
        (role) => role.name === "GameMaster"
      );
      if (!role || !interaction.member.roles.cache.has(role.id)) {
        const errorEmbed = new EmbedBuilder()
          .setTitle("Erreur")
          .setColor(color.error)
          .setDescription(
            "Vous n'avez pas la permission d'utiliser cette commande. Tricheur 👀!"
          )
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
    const type = interaction.options.getString("type");
    const target = interaction.options.getMember("membre");
    const utilisateur = await client.users.fetch(target.user.id);
    const valeur = interaction.options.getInteger("valeur") || 0;
    const materials = await dbManager.getMateriau();
    const badges = await dbManager.getBadgeNoL();

    async function componentMaterial() {
      let components = [];
      if (materials.length > 0) {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("material_select")
          .setPlaceholder("Donner un Matériel")
          .setMaxValues(1)
          .addOptions(
            (await dbManager.getMateriau()).map((material) => {
              return new StringSelectMenuOptionBuilder()
                .setEmoji(emo[material.nom])
                .setLabel(material.nom)
                .setValue(material.id.toString());
            })
          );
        const row = new ActionRowBuilder().addComponents(selectMenu);
        components.push(row);
      }

      return components;
    }

    async function componentBadge() {
      let components = [];
      if (badges.length > 0) {
        const selectMenu2 = new StringSelectMenuBuilder()
          .setCustomId("badge_select")
          .setPlaceholder("Donner un Badge")
          .setMaxValues(1)
          .addOptions(
            (await dbManager.getBadgeNoL()).map((badge) => {
              return new StringSelectMenuOptionBuilder()
                .setEmoji(badge.emojiId)
                .setLabel(badge.nom)
                .setValue(badge.id.toString());
            })
          );
        const unSelectMenu2 = new StringSelectMenuBuilder()
          .setCustomId("badge_UnSelect")
          .setPlaceholder("Reprendre un Badge")
          .setMaxValues(1)
          .addOptions(
            (await dbManager.getBadgeNoL()).map((badge) => {
              return new StringSelectMenuOptionBuilder()
                .setEmoji(badge.emojiId)
                .setLabel(badge.nom)
                .setValue(badge.id.toString());
            })
          );
        const row2 = new ActionRowBuilder().addComponents(selectMenu2);
        const row3 = new ActionRowBuilder().addComponents(unSelectMenu2);
        components.push(row2, row3);
      }
      return components;
    }

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) =>
        (i.user.id === interaction.user.id &&
          i.customId === "material_select") ||
        i.customId === "badge_select" ||
        i.customId === "badge_UnSelect",
      time: 72000,
    });
    if (type === "power") {
      await dbManager.updatePower(utilisateur.id, valeur);
      interaction.reply({
        content: `Vous avez donné à ${utilisateur},  ${valeur} Fragments de Protection. ${emoji(
          emo.power
        )}`,
      });
    } else if (type === "materiel") {
      interaction.reply({
        content: "Veuillez choisir le matériel à donner.",
        components: await componentMaterial(),
      });
      collector.on("collect", async (i) => {
        const selectedMaterials = i.values;
        const selectedMaterialId = selectedMaterials[0];

        if (i.customId === "material_select") {
          await dbManager.addMaterialToUser(utilisateur.id, selectedMaterialId);
          await i.update({
            content: `Vous avez donné un materiel à ${utilisateur}.`,
          });
        }
      });
    } else if (type === "badge") {
      interaction.reply({
        content: "Veuillez choisir le badge à donner (ou à reprendre).",
        components: await componentBadge(),
      });
      collector.on("collect", async (i) => {
        const selectedMaterials = i.values;
        const selectedMaterialId = selectedMaterials[0];
        if (i.customId === "badge_select") {
          const badge = await dbManager.getBadgeById(selectedMaterialId);
          if (badge.length > 0) {
            await i.update({
              content: `Le badge appartient déjà à quelqu'un.`,
            });
            return;
          } else {
            await dbManager.updateBadgeById(utilisateur.id, selectedMaterialId);
            await i.update({
              content: `Vous avez donné le badge à ${utilisateur}.`,
            });
          }
        } else if (i.customId === "badge_UnSelect") {
          const selectedMaterials = i.values;
          const selectedMaterialId = selectedMaterials[0];
          //appartient à qq ? si oui, retirer si non erreur
          const badge = await dbManager.getBadgeById(selectedMaterialId);
          if (badge.length === 0) {
            await i.update({
              content: `Le badge n'appartient pas à quelqu'un.`,
            });
            return;
          } else {
            await dbManager.removeBadgeById(utilisateur.id, selectedMaterialId);
            await i.update({
              content: `Vous avez retiré le badge à un user.`,
            });
          }
        }
      });
    } else {
      interaction.reply({ content: "Type de donnée non reconnu." });
    }

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        interaction.followUp(
          "La sélection est terminée car le délai a expiré."
        );
      }
    });
  },
};
