/**
 * Migration to add advanced profile columns for media share, VN, templates, and bans.
 */
module.exports = {
  /**
   * Applies the new columns to streamer_profiles.
   *
   * @param {object} queryInterface The Sequelize query interface.
   * @param {object} Sequelize The Sequelize module.
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("streamer_profiles", "enable_media_share", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });
    await queryInterface.addColumn("streamer_profiles", "enable_vn", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });
    await queryInterface.addColumn("streamer_profiles", "alert_template", {
      type: Sequelize.STRING(30),
      allowNull: true,
      defaultValue: "classic"
    });
    await queryInterface.addColumn("streamer_profiles", "banned_keys", {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: "[]"
    });
  },

  /**
   * Reverts the added columns.
   *
   * @param {object} queryInterface The Sequelize query interface.
   * @param {object} Sequelize The Sequelize module.
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("streamer_profiles", "enable_media_share");
    await queryInterface.removeColumn("streamer_profiles", "enable_vn");
    await queryInterface.removeColumn("streamer_profiles", "alert_template");
    await queryInterface.removeColumn("streamer_profiles", "banned_keys");
  }
};
