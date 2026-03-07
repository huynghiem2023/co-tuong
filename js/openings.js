// openings.js - Cờ Tướng Opening Database
// Coordinates: [row, col], row 0=top(Black), row 9=bottom(Red), col 0-8

const OPENINGS = [
{id:"tp_hx_bpm",category:"Pháo đầu đối Bình phong mã",name:"Trung pháo hoành xa đối Bình phong mã",
description:"Đỏ dùng Trung pháo kết hợp hoành xa tấn công, Đen dùng Bình phong mã phòng thủ vững chắc.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo khai cuộc, kiểm soát cột giữa"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7 - Mã lên bảo vệ trung lộ, bắt đầu thế Bình phong mã"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7 - Khai triển Mã, chuẩn bị phối hợp tấn công"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1 - Khai triển Xa chuẩn bị tuần hà"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1 - Xuất Xa đối kháng"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3 - Hoàn thành thế Bình phong mã, hai Mã bảo vệ"},
{from:[8,0],to:[8,3],explanation:"Xa 9 bình 6 - Hoành xa, Xe ngang sang cột 6 tấn công cánh"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1 - Tiến tốt giành không gian trung tâm"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3 - Khai triển Mã phải phối hợp tấn công"},
{from:[2,7],to:[2,4],explanation:"Pháo 2 bình 5 - Pháo vào giữa phản công"}
]},

{id:"tp_tx_bpm",category:"Pháo đầu đối Bình phong mã",name:"Trung pháo trực xa đối Bình phong mã",
description:"Đỏ dùng Trung pháo với trực xa (xe thẳng) gây áp lực trực tiếp lên trung lộ.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7 - Bình phong mã"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7 - Khai triển mã trái"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3 - Hoàn thành Bình phong mã"},
{from:[9,8],to:[8,8],explanation:"Xa 1 tiến 1 - Xuất xa phải"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1 - Đen xuất xa đối kháng"},
{from:[8,8],to:[8,4],explanation:"Xa 1 bình 5 - Trực xa chiếm cột giữa"},
{from:[1,8],to:[1,4],explanation:"Xa 1 bình 5 - Đen đưa xa vào trung lộ phòng thủ"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3 - Hoàn thành khai triển hai mã"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1 - Tiến tốt trung tâm"}
]},

{id:"tp_t3b_bpm",category:"Pháo đầu đối Bình phong mã",name:"Trung pháo tiến tam binh đối Bình phong mã",
description:"Đỏ tiến binh 3 sớm kết hợp Trung pháo, tạo thế tấn công linh hoạt.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo khai cuộc"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7 - Bình phong mã"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7 - Khai triển mã"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3 - Hoàn thành Bình phong mã"},
{from:[6,6],to:[5,6],explanation:"Binh 3 tiến 1 - Tiến binh 3, mở đường cho Mã"},
{from:[3,2],to:[4,2],explanation:"Tốt 7 tiến 1 - Đen tiến tốt đối kháng"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3 - Mã nhảy qua binh vừa tiến"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1 - Đen xuất xa"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1 - Đỏ xuất xa trái"},
{from:[2,7],to:[2,4],explanation:"Pháo 2 bình 5 - Đen pháo vào giữa"}
]},

{id:"tp_qhx_bpm",category:"Pháo đầu đối Bình phong mã",name:"Trung pháo quá hà xa đối Bình phong mã",
description:"Đỏ đưa Xa qua hà tấn công sớm, gây áp lực lớn lên Đen.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7 - Bình phong mã"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3 - Hoàn thành Bình phong mã"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1 - Xuất xa"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"},
{from:[8,0],to:[4,0],explanation:"Xa 9 tiến 4 - Xa quá hà, tiến sâu sang trận địa đối phương"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1 - Giành trung tâm"},
{from:[4,0],to:[4,3],explanation:"Xa 9 bình 6 - Xa tuần hà gây áp lực"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1 - Xuất xa đối phó"}
]},

{id:"n7p_bpm",category:"Pháo đầu đối Bình phong mã",name:"Ngũ thất pháo đối Bình phong mã",
description:"Đỏ dùng thế Ngũ thất pháo (Pháo ở cột 5 và cột 7) tấn công cánh phải.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[7,1],to:[7,2],explanation:"Pháo 8 bình 7 - Tạo thế Ngũ thất pháo"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1 - Đen xuất xa"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3 - Hoàn thành khai triển"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"}
]},

