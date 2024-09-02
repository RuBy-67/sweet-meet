const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, Events } = require('discord.js');
const Dating = require("../../class/dateManager");
const db = new Dating();

module.exports = {
    name: 'createdateprofil',
    description: 'Crée un profil pour date',

    run: async (client) => {

      client.once(Events.InteractionCreate, async (interaction) =>{
            if (interaction.isChatInputCommand() && interaction.commandName ==='createdateprofil') {

                // création du modal
                const modal = new ModalBuilder()
                    .setCustomId('DateModal')
                    .setTitle('Créer ton Profil');

                const prenomInput = new TextInputBuilder()
                    .setCustomId('prenomInput')
                    .setLabel("Quel est votre prénom/pseudo ?")
                    .setStyle(TextInputStyle.Short);

                const ageInput = new TextInputBuilder()
                    .setCustomId('ageInput')
                    .setLabel("Quel âge avez vous ?")
                    .setStyle(TextInputStyle.Short);

                const orientationInput = new TextInputBuilder()
                    .setCustomId('orientationInput')
                    .setLabel("Quel est votre orientation ?")
                    .setStyle(TextInputStyle.Short);

                const searchInput = new TextInputBuilder()
                    .setCustomId('searchInput')
                    .setLabel("Que recherchez-vous ?")
                    .setStyle(TextInputStyle.Short);

                const descriptionInput = new TextInputBuilder()
                    .setCustomId('descriptionInput')
                    .setLabel("Une petite description de vous?")
                    .setStyle(TextInputStyle.Paragraph);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(prenomInput),
                    new ActionRowBuilder().addComponents(ageInput),
                    new ActionRowBuilder().addComponents(orientationInput),
                    new ActionRowBuilder().addComponents(searchInput),
                    new ActionRowBuilder().addComponents(descriptionInput),
                );

            }
            else if (interaction.type === InteractionType.ModalSubmit) {

                const user_id = interaction.user.id;
                const prenomInput = interaction.fields.getTextInputValue('prenomInput');
                const ageInput = interaction.fields.getTextInputValue('ageInput');
                const dateOrientation = interaction.fields.getTextInputValue('orientationInput');
                const searchInput = interaction.fields.getTextInputValue('searchInput');
                const descriptionInput = interaction.fields.getTextInputValue('descriptionInput');

                // REGEX DU FORMULAIRE
                const prenomRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿ \-_]{3,20}$/;
                const ageRegex = /^(?:1[01][0-9]|[1-9]?[0-9]|120)$/;
                const orientationRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿ \-_]{1,50}$/;
                const searchRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿ \-_]{1,50}$/;
                const descriptionRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s*~_\-']{1,300}$/;

                if (!prenomRegex.test(prenomInput)) {
                    return interaction.reply({ content: "Le prénom/pseudo doit contenir entre 3 et 20 caractères", ephemeral: true });
                }

                if (!ageRegex.test(ageInput)) {
                    return interaction.reply({ content: "L'âge doit être un nombre entier valide entre 1 et 120.", ephemeral: true });
                }

                if (!orientationRegex.test(dateOrientation)) {
                    return interaction.reply({ content: "Votre Orientation doit contenir entre 1 et 20 caractères sans caractères spéciaux", ephemeral: true });
                }

                if (!searchRegex.test(searchInput)) {
                    return interaction.reply({ content: "Votre Recherche doit contenir entre 1 et 20 caractères sans caractères spéciaux", ephemeral: true });
                }

                if (!descriptionRegex.test(descriptionInput)) {
                    return interaction.reply({ content: "La description doit contenir entre 1 et 300 caractères sans caractères spéciaux", ephemeral: true });
                }

                const existingProfile = await db.getProfileByUserId(user_id);
                if (existingProfile) {
                    return interaction.reply({ content: "Un profil existe déjà pour cet utilisateur. Impossible d'en créer un nouveau.", ephemeral: true });
                }
                // INSERTION DES DONNEES DANS LA DB
                await db.insertIntoProfile(
                    user_id,
                    dateOrientation,
                    searchInput,
                    prenomInput,
                    ageInput,
                    descriptionInput,
                );
                interaction.reply({ content: "Profil prêt à dater !", ephemeral: true });
            }
        })
    },
};