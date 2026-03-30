require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const config = require("./config/config.js")["development"];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false,
});

/**
 * Applies v1.4 column additions to donation_history.
 *
 * @returns {Promise<void>}
 */
async function run() {
  const qi = sequelize.getQueryInterface();
  const cols = await qi.describeTable("donation_history");

  if (!cols.donor_name) {
    await qi.addColumn("donation_history", "donor_name", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Anonymous",
    });
    console.log("Added: donation_history.donor_name");
  } else {
    console.log("Skip: donation_history.donor_name already exists");
  }

  if (!cols.media_type) {
    await qi.addColumn("donation_history", "media_type", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "none",
    });
    console.log("Added: donation_history.media_type");
  } else {
    console.log("Skip: donation_history.media_type already exists");
  }

  await sequelize.close();
  console.log("Migration v1.4 complete.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration error:", e.message);
  process.exit(1);
});
