require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Sequelize, DataTypes } = require("sequelize");
const config = require("../config/config.js")["development"];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false,
});

/**
 * Applies v1.10 schema additions to streamer_profiles:
 * - is_subathon_active (BOOLEAN, default false)
 * - subathon_price_per_second (FLOAT, default 0.0005)
 *
 * @returns {Promise<void>}
 */
async function up() {
  const qi = sequelize.getQueryInterface();
  const cols = await qi.describeTable("streamer_profiles");

  if (!cols.is_subathon_active) {
    await qi.addColumn("streamer_profiles", "is_subathon_active", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    console.log("Added: streamer_profiles.is_subathon_active");
  } else {
    console.log("Skip: is_subathon_active already exists");
  }

  if (!cols.subathon_price_per_second) {
    await qi.addColumn("streamer_profiles", "subathon_price_per_second", {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0005,
    });
    console.log("Added: streamer_profiles.subathon_price_per_second");
  } else {
    console.log("Skip: subathon_price_per_second already exists");
  }

  await sequelize.close();
  console.log("Migration v1.10 complete.");
  process.exit(0);
}

up().catch((e) => {
  console.error("Migration error:", e.message);
  process.exit(1);
});