{id:"tp_thp_hx",category:"Pháo đầu đối Thuận pháo",name:"Thuận pháo hoành xa đối trực xa",
description:"Cả hai bên đều dùng Trung pháo cùng hướng (Thuận pháo). Đỏ kết hợp hoành xa, Đen dùng trực xa.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[2,7],to:[2,4],explanation:"Pháo 8 bình 5 - Thuận pháo, pháo cùng hướng với Đỏ"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,8],to:[2,8],explanation:"Xa 1 tiến 2 - Trực xa, xe thẳng tiến"},
{from:[8,0],to:[8,3],explanation:"Xa 9 bình 6 - Hoành xa chiếm cánh"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1 - Xuất xa trái"}
]},

{id:"tp_thp_tx",category:"Pháo đầu đối Thuận pháo",name:"Thuận pháo trực xa đối hoành xa",
description:"Thuận pháo - Đỏ dùng trực xa tấn công trung lộ, Đen phản công bằng hoành xa.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[2,7],to:[2,4],explanation:"Pháo 8 bình 5 - Thuận pháo"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,8],to:[8,8],explanation:"Xa 1 tiến 1 - Xuất xa phải"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"},
{from:[8,8],to:[8,4],explanation:"Xa 1 bình 5 - Trực xa chiếm trung lộ"},
{from:[0,0],to:[2,0],explanation:"Xa 9 tiến 2"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[2,0],to:[2,3],explanation:"Xa 9 bình 6 - Hoành xa phản công"}
]},

{id:"tp_thp_ldx",category:"Pháo đầu đối Thuận pháo",name:"Thuận pháo lưỡng đầu xà",
description:"Biến thể Thuận pháo với thế Lưỡng đầu xà - hai Xa đều xuất ra sớm như hai đầu rắn.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[2,7],to:[2,4],explanation:"Pháo 8 bình 5 - Thuận pháo"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1 - Xuất xa trái"},
{from:[0,0],to:[2,0],explanation:"Xa 9 tiến 2 - Xa tiến nhanh"},
{from:[9,8],to:[8,8],explanation:"Xa 1 tiến 1 - Xuất cả hai xa (Lưỡng đầu xà)"},
{from:[0,8],to:[2,8],explanation:"Xa 1 tiến 2 - Đen cũng xuất hai xa"},
{from:[8,0],to:[8,3],explanation:"Xa 9 bình 6 - Hoành xa trái"},
{from:[2,0],to:[2,3],explanation:"Xa 9 bình 6 - Đen tuần hà"}
]},

{id:"tp_nghp_txhx",category:"Pháo đầu đối Nghịch pháo",name:"Nghịch pháo trực xa đối hoành xa",
description:"Đen dùng Nghịch pháo (pháo ngược hướng Đỏ) kết hợp phòng thủ linh hoạt.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[2,1],to:[2,4],explanation:"Pháo 2 bình 5 - Nghịch pháo, pháo ngược hướng với Đỏ"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,8],to:[8,8],explanation:"Xa 1 tiến 1"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[8,8],to:[8,4],explanation:"Xa 1 bình 5 - Trực xa áp trung lộ"},
{from:[1,0],to:[1,4],explanation:"Xa 9 bình 5 - Đen xa vào giữa phòng thủ"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"}
]},

{id:"tp_lietp",category:"Pháo đầu đối Nghịch pháo",name:"Liệt pháo",
description:"Liệt pháo - Đỏ đặt pháo ở cánh (cột 4/6) kết hợp trung pháo tạo hỏa lực chéo.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[2,1],to:[2,4],explanation:"Pháo 2 bình 5 - Nghịch pháo"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[7,1],to:[7,5],explanation:"Pháo 8 bình 4 - Liệt pháo, hai pháo tấn công cánh"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"},
{from:[6,6],to:[5,6],explanation:"Binh 3 tiến 1 - Mở đường cho mã"},
{from:[3,2],to:[4,2],explanation:"Tốt 7 tiến 1 - Đổi binh giành không gian"}
]},

