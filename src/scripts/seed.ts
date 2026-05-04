import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'defaultdb',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
  });

  try {
    console.log('🗑️  Xóa bảng cũ...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query(`
      DROP TABLE IF EXISTS industrialDesignAuthors, inventionAuthors, copyrightAuthors;
      DROP TABLE IF EXISTS industrialDesigns, inventions, trademarks,
                           geographicalIndications, craftVillages, copyrights;
      DROP TABLE IF EXISTS stakeholders, users;
    `);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('📝 Tạo lại cấu trúc bảng...');
    await connection.query(`
      CREATE TABLE users (
        id           BIGINT       PRIMARY KEY,
        username     VARCHAR(255) UNIQUE NOT NULL,
        fullName     VARCHAR(255) NOT NULL,
        passwordHash VARCHAR(255) NOT NULL,
        role         VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'staff'))
      );

      CREATE TABLE stakeholders (
        id      BIGINT       NOT NULL AUTO_INCREMENT,
        name    VARCHAR(255) NOT NULL,
        address TEXT,
        PRIMARY KEY (id)
      );

      CREATE TABLE copyrights (
        id                BIGINT       PRIMARY KEY,
        certificateNumber VARCHAR(100),
        grantDate         DATE,
        title             VARCHAR(255),
        type              VARCHAR(100),
        imageUrls         TEXT
      );

      CREATE TABLE copyrightAuthors (
        copyrightId   BIGINT      NOT NULL,
        stakeholderId BIGINT      NOT NULL,
        role          VARCHAR(50) NOT NULL DEFAULT 'author',
        PRIMARY KEY (copyrightId, stakeholderId, role),
        FOREIGN KEY (copyrightId)   REFERENCES copyrights(id)   ON DELETE CASCADE,
        FOREIGN KEY (stakeholderId) REFERENCES stakeholders(id) ON DELETE CASCADE
      );

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

      CREATE TABLE inventionAuthors (
        inventionId   BIGINT NOT NULL,
        stakeholderId BIGINT NOT NULL,
        PRIMARY KEY (inventionId, stakeholderId),
        FOREIGN KEY (inventionId)   REFERENCES inventions(id)   ON DELETE CASCADE,
        FOREIGN KEY (stakeholderId) REFERENCES stakeholders(id) ON DELETE CASCADE
      );

      CREATE TABLE industrialDesigns (
        id                    BIGINT       PRIMARY KEY,
        name                  VARCHAR(255),
        applicationNumber     VARCHAR(100),
        applicationDate       DATE,
        publicationNumber     VARCHAR(100),
        publicationDate       DATE,
        certificateNumber     VARCHAR(100),
        grantDate             DATE,
        expirationDate        DATE,
        locarnoClassification VARCHAR(100),
        ownerId               BIGINT,
        status                VARCHAR(100),
        imageUrls             TEXT,
        FOREIGN KEY (ownerId) REFERENCES stakeholders(id) ON DELETE SET NULL
      );

      CREATE TABLE industrialDesignAuthors (
        industrialDesignId BIGINT NOT NULL,
        stakeholderId      BIGINT NOT NULL,
        PRIMARY KEY (industrialDesignId, stakeholderId),
        FOREIGN KEY (industrialDesignId) REFERENCES industrialDesigns(id) ON DELETE CASCADE,
        FOREIGN KEY (stakeholderId)      REFERENCES stakeholders(id)      ON DELETE CASCADE
      );

      CREATE TABLE craftVillages (
        id                BIGINT       PRIMARY KEY,
        name              VARCHAR(255),
        product           VARCHAR(255),
        address           TEXT,
        certificateNumber VARCHAR(100),
        recognitionDate   DATE,
        imageUrls         TEXT
      );
    `);

    console.log('🌱 Bơm dữ liệu mẫu...');

    const base = Date.now();
    const hashedPassword = await bcrypt.hash(process.env.DEFAULT_PASSWORD || 'Test@123', 10);

    await connection.query(
      `INSERT INTO users (id, username, fullName, passwordHash, role) VALUES
       (?, 'admin@bacninh.gov.vn', 'Admin Bắc Ninh', ?, 'admin'),
       (?, 'staff@bacninh.gov.vn', 'Nhân viên', ?, 'staff')`,
      [base + 10, hashedPassword, base + 20, hashedPassword]
    );

    await connection.query(
      `INSERT INTO stakeholders (id, name, address) VALUES
       (?, 'Công ty Công nghệ ABC', 'Thành phố Bắc Ninh'),
       (?, 'Nguyễn Văn A', 'Huyện Tiên Du, Bắc Ninh')`,
      [base + 30, base + 40]
    );

    await connection.query(
      `INSERT INTO copyrights (id, certificateNumber, grantDate, title, type, imageUrls)
       VALUES (?, '123/2024/QTG', '2024-01-20', 'Phần mềm A', 'Phần mềm', ?)`,
      [base + 50, JSON.stringify([])]
    );

    await connection.query(
      `INSERT INTO copyrightAuthors (copyrightId, stakeholderId, role) VALUES
       (?, ?, 'author'),
       (?, ?, 'owner')`,
      [base + 50, base + 40, base + 50, base + 30]
    );

    console.log('✅ Seed hoàn thành!');
    console.log(`   admin: admin@bacninh.gov.vn / ${process.env.DEFAULT_PASSWORD || 'Test@123'}`);
    console.log(`   staff: staff@bacninh.gov.vn / ${process.env.DEFAULT_PASSWORD || 'Test@123'}`);
  } catch (error) {
    console.error('❌ Lỗi seed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedDatabase();
