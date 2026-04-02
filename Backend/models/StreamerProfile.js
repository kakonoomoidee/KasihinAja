/**
 * Defines the StreamerProfile schema for Sequelize.
 *
 * @param {object} sequelize The Sequelize instance.
 * @param {object} DataTypes The Sequelize DataTypes object.
 * @returns {object} The StreamerProfile model definition.
 */
module.exports = (sequelize, DataTypes) => {
  const StreamerProfile = sequelize.define("StreamerProfile", {
    wallet_address: {
      type: DataTypes.STRING(42),
      primaryKey: true,
      allowNull: false,
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    msg_color: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    user_color: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    bg_color: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    custom_blacklist: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    milestone_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ""
    },
    milestone_target: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    milestone_current: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    enable_media_share: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    enable_vn: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    alert_template: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: "classic"
    },
    banned_keys: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    media_price_per_second: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0.0005,
    },
    vn_fixed_price: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0.01,
    },
    subathon_config: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    subathon_end_time: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null,
    },
    is_subathon_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: "streamer_profiles",
    timestamps: false,
  });

  StreamerProfile.associate = function(models) {
    StreamerProfile.hasMany(models.DonationHistory, {
      foreignKey: "streamer_address",
      as: "donations"
    });
  };

  return StreamerProfile;
};
