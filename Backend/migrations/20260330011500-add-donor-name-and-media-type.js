"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("donation_history", "donor_name", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "Anonymous",
      after: "donor_address",
    });

    await queryInterface.addColumn("donation_history", "media_type", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "none",
      comment: "youtube, tiktok, vn, or none",
      before: "media_url",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("donation_history", "donor_name");
    await queryInterface.removeColumn("donation_history", "media_type");
  },
};
