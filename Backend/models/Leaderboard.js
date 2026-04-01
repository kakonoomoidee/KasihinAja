/**
 * Defines the Leaderboard aggregate schema for Sequelize.
 * Each row represents the lifetime total donations from one donor to one streamer.
 *
 * @param {object} sequelize The Sequelize instance.
 * @param {object} DataTypes The Sequelize DataTypes object.
 * @returns {object} The Leaderboard model definition.
 */
module.exports = (sequelize, DataTypes) => {
  const Leaderboard = sequelize.define("Leaderboard", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    streamer_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
    },
    donor_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
    },
    donor_name: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Anonymous",
    },
    total_amount_eth: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: "leaderboards",
    timestamps: false,
    indexes: [
      { fields: ["streamer_address"] },
      { fields: ["donor_address"] },
      { unique: true, fields: ["streamer_address", "donor_address"] },
    ],
  });

  return Leaderboard;
};
