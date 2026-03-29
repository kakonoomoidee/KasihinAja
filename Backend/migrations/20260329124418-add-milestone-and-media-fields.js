'use strict';

module.exports = {
  /**
   * Adds new columns for milestone and media features.
   *
   * @param {object} queryInterface The Sequelize Query Interface.
   * @param {object} Sequelize The Sequelize module.
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('streamer_profiles', 'milestone_name', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "",
    });
    
    await queryInterface.addColumn('donation_histories', 'media_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    
    await queryInterface.addColumn('donation_histories', 'vn_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  /**
   * Reverts the previously added columns.
   *
   * @param {object} queryInterface The Sequelize Query Interface.
   * @param {object} Sequelize The Sequelize module.
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('streamer_profiles', 'milestone_name');
    await queryInterface.removeColumn('donation_histories', 'media_url');
    await queryInterface.removeColumn('donation_histories', 'vn_url');
  }
};
