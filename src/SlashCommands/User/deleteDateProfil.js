const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const Dating = require("../../class/dateManager");
const db = new Dating();

module.exports = {
    name: 'deletedateprofil',
    description: 'Supprime ton profil de date',

    run: async (client, interaction) => {
        console.log('Chargement du fichier deletedateprofil.js');

        if (!interaction.isChatInputCommand() || interaction.commandName !== 'deletedateprofil') return;

        const userId = interaction.user.id;

        const existingProfile = await db.getProfileByUserId(userId);
        if (!existingProfile || existingProfile.length === 0) {
            return interaction.reply({ content: 'Vous n\'avez pas de profil à supprimer.', ephemeral: true });
        }

        const confirmEmbed = new EmbedBuilder()
            .setTitle('Confirmation de suppression')
            .setDescription('Êtes-vous sûr de vouloir supprimer votre profil de date ? Cette action est irréversible.')
            .setColor('#FF0000');

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_delete')
                .setLabel('✅')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel_delete')
                .setLabel('❌')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            embeds: [confirmEmbed],
            components: [actionRow],
            ephemeral: true
        });

        const message = await interaction.fetchReply();

        const collector = message.createMessageComponentCollector({
            time: 30000,
            filter: (i) => i.user.id === userId
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'confirm_delete') {
                try {
                    await db.deleteProfileByUserId(userId);
                    await i.update({ content: 'Votre profil a été supprimé avec succès.', components: [], ephemeral: true });
                } catch (error) {
                    console.error("Erreur lors de la suppression du profil : ", error);
                    await i.update({ content: 'Une erreur est survenue lors de la suppression de votre profil.', components: [], ephemeral: true });
                }
            } else if (i.customId === 'cancel_delete') {
                await i.update({ content: 'Suppression annulée.', components: [], ephemeral: true });
            }
        });

        collector.on('end', (collected) => {
            if (collected.size === 0) {
                message.edit({ content: 'Aucune réponse reçue. Suppression annulée.', components: [] });
            }
        });
    }
};
