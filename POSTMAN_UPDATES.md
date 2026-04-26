# 📋 Cập Nhật Postman Collection - User Management APIs

## ✅ Những Gì Đã Được Thêm Mới

### 🆕 **User Management Section** (6 API tests mới)

1. **Create User** ✅
   - POST `/api/users`
   - Cần: Authorization (Admin) + Body (username, fullName, password, role)
   - Tự động lưu User ID vào `createdUserId`

2. **Create User - Duplicate Username** ❌
   - Kiểm tra xử lý username đã tồn tại
   - Kỳ vọng: 409 Conflict

3. **Create User - Missing Fields** ❌
   - Kiểm tra xử lý fields không đủ
   - Kỳ vọng: 400 Bad Request

4. **Update User** ✅
   - PUT `/api/users/{{createdUserId}}`
   - Cần: Authorization (Admin) + Body
   - Tự động cập nhật `createdUserId`

5. **Update User - Not Found** ❌
   - Kiểm tra xử lý user ID không tồn tại
   - Kỳ vọng: 404 Not Found

6. **Create User - Without Authorization** ❌
   - Kiểm tra xử lý khi không gửi token
   - Kỳ vọng: 401 Unauthorized

---

## 🔑 Biến Môi Trường Mới

- `createdUserId` - Lưu ID của user vừa tạo (tự động từ Create User test)

---

## 📝 Cách Sử Dụng

### Quy Trình Đầy Đủ

```
1. Login ↓
   ├→ Get Access Token + Refresh Token
   │
2. Create User ↓
   ├→ Authorization: Bearer {{accessToken}}
   ├→ Auto save User ID → createdUserId
   │
3. Update User ↓
   ├→ Authorization: Bearer {{accessToken}}
   ├→ Use {{createdUserId}} from step 2
   │
4. Test Error Cases
   ├→ Duplicate Username (409)
   ├→ Missing Fields (400)
   ├→ Not Found (404)
   └→ Without Authorization (401)
```

### Chi Tiết Request

**Create User:**
```json
{
  "username": "officer@bacninh.gov.vn",
  "fullName": "Trịnh Văn Công",
  "password": "SecurePass@2024",
  "role": "officer"
}
```

**Update User:**
```json
{
  "fullName": "Trịnh Văn Công - Updated",
  "role": "officer",
  "password": "NewSecurePass@2024"
}
```

---

## ⚠️ Lưu Ý Quan Trọng

### Authorization
- Tất cả User Management APIs cần **Bearer Token**
- Format: `Authorization: Bearer {{accessToken}}`
- Token phải từ Admin account

### Admin Only
- Chỉ admin mới có quyền tạo/cập nhật user
- Nếu dùng staff token sẽ nhận: 403 Forbidden

### Error Handling
- Các test error cases giúp kiểm tra xử lý lỗi của API
- Response codes: 400, 401, 403, 404, 409 được test

---

## 📊 Tóm Tắt

| Chỉ Số | Trước | Sau | Thêm Mới |
|--------|-------|-----|---------|
| Auth Tests | 4 | 4 | 0 |
| User Management Tests | 0 | 6 | 6 ⭐ |
| **Tổng Tests** | **4** | **10** | **+6** |

---

## 🚀 Quick Start

1. **Import Collection (mới)**
   ```
   File → Import → Express_API_Auth_Tests.postman_collection.json
   ```

2. **Chạy Server**
   ```bash
   npm run dev
   ```

3. **Test Workflow:**
   - Chọn **Login** → Send
   - Chọn **Create User** → Send
   - Chọn **Update User** → Send
   - Chọn **Test Errors** → Send

4. **Xem Results**
   - Check **Response** tab cho từng request
   - Check **Tests** tab để xem logs

---

## 📁 Files Cập Nhật

- ✅ `Express_API_Auth_Tests.postman_collection.json` - Thêm 6 user management tests
- ✅ `POSTMAN_GUIDE.md` - Cập nhật hướng dẫn cho user management
- ✅ `POSTMAN_QUICKSTART.md` - Thêm user management test cases + API table

---

## ❓ FAQ

**Q: Tại sao Create User cần Authorization?**
A: Vì chỉ Admin mới có quyền tạo user mới

**Q: Làm sao biết User ID của user vừa tạo?**
A: Tự động lưu vào biến `createdUserId` sau khi Create User thành công

**Q: Có thể test với staff account không?**
A: Có, nhưng sẽ nhận 403 Forbidden vì chỉ admin có quyền

**Q: Password phải mã hóa trước khi gửi không?**
A: Không, gửi plain text password, server sẽ mã hóa bằng bcrypt

---

## 🔗 Tài Liệu Liên Quan

- [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md) - Hướng dẫn chi tiết
- [POSTMAN_QUICKSTART.md](./POSTMAN_QUICKSTART.md) - Quick start 5 phút
- [README.md](./README.md) - Tài liệu chung project
