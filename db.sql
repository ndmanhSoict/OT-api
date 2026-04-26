-- 1. BẢNG TÀI KHOẢN VÀ CHỦ THỂ
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    fullName VARCHAR(255) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff'))
);

CREATE TABLE stakeholders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT
);

-- ==========================================
-- CÁC BẢNG DỮ LIỆU CHÍNH
-- ==========================================

-- 2. BẢN QUYỀN TÁC GIẢ
CREATE TABLE copyrights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificateNumber VARCHAR(100),
    grantDate DATE,
    title VARCHAR(255),
    type VARCHAR(100),
    ownerId INT, 
    imageUrls TEXT,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- 3. CHỈ DẪN ĐỊA LÝ
CREATE TABLE geographicalIndications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    product VARCHAR(255),
    applicationNumber VARCHAR(100),
    applicationDate DATE,
    certificateNumber VARCHAR(100),
    grantDate DATE,
    ownerId INT,
    managementOrgId INT,
    geographicalArea TEXT,
    description TEXT,
    status VARCHAR(100),
    imageUrls TEXT,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL,
    FOREIGN KEY (managementOrgId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- 4. NHÃN HIỆU
CREATE TABLE trademarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    ownerId INT,
    status VARCHAR(100),
    imageUrls TEXT,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- 5. SÁNG CHẾ / GIẢI PHÁP HỮU ÍCH
CREATE TABLE inventions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    applicationNumber VARCHAR(100),
    applicationDate DATE,
    publicationNumber VARCHAR(100),
    publicationDate DATE,
    certificateNumber VARCHAR(100),
    grantDate DATE,
    ipcClassification VARCHAR(100),
    ownerId INT,
    status VARCHAR(100),
    imageUrls TEXT,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- 6. KIỂU DÁNG CÔNG NGHIỆP
CREATE TABLE industrialDesigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    applicationNumber VARCHAR(100),
    applicationDate DATE,
    publicationNumber VARCHAR(100),
    publicationDate DATE,
    certificateNumber VARCHAR(100),
    grantDate DATE,
    expirationDate DATE,
    locarnoClassification VARCHAR(100),
    ownerId INT,
    status VARCHAR(100),
    imageUrls TEXT,
    FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL
);

-- 7. LÀNG NGHỀ
CREATE TABLE craftVillages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    product VARCHAR(255),
    address TEXT,
    certificateNumber VARCHAR(100),
    recognitionDate DATE,
    imageUrls TEXT
);

-- ==========================================
-- CÁC BẢNG TRUNG GIAN (Xử lý Mảng Tác giả)
-- ==========================================

-- Bảng lưu mảng tác giả cho Bản quyền
CREATE TABLE copyrightAuthors (
    copyrightId INT,
    stakeholderId INT,
    PRIMARY KEY (copyrightId, stakeholderId),
    FOREIGN KEY (copyrightId) REFERENCES copyrights(id) ON DELETE CASCADE,
    FOREIGN KEY (stakeholderId) REFERENCES stakeholders(id) ON DELETE CASCADE
);

-- Bảng lưu mảng tác giả cho Sáng chế
CREATE TABLE inventionAuthors (
    inventionId INT,
    stakeholderId INT,
    PRIMARY KEY (inventionId, stakeholderId),
    FOREIGN KEY (inventionId) REFERENCES inventions(id) ON DELETE CASCADE,
    FOREIGN KEY (stakeholderId) REFERENCES stakeholders(id) ON DELETE CASCADE
);

-- Bảng lưu mảng tác giả cho Kiểu dáng công nghiệp
CREATE TABLE industrialDesignAuthors (
    industrialDesignId INT,
    stakeholderId INT,
    PRIMARY KEY (industrialDesignId, stakeholderId),
    FOREIGN KEY (industrialDesignId) REFERENCES industrialDesigns(id) ON DELETE CASCADE,
    FOREIGN KEY (stakeholderId) REFERENCES stakeholders(id) ON DELETE CASCADE
);