-- Chạy file này để fix schema DB hiện có (không cần xóa/tạo lại DB)
-- Thứ tự quan trọng: phải tắt FK checks trước khi ALTER

SET FOREIGN_KEY_CHECKS = 0;

-- 1. stakeholders: INT -> BIGINT AUTO_INCREMENT
ALTER TABLE stakeholders MODIFY COLUMN id BIGINT AUTO_INCREMENT NOT NULL;

-- 2. copyrights: INT AUTO_INCREMENT -> BIGINT (manual ID từ Date.now())
ALTER TABLE copyrights MODIFY COLUMN id BIGINT NOT NULL;
ALTER TABLE copyrights MODIFY COLUMN ownerId BIGINT;

-- 3. copyrightAuthors: sửa kiểu + thêm cột role + đổi PRIMARY KEY
ALTER TABLE copyrightAuthors MODIFY COLUMN copyrightId BIGINT NOT NULL;
ALTER TABLE copyrightAuthors MODIFY COLUMN stakeholderId BIGINT NOT NULL;

-- Thêm cột role nếu chưa có
ALTER TABLE copyrightAuthors ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'author';

-- Đổi PRIMARY KEY để bao gồm role (vì 1 người có thể vừa là tác giả vừa là chủ sở hữu)
ALTER TABLE copyrightAuthors DROP PRIMARY KEY;
ALTER TABLE copyrightAuthors ADD PRIMARY KEY (copyrightId, stakeholderId, role);

-- 4. Các bảng khác: sửa ownerId thành BIGINT cho đồng nhất
ALTER TABLE geographicalIndications MODIFY COLUMN id BIGINT NOT NULL;
ALTER TABLE geographicalIndications MODIFY COLUMN ownerId BIGINT;
ALTER TABLE geographicalIndications MODIFY COLUMN managementOrgId BIGINT;

ALTER TABLE trademarks MODIFY COLUMN id BIGINT NOT NULL;
ALTER TABLE trademarks MODIFY COLUMN ownerId BIGINT;

ALTER TABLE inventions MODIFY COLUMN id BIGINT NOT NULL;
ALTER TABLE inventions MODIFY COLUMN ownerId BIGINT;

ALTER TABLE industrialDesigns MODIFY COLUMN id BIGINT NOT NULL;
ALTER TABLE industrialDesigns MODIFY COLUMN ownerId BIGINT;

ALTER TABLE craftVillages MODIFY COLUMN id BIGINT NOT NULL;

ALTER TABLE inventionAuthors MODIFY COLUMN inventionId BIGINT NOT NULL;
ALTER TABLE inventionAuthors MODIFY COLUMN stakeholderId BIGINT NOT NULL;

ALTER TABLE industrialDesignAuthors MODIFY COLUMN industrialDesignId BIGINT NOT NULL;
ALTER TABLE industrialDesignAuthors MODIFY COLUMN stakeholderId BIGINT NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration hoàn thành!' AS status;
