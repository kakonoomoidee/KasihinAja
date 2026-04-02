require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Sequelize } = require("sequelize");
const config = require("../config/config.js")["development"];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false,
});

/**
 * Drops the subathon_price_per_second column from streamer_profiles.
 * The subathon_config JSON array is the sole source of truth for pricing rules.
 *
 * @returns {Promise<void>}
 */
async function up() {
  const qi = sequelize.getQueryInterface();
  const cols = await qi.describeTable("streamer_profiles");

  if (cols.subathon_price_per_second) {
    await qi.removeColumn("streamer_profiles", "subathon_price_per_second");
    console.log("Dropped: streamer_profiles.subathon_price_per_second");
  } else {
    console.log("Skip: subathon_price_per_second does not exist");
  }

  await sequelize.close();
  console.log("Migration v1.11 complete.");
  process.exit(0);
}

up().catch((e) => {
  console.error("Migration error:", e.message);
  process.exit(1);
});
