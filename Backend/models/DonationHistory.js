/**
 * Defines the DonationHistory schema for Sequelize.
 *
 * @param {object} sequelize The Sequelize instance.
 * @param {object} DataTypes The Sequelize DataTypes object.
 * @returns {object} The DonationHistory model definition.
 */
module.exports = (sequelize, DataTypes) => {
  const DonationHistory = sequelize.define("DonationHistory", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    donor_address: {
      type: DataTypes.STRING(42),
      allowNull: true,
    },
    streamer_address: {
      type: DataTypes.STRING(42),
      allowNull: true,
    },
    amount: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    filtered_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: "donation_history",
    timestamps: false,
  });

  DonationHistory.associate = function(models) {
    DonationHistory.belongsTo(models.StreamerProfile, {
      foreignKey: "streamer_address",
      as: "streamer"
    });
  };

  return DonationHistory;
};
