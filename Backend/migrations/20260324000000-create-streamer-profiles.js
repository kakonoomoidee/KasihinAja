/**
 * Migration schema for creating the streamer_profiles table.
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
    await queryInterface.createTable("streamer_profiles", {
      wallet_address: {
        type: Sequelize.STRING(42),
        primaryKey: true,
        allowNull: false,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      avatar_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      msg_color: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      user_color: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      bg_color: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      custom_blacklist: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: "[]"
      },
      milestone_target: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0
      },
      milestone_current: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0
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
    await queryInterface.dropTable("streamer_profiles");
  }
};
