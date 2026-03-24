// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Manages the routing of donations to streamers and collects platform fees.
 */
contract DonationRouter {
    address payable public owner;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 5;

    event DonationReceived(address indexed donor, address indexed streamer, uint256 amount, string message);

    /**
     * Initializes the contract and assigns the deployer as the initial owner.
     */
    constructor() {
        owner = payable(msg.sender);
    }

    /**
     * Processes a donation, deducts the platform fee, and transfers the remainder to the streamer.
     *
     * @param {address} _streamer The address of the streamer receiving the donation.
     * @param {string} _message The message attached to the donation.
     * @return {bool} Returns true upon successful execution.
     */
    function donate(address _streamer, string calldata _message) external payable returns (bool) {
        require(msg.value > 0, "Amount must be greater than zero");

        uint256 fee = (msg.value * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 finalAmount = msg.value - fee;

        (bool feeSuccess, ) = owner.call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        (bool streamerSuccess, ) = _streamer.call{value: finalAmount}("");
        require(streamerSuccess, "Streamer transfer failed");

        emit DonationReceived(msg.sender, _streamer, msg.value, _message);

        return true;
    }
}
