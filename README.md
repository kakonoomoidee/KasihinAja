# KasihinAja - Decentralized Tipping Platform

A transparent, full-stack Web3 application empowering streamers to safely capture ETH donations via a seamlessly tracked overlay integrated directly into their existing OBS setup perfectly natively.

## Prerequisites
- Node.js (v18.0.0+)
- MySQL Base Server (Laragon or XAMPP)
- Truffle Suite & Ganache Desktop (port 7545 natively required).
- MetaMask browser extension for authenticating creator profiles.

## Module 1 - Smart Contract Deployment
1. Ensure your local Ethereum node (Ganache) is bound dynamically to `http://127.0.0.1:7545`.
2. Open your terminal at `SmartContract/` and install local framework dependencies securely:
   ```bash
   cd SmartContract
   npm install
   ```
3. Compile all contract ABIs then securely generate and bind deployment addresses explicitly overwriting your core `.env`:
   ```bash
   npx truffle migrate --reset
   ```

## Module 2 - Backend Relay Hub
1. Boot up Laragon or XAMPP. Ensure MySQL is actively connected natively over port 3306.
2. Verify or generate an empty database strictly titled according to your parameter configuration. 
3. Move strictly into your `Backend/` directory mapping.
   ```bash
   cd ../Backend
   npm install
   ```
4. Perform sequential execution modeling over your DB schemas natively allocating properties.
   ```bash
   npx sequelize-cli db:migrate
   ```
5. Initiate the continuous Node execution environment, linking EVM streams and exposing REST routing:
   ```bash
   node server.js
   ```

## Module 3 - Frontend Streamer Interface
1. Launch a separate terminal completely and switch to the `Frontend/` interface map explicitly handling React paths natively.
   ```bash
   cd Frontend
   npm install
   ```
2. Activate Vite's rapid modular development framework locally binding all component structures.
   ```bash
   npm run dev
   ```

## Application Usage
1. Connect via `http://localhost:5173/dashboard` safely unlocking access securely using MetaMask validation architectures seamlessly connecting your decentralized stream ID.
2. Navigate the **KasihinAja Hub** targeting **OBS Overlay Alerts** strictly revealing your decoded Base64 OBS browser link natively hidden perfectly ensuring security.
3. Add the output URI cleanly as an isolated OBS **Browser Source** ensuring *Make background transparent* remains dynamically enabled!
4. Customize your Notification Palettes, deploy **AI Content Filtering** parameters, map out rigid **Financial Objective Limits**, and safely distribute your **Public Portal Link** to start capturing tips directly into your mapped public Ethereum node!
