-- ============================================================
-- SHTT Database Schema (Full - chạy 1 lần từ đầu)
-- ============================================================

CREATE DATABASE IF NOT EXISTS defaultdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE defaultdb;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS industrialDesignAuthors;
DROP TABLE IF EXISTS inventionAuthors;
DROP TABLE IF EXISTS copyrightAuthors;
DROP TABLE IF EXISTS industrialDesigns;
DROP TABLE IF EXISTS inventions;
DROP TABLE IF EXISTS trademarks;
DROP TABLE IF EXISTS geographicalIndications;
DROP TABLE IF EXISTS craftVillages;
DROP TABLE IF EXISTS copyrights;
DROP TABLE IF EXISTS stakeholders;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE users (
    id          BIGINT       PRIMARY KEY,               -- Date.now()
    username    VARCHAR(255) UNIQUE NOT NULL,
    fullName    VARCHAR(255) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'staff'))
);

-- ── Stakeholders ───────────────────────────────────────────
CREATE TABLE stakeholders (
    id      BIGINT       NOT NULL AUTO_INCREMENT,       -- Date.now() hoặc AUTO_INCREMENT
    name    VARCHAR(255) NOT NULL,
    address TEXT,
    PRIMARY KEY (id)
);

-- ── Copyrights ─────────────────────────────────────────────
CREATE TABLE copyrights (
    id                BIGINT       PRIMARY KEY,         -- Date.now()
    certificateNumber VARCHAR(100),
    grantDate         DATE,
    title             VARCHAR(255),
    type              VARCHAR(100),
    imageUrls         TEXT
);

-- ── Copyright Authors/Owners (many-to-many + role) ─────────
CREATE TABLE copyrightAuthors (
    copyrightId    BIGINT      NOT NULL,
    stakeholderId  BIGINT      NOT NULL,
    role           VARCHAR(50) NOT NULL DEFAULT 'author', -- 'author' | 'owner'
    PRIMARY KEY (copyrightId, stakeholderId, role),
    FOREIGN KEY (copyrightId)   REFERENCES copyrights(id)   ON DELETE CASCADE,
    FOREIGN KEY (stakeholderId) REFERENCES stakeholders(id) ON DELETE CASCADE
);

-- ── Geographical Indications ───────────────────────────────
CREATE TABLE geographicalIndications (
    id                BIGINT       PRIMARY KEY,
    name              VARCHAR(255),
    product           VARCHAR(255),
    applicationNumber VARCHAR(100),
    applicationDate   DATE,
    certificateNumber VARCHAR(100),
    grantDate         DATE,
    ownerId           BIGINT,
    managementOrgId   BIGINT,
    geographicalArea  TEXT,
    description       TEXT,
    status            VARCHAR(100),
    imageUrls         TEXT,
    FOREIGN KEY (ownerId)         REFERENCES stakeholders(id) ON DELETE SET NULL,
    FOREIGN KEY (managementOrgId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- ── Trademarks ─────────────────────────────────────────────
CREATE TABLE trademarks (
    id                  BIGINT       PRIMARY KEY,
    trademarkSample     TEXT,
    name                VARCHAR(255),
    type                VARCHAR(100),
    applicationNumber   VARCHAR(100),
    applicationDate     DATE,
    publicationNumber   VARCHAR(100),
    publicationDate     DATE,
    certificateNumber   VARCHAR(100),
    grantDate           DATE,
    expirationDate      DATE,
    productServiceGroup TEXT,
    classification      VARCHAR(100),
    ownerId             BIGINT,
    status              VARCHAR(100),
    imageUrls           TEXT,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- ── Inventions ─────────────────────────────────────────────
CREATE TABLE inventions (
    id                BIGINT       PRIMARY KEY,
    name              VARCHAR(255),
    applicationNumber VARCHAR(100),
    applicationDate   DATE,
    publicationNumber VARCHAR(100),
    publicationDate   DATE,
    certificateNumber VARCHAR(100),
    grantDate         DATE,
    ipcClassification VARCHAR(100),
    ownerId           BIGINT,
    status            VARCHAR(100),
    imageUrls         TEXT,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- ── Invention Authors (many-to-many) ───────────────────────
CREATE TABLE inventionAuthors (
    inventionId   BIGINT NOT NULL,
    stakeholderId BIGINT NOT NULL,
    PRIMARY KEY (inventionId, stakeholderId),
    FOREIGN KEY (inventionId)   REFERENCES inventions(id)   ON DELETE CASCADE,
    FOREIGN KEY (stakeholderId) REFERENCES stakeholders(id) ON DELETE CASCADE
);

-- ── Industrial Designs ─────────────────────────────────────
CREATE TABLE industrialDesigns (
    id                   BIGINT       PRIMARY KEY,
    name                 VARCHAR(255),
    applicationNumber    VARCHAR(100),
    applicationDate      DATE,
    publicationNumber    VARCHAR(100),
    publicationDate      DATE,
    certificateNumber    VARCHAR(100),
    grantDate            DATE,
    expirationDate       DATE,
    locarnoClassification VARCHAR(100),
    ownerId              BIGINT,
    status               VARCHAR(100),
    imageUrls            TEXT,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- ── Industrial Design Authors (many-to-many) ───────────────
CREATE TABLE industrialDesignAuthors (
    industrialDesignId BIGINT NOT NULL,
    stakeholderId      BIGINT NOT NULL,
    PRIMARY KEY (industrialDesignId, stakeholderId),
    FOREIGN KEY (industrialDesignId) REFERENCES industrialDesigns(id) ON DELETE CASCADE,
    FOREIGN KEY (stakeholderId)      REFERENCES stakeholders(id)      ON DELETE CASCADE
);

-- ── Craft Villages ─────────────────────────────────────────
CREATE TABLE craftVillages (
    id                BIGINT       PRIMARY KEY,
    name              VARCHAR(255),
    product           VARCHAR(255),
    address           TEXT,
    certificateNumber VARCHAR(100),
    recognitionDate   DATE,
    imageUrls         TEXT
);

SELECT 'Schema SHTT_db tạo thành công!' AS status;
