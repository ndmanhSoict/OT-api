# 🚀 Quick Start Postman Testing

## 📦 Files Included

1. **Express_API_Auth_Tests.postman_collection.json** - Postman Collection
2. **Express_API_Env.postman_environment.json** - Environment Variables
3. **POSTMAN_GUIDE.md** - Hướng dẫn chi tiết

---

## ⚡ Bước Đầu Tiên (5 phút)

### 1️⃣ Import Collection vào Postman
```
File → Import → Express_API_Auth_Tests.postman_collection.json
```

### 2️⃣ Import Environment (Tùy chọn)
```
File → Import → Express_API_Env.postman_environment.json
```

### 3️⃣ Chạy Server
```bash
npm run dev
```

### 4️⃣ Test Login API
1. Mở Postman
2. Chọn **Login** từ Collection
3. Nhấn **Send**
4. ✅ Nếu thành công, sẽ thấy Access Token + Refresh Token

---

## 🧪 Test Cases

### ✅ **Authentication Tests**

#### Login Thành Công
```bash
POST http://localhost:3000/api/auth/login

Body:
{
  "email": "admin@bacninh.gov.vn",
  "password": "Test@123"
}

Response (200):
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": { "id": 1, "email": "admin@bacninh.gov.vn", "role": "admin" },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Refresh Token
```bash
POST http://localhost:3000/api/auth/refresh-token

Body:
{
  "refreshToken": "{{refreshToken}}"
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "..."
  }
}
```

### ✅ **User Management Tests** (Admin Only)

#### Create User
```bash
POST http://localhost:3000/api/users
Authorization: Bearer {{accessToken}}

Body:
{
  "username": "officer@bacninh.gov.vn",
  "fullName": "Trịnh Văn Công",
  "password": "SecurePass@2024",
  "role": "officer"
}

Response (201):
{
  "success": true,
  "message": "Tạo tài khoản thành công",
  "data": {
    "id": 3,
    "username": "officer@bacninh.gov.vn",
    "fullName": "Trịnh Văn Công",
    "role": "officer"
  }
}
```

#### Update User
```bash
PUT http://localhost:3000/api/users/3
Authorization: Bearer {{accessToken}}

Body:
{
  "fullName": "Trịnh Văn Công - Updated",
  "role": "officer",
  "password": "NewSecurePass@2024"
}

Response (200):
{
  "success": true,
  "message": "Cập nhật tài khoản thành công",
  "data": {
    "id": 3,
    "fullName": "Trịnh Văn Công - Updated",
    "role": "officer"
  }
}
```

### ❌ **Error Cases**

#### Login Thất Bại (Email không tồn tại)
```bash
Response (401):
{
  "success": false,
  "message": "Email hoặc mật khẩu không đúng"
}
```

#### Create User - Duplicate Username
```bash
Response (409):
{
  "success": false,
  "message": "Username này đã tồn tại trong hệ thống"
}
```

#### Create User - Missing Fields
```bash
Response (400):
{
  "success": false,
  "message": "Vui lòng cung cấp đủ thông tin (username, fullName, password, role)"
}
```

#### Update User - Not Found
```bash
Response (404):
{
  "success": false,
  "message": "Không tìm thấy tài khoản"
}
```

#### Create User - Without Authorization
```bash
Response (401):
{
  "success": false,
  "message": "Không tìm thấy Token xác thực (Authorization Header)"
}
```

---

## 🔐 Login Credentials

| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Admin | admin@bacninh.gov.vn     | Test@123  |
| Staff | staff@bacninh.gov.vn     | Test@123  |

---

## 📝 Ghi Chú

- ⏱️ Access Token hết hạn sau **15 phút**
- ⏱️ Refresh Token hết hạn sau **7 ngày**
- 🔒 Mật khẩu được mã hóa bằng **bcryptjs** (10 rounds)
- 🗄️ Token được lưu trong **Postman Environment Variables**
- 🔐 **Các API User Management cần:**
  - Authorization Header: `Bearer {{accessToken}}`
  - Admin Role: Chỉ admin mới có quyền tạo/cập nhật user
  - Access Token phải còn hiệu lực (< 15 phút)

---

## 📚 API Endpoints

| Endpoint | Method | Mô Tả | Auth |
|----------|--------|-------|------|
| `/api/auth/login` | POST | Đăng nhập, nhận Access + Refresh Token | ❌ |
| `/api/auth/refresh-token` | POST | Làm mới Access Token | ❌ |
| `/api/users` | POST | Tạo user mới | ✅ Admin |
| `/api/users/:id` | PUT | Cập nhật user | ✅ Admin |

---

## 🆘 Nếu Gặp Lỗi

| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-----------|----------|
| Connection refused | Server không chạy | `npm run dev` |
| 400 Bad Request | Email/password không hợp lệ | Kiểm tra request body |
| 401 Unauthorized | Email/password sai | Sử dụng credential đúng |
| Cannot read property 'accessToken' | Login thất bại | Xem console trong Postman |

---

## 📚 Liên Kết

- [Postman Collections Tutorial](https://learning.postman.com/docs/collections/collections-overview/)
- [Postman Environment Variables](https://learning.postman.com/docs/postman/variables-and-data-types/variables/)
- Express API Documentation: [README.md](./README.md)