{id:"tp_bdlp",category:"Pháo đầu đối Nghịch pháo",name:"Bán đồ liệt pháo",
description:"Biến thể nhẹ hơn của Liệt pháo, pháo giữ vị trí linh hoạt hơn.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[2,1],to:[2,4],explanation:"Pháo 2 bình 5 - Nghịch pháo"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[8,0],to:[8,3],explanation:"Xa 9 bình 6 - Hoành xa"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[7,1],to:[7,5],explanation:"Pháo 8 bình 4 - Chuyển thành liệt pháo muộn"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1 - Giành trung tâm"}
]},

{id:"tp_ddm_hx",category:"Pháo đầu đối Đơn đề mã",name:"Đơn đề mã hoành xa",
description:"Đen chỉ lên một Mã (Đơn đề mã) kết hợp hoành xa phản công linh hoạt.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7 - Chỉ lên một mã (Đơn đề mã)"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,0],to:[2,0],explanation:"Xa 9 tiến 2 - Xuất xa nhanh"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[2,0],to:[2,3],explanation:"Xa 9 bình 6 - Hoành xa tuần hà"},
{from:[8,0],to:[8,3],explanation:"Xa 9 bình 6 - Đỏ cũng hoành xa"},
{from:[0,3],to:[1,4],explanation:"Sĩ 4 tiến 5 - Bổ sĩ phòng thủ"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1 - Chuẩn bị xuất xa phải"}
]},

{id:"tp_ddm_gp",category:"Pháo đầu đối Đơn đề mã",name:"Đơn đề mã giáp pháo",
description:"Đơn đề mã kết hợp giáp pháo (pháo giữ bên cạnh tướng) phòng thủ kiên cố.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7 - Đơn đề mã"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[2,7],to:[1,7],explanation:"Pháo 2 tiến 1 - Di chuyển pháo chuẩn bị giáp pháo"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[1,7],to:[1,4],explanation:"Pháo 2 bình 5 - Giáp pháo, pháo bảo vệ tướng"},
{from:[8,0],to:[8,3],explanation:"Xa 9 bình 6"},
{from:[0,0],to:[2,0],explanation:"Xa 9 tiến 2"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,3],to:[1,4],explanation:"Sĩ 4 tiến 5 - Bổ sĩ"}
]},

{id:"tp_pcm_cb",category:"Pháo đầu đối Phản cung mã",name:"Phản cung mã cơ bản",
description:"Đen dùng Phản cung mã - Mã nhảy về phía cung (sĩ tượng), phòng thủ rồi phản công.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1 - Xuất xa"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[2,6],to:[3,4],explanation:"Mã 3 tiến 5 - Phản cung mã, mã nhảy vào trung tâm"},
{from:[8,0],to:[8,3],explanation:"Xa 9 bình 6"},
{from:[0,3],to:[1,4],explanation:"Sĩ 4 tiến 5 - Bổ sĩ bảo vệ tướng"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[2,1],to:[2,3],explanation:"Pháo 2 bình 6 - Pháo giữ cánh phối hợp mã"}
]},

{id:"tp_pcm_px",category:"Pháo đầu đối Phản cung mã",name:"Phản cung mã tả pháo phong xa",
description:"Phản cung mã biến thể - dùng pháo trái phong tỏa xa đối phương.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[2,1],to:[2,3],explanation:"Pháo 2 bình 6 - Tả pháo phong xa, chặn xa đối phương"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"},
{from:[8,0],to:[8,3],explanation:"Xa 9 bình 6"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[6,6],to:[5,6],explanation:"Binh 3 tiến 1"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1"}
]},

