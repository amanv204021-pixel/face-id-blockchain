// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FaceRecordAnchor
 * @notice Tamper-evident anchoring of face-verification demo records.
 *         Stores ONLY hashes and non-sensitive metadata:
 *         no images, no embeddings, no names, no personal data.
 */
contract FaceRecordAnchor {
    struct Record {
        bytes32 recordHash;
        bytes32 sourceHash;
        uint256 timestamp;
        address anchoredBy;
    }

    mapping(bytes32 => Record) private _records;
    bytes32[] private _recordHashes;
    uint256 public recordCount;

    event RecordAnchored(
        bytes32 indexed recordHash,
        bytes32 indexed sourceHash,
        uint256 timestamp,
        address indexed anchoredBy
    );

    /**
     * @notice Anchor a verification record hash.
     * @param recordHash SHA-256 (as bytes32) of the canonical JSON record.
     * @param sourceHash SHA-256 of the match source reference.
     * @param timestamp  Unix seconds when the record was produced.
     */
    function storeRecord(bytes32 recordHash, bytes32 sourceHash, uint256 timestamp) external {
        require(timestamp > 0, "invalid timestamp");
        require(_records[recordHash].timestamp == 0, "already anchored");
        _records[recordHash] = Record(recordHash, sourceHash, timestamp, msg.sender);
        _recordHashes.push(recordHash);
        recordCount += 1;
        emit RecordAnchored(recordHash, sourceHash, timestamp, msg.sender);
    }

    /**
     * @notice Verify whether a record hash was anchored and when.
     */
    function verifyRecord(bytes32 recordHash)
        external
        view
        returns (bool verified, bytes32 sourceHash, uint256 timestamp, address anchoredBy)
    {
        Record memory r = _records[recordHash];
        return (r.timestamp != 0, r.sourceHash, r.timestamp, r.anchoredBy);
    }

    function allRecordHashes() external view returns (bytes32[] memory) {
        return _recordHashes;
    }
}
