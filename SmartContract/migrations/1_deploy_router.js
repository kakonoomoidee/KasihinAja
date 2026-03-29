const fs = require("fs");
const path = require("path");
const DonationRouter = artifacts.require("DonationRouter");

/**
 * Updates a key=value pair in a .env file. Creates the file if it does not exist.
 *
 * @param {string} filePath Absolute path to the .env file.
 * @param {string} key The environment variable name.
 * @param {string} value The environment variable value.
 * @returns {void}
 */
const updateEnvFile = (filePath, key, value) => {
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  let envData = "";
  if (fs.existsSync(filePath)) {
    envData = fs.readFileSync(filePath, "utf8");
  }

  const entry = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*`, "gm");

  if (regex.test(envData)) {
    envData = envData.replace(regex, entry);
  } else {
    envData += `\n${entry}\n`;
  }

  fs.writeFileSync(filePath, envData.trim() + "\n");
};

/**
 * Deploys the DonationRouter contract and syncs the address to both backend and frontend .env files.
 *
 * @param {object} deployer The Truffle deployer instance.
 * @returns {Promise<void>}
 */
module.exports = async function (deployer) {
  await deployer.deploy(DonationRouter);
  const routerInstance = await DonationRouter.deployed();
  const contractAddress = routerInstance.address;

  const backendEnv = path.resolve(__dirname, "../../Backend/.env");
  const frontendEnv = path.resolve(__dirname, "../../Frontend/.env");

  updateEnvFile(backendEnv, "DONATION_ROUTER_ADDRESS", contractAddress);
  updateEnvFile(frontendEnv, "VITE_DONATION_ROUTER_ADDRESS", contractAddress);

  const backendAbiPath = path.resolve(__dirname, "../../Backend/utils/DonationRouter.json");
  const frontendAbiPath = path.resolve(__dirname, "../../Frontend/src/utils/DonationRouter.json");
  const abiJson = JSON.stringify({ abi: DonationRouter.abi }, null, 2);
  
  fs.writeFileSync(backendAbiPath, abiJson);
  fs.writeFileSync(frontendAbiPath, abiJson);

  console.log(`Contract deployed at: ${contractAddress}`);
  console.log(`Updated: ${backendEnv}`);
  console.log(`Updated: ${frontendEnv}`);
  console.log(`Exported ABI to: ${backendAbiPath}`);
  console.log(`Exported ABI to: ${frontendAbiPath}`);
};