{id:"tp_n6p",category:"Pháo đầu - Biến thể đặc biệt",name:"Ngũ lục pháo",
description:"Thế Ngũ lục pháo - hai pháo ở cột 5 và cột 6, tập trung hỏa lực tấn công cánh.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[7,1],to:[7,3],explanation:"Pháo 8 bình 6 - Tạo thế Ngũ lục pháo (cột 5 và 6)"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"}
]},

{id:"tp_pcm_ht",category:"Pháo đầu đối Phản cung mã",name:"Phản cung mã hữu tượng",
description:"Phản cung mã kết hợp phi tượng phải, xây dựng thế phòng thủ vững chắc.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3 - Phản cung mã"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,6],to:[2,8],explanation:"Tượng 3 tiến 1 - Phi tượng phải, củng cố phòng thủ"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"},
{from:[8,0],to:[8,3],explanation:"Xa 9 bình 6"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1"}
]},

{id:"tp_n7p_t3b",category:"Pháo đầu - Biến thể đặc biệt",name:"Ngũ thất pháo tiến tam binh",
description:"Ngũ thất pháo kết hợp tiến binh 3, mở đường cho mã tấn công cánh phải.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[7,1],to:[7,2],explanation:"Pháo 8 bình 7 - Ngũ thất pháo"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[6,6],to:[5,6],explanation:"Binh 3 tiến 1 - Tiến tam binh"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7 - Mã qua binh đã tiến"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"}
]},

