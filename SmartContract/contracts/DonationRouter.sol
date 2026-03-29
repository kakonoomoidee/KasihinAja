// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Routes donations to streamers, collects platform fees, and logs a verification token.
 */
contract DonationRouter {
    address payable public owner;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 5;

    event DonationReceived(
        address indexed donor,
        address indexed streamer,
        uint256 amount,
        string message,
        string donationToken
    );

    constructor() {
        owner = payable(msg.sender);
    }

    /**
     * @param _streamer The address of the streamer receiving the donation.
     * @param _message The message attached to the donation.
     * @param _donationToken The off-chain intent token for backend verification.
     * @return True on success.
     */
    function donate(
        address _streamer,
        string calldata _message,
        string calldata _donationToken
    ) external payable returns (bool) {
        require(msg.value > 0, "Amount must be greater than zero");

        uint256 streamerAmount = (msg.value * 95) / 100;
        uint256 fee = msg.value - streamerAmount;

        (bool feeSuccess, ) = owner.call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        (bool streamerSuccess, ) = _streamer.call{value: streamerAmount}("");
        require(streamerSuccess, "Streamer transfer failed");

        emit DonationReceived(msg.sender, _streamer, msg.value, _message, _donationToken);

        return true;
    }
}
