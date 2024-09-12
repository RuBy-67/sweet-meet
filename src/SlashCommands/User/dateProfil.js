const { EmbedBuilder, ButtonBuilder, ButtonStyle, ComponentType, ActionRowBuilder } = require('discord.js');
const Dating = require("../../class/dateManager");
const db = new Dating();

module.exports = {
    name: 'dateprofil',
    description: 'Affiche les profils de date',

    run: async (client, interaction) => {
        if (!interaction.isChatInputCommand() || interaction.commandName !== 'dateprofil') return;

        // Utilisation de deferReply pour informer Discord que nous allons répondre plus tard
        await interaction.deferReply();

        try {
            const rows = await db.getAllDateProfil();
            if (!rows || rows.length === 0) {
                return interaction.editReply('Aucun profil n\'a été trouvé.');
            }

            let page = 0;
            const embed = await generateEmbed(client, rows, page);
            const actionRow = generateActionRow();

            const embedMessage = await interaction.editReply({
                embeds: [embed],
                components: [actionRow],
                fetchReply: true
            });

            // Enregistre le collector pour gérer les boutons 'next', 'previous' et 'like'
            registerCollector(client, embedMessage, rows, page);
        } catch (error) {
            console.error("Erreur lors de la récupération des profils : ", error);
            await interaction.editReply('Une erreur est survenue lors de la récupération des profils.');
        }
    }
};

async function generateEmbed(client, rows, page) {
    const profil = rows[page];

    try {
        const targetUser = await client.users.fetch(profil.user_id);
        return new EmbedBuilder()
            .setTitle(`Profil de ${profil.prenomInput}`)
            .setDescription(profil.dateDesc)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Âge', value: `${profil.ageInput}`, inline: true },
                { name: 'Orientation', value: `${profil.dateOrientation}`, inline: true },
                { name: 'Recherche', value: `${profil.searchInput}`, inline: true },
            )
            .setFooter({ text: `Page ${page + 1} sur ${rows.length}` });
    } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur : ", error);
        return new EmbedBuilder()
            .setTitle('Erreur')
            .setDescription('Impossible de charger ce profil pour le moment.');
    }
}

function generateActionRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('previous')
            .setLabel("⬅️")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('like')
            .setLabel("❤️")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('next')
            .setLabel("➡️")
            .setStyle(ButtonStyle.Primary)
    );
}

function registerCollector(client, embedMessage, rows, page) {
    const collector = embedMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000
    });

    collector.on('collect', async (i) => {
        try {
            if (i.customId === 'like') {
                const likedId = rows[page].user_id;
                const likerId = i.user.id;

                const existingLike = await db.checkIfLikeExists(likerId, likedId);

                if (existingLike) {
                    return i.reply({ content: 'Vous avez déjà aimé ce profil.', ephemeral: true });
                }

                await db.insertIntoLike(likerId, likedId);
                const isMatch = await db.checkIfLikeExists(likedId, likerId);

                if (isMatch) {
                    const liker = await client.users.fetch(likerId);
                    const liked = await client.users.fetch(likedId);

                    if (liker && liked) {
                        await liker.send(`Toi et <@${likedId}> avez matché! 💓`);
                        await liked.send(`Toi et <@${likerId}> avez matché! 💓`);
                    }
                }

                return i.reply({ content: 'Vous avez aimé ce profil!', ephemeral: true });
            } else if (i.customId === 'previous') {
                page = page > 0 ? --page : rows.length - 1;
                i.update({ embeds: [await generateEmbed(client, rows, page)], components: [generateActionRow()] });
            } else if (i.customId === 'next') {
                page = page + 1 < rows.length ? ++page : 0;
                i.update({ embeds: [await generateEmbed(client, rows, page)], components: [generateActionRow()] });
            }
        } catch (error) {
            console.error("Erreur lors de l'interaction avec un bouton : ", error);
            i.reply({ content: 'Une erreur est survenue lors de l\'interaction avec le bouton.', ephemeral: true });
        }
    });

    collector.on('end', () => {
        embedMessage.edit({ components: [] });
    });
}