{id:"ptc_ttp",category:"Phi tượng cục",name:"Phi tượng cục đối tả trung pháo",
description:"Đỏ khai cuộc bằng Phi tượng (bay tượng), Đen phản công bằng pháo vào trung lộ từ cánh trái.",
moves:[
{from:[9,6],to:[7,4],explanation:"Tượng 3 tiến 5 - Phi tượng cục, khai cuộc linh hoạt"},
{from:[2,1],to:[2,4],explanation:"Pháo 2 bình 5 - Đen trung pháo phản công"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[7,7],to:[5,7],explanation:"Pháo 2 tiến 2 - Pháo tiến chuẩn bị tấn công"},
{from:[0,8],to:[2,8],explanation:"Xa 1 tiến 2"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"}
]},

{id:"ptc_htp",category:"Phi tượng cục",name:"Phi tượng cục đối hữu trung pháo",
description:"Phi tượng cục - Đen dùng pháo phải vào trung lộ tạo áp lực.",
moves:[
{from:[9,6],to:[7,4],explanation:"Tượng 3 tiến 5 - Phi tượng cục"},
{from:[2,7],to:[2,4],explanation:"Pháo 8 bình 5 - Đen trung pháo từ cánh phải"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[7,7],to:[7,5],explanation:"Pháo 2 bình 4 - Pháo giữ cánh"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1"}
]},

{id:"ptc_tt",category:"Phi tượng cục",name:"Phi tượng cục đối tiến tốt",
description:"Phi tượng cục - Đen đáp trả bằng tiến tốt, giành không gian từ từ.",
moves:[
{from:[9,6],to:[7,4],explanation:"Tượng 3 tiến 5 - Phi tượng cục"},
{from:[3,6],to:[4,6],explanation:"Tốt 3 tiến 1 - Đen tiến tốt cánh thăm dò"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[7,7],to:[7,5],explanation:"Pháo 2 bình 4"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"}
]},

{id:"tncl_tcb",category:"Tiên nhân chỉ lộ",name:"Tiên nhân chỉ lộ đối tốt trung binh",
description:"Đỏ tiến binh đầu tiên (Tiên nhân chỉ lộ) thăm dò, Đen đáp lại bằng tiến tốt trung tâm.",
moves:[
{from:[6,6],to:[5,6],explanation:"Binh 3 tiến 1 - Tiên nhân chỉ lộ, nước đi thăm dò"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1 - Tiến tốt trung tâm đáp trả"},
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Chuyển sang Trung pháo"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"}
]},

{id:"tncl_tp",category:"Tiên nhân chỉ lộ",name:"Tiên nhân chỉ lộ đối trung pháo",
description:"Tiên nhân chỉ lộ - Đen đáp trả mạnh mẽ bằng trung pháo tấn công.",
moves:[
{from:[6,6],to:[5,6],explanation:"Binh 3 tiến 1 - Tiên nhân chỉ lộ"},
{from:[2,7],to:[2,4],explanation:"Pháo 8 bình 5 - Đen trung pháo phản công"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Đỏ cũng trung pháo, thành Thuận/Nghịch pháo"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"}
]},

{id:"tncl_pt",category:"Tiên nhân chỉ lộ",name:"Tiên nhân chỉ lộ đối phi tượng",
description:"Tiên nhân chỉ lộ - Đen phi tượng đáp trả, xây dựng thế trận chặt chẽ.",
moves:[
{from:[6,6],to:[5,6],explanation:"Binh 3 tiến 1 - Tiên nhân chỉ lộ"},
{from:[0,2],to:[2,4],explanation:"Tượng 7 tiến 5 - Phi tượng trung tâm"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Chuyển sang trung pháo"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"}
]},

{id:"kmc_tt",category:"Khởi mã cục",name:"Khởi mã cục đối tiến tốt",
description:"Đỏ khai cuộc bằng Mã (Khởi mã cục), Đen đáp trả bằng tiến tốt.",
moves:[
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7 - Khởi mã cục, khai cuộc bằng Mã"},
{from:[3,6],to:[4,6],explanation:"Tốt 3 tiến 1 - Tiến tốt cánh thăm dò"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3 - Khai triển mã phải"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Chuyển sang trung pháo"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[6,6],to:[5,6],explanation:"Binh 3 tiến 1 - Mở đường cho mã"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"}
]},

{id:"kmc_tp",category:"Khởi mã cục",name:"Khởi mã cục đối trung pháo",
description:"Khởi mã cục - Đen đáp trả trực tiếp bằng trung pháo gây áp lực.",
moves:[
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7 - Khởi mã cục"},
{from:[2,7],to:[2,4],explanation:"Pháo 8 bình 5 - Đen trung pháo phản công"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[7,7],to:[7,5],explanation:"Pháo 2 bình 4 - Pháo giữ cánh"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[9,6],to:[7,4],explanation:"Tượng 3 tiến 5 - Phi tượng"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1"}
]},

{id:"kmc_ctp",category:"Khởi mã cục",name:"Khởi mã chuyển trung pháo",
description:"Khởi mã cục sau đó chuyển sang trung pháo, kết hợp ưu thế của cả hai thế trận.",
moves:[
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7 - Khởi mã cục"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Chuyển sang trung pháo"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1"},
{from:[8,0],to:[8,3],explanation:"Xa 9 bình 6 - Hoành xa"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"}
]},

{id:"stc_sgp",category:"Sĩ tượng cục",name:"Sĩ giác pháo",
description:"Bổ sĩ khai cuộc kết hợp pháo ở góc sĩ, thế trận phòng ngự chờ phản công.",
moves:[
{from:[9,5],to:[8,4],explanation:"Sĩ 4 tiến 5 - Bổ sĩ khai cuộc (Sĩ tượng cục)"},
{from:[2,7],to:[2,4],explanation:"Pháo 8 bình 5 - Đen trung pháo"},
{from:[7,7],to:[8,7],explanation:"Pháo 2 tiến 1 - Pháo lui về giác sĩ phòng thủ"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"}
]},

{id:"stc_qbp",category:"Sĩ tượng cục",name:"Quy bối pháo",
description:"Quy bối pháo - Pháo đặt sau lưng tướng như mai rùa, phòng thủ cực vững rồi phản công.",
moves:[
{from:[9,5],to:[8,4],explanation:"Sĩ 4 tiến 5 - Bổ sĩ"},
{from:[2,7],to:[2,4],explanation:"Pháo 8 bình 5 - Đen trung pháo"},
{from:[7,7],to:[8,7],explanation:"Pháo 2 tiến 1"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[8,7],to:[8,4],explanation:"Pháo 2 bình 5 - Quy bối pháo, pháo sau lưng tướng"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1"}
]},

{id:"yyp",category:"Thế trận đặc biệt",name:"Uyên ương pháo",
description:"Uyên ương pháo - Hai pháo kết hợp như đôi uyên ương, liên kết tấn công đầy uy lực.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[6,4],to:[5,4],explanation:"Binh 5 tiến 1 - Tiến binh trung tâm"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1 - Đổi binh"},
{from:[7,1],to:[5,1],explanation:"Pháo 8 tiến 2 - Pháo tiến lên, chuẩn bị Uyên ương pháo"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[5,1],to:[5,4],explanation:"Pháo 8 bình 5 - Hai pháo cùng cột 5, thế Uyên ương"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1 - Đen xuất xa đối phó"}
]},

{id:"tbh",category:"Thế trận đặc biệt",name:"Tam bộ hổ",
description:"Tam bộ hổ - Ba nước đầu tạo thế hổ mạnh mẽ: Mã, Pháo, Xa phối hợp hoàn hảo.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Bước 1: Trung pháo"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7 - Bước 2: Lên mã"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"},
{from:[9,0],to:[7,0],explanation:"Xa 9 tiến 2 - Bước 3: Xuất xa nhanh, hoàn thành Tam bộ hổ"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[7,0],to:[7,3],explanation:"Xa 9 bình 6 - Xa tuần hà tấn công"},
{from:[0,8],to:[1,8],explanation:"Xa 1 tiến 1"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[3,4],to:[4,4],explanation:"Tốt 5 tiến 1"}
]},

{id:"ddm_qhx",category:"Pháo đầu đối Đơn đề mã",name:"Trung pháo quá hà xa đối Đơn đề mã",
description:"Đỏ dùng xa quá hà kết hợp trung pháo đối phó thế Đơn đề mã của Đen.",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7 - Đơn đề mã"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,3],to:[1,4],explanation:"Sĩ 4 tiến 5 - Bổ sĩ phòng thủ"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,0],to:[2,0],explanation:"Xa 9 tiến 2"},
{from:[8,0],to:[4,0],explanation:"Xa 9 tiến 4 - Xa quá hà tấn công"},
{from:[2,0],to:[2,3],explanation:"Xa 9 bình 6 - Đen hoành xa phòng thủ"},
{from:[4,0],to:[4,3],explanation:"Xa 9 bình 6 - Đỏ xa tuần hà"},
{from:[2,7],to:[2,4],explanation:"Pháo 8 bình 5 - Pháo vào giữa đối kháng"}
]},

{id:"thp_dx",category:"Pháo đầu đối Thuận pháo",name:"Thuận pháo duyên xa",
description:"Biến thể Thuận pháo với Xa di chuyển dọc theo cạnh bàn cờ (duyên xa).",
moves:[
{from:[7,7],to:[7,4],explanation:"Pháo 2 bình 5 - Trung pháo"},
{from:[2,7],to:[2,4],explanation:"Pháo 8 bình 5 - Thuận pháo"},
{from:[9,1],to:[7,2],explanation:"Mã 8 tiến 7"},
{from:[0,1],to:[2,2],explanation:"Mã 8 tiến 7"},
{from:[9,0],to:[8,0],explanation:"Xa 9 tiến 1"},
{from:[0,8],to:[4,8],explanation:"Xa 1 tiến 4 - Duyên xa, xa tiến dọc theo cạnh bàn cờ"},
{from:[8,0],to:[8,3],explanation:"Xa 9 bình 6"},
{from:[0,0],to:[1,0],explanation:"Xa 9 tiến 1"},
{from:[9,7],to:[7,6],explanation:"Mã 2 tiến 3"},
{from:[0,7],to:[2,6],explanation:"Mã 2 tiến 3"}
]}
];

// Group openings by category
function getOpeningsByCategory() {
    const categories = {};
    for (const opening of OPENINGS) {
        if (!categories[opening.category]) {
            categories[opening.category] = [];
        }
        categories[opening.category].push(opening);
    }
    return categories;
}
