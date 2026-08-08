// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HallConfirmation
 * @notice A tamper-evident confirmation stamp for the UI Alumni Halls
 * Fund. This contract is intentionally minimal, by design:
 *
 *   - It holds NO funds. There is no payable function anywhere in this
 *     contract, and there never should be — donor money moves entirely
 *     through Paystack/Stripe into the university's own accounts. This
 *     contract never sees it.
 *   - It has exactly ONE write function, gated to a single owner address
 *     (the backend's server wallet). No end user, alumnus, or donor ever
 *     calls this contract directly — there is no wallet-connect flow
 *     anywhere on the donor-facing site, and there never should be.
 *   - Its only job is to emit a permanent, publicly verifiable event
 *     recording "at this point in time, this hall's confirmed total, in
 *     this currency, was X" — used both for regular donation totals and
 *     for fund-movement confirmations (see the backend's
 *     lib/blockchain/stamp.ts for both call sites).
 *
 * Because no funds ever touch this contract, there is no reentrancy
 * risk, no withdrawal logic, and no upgrade path to worry about — the
 * entire audit surface reduces to one question: does `onlyOwner`
 * actually restrict `confirmTotal()`? That's it.
 */
contract HallConfirmation {
    address public immutable owner;

    event Confirmed(
        string hallSlug,
        string currency,
        uint256 totalSubunits,
        string note,
        uint256 timestamp
    );

    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    /**
     * @notice Records a hall's confirmed total. Called by the backend
     * after a webhook confirms a successful donation, or after a
     * finance_admin records a fund movement. Never blocks or delays a
     * donor's payment confirmation — the backend calls this
     * fire-and-forget, well after the donor has already received their
     * receipt (see lib/blockchain/stamp.ts).
     * @param hallSlug The hall's slug (matches the `halls.slug` column).
     * @param currency "NGN" or "USD".
     * @param totalSubunits The new confirmed total, in integer subunits
     * (kobo or cents) — matches how the database stores money exactly,
     * so there is nothing to convert or round on-chain.
     * @param note A short human-readable note (a donation reference or a
     * fund-movement description) for on-chain context.
     */
    function confirmTotal(
        string calldata hallSlug,
        string calldata currency,
        uint256 totalSubunits,
        string calldata note
    ) external onlyOwner {
        emit Confirmed(hallSlug, currency, totalSubunits, note, block.timestamp);
    }
}
