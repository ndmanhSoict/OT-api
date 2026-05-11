-- 1. BẢNG TÀI KHOẢN VÀ CHỦ THỂ
CREATE TABLE users (
    id BIGINT PRIMARY KEY, 
    username VARCHAR(255) UNIQUE NOT NULL,
    fullName VARCHAR(255) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff'))
);

CREATE TABLE stakeholders (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT
);

-- 2. BẢN QUYỀN TÁC GIẢ
CREATE TABLE copyrights (
    id BIGINT PRIMARY KEY, -- Sửa thành BIGINT
    certificateNumber VARCHAR(100),
    grantDate DATE,
    title VARCHAR(255),
    type VARCHAR(100),
    ownerId BIGINT, -- Cùng kiểu BIGINT với stakeholders(id)
    imageUrls TEXT,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- 3. CHỈ DẪN ĐỊA LÝ
CREATE TABLE geographicalIndications (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    product VARCHAR(255),
    applicationNumber VARCHAR(100),
    applicationDate DATE,
    certificateNumber VARCHAR(100),
    grantDate DATE,
    ownerId BIGINT,
    managementOrgId BIGINT,
    geographicalArea TEXT,
    description TEXT,
    status VARCHAR(100),
    imageUrls TEXT,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL,
    FOREIGN KEY (managementOrgId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- 4. NHÃN HIỆU
CREATE TABLE trademarks (
    id BIGINT PRIMARY KEY,
    trademarkSample TEXT,
    name VARCHAR(255),
    type VARCHAR(100),
    applicationNumber VARCHAR(100),
    applicationDate DATE,
    publicationNumber VARCHAR(100),
    publicationDate DATE,
    certificateNumber VARCHAR(100),
    grantDate DATE,
    expirationDate DATE,
    productServiceGroup TEXT,
    classification VARCHAR(100),
    applicantId BIGINT,
    ownerId BIGINT,
    status VARCHAR(100),
    imageUrls TEXT,
    FOREIGN KEY (applicantId) REFERENCES stakeholders(id) ON DELETE SET NULL,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- 5. SÁNG CHẾ / GIẢI PHÁP HỮU ÍCH
CREATE TABLE inventions (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    applicationNumber VARCHAR(100),
    applicationDate DATE,
    publicationNumber VARCHAR(100),
    publicationDate DATE,
    certificateNumber VARCHAR(100),
    grantDate DATE,
    ipcClassification VARCHAR(100),
    applicantId BIGINT,
    ownerId BIGINT,
    status VARCHAR(100),
    imageUrls TEXT,
    FOREIGN KEY (applicantId) REFERENCES stakeholders(id) ON DELETE SET NULL,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- 6. KIỂU DÁNG CÔNG NGHIỆP
CREATE TABLE industrialDesigns (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    applicationNumber VARCHAR(100),
    applicationDate DATE,
    publicationNumber VARCHAR(100),
    publicationDate DATE,
    certificateNumber VARCHAR(100),
    grantDate DATE,
    expirationDate DATE,
    locarnoClassification VARCHAR(100),
    applicantId BIGINT,
    ownerId BIGINT,
    status VARCHAR(100),
    imageUrls TEXT,
    FOREIGN KEY (applicantId) REFERENCES stakeholders(id) ON DELETE SET NULL,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- 7. LÀNG NGHỀ
CREATE TABLE craftVillages (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    product VARCHAR(255),
    address TEXT,
    certificateNumber VARCHAR(100),
    recognitionDate DATE,
    imageUrls TEXT
);

-- Bảng trung gian (Xử lý Mảng Tác giả)
CREATE TABLE copyrightAuthors (
    copyrightId BIGINT, -- Khớp kiểu BIGINT
    stakeholderId BIGINT, -- Khớp kiểu BIGINT
    role VARCHAR(50),
    PRIMARY KEY (copyrightId, stakeholderId, role),
    FOREIGN KEY (copyrightId) REFERENCES copyrights(id) ON DELETE CASCADE,
    FOREIGN KEY (stakeholderId) REFERENCES stakeholders(id) ON DELETE CASCADE
);

CREATE TABLE inventionAuthors (
    inventionId BIGINT,
    stakeholderId BIGINT,
    PRIMARY KEY (inventionId, stakeholderId),
    FOREIGN KEY (inventionId) REFERENCES inventions(id) ON DELETE CASCADE,
    FOREIGN KEY (stakeholderId) REFERENCES stakeholders(id) ON DELETE CASCADE
);

CREATE TABLE industrialDesignAuthors (
    industrialDesignId BIGINT,
    stakeholderId BIGINT,
    PRIMARY KEY (industrialDesignId, stakeholderId),
    FOREIGN KEY (industrialDesignId) REFERENCES industrialDesigns(id) ON DELETE CASCADE,
    FOREIGN KEY (stakeholderId) REFERENCES stakeholders(id) ON DELETE CASCADE
);
