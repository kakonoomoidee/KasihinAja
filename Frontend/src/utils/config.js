export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
export const DONATION_ROUTER_ADDRESS = import.meta.env.VITE_DONATION_ROUTER_ADDRESS;

import DonationRouter from "./DonationRouter.json";

export const ROUTER_ABI = DonationRouter.abi;
