# Hướng dẫn sử dụng Auto Accept GGMeet

Tên extension: **Mike-AutoMeet**  
Phiên bản: **1.5.2**  
Cập nhật tài liệu: **2026-07-01**  
Link GitHub: **https://github.com/mikeTran99/AUTO_ACCEPT_GGMEET**

## 1. Extension này dùng để làm gì?

Auto Accept GGMeet là extension Chrome/Edge Manifest V3 giúp host, co-host hoặc giảng viên tự động xử lý yêu cầu vào phòng Google Meet.

Extension hỗ trợ hai chế độ:

- **Allow / Cho phép**: tự động bấm nút cho phép hoặc chấp nhận người đang chờ vào phòng.
- **Deny / Từ chối**: tự động bấm nút từ chối người đang chờ vào phòng.

Extension chỉ chạy trên `https://meet.google.com/*`, không gửi dữ liệu ra máy chủ ngoài, và lưu cấu hình ngay trong trình duyệt của bạn bằng `chrome.storage.sync`.

## 2. Yêu cầu trước khi cài

Bạn cần:

- Máy tính dùng Google Chrome hoặc Microsoft Edge bản mới.
- Có quyền bật **Developer mode** trong trang quản lý extension.
- Đăng nhập Google Meet bằng tài khoản có quyền duyệt người tham gia: host, co-host, giảng viên hoặc người tổ chức cuộc họp.
- Tải đúng thư mục extension có file `manifest.json` ở cấp ngoài cùng.

Bạn không cần cài Node.js hoặc chạy lệnh build để sử dụng extension. Node.js chỉ cần cho nhà phát triển muốn chạy test.

## 3. Tải extension từ GitHub

Repository public: `https://github.com/mikeTran99/AUTO_ACCEPT_GGMEET`

Để tải extension:

1. Mở trang GitHub của dự án.
2. Bấm nút **Code** màu xanh.
3. Chọn **Download ZIP**.
4. Giải nén file ZIP vào một thư mục cố định, ví dụ `D:\Extensions\Auto_Accept_GGMeet`.
5. Mở thư mục vừa giải nén và kiểm tra bên trong có các file/thư mục như:
   - `manifest.json`
   - `src`
   - `icons`
   - `_locales`
   - `assets`

Lưu ý: Không chọn nhầm thư mục cha. Khi cài bằng **Load unpacked**, bạn phải chọn đúng thư mục đang chứa file `manifest.json`.

## 4. Cài trên Google Chrome

1. Mở Chrome.
2. Truy cập `chrome://extensions`.
3. Bật công tắc **Developer mode** ở góc trên bên phải.
4. Bấm **Load unpacked**.
5. Chọn thư mục extension đã giải nén, tức thư mục có file `manifest.json`.
6. Sau khi cài thành công, Chrome sẽ hiển thị extension **Mike-AutoMeet** trong danh sách.
7. Ghim extension ra thanh công cụ nếu muốn thao tác nhanh:
   - Bấm biểu tượng mảnh ghép Extensions.
   - Tìm **Mike-AutoMeet**.
   - Bấm biểu tượng ghim.

## 5. Cài trên Microsoft Edge

1. Mở Edge.
2. Truy cập `edge://extensions`.
3. Bật **Developer mode**.
4. Bấm **Load unpacked**.
5. Chọn thư mục extension đã giải nén, tức thư mục có file `manifest.json`.
6. Kiểm tra extension **Mike-AutoMeet** đã xuất hiện và đang bật.

## 6. Cấu hình lần đầu

Sau khi cài xong:

1. Mở một phòng Google Meet tại `https://meet.google.com/`.
2. Refresh tab Google Meet nếu tab đã mở trước khi cài extension.
3. Bấm biểu tượng **Mike-AutoMeet** trên thanh công cụ.
4. Chọn nút **VI** hoặc **EN** ở mục **Ngôn ngữ giao diện / Popup language** nếu muốn đổi ngôn ngữ popup.
5. Bật **Tự động xử lý / Auto handling**.
6. Chọn **Chế độ tự động / Automation mode**:
   - **Cho phép / Allow** nếu muốn tự động duyệt người đang chờ.
   - **Từ chối / Deny** nếu muốn tự động từ chối người đang chờ.
7. Để **Chế độ an toàn / Safety mode** bật trong lần dùng đầu tiên.
8. Để **Phản hồi nhanh / Fast response** bật nếu muốn extension quét và phản hồi nhanh hơn.
9. Chỉ bật **Cho phép xử lý hàng loạt / Allow batch actions** khi bạn thật sự muốn dùng nút kiểu **Admit all / Deny all** nếu Google Meet hiển thị.

