require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Sequelize, DataTypes } = require("sequelize");
const config = require("../config/config.js")["development"];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false,
});

/**
 * Applies v1.8 schema additions: subathon_config on streamer_profiles and the leaderboards aggregate table.
 *
 * @returns {Promise<void>}
 */
async function up() {
  const qi = sequelize.getQueryInterface();
  const profileCols = await qi.describeTable("streamer_profiles");

  if (!profileCols.subathon_config) {
    await qi.addColumn("streamer_profiles", "subathon_config", {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    });
    console.log("Added: streamer_profiles.subathon_config");
  } else {
    console.log("Skip: streamer_profiles.subathon_config already exists");
  }

  const tables = await qi.showAllTables();
  if (!tables.includes("leaderboards")) {
    await qi.createTable("leaderboards", {
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
    await qi.addIndex("leaderboards", ["streamer_address"], { name: "idx_leaderboards_streamer" });
    await qi.addIndex("leaderboards", ["donor_address"], { name: "idx_leaderboards_donor" });
    await qi.addIndex("leaderboards", ["streamer_address", "donor_address"], {
      unique: true,
      name: "uq_leaderboards_streamer_donor",
    });
    console.log("Created: leaderboards table with indexes");
  } else {
    console.log("Skip: leaderboards table already exists");
  }

  await sequelize.close();
  console.log("Migration v1.8 complete.");
  process.exit(0);
}

up().catch((e) => {
  console.error("Migration error:", e.message);
  process.exit(1);
});
