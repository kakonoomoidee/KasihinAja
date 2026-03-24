/**
 * Migration schema for creating the donation_history table.
 */
module.exports = {
  /**
   * Applies the schema changes to the database.
   *
   * @param {object} queryInterface The Sequelize query interface.
   * @param {object} Sequelize The Sequelize module.
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("donation_history", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      donor_address: {
        type: Sequelize.STRING(42),
        allowNull: true,
      },
      streamer_address: {
        type: Sequelize.STRING(42),
        allowNull: true,
        references: {
          model: "streamer_profiles",
          key: "wallet_address"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      amount: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      filtered_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  /**
   * Reverts the schema changes.
   *
   * @param {object} queryInterface The Sequelize query interface.
   * @param {object} Sequelize The Sequelize module.
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("donation_history");
  }
};
