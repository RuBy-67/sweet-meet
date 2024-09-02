const { EmbedBuilder, ButtonBuilder, ButtonStyle, ComponentType, ActionRowBuilder } = require('discord.js');
const Dating = require("../../class/dateManager");
const db = new Dating();

module.exports = {
    name: 'dateprofil',
    description: 'Affiche les profils de date',

    run: async (client, interaction) => {
        if (!interaction.isChatInputCommand() && interaction.commandName ==='dateprofil') return;

        const { commandName } = interaction;

        if (commandName === 'dateprofil') {
            const rows = await db.getAllDateProfil();
            if (!rows || rows.length === 0) {
                return interaction.reply('Aucun profil n\'a été trouvé.');
            }
            let page = 0;
            console.log(rows)

            const generateEmbed = async (page) => {
                const profil = rows[page];
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
            };

            const generateActionRow = () => {
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
            };

            const embedMessage = await interaction.reply({
                embeds: [await generateEmbed(page)],
                components: [generateActionRow()],
                fetchReply: true
            });

            const collector = embedMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60000
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'like') {
                    const likedId = rows[page].user_id;
                    const likerId = i.user.id;

                    // Vérifie si l'utilisateur a déjà liké ce profil
                    const existingLike = await db.checkIfLikeExists(likerId, likedId);

                    if (existingLike) {
                        return i.reply({ content: 'Vous avez déjà aimé ce profil.', ephemeral: true });
                    }

                    // Insère le like dans la base de données
                    await db.insertIntoLike(likerId, likedId);

                    // Vérifie si l'autre utilisateur a également aimé l'utilisateur actuel
                    const isMatch = await db.checkIfLikeExists(likedId, likerId);

                    if (isMatch) {
                        // Les deux utilisateurs se sont aimés mutuellement, donc c'est un match
                        const liker = await client.users.fetch(likerId);
                        const liked = await client.users.fetch(likedId);

                        if (!liker || !liked) {
                            return i.reply({ content: 'Impossible de trouver les utilisateurs pour le match.', ephemeral: true });
                        }

                        await liker.send(`Toi et ${liked.username} avez matché! 💓`);
                        await liked.send(`Toi et ${liker.username} avez matché! 💓`);
                        console.log(`Messages envoyés à ${liker.username} et ${liked.username}`);
                    } else {
                        console.log('Pas de match trouvé pour les IDs donnés.');
                    }

                    return i.reply({ content: 'Vous avez aimé ce profil!', ephemeral: true });
                } else if (i.customId === 'previous') {
                    // Navigation vers le profil précédent
                    page = page > 0 ? --page : rows.length - 1;
                    i.update({ embeds: [await generateEmbed(page)], components: [generateActionRow()] });
                } else if (i.customId === 'next') {
                    // Navigation vers le profil suivant
                    page = page + 1 < rows.length ? ++page : 0;
                    i.update({ embeds: [await generateEmbed(page)], components: [generateActionRow()] });
                }
            });
            collector.on('end', () => {
                // Retire les composants interactifs à la fin de la collecte
                embedMessage.edit({ components: [] });
            });
        }
    },
};