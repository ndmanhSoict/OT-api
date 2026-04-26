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

### 1. **Login** ✅
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

### 2. **Refresh Token** ✅
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

### 3. **Test Error - Invalid Email** ❌
- Kiểm tra xử lý email không tồn tại
- **Kết quả mong muốn:** 401 Unauthorized

### 4. **Test Error - Invalid Password** ❌
- Kiểm tra xử lý mật khẩu sai
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

### Bước 3: Test Error Cases
1. Chọn **Test Error - Invalid Email** hoặc **Test Error - Invalid Password**
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
