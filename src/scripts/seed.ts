import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const asJson = (value: unknown) => JSON.stringify(value);

async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3308,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'mat_khau_cua_ban',
    database: process.env.DB_NAME || 'SHTT_db',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
  });

  try {
    console.log('Tao lai cau truc database tu schema.sql...');
    const schemaPath = path.join(__dirname, '../../schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    schemaSql = schemaSql
      .replace(/CREATE DATABASE[^;]+;/gi, '')
      .replace(/USE\s+\S+;/gi, '');
    await connection.query(schemaSql);

    console.log('Bom du lieu mau...');
    const password = process.env.DEFAULT_PASSWORD || 'Test@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.query(
      `INSERT INTO users (id, username, fullName, passwordHash, role) VALUES
       (1001, 'admin@bacninh.gov.vn', 'Admin Bac Ninh', ?, 'admin'),
       (1002, 'staff@bacninh.gov.vn', 'Can bo quan ly SHTT', ?, 'staff')`,
      [hashedPassword, hashedPassword]
    );

    await connection.query(
      `INSERT INTO stakeholders (id, name, address) VALUES
       (2001, 'Cong ty TNHH Thuc pham Kinh Bac', 'So 12 duong Ly Thai To, phuong Suoi Hoa, TP Bac Ninh'),
       (2002, 'Hop tac xa Nem Bui Thuan Thanh', 'Xa Ninh Xa, huyen Thuan Thanh, tinh Bac Ninh'),
       (2003, 'So Khoa hoc va Cong nghe tinh Bac Ninh', 'So 11 Ly Thai To, TP Bac Ninh'),
       (2004, 'Hoi San xuat va Kinh doanh Ga Ho', 'Xa Lac Tho, huyen Thuan Thanh, tinh Bac Ninh'),
       (2005, 'Cong ty Co phan Cong nghe Que Vo', 'KCN Que Vo, phuong Van Duong, TP Bac Ninh'),
       (2006, 'Nguyen Van An', 'Phuong Dinh Bang, TP Tu Son, tinh Bac Ninh'),
       (2007, 'Tran Thi Binh', 'Phuong Vo Cuong, TP Bac Ninh'),
       (2008, 'Cong ty TNHH Gom Phu Lang', 'Xa Phu Lang, thi xa Que Vo, tinh Bac Ninh'),
       (2009, 'UBND phuong Dong Ky', 'Phuong Dong Ky, TP Tu Son, tinh Bac Ninh'),
       (2010, 'Trung tam Quan ly CDĐL Bac Ninh', 'TP Bac Ninh, tinh Bac Ninh'),
       (2011, 'Doanh nghiep tu nhan Moc My Nghe Dong Ky', 'Phuong Dong Ky, TP Tu Son, tinh Bac Ninh')`
    );

    await connection.query(
      `INSERT INTO copyrights (id, certificateNumber, grantDate, title, type, imageUrls) VALUES
       (3001, 'BN-QTG-001/2025', '2025-02-14', 'Bo nhan dien Le hoi Lim', 'My thuat ung dung', ?),
       (3002, 'BN-QTG-002/2025', '2025-05-20', 'Phan mem tra cuu tai san tri tue Bac Ninh', 'Chuong trinh may tinh', ?)`,
      [asJson([]), asJson([])]
    );

    await connection.query(
      `INSERT INTO copyrightAuthors (copyrightId, stakeholderId, role) VALUES
       (3001, 2007, 'author'),
       (3001, 2003, 'owner'),
       (3002, 2005, 'author'),
       (3002, 2003, 'owner')`
    );

    await connection.query(
      `INSERT INTO geographicalIndications
        (id, name, product, applicationNumber, applicationDate, certificateNumber,
         grantDate, ownerId, managementOrgId, geographicalArea, description, status, imageUrls)
       VALUES
        (4001, 'Ga Ho Bac Ninh', 'Ga giong va san pham tu ga Ho', 'CDDL-2024-001', '2024-03-12',
         '00088/CDDL', '2025-01-18', 2004, 2010, 'Khu vuc xa Lac Tho va cac vung phu can huyen Thuan Thanh',
         'San pham co nguon gen ban dia, dac tinh ngoai hinh va chat luong thit dac trung.',
         'Da cap van bang', ?),
        (4002, 'Nem Bui Bac Ninh', 'Nem Bui', 'CDDL-2025-003', '2025-07-09',
         NULL, NULL, 2002, 2010, 'Khu vuc san xuat nem Bui tai huyen Thuan Thanh',
         'Ho so dang tham dinh ban mo ta tinh chat, chat luong va danh tieng san pham.',
         'Dang tham dinh', ?)`,
      [asJson([]), asJson([])]
    );

    await connection.query(
      `INSERT INTO trademarks
        (id, trademarkSample, name, type, applicationNumber, applicationDate, publicationNumber,
         publicationDate, certificateNumber, grantDate, expirationDate, productServiceGroup,
         classification, applicantId, ownerId, status, imageUrls)
       VALUES
        (5001, 'Chu KINH BAC FOOD mau do vang kem bieu tuong chim lac', 'KINH BAC FOOD',
         'Nhan hieu thong thuong', '4-2024-01234', '2024-04-10', 'CBNH-2024-0987',
         '2024-08-25', '4-0567890', '2025-02-01', '2035-02-01',
         'Nhom 29: thuc pham che bien; nhom 30: gia vi, banh keo',
         'Hinh va chu', 2001, 2001, 'Da cap van bang', ?),
        (5002, 'Logo NEM BUI THUAN THANH dang tron mau xanh nau', 'NEM BUI THUAN THANH',
         'Nhan hieu tap the', '4-2025-04567', '2025-09-05', NULL,
         NULL, NULL, NULL, NULL,
         'Nhom 29: nem thit, san pham thit len men',
         'Hinh va chu', 2002, NULL, 'Dang tham dinh', ?)`,
      [asJson([]), asJson([])]
    );

    await connection.query(
      `INSERT INTO inventions
        (id, name, applicationNumber, applicationDate, publicationNumber, publicationDate,
         certificateNumber, grantDate, ipcClassification, applicantId, ownerId, status, imageUrls)
       VALUES
        (6001, 'Quy trinh say kho nem Bui bang luong gio nhiet do thap',
         '1-2024-00678', '2024-05-22', 'A-2024-1122', '2024-11-15',
         '1-0045678', '2025-06-30', 'A23L 13/40', 2002, 2002, 'Da cap bang', ?),
        (6002, 'He thong theo doi nhiet am kho bao quan san pham OCOP',
         '1-2025-01001', '2025-03-11', NULL, NULL,
         NULL, NULL, 'G01N 33/02', 2005, NULL, 'Dang tham dinh', ?)`,
      [asJson([]), asJson([])]
    );

    await connection.query(
      `INSERT INTO inventionAuthors (inventionId, stakeholderId) VALUES
       (6001, 2006),
       (6001, 2007),
       (6002, 2006)`
    );

    await connection.query(
      `INSERT INTO industrialDesigns
        (id, name, applicationNumber, applicationDate, publicationNumber, publicationDate,
         certificateNumber, grantDate, expirationDate, locarnoClassification,
         applicantId, ownerId, status, imageUrls)
       VALUES
        (7001, 'Kieu dang chai dung ruou nep Kinh Bac',
         '2-2024-00321', '2024-06-18', 'KDCN-2024-0456', '2024-10-20',
         '3-0098765', '2025-03-12', '2030-03-12', '09-01',
         2001, 2001, 'Da cap bang', ?),
        (7002, 'Bo am chen gom Phu Lang hoa tiet hoa sen',
         '2-2025-00222', '2025-04-02', NULL, NULL,
         NULL, NULL, NULL, '07-01',
         2008, NULL, 'Dang tham dinh', ?)`,
      [asJson([]), asJson([])]
    );

    await connection.query(
      `INSERT INTO industrialDesignAuthors (industrialDesignId, stakeholderId) VALUES
       (7001, 2007),
       (7002, 2006),
       (7002, 2007)`
    );

    await connection.query(
      `INSERT INTO craftVillages
        (id, name, product, address, certificateNumber, recognitionDate, imageUrls)
       VALUES
        (8001, 'Lang nghe go my nghe Dong Ky', 'Do go my nghe, noi that cao cap',
         'Phuong Dong Ky, TP Tu Son, tinh Bac Ninh', 'QD-1234/UBND', '2023-12-20', ?),
        (8002, 'Lang nghe gom Phu Lang', 'Gom my nghe, gom gia dung',
         'Xa Phu Lang, thi xa Que Vo, tinh Bac Ninh', 'QD-0521/UBND', '2024-04-16', ?)`,
      [asJson([]), asJson([])]
    );

    console.log('Seed hoan thanh!');
    console.log(`admin: admin@bacninh.gov.vn / ${password}`);
    console.log(`staff: staff@bacninh.gov.vn / ${password}`);
  } catch (error) {
    console.error('Loi seed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedDatabase();
