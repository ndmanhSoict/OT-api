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

### ✅ Login Thành Công
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

### ✅ Refresh Token
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

### ❌ Login Thất Bại (Email không tồn tại)
```bash
Response (401):
{
  "success": false,
  "message": "Email hoặc mật khẩu không đúng"
}
```

### ❌ Login Thất Bại (Mật khẩu sai)
```bash
Response (401):
{
  "success": false,
  "message": "Email hoặc mật khẩu không đúng"
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
