const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, Events } = require('discord.js');
const Dating = require("../../class/dateManager");
const db = new Dating();

module.exports = {
    name: 'createdateprofil',
    description: 'Crée un profil pour date',

    run: async (client, interaction) => {
        console.log("Commande 'createdateprofil' exécutée");

        // Création du modal pour entrer les détails du profil
        const modal = new ModalBuilder()
            .setCustomId('DateModal')
            .setTitle('Créer ton Profil');

        const prenomInput = new TextInputBuilder()
            .setCustomId('prenomInput')
            .setLabel("Quel est votre prénom/pseudo ?")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(20);

        const ageInput = new TextInputBuilder()
            .setCustomId('ageInput')
            .setLabel("Quel âge avez-vous ?")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(3);

        const orientationInput = new TextInputBuilder()
            .setCustomId('orientationInput')
            .setLabel("Quel est votre orientation ?")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(50);

        const searchInput = new TextInputBuilder()
            .setCustomId('searchInput')
            .setLabel("Que recherchez-vous ?")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(50);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('descriptionInput')
            .setLabel("Une petite description de vous ?")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(500);

        modal.addComponents(
            new ActionRowBuilder().addComponents(prenomInput),
            new ActionRowBuilder().addComponents(ageInput),
            new ActionRowBuilder().addComponents(orientationInput),
            new ActionRowBuilder().addComponents(searchInput),
            new ActionRowBuilder().addComponents(descriptionInput),
        );

        // Afficher le modal
        await interaction.showModal(modal);
    }
};

// Enregistrement de l'événement d'interaction pour le modal
module.exports.registerEvent = (client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'DateModal') {
            console.log("Modal soumis");

            // Délai de réponse pour éviter l'erreur d'intégration inconnue
            await interaction.deferReply({ ephemeral: true });

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

            // Validation des champs du formulaire
            if (!prenomRegex.test(prenomInput)) {
                return interaction.followUp({ content: "Le prénom/pseudo doit contenir entre 3 et 20 caractères", ephemeral: true });
            }

            if (!ageRegex.test(ageInput)) {
                return interaction.followUp({ content: "L'âge doit être un nombre entier valide entre 1 et 120.", ephemeral: true });
            }

            if (!orientationRegex.test(dateOrientation)) {
                return interaction.followUp({ content: "Votre Orientation doit contenir entre 1 et 50 caractères sans caractères spéciaux", ephemeral: true });
            }

            if (!searchRegex.test(searchInput)) {
                return interaction.followUp({ content: "Votre Recherche doit contenir entre 1 et 50 caractères sans caractères spéciaux", ephemeral: true });
            }

            if (!descriptionRegex.test(descriptionInput)) {
                return interaction.followUp({ content: "La description doit contenir entre 1 et 300 caractères sans caractères spéciaux", ephemeral: true });
            }

            // Vérification de l'existence d'un profil pour cet utilisateur
            const existingProfile = await db.getProfileByUserId(user_id);
            console.log("Profil existant pour l'utilisateur ID", user_id, ":", existingProfile);

            // Si un profil existe déjà
            if (existingProfile && existingProfile.length > 0) {
                console.log("Un profil a été trouvé pour cet utilisateur.");
                return interaction.followUp({ content: "Un profil existe déjà pour cet utilisateur. Impossible d'en créer un nouveau.", ephemeral: true });
            }

            // Insertion du profil dans la base de données
            try {
                await db.insertIntoProfile(
                    user_id,
                    dateOrientation,
                    searchInput,
                    prenomInput,
                    ageInput,
                    descriptionInput,
                );
                // Réponse réussie après l'insertion du profil
                interaction.followUp({ content: "Profil prêt à dater !", ephemeral: true });
            } catch (error) {
                console.error("Erreur lors de l'insertion du profil :", error);
                interaction.followUp({ content: "Une erreur est survenue lors de la création du profil.", ephemeral: true });
            }
        }
    });
};
