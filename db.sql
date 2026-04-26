-- 1. BẢNG TÀI KHOẢN VÀ CHỦ THỂ (Giữ nguyên)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff'))
);

CREATE TABLE stakeholders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT
);

-- ==========================================
-- CÁC BẢNG DỮ LIỆU CHÍNH (Đã bỏ authorId)
-- ==========================================

-- 2. BẢN QUYỀN TÁC GIẢ
CREATE TABLE copyrights (
    id SERIAL PRIMARY KEY,
    certificateNumber VARCHAR(100),
    grantDate DATE,
    title VARCHAR(255),
    type VARCHAR(100),
    ownerId INT REFERENCES stakeholders(id) ON DELETE SET NULL, 
    imageUrls TEXT
);

-- 3. CHỈ DẪN ĐỊA LÝ
CREATE TABLE geographicalIndications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    product VARCHAR(255),
    applicationNumber VARCHAR(100),
    applicationDate DATE,
    certificateNumber VARCHAR(100),
    grantDate DATE,
    ownerId INT REFERENCES stakeholders(id) ON DELETE SET NULL,
    managementOrgId INT REFERENCES stakeholders(id) ON DELETE SET NULL,
    geographicalArea TEXT,
    description TEXT,
    status VARCHAR(100),
    imageUrls TEXT
);

-- 4. NHÃN HIỆU
CREATE TABLE trademarks (
    id SERIAL PRIMARY KEY,
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
    ownerId INT REFERENCES stakeholders(id) ON DELETE SET NULL,
    status VARCHAR(100),
    imageUrls TEXT
);

-- 5. SÁNG CHẾ / GIẢI PHÁP HỮU ÍCH
CREATE TABLE inventions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    applicationNumber VARCHAR(100),
    applicationDate DATE,
    publicationNumber VARCHAR(100),
    publicationDate DATE,
    certificateNumber VARCHAR(100),
    grantDate DATE,
    ipcClassification VARCHAR(100),
    ownerId INT REFERENCES stakeholders(id) ON DELETE SET NULL,
    status VARCHAR(100),
    imageUrls TEXT
);

-- 6. KIỂU DÁNG CÔNG NGHIỆP
CREATE TABLE industrialDesigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    applicationNumber VARCHAR(100),
    applicationDate DATE,
    publicationNumber VARCHAR(100),
    publicationDate DATE,
    certificateNumber VARCHAR(100),
    grantDate DATE,
    expirationDate DATE,
    locarnoClassification VARCHAR(100),
    ownerId INT REFERENCES stakeholders(id) ON DELETE SET NULL,
    status VARCHAR(100),
    imageUrls TEXT
);

-- 7. LÀNG NGHỀ (Giữ nguyên)
CREATE TABLE craftVillages (
    id SERIAL PRIMARY KEY,
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
    copyrightId INT REFERENCES copyrights(id) ON DELETE CASCADE,
    stakeholderId INT REFERENCES stakeholders(id) ON DELETE CASCADE,
    PRIMARY KEY (copyrightId, stakeholderId)
);

-- Bảng lưu mảng tác giả cho Sáng chế
CREATE TABLE inventionAuthors (
    inventionId INT REFERENCES inventions(id) ON DELETE CASCADE,
    stakeholderId INT REFERENCES stakeholders(id) ON DELETE CASCADE,
    PRIMARY KEY (inventionId, stakeholderId)
);

-- Bảng lưu mảng tác giả cho Kiểu dáng công nghiệp
CREATE TABLE industrialDesignAuthors (
    industrialDesignId INT REFERENCES industrialDesigns(id) ON DELETE CASCADE,
    stakeholderId INT REFERENCES stakeholders(id) ON DELETE CASCADE,
    PRIMARY KEY (industrialDesignId, stakeholderId)
);