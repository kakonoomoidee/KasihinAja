const fs = require("fs");
const path = require("path");
const DonationRouter = artifacts.require("DonationRouter");

/**
 * Deploys the DonationRouter contract to the local network and updates the backend environment variables.
 *
 * @param {object} deployer The Truffle deployer instance.
 * @returns {void}
 */
module.exports = async function (deployer) {
  await deployer.deploy(DonationRouter);
  const routerInstance = await DonationRouter.deployed();

  const envFilePath = path.resolve(__dirname, "../../Backend/.env");
  const backendDirPath = path.dirname(envFilePath);

  if (!fs.existsSync(backendDirPath)) {
    fs.mkdirSync(backendDirPath, { recursive: true });
  }

  let envData = "";
  if (fs.existsSync(envFilePath)) {
    envData = fs.readFileSync(envFilePath, "utf8");
  }

  const variableString = `DONATION_ROUTER_ADDRESS=${routerInstance.address}`;

  if (envData.includes("DONATION_ROUTER_ADDRESS=")) {
    envData = envData.replace(/DONATION_ROUTER_ADDRESS=.*/g, variableString);
  } else {
    envData += `\n${variableString}\n`;
  }

  fs.writeFileSync(envFilePath, envData.trim() + "\n");
};
