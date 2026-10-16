-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `githubId` BIGINT NOT NULL,
    `githubUsername` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `avatarUrl` VARCHAR(512) NULL,
    `accessToken` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_githubId_key`(`githubId`),
    INDEX `User_githubUsername_idx`(`githubUsername`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GitHubInstallation` (
    `id` VARCHAR(191) NOT NULL,
    `githubInstallationId` BIGINT NOT NULL,
    `accountLogin` VARCHAR(255) NOT NULL,
    `accountId` BIGINT NOT NULL,
    `accountAvatarUrl` VARCHAR(512) NULL,
    `accountType` VARCHAR(50) NOT NULL DEFAULT 'User',
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GitHubInstallation_githubInstallationId_key`(`githubInstallationId`),
    INDEX `GitHubInstallation_accountLogin_idx`(`accountLogin`),
    INDEX `GitHubInstallation_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Repository` (
    `id` VARCHAR(191) NOT NULL,
    `githubRepoId` BIGINT NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `fullName` VARCHAR(512) NOT NULL,
    `description` TEXT NULL,
    `visibility` VARCHAR(50) NOT NULL DEFAULT 'public',
    `defaultBranch` VARCHAR(100) NOT NULL DEFAULT 'main',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSyncAt` DATETIME(3) NULL,
    `installationId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Repository_githubRepoId_key`(`githubRepoId`),
    UNIQUE INDEX `Repository_fullName_key`(`fullName`),
    INDEX `Repository_owner_name_idx`(`owner`, `name`),
    INDEX `Repository_installationId_idx`(`installationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Issue` (
    `id` VARCHAR(191) NOT NULL,
    `githubIssueId` BIGINT NOT NULL,
    `issueNumber` INTEGER NOT NULL,
    `title` VARCHAR(512) NOT NULL,
    `body` LONGTEXT NULL,
    `state` VARCHAR(50) NOT NULL DEFAULT 'open',
    `authorUsername` VARCHAR(255) NULL,
    `authorAvatarUrl` VARCHAR(512) NULL,
    `htmlUrl` VARCHAR(512) NOT NULL,
    `labelsJson` JSON NULL,
    `embeddingJson` JSON NULL,
    `repositoryId` VARCHAR(191) NOT NULL,
    `githubCreatedAt` DATETIME(3) NULL,
    `githubUpdatedAt` DATETIME(3) NULL,
    `githubClosedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Issue_githubIssueId_key`(`githubIssueId`),
    INDEX `Issue_repositoryId_state_idx`(`repositoryId`, `state`),
    INDEX `Issue_githubIssueId_idx`(`githubIssueId`),
    UNIQUE INDEX `Issue_repositoryId_issueNumber_key`(`repositoryId`, `issueNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IssueAnalysis` (
    `id` VARCHAR(191) NOT NULL,
    `issueId` VARCHAR(191) NOT NULL,
    `category` ENUM('BUG', 'FEATURE_REQUEST', 'ENHANCEMENT', 'DOCUMENTATION', 'QUESTION', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `priority` ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    `summary` TEXT NOT NULL,
    `reasoning` TEXT NOT NULL,
    `suggestedLabels` JSON NOT NULL,
    `missingInfo` JSON NOT NULL,
    `duplicateCandidates` JSON NOT NULL,
    `modelId` VARCHAR(100) NOT NULL,
    `promptVersion` VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    `confidence` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `IssueAnalysis_issueId_idx`(`issueId`),
    INDEX `IssueAnalysis_category_idx`(`category`),
    INDEX `IssueAnalysis_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TriageAction` (
    `id` VARCHAR(191) NOT NULL,
    `issueId` VARCHAR(191) NOT NULL,
    `actionType` ENUM('APPLY_LABELS', 'POST_COMMENT', 'REQUEST_INFO') NOT NULL DEFAULT 'APPLY_LABELS',
    `proposedPayload` JSON NOT NULL,
    `approvalStatus` ENUM('PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `approvingUserId` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `executionStatus` ENUM('PENDING', 'EXECUTED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `gitHubResult` JSON NULL,
    `failureDetails` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `executedAt` DATETIME(3) NULL,

    INDEX `TriageAction_issueId_approvalStatus_idx`(`issueId`, `approvalStatus`),
    INDEX `TriageAction_approvalStatus_idx`(`approvalStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `deliveryId` VARCHAR(255) NOT NULL,
    `eventType` VARCHAR(100) NOT NULL,
    `action` VARCHAR(100) NULL,
    `payload` JSON NOT NULL,
    `processingStatus` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    UNIQUE INDEX `WebhookEvent_deliveryId_key`(`deliveryId`),
    INDEX `WebhookEvent_deliveryId_idx`(`deliveryId`),
    INDEX `WebhookEvent_eventType_idx`(`eventType`),
    INDEX `WebhookEvent_processingStatus_idx`(`processingStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GitHubInstallation` ADD CONSTRAINT `GitHubInstallation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Repository` ADD CONSTRAINT `Repository_installationId_fkey` FOREIGN KEY (`installationId`) REFERENCES `GitHubInstallation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Issue` ADD CONSTRAINT `Issue_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `Repository`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IssueAnalysis` ADD CONSTRAINT `IssueAnalysis_issueId_fkey` FOREIGN KEY (`issueId`) REFERENCES `Issue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TriageAction` ADD CONSTRAINT `TriageAction_issueId_fkey` FOREIGN KEY (`issueId`) REFERENCES `Issue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TriageAction` ADD CONSTRAINT `TriageAction_approvingUserId_fkey` FOREIGN KEY (`approvingUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
