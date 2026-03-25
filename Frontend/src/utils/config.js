export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
export const DONATION_ROUTER_ADDRESS = import.meta.env.VITE_DONATION_ROUTER_ADDRESS;

export const ROUTER_ABI = [
  "function donate(address _streamer, string calldata _message) external payable returns (bool)",
  "event DonationReceived(address indexed donor, address indexed streamer, uint256 amount, string message)"
];
