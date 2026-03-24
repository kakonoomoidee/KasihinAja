import { ethers } from "ethers";

/**
 * Prompts the user to connect their digital wallet and retrieves the signer interface.
 *
 * @returns {Promise<object>} Returns the Ethers abstract signer.
 */
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is required");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};

/**
 * Generates a cryptographic signature proving ownership of a specified wallet address.
 *
 * @param {object} signer The connected Ethers signer.
 * @param {object} payload The data object representing the setup.
 * @returns {Promise<string>} An Ethereum compatible ECDSA signature.
 */
export const signPayload = async (signer, payload) => {
  const payloadString = JSON.stringify(payload);
  const signature = await signer.signMessage(payloadString);
  return signature;
};
