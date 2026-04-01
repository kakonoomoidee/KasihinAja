require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Sequelize, DataTypes } = require("sequelize");
const config = require("../config/config.js")["development"];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false,
});

/**
 * Applies v1.6 column additions to donation_history for media timing data.
 *
 * @returns {Promise<void>}
 */
async function run() {
  const qi = sequelize.getQueryInterface();
  const cols = await qi.describeTable("donation_history");

  if (!cols.media_start) {
    await qi.addColumn("donation_history", "media_start", {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
    console.log("Added: donation_history.media_start");
  } else {
    console.log("Skip: donation_history.media_start already exists");
  }

  if (!cols.media_duration) {
    await qi.addColumn("donation_history", "media_duration", {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 5,
    });
    console.log("Added: donation_history.media_duration");
  } else {
    console.log("Skip: donation_history.media_duration already exists");
  }

  await sequelize.close();
  console.log("Migration v1.6 complete.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration error:", e.message);
  process.exit(1);
});
