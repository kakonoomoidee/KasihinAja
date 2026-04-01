require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Sequelize, DataTypes } = require("sequelize");
const config = require("../config/config.js")["development"];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false,
});

/**
 * Applies v1.9 schema addition: subathon_end_time timestamp on streamer_profiles.
 *
 * @returns {Promise<void>}
 */
async function up() {
  const qi = sequelize.getQueryInterface();
  const cols = await qi.describeTable("streamer_profiles");

  if (!cols.subathon_end_time) {
    await qi.addColumn("streamer_profiles", "subathon_end_time", {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null,
    });
    console.log("Added: streamer_profiles.subathon_end_time");
  } else {
    console.log("Skip: streamer_profiles.subathon_end_time already exists");
  }

  await sequelize.close();
  console.log("Migration v1.9 complete.");
  process.exit(0);
}

up().catch((e) => {
  console.error("Migration error:", e.message);
  process.exit(1);
});