## 7. Ý nghĩa từng tùy chọn trong popup

### Tự động xử lý / Auto handling

Bật hoặc tắt toàn bộ cơ chế tự động cho tab Meet hiện tại. Khi tắt, extension không bấm nút nào.

### Chế độ tự động / Automation mode

- **Allow**: ưu tiên các nút cho phép, chấp nhận, admit, let in, accept.
- **Deny**: ưu tiên các nút từ chối, deny, decline, reject.

Khi đổi chế độ, extension tự đồng bộ cấu hình và làm mới trạng thái xử lý để tránh giữ hành động cũ.

### Ngôn ngữ giao diện / Popup language

Chọn ngôn ngữ hiển thị trong popup bằng nút **VI / EN**. Với người dùng mới, extension tự chọn tiếng Việt nếu trình duyệt đang dùng locale tiếng Việt; các locale khác sẽ mặc định dùng tiếng Anh để người dùng quốc tế thao tác dễ hơn.

### Ngôn ngữ nút Meet / Meet button language

Chọn ngôn ngữ nhãn nút mà Google Meet đang dùng:

- **Tự động / Auto**: nhận diện cả tiếng Việt và tiếng Anh.
- **Tiếng Việt**: chỉ ưu tiên nhãn tiếng Việt.
- **English**: chỉ ưu tiên nhãn tiếng Anh.

Nếu tài khoản Google Meet của bạn dùng tiếng Anh, có thể để **Auto** hoặc **English**. Nếu dùng tiếng Việt, có thể để **Auto** hoặc **Tiếng Việt**.

### Màu giao diện / Interface color

Chỉ thay đổi giao diện popup, không ảnh hưởng đến logic tự động.

### Chế độ an toàn / Safety mode

Nên bật mặc định. Khi bật, extension chỉ bấm khi phát hiện ngữ cảnh yêu cầu vào phòng Meet, ví dụ người đang chờ hoặc yêu cầu tham gia. Chế độ này giúp tránh bấm nhầm các nút không liên quan như chat, cài đặt host controls hoặc các trạng thái thông báo.

### Phản hồi nhanh / Fast response

Giảm độ trễ quét giao diện Meet để phản hồi nhanh hơn khi có người xin vào. Nếu máy yếu hoặc Meet bị lag, bạn có thể tắt tùy chọn này.

### Cho phép xử lý hàng loạt / Allow batch actions

Khi bật, extension có thể ưu tiên các nút xử lý tất cả như **Admit all** hoặc **Deny all**. Tùy chọn này sẽ tắt **Safety mode** vì xử lý hàng loạt thường không đi theo ngữ cảnh từng người. Chỉ bật khi bạn hiểu rõ tác động.

## 8. Cách sử dụng trong buổi Google Meet

1. Vào phòng Google Meet bằng tài khoản host hoặc co-host.
2. Mở popup **Mike-AutoMeet**.
3. Bật **Tự động xử lý**.
4. Chọn **Allow** hoặc **Deny** theo nhu cầu buổi học/cuộc họp.
5. Giữ popup đóng cũng được; extension vẫn chạy trong tab Meet.
6. Khi có người yêu cầu vào phòng, extension sẽ quét các nút hành động thật trên trang và bấm theo chế độ bạn chọn.
7. Quan sát badge trên icon extension:
   - `A`: đang ở chế độ Allow.
   - `D`: đang ở chế độ Deny.
   - Không có chữ: extension đang tắt hoặc không hoạt động trên tab hiện tại.

## 9. Kiểm tra extension đã hoạt động chưa

Bạn có thể kiểm tra nhanh như sau:

1. Mở một phòng Google Meet.
2. Mở popup extension.
3. Nếu popup báo cần mở hoặc tải lại phòng Google Meet, hãy refresh tab Meet.
4. Bật **Tự động xử lý** và chọn **Allow**.
5. Nhờ một tài khoản khác xin vào phòng.
6. Nếu bạn là host/co-host, yêu cầu vào phòng sẽ được xử lý tự động.

Nếu không có người thứ hai để thử, bạn vẫn có thể kiểm tra extension đã nạp bằng cách:

- Mở `chrome://extensions`.
- Bật **Developer mode**.
- Kiểm tra **Mike-AutoMeet** không có lỗi đỏ.
- Mở Google Meet và refresh tab.
- Mở popup và xem trạng thái không còn báo "mở hoặc tải lại một phòng Google Meet".

## 10. Cập nhật extension khi có bản mới

Nếu bạn tải bản mới từ GitHub:

