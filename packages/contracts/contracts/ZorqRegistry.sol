// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title ZorqRegistry
 * @notice Authoritative, non-upgradeable registry and non-transferable ERC-721
 *         DataLicense for job-scoped federated-learning participation rights.
 * @dev The contract stores opaque asset/job identifiers and salted metadata
 *      commitments only. Raw datasets and private metadata never go on-chain.
 */
contract ZorqRegistry is ERC721, Ownable2Step {
    enum JobState {
        OPEN,
        PAUSED,
        CLOSED
    }

    enum AuthorizationReason {
        AUTHORIZED,
        UNKNOWN_LICENSE,
        WRONG_PARTICIPANT,
        WRONG_JOB,
        REVOKED,
        ASSET_INACTIVE,
        JOB_NOT_OPEN,
        NOT_YET_VALID,
        LICENSE_EXPIRED,
        JOB_NOT_STARTED,
        JOB_EXPIRED
    }

    struct DataAsset {
        address owner;
        bytes32 metadataCommitment;
        bool active;
    }

    struct TrainingJob {
        address creator;
        bytes32 purposeHash;
        bytes32 modelConfigHash;
        uint64 startsAt;
        uint64 endsAt;
        uint8 maxParticipants;
        uint8 distinctAssetCount;
        JobState state;
    }

    struct DataLicense {
        bytes32 assetId;
        bytes32 jobId;
        uint64 validFrom;
        uint64 validUntil;
        uint32 revision;
        bool revoked;
    }

    mapping(bytes32 assetId => DataAsset) public assets;
    mapping(bytes32 jobId => TrainingJob) public jobs;
    mapping(uint256 tokenId => DataLicense) public licenses;
    mapping(bytes32 assetId => mapping(bytes32 jobId => uint256)) public latestLicenseId;
    mapping(bytes32 jobId => mapping(bytes32 assetId => uint32)) private _licenseRevision;

    uint256 private _nextTokenId = 1;
    bool public creationPaused;

    error InvalidIdentifier();
    error InvalidCommitment();
    error InvalidJobWindow();
    error InvalidParticipantLimit();
    error InvalidLicenseWindow();
    error NotAssetOwner();
    error NotJobCreator();
    error AssetAlreadyExists();
    error AssetInactive();
    error JobAlreadyExists();
    error JobNotOpen();
    error InvalidJobTransition();
    error ActiveLicenseExists();
    error ParticipantLimitReached();
    error LicenseNotFound();
    error NotLicenseOwner();
    error LicenseAlreadyRevoked();
    error Soulbound();
    error CreationPaused();

    event AssetRegistered(
        bytes32 indexed assetId,
        address indexed owner,
        bytes32 metadataCommitment
    );
    event AssetDeactivated(bytes32 indexed assetId, address indexed owner);
    event JobCreated(
        bytes32 indexed jobId,
        address indexed creator,
        bytes32 purposeHash,
        bytes32 modelConfigHash,
        uint64 startsAt,
        uint64 endsAt
    );
    event JobStateChanged(bytes32 indexed jobId, address indexed creator, JobState state);
    event LicenseIssued(
        uint256 indexed tokenId,
        bytes32 indexed assetId,
        bytes32 indexed jobId,
        address owner,
        uint32 revision,
        uint64 validFrom,
        uint64 validUntil
    );
    event LicenseRevoked(
        uint256 indexed tokenId,
        bytes32 indexed assetId,
        bytes32 indexed jobId,
        address owner
    );
    event CreationPauseChanged(bool paused);

    constructor(address initialOwner) ERC721("Zorq DataLicense", "ZORQ") Ownable(initialOwner) {}

    modifier onlyExistingAsset(bytes32 assetId) {
        if (assets[assetId].owner == address(0)) revert InvalidIdentifier();
        _;
    }

    modifier onlyExistingJob(bytes32 jobId) {
        if (jobs[jobId].creator == address(0)) revert InvalidIdentifier();
        _;
    }

    function registerAsset(bytes32 assetId, bytes32 metadataCommitment) external {
        if (creationPaused) revert CreationPaused();
        if (assetId == bytes32(0)) revert InvalidIdentifier();
        if (metadataCommitment == bytes32(0)) revert InvalidCommitment();
        if (assets[assetId].owner != address(0)) revert AssetAlreadyExists();

        assets[assetId] = DataAsset({
            owner: msg.sender,
            metadataCommitment: metadataCommitment,
            active: true
        });

        emit AssetRegistered(assetId, msg.sender, metadataCommitment);
    }

    function deactivateAsset(bytes32 assetId) external onlyExistingAsset(assetId) {
        DataAsset storage asset = assets[assetId];
        if (asset.owner != msg.sender) revert NotAssetOwner();
        if (!asset.active) revert AssetInactive();

        asset.active = false;
        emit AssetDeactivated(assetId, msg.sender);
    }

    function createJob(
        bytes32 jobId,
        bytes32 purposeHash,
        bytes32 modelConfigHash,
        uint64 startsAt,
        uint64 endsAt,
        uint8 maxParticipants
    ) external {
        if (creationPaused) revert CreationPaused();
        if (jobId == bytes32(0)) revert InvalidIdentifier();
        if (purposeHash == bytes32(0) || modelConfigHash == bytes32(0)) {
            revert InvalidCommitment();
        }
        if (startsAt >= endsAt || endsAt <= block.timestamp) revert InvalidJobWindow();
        if (endsAt - startsAt > 30 days) revert InvalidJobWindow();
        if (maxParticipants < 2 || maxParticipants > 5) {
            revert InvalidParticipantLimit();
        }
        if (jobs[jobId].creator != address(0)) revert JobAlreadyExists();

        jobs[jobId] = TrainingJob({
            creator: msg.sender,
            purposeHash: purposeHash,
            modelConfigHash: modelConfigHash,
            startsAt: startsAt,
            endsAt: endsAt,
            maxParticipants: maxParticipants,
            distinctAssetCount: 0,
            state: JobState.OPEN
        });

        emit JobCreated(jobId, msg.sender, purposeHash, modelConfigHash, startsAt, endsAt);
    }

    function setJobState(bytes32 jobId, JobState nextState) external onlyExistingJob(jobId) {
        TrainingJob storage job = jobs[jobId];
        if (job.creator != msg.sender) revert NotJobCreator();

        JobState current = job.state;
        bool valid = (current == JobState.OPEN &&
            (nextState == JobState.PAUSED || nextState == JobState.CLOSED)) ||
            (current == JobState.PAUSED &&
                (nextState == JobState.OPEN || nextState == JobState.CLOSED));

        if (!valid) revert InvalidJobTransition();

        job.state = nextState;
        emit JobStateChanged(jobId, msg.sender, nextState);
    }

    function issueLicense(
        bytes32 assetId,
        bytes32 jobId,
        uint64 validFrom,
        uint64 validUntil
    ) external {
        if (creationPaused) revert CreationPaused();

        DataAsset storage asset = assets[assetId];
        if (asset.owner == address(0)) revert InvalidIdentifier();
        if (asset.owner != msg.sender) revert NotAssetOwner();
        if (!asset.active) revert AssetInactive();

        TrainingJob storage job = jobs[jobId];
        if (job.creator == address(0)) revert InvalidIdentifier();
        if (job.state != JobState.OPEN) revert JobNotOpen();
        if (block.timestamp < job.startsAt || block.timestamp >= job.endsAt) {
            revert InvalidJobWindow();
        }
        if (
            validFrom < block.timestamp ||
            validUntil <= validFrom ||
            validFrom < job.startsAt ||
            validUntil > job.endsAt
        ) {
            revert InvalidLicenseWindow();
        }

        uint256 previousId = latestLicenseId[assetId][jobId];
        if (previousId != 0) {
            DataLicense storage previous = licenses[previousId];
            if (!previous.revoked && block.timestamp < previous.validUntil) {
                revert ActiveLicenseExists();
            }
        }

        if (latestLicenseId[assetId][jobId] == 0) {
            if (job.distinctAssetCount >= job.maxParticipants) revert ParticipantLimitReached();
            job.distinctAssetCount += 1;
        }

        uint32 revision = ++_licenseRevision[jobId][assetId];
        uint256 tokenId = _nextTokenId++;

        licenses[tokenId] = DataLicense({
            assetId: assetId,
            jobId: jobId,
            validFrom: validFrom,
            validUntil: validUntil,
            revision: revision,
            revoked: false
        });
        latestLicenseId[assetId][jobId] = tokenId;

        _mint(msg.sender, tokenId);

        emit LicenseIssued(
            tokenId,
            assetId,
            jobId,
            msg.sender,
            revision,
            validFrom,
            validUntil
        );
    }

    function revokeLicense(uint256 tokenId) external {
        DataLicense storage license = licenses[tokenId];
        if (_ownerOf(tokenId) == address(0)) revert LicenseNotFound();
        if (ownerOf(tokenId) != msg.sender) revert NotLicenseOwner();
        if (license.revoked) revert LicenseAlreadyRevoked();

        license.revoked = true;
        emit LicenseRevoked(tokenId, license.assetId, license.jobId, msg.sender);
    }

    function setCreationPaused(bool paused) external onlyOwner {
        creationPaused = paused;
        emit CreationPauseChanged(paused);
    }

    function checkAuthorization(
        uint256 tokenId,
        address participant,
        bytes32 jobId
    ) external view returns (bool allowed, AuthorizationReason reason) {
        address tokenOwner = _ownerOf(tokenId);
        if (tokenOwner == address(0)) {
            return (false, AuthorizationReason.UNKNOWN_LICENSE);
        }

        DataLicense storage license = licenses[tokenId];
        if (license.jobId != jobId) {
            return (false, AuthorizationReason.WRONG_JOB);
        }
        if (tokenOwner != participant) {
            return (false, AuthorizationReason.WRONG_PARTICIPANT);
        }

        DataAsset storage asset = assets[license.assetId];
        if (asset.owner != participant) {
            return (false, AuthorizationReason.WRONG_PARTICIPANT);
        }
        if (license.revoked) {
            return (false, AuthorizationReason.REVOKED);
        }
        if (!asset.active) {
            return (false, AuthorizationReason.ASSET_INACTIVE);
        }

        TrainingJob storage job = jobs[license.jobId];
        if (job.creator == address(0)) {
            return (false, AuthorizationReason.WRONG_JOB);
        }
        if (job.state != JobState.OPEN) {
            return (false, AuthorizationReason.JOB_NOT_OPEN);
        }
        if (block.timestamp < job.startsAt) {
            return (false, AuthorizationReason.JOB_NOT_STARTED);
        }
        if (block.timestamp >= job.endsAt) {
            return (false, AuthorizationReason.JOB_EXPIRED);
        }
        if (block.timestamp < license.validFrom) {
            return (false, AuthorizationReason.NOT_YET_VALID);
        }
        if (block.timestamp >= license.validUntil) {
            return (false, AuthorizationReason.LICENSE_EXPIRED);
        }

        return (true, AuthorizationReason.AUTHORIZED);
    }

    function _approve(address, uint256, address, bool) internal pure override {
        revert Soulbound();
    }

    function _setApprovalForAll(address, address, bool) internal pure override {
        revert Soulbound();
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }
}
