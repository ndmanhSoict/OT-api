# Hướng Dẫn Import và Sử Dụng Postman Collection

## 📥 Cách Import Collection

### Cách 1: Import từ File
1. Mở Postman
2. Nhấn **File** → **Import** (hoặc `Ctrl+O`)
3. Chọn tab **Upload Files**
4. Upload file: `Express_API_Auth_Tests.postman_collection.json`
5. Nhấn **Import**

### Cách 2: Paste Raw JSON
1. Mở Postman
2. Nhấn **File** → **Import**
3. Chọn tab **Paste Raw text**
4. Copy-paste nội dung file JSON
5. Nhấn **Import**

---

## ⚙️ Cấu Hình Environment

Collection có các biến sau (tự động set sau khi login):
- `baseUrl`: `http://localhost:3000` (mặc định)
- `accessToken`: Token ngắn hạn (tự động cập nhật sau khi login)
- `refreshToken`: Token dài hạn (tự động cập nhật sau khi login)
- `userId`: ID của user (tự động cập nhật sau khi login)

**Để thay đổi baseUrl:**
1. Chọn Environment từ dropdown (góc phải trên)
2. Chỉnh sửa giá trị `baseUrl`
3. Nhấn Save

---

## 🧪 Các API Tests Có Sẵn

### 📌 **Authentication Endpoints**

#### 1. **Login** ✅
- **Method:** POST
- **Endpoint:** `/api/auth/login`
- **Body:**
```json
{
  "email": "admin@bacninh.gov.vn",
  "password": "Test@123"
}
```
- **Kết quả:** Cấp Access Token + Refresh Token
- **Tự động:** Lưu token vào environment

#### 2. **Refresh Token** ✅
- **Method:** POST
- **Endpoint:** `/api/auth/refresh-token`
- **Body:**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```
- **Kết quả:** Cấp Access Token mới
- **Tự động:** Cập nhật Access Token trong environment

#### 3. **Test Error - Invalid Email** ❌
- Kiểm tra xử lý email không tồn tại
- **Kết quả mong muốn:** 401 Unauthorized

#### 4. **Test Error - Invalid Password** ❌
- Kiểm tra xử lý mật khẩu sai
- **Kết quả mong muốn:** 401 Unauthorized

---

### 🔧 **User Management Endpoints** (Chỉ Admin)

#### 5. **Create User** ✅ (Admin only)
- **Method:** POST
- **Endpoint:** `/api/users`
- **Authorization:** `Bearer {{accessToken}}` (Admin token)
- **Body:**
```json
{
  "username": "officer@bacninh.gov.vn",
  "fullName": "Trịnh Văn Công",
  "password": "SecurePass@2024",
  "role": "officer"
}
```
- **Kết quả mong muốn:** 201 Created
- **Tự động:** Lưu User ID vào `createdUserId`

#### 6. **Create User - Duplicate Username** ❌ (Test Error)
- Kiểm tra xử lý username đã tồn tại
- **Kết quả mong muốn:** 409 Conflict

#### 7. **Create User - Missing Fields** ❌ (Test Error)
- Kiểm tra xử lý fields không đủ
- **Kết quả mong muốn:** 400 Bad Request

#### 8. **Update User** ✅ (Admin only)
- **Method:** PUT
- **Endpoint:** `/api/users/{{createdUserId}}`
- **Authorization:** `Bearer {{accessToken}}` (Admin token)
- **Body:**
```json
{
  "fullName": "Trịnh Văn Công - Updated",
  "role": "officer",
  "password": "NewSecurePass@2024"
}
```
- **Kết quả mong muốn:** 200 OK

#### 9. **Update User - Not Found** ❌ (Test Error)
- Kiểm tra xử lý user ID không tồn tại
- **Endpoint:** `/api/users/9999`
- **Kết quả mong muốn:** 404 Not Found

#### 10. **Create User - Without Authorization** ❌ (Test Error)
- Kiểm tra xử lý khi không gửi token
- **Kết quả mong muốn:** 401 Unauthorized

---

## 🚀 Quy Trình Sử Dụng

### Bước 1: Login
1. Chọn request **Login**
2. Nhấn **Send**
3. Kiểm tra Response (Status 200)
4. Xem **Tests** tab để xem token được lưu

### Bước 2: Refresh Token (Sau 15 phút hoặc khi Access Token hết hạn)
1. Chọn request **Refresh Token**
2. Nhấn **Send**
3. Access Token sẽ tự động cập nhật
4. Tiếp tục sử dụng token mới

### Bước 3: Test Error Cases (Auth)
1. Chọn **Test Error - Invalid Email** hoặc **Test Error - Invalid Password**
2. Nhấn **Send**
3. Xem Response để kiểm tra error handling

### Bước 4: Create User (Admin Only)
1. Đảm bảo đã Login với admin account
2. Chọn request **Create User**
3. (Tùy chọn) Chỉnh sửa body nếu muốn
4. Nhấn **Send**
5. ✅ Nếu thành công, User ID sẽ được lưu vào `createdUserId`

### Bước 5: Update User (Admin Only)
1. Phải tạo user trước (Bước 4)
2. Chọn request **Update User**
3. (Tùy chọn) Chỉnh sửa body nếu muốn
4. Nhấn **Send**
5. ✅ Xem response để kiểm tra update thành công

### Bước 6: Test Error Cases (User Management)
1. Chọn các test error case: **Duplicate Username**, **Missing Fields**, **Not Found**, **Without Authorization**
2. Nhấn **Send**
3. Xem Response để kiểm tra error handling

---

## 📋 Thông Tin Login Mặc Định

**Admin Account:**
- Email: `admin@bacninh.gov.vn`
- Password: `Test@123`
- Role: `admin`

**Staff Account:**
- Email: `staff@bacninh.gov.vn`
- Password: `Test@123`
- Role: `staff`

---

## 🔍 Kiểm Tra Response

### Response Login Thành Công (200):
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@bacninh.gov.vn",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Response Login Thất Bại (401):
```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không đúng"
}
```

---

## 💡 Tips Sử Dụng

1. **Xem Console Log:** Nhấn **Console** (góc dưới) để xem logs tự động từ Tests
2. **Xem Token:** Hover lên biến `{{accessToken}}` để xem giá trị
3. **Reset Token:** Set giá trị biến về rỗng nếu cần logout
4. **Xem Request Details:** Click **Params**, **Headers**, **Body** để xem chi tiết

---

## ❓ Troubleshooting

### Lỗi: "Cannot read property 'accessToken'"
- ✅ Nguyên nhân: Login thất bại
- ✅ Giải pháp: Kiểm tra email/password đúng

### Lỗi: "baseUrl is not defined"
- ✅ Nguyên nhân: Chưa set environment
- ✅ Giải pháp: Chỉnh sửa biến `baseUrl` trong Collection

### Lỗi: "Connection refused"
- ✅ Nguyên nhân: Server không chạy
- ✅ Giải pháp: Chạy `npm run dev` trước

---

## 📚 Tài Liệu Thêm

- [Postman Documentation](https://learning.postman.com/)
- [Express API Docs](../README.md)
