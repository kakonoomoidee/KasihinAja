require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Sequelize, DataTypes } = require("sequelize");
const config = require("../config/config.js")["development"];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false,
});

/**
 * Applies v1.7 schema changes: migrates TEXT array columns to native JSON in streamer_profiles.
 * Handles the data conversion from JSON string values to parsed arrays before altering column type.
 *
 * @returns {Promise<void>}
 */
async function up() {
  const qi = sequelize.getQueryInterface();

  console.log("Step 1: Normalizing existing TEXT values to valid JSON arrays...");
  await sequelize.query(`
    UPDATE streamer_profiles
    SET custom_blacklist = '[]'
    WHERE custom_blacklist IS NULL OR custom_blacklist = '';
  `);
  await sequelize.query(`
    UPDATE streamer_profiles
    SET banned_keys = '[]'
    WHERE banned_keys IS NULL OR banned_keys = '' OR banned_keys = 'null';
  `);
  console.log("Step 1 done.");

  console.log("Step 2: Altering custom_blacklist to JSON...");
  await qi.changeColumn("streamer_profiles", "custom_blacklist", {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  });
  console.log("Step 2 done.");

  const cols = await qi.describeTable("streamer_profiles");
  if (!cols.banned_keys) {
    console.log("Step 3: Adding banned_keys as JSON...");
    await qi.addColumn("streamer_profiles", "banned_keys", {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    });
  } else {
    console.log("Step 3: Altering banned_keys to JSON...");
    await qi.changeColumn("streamer_profiles", "banned_keys", {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    });
  }
  console.log("Step 3 done.");

  await sequelize.close();
  console.log("Migration v1.7 complete.");
  process.exit(0);
}

up().catch((e) => {
  console.error("Migration error:", e.message);
  process.exit(1);
});