1. Tải ZIP mới từ GitHub.
2. Giải nén và thay thế thư mục extension cũ, hoặc giải nén sang thư mục mới.
3. Mở `chrome://extensions` hoặc `edge://extensions`.
4. Tìm **Mike-AutoMeet**.
5. Bấm nút reload của extension.
6. Refresh mọi tab Google Meet đang mở.

Nếu bạn đổi sang thư mục mới, có thể cần bấm **Remove** extension cũ rồi **Load unpacked** lại thư mục mới.

## 11. Gỡ extension

Trên Chrome hoặc Edge:

1. Mở trang quản lý extension:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
2. Tìm **Mike-AutoMeet**.
3. Bấm **Remove**.
4. Xác nhận gỡ.

## 12. Xử lý lỗi thường gặp

### Không thấy extension trong thanh công cụ

Mở biểu tượng Extensions hình mảnh ghép, tìm **Mike-AutoMeet**, rồi bấm ghim.

### Bấm Load unpacked bị lỗi

Hãy chắc chắn bạn chọn đúng thư mục có file `manifest.json`. Nếu bạn tải ZIP từ GitHub, sau khi giải nén có thể có một thư mục lồng bên trong. Hãy mở vào thư mục đó rồi chọn.

### Popup báo cần mở hoặc tải lại Google Meet

Extension chỉ chạy trên `https://meet.google.com/*`. Hãy mở một phòng Meet thật, rồi refresh tab sau khi cài hoặc cập nhật extension.

### Extension không tự bấm nút

Kiểm tra các điểm sau:

- Bạn có phải host hoặc co-host không?
- **Tự động xử lý** đã bật chưa?
- Chế độ đang chọn có đúng không: Allow hoặc Deny?
- Tab Google Meet đã refresh sau khi cài/cập nhật chưa?
- Google Meet đang dùng tiếng Việt hay tiếng Anh? Thử đặt **Ngôn ngữ nút Meet** về **Tự động / Auto**.
- Nếu đang bật xử lý hàng loạt nhưng không thấy tác dụng, Google Meet có thể không hiển thị nút **Admit all / Deny all** trong tình huống đó.

### Extension bấm chậm

Bật **Phản hồi nhanh / Fast response**. Nếu mạng hoặc máy đang chậm, Google Meet cũng có thể hiển thị nút muộn hơn.

### Lo ngại bấm nhầm

Bật **Chế độ an toàn / Safety mode** và tắt **Cho phép xử lý hàng loạt / Allow batch actions**. Đây là cấu hình khuyến nghị cho đa số lớp học/cuộc họp.

## 13. Quyền riêng tư và phạm vi hoạt động

Extension dùng các quyền sau:

- `host_permissions` cho `https://meet.google.com/*`: cho phép content script nhận diện và bấm nút trong Google Meet.
- `storage`: lưu cấu hình bật/tắt, ngôn ngữ, chế độ Allow/Deny, màu giao diện và tùy chọn an toàn trong trình duyệt.
- `activeTab`: cho popup đọc trạng thái tab Google Meet hiện tại khi bạn mở popup.

Extension không thu thập nội dung camera, microphone, chat, email hoặc danh sách người tham gia. Extension không gửi dữ liệu ra máy chủ ngoài.

## 14. Dành cho nhà phát triển

Nếu bạn muốn kiểm tra mã nguồn:

```powershell
npm.cmd run check
npm.cmd test
```

Các lệnh này kiểm tra cú pháp JavaScript và chạy test nhận diện nhãn nút tiếng Việt/tiếng Anh.

## 15. Cấu hình khuyến nghị

Cho lớp học hoặc cuộc họp thông thường:

- **Tự động xử lý**: bật.
- **Chế độ tự động**: Allow.
- **Ngôn ngữ nút Meet**: Auto.
- **Chế độ an toàn**: bật.
- **Phản hồi nhanh**: bật.
- **Xử lý hàng loạt**: tắt.

Chỉ chuyển sang **Deny** khi bạn muốn từ chối toàn bộ yêu cầu vào phòng trong một thời điểm cụ thể.

## 16. Ghi chú quan trọng

Google Meet có thể thay đổi giao diện hoặc nhãn nút theo thời gian. Nếu extension đột nhiên không nhận diện đúng, hãy:

1. Refresh tab Google Meet.
2. Reload extension trong `chrome://extensions` hoặc `edge://extensions`.
3. Kiểm tra bạn đang dùng bản mới nhất từ GitHub.
4. Mở issue trên GitHub và mô tả ngôn ngữ giao diện Meet, chế độ đang dùng, trình duyệt và tình huống gặp lỗi.
