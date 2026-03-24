export const API_URL = "http://localhost:3000/api";
export const WS_URL = "ws://localhost:3000";
export const DONATION_ROUTER_ADDRESS = "0x110Fa4479E6CDaB72195D8e9cFE12B5bb799ec35";

export const ROUTER_ABI = [
  "function donate(address _streamer, string calldata _message) external payable returns (bool)",
  "event DonationReceived(address indexed donor, address indexed streamer, uint256 amount, string message)"
];
