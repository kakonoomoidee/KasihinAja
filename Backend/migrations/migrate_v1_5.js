require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Sequelize, DataTypes } = require("sequelize");
const config = require("../config/config.js")["development"];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false,
});

/**
 * Applies v1.5 column additions to streamer_profiles for dynamic media pricing.
 *
 * @returns {Promise<void>}
 */
async function run() {
  const qi = sequelize.getQueryInterface();
  const cols = await qi.describeTable("streamer_profiles");

  if (!cols.media_price_per_second) {
    await qi.addColumn("streamer_profiles", "media_price_per_second", {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0.0005,
    });
    console.log("Added: streamer_profiles.media_price_per_second");
  } else {
    console.log("Skip: streamer_profiles.media_price_per_second already exists");
  }

  if (!cols.vn_fixed_price) {
    await qi.addColumn("streamer_profiles", "vn_fixed_price", {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0.01,
    });
    console.log("Added: streamer_profiles.vn_fixed_price");
  } else {
    console.log("Skip: streamer_profiles.vn_fixed_price already exists");
  }

  await sequelize.close();
  console.log("Migration v1.5 complete.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration error:", e.message);
  process.exit(1);
});
