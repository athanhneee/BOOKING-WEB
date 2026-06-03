import villaTranPhuImage from "../assets/img/19tranphu.jpg";
import villaBaiSauImage from "../assets/img/343vothisau.jpg";
import villaPoolImage from "../assets/img/casamar.jpg";
import villaFamilyImage from "../assets/img/lacase.jpg";
import villaGroupImage from "../assets/img/diamond.jpg";
import villaBudgetImage from "../assets/img/mocnhien.jpg";
import villaBeachImage from "../assets/img/NDT05929-HDR1.jpg";
import villaBbqImage from "../assets/img/nabi.JPG";
import villaChecklistImage from "../assets/img/s07.jpg";
import villaSunsetImage from "../assets/img/sunset.jpg";

export type BlogPost = {
    id: string;
    slug: string;
    title: string;
    category: string;
    readTime: string;
    location: string;
    excerpt: string;
    coverImage: string;
    content: string[];
    publishedAt: string;
};

export const blogPosts: BlogPost[] = [
    {
        id: "blog-01",
        slug: "lich-trinh-vung-tau-2-ngay-1-dem-cho-nhom-ban",
        title: "Lên lịch nghỉ dưỡng Vũng Tàu 2 ngày 1 đêm cho nhóm bạn",
        category: "Cẩm nang chuyến đi",
        readTime: "5 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Gợi ý cách chọn villa, sắp lịch check-in, chuẩn bị bữa BBQ và di chuyển giữa các điểm biển để chuyến đi ngắn vẫn thật trọn vẹn.",
        coverImage: villaFamilyImage,
        publishedAt: "2026-05-05",
        content: [
            "Với chuyến đi 2 ngày 1 đêm, nhóm bạn nên ưu tiên villa có không gian sinh hoạt chung rộng, bếp dễ sử dụng và vị trí không quá xa biển. Lịch trình ngắn sẽ thoải mái hơn nếu nhóm không phải di chuyển liên tục giữa quá nhiều điểm.",
            "Ngày đầu tiên nên nhận phòng, nghỉ ngơi, chuẩn bị BBQ hoặc ăn tối gần villa. Nếu muốn chụp ảnh biển, hãy ra Bãi Sau hoặc đường Hạ Long vào cuối buổi chiều để tránh nắng gắt và có ánh sáng đẹp hơn.",
            "Ngày thứ hai phù hợp cho cà phê sáng, tắm biển sớm và trả phòng đúng giờ. Trước khi rời villa, nhóm nên kiểm tra lại đồ cá nhân, khu bếp, thiết bị karaoke và các khoản phụ thu nếu có.",
        ],
    },
    {
        id: "blog-02",
        slug: "cach-chon-villa-ho-boi-cho-gia-dinh-co-tre-nho",
        title: "Cách chọn villa hồ bơi phù hợp cho gia đình có trẻ nhỏ",
        category: "Kinh nghiệm đặt phòng",
        readTime: "4 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Những tiêu chí nên kiểm tra trước khi đặt: độ sâu hồ bơi, hàng rào an toàn, số phòng ngủ và không gian sinh hoạt chung.",
        coverImage: villaPoolImage,
        publishedAt: "2026-04-28",
        content: [
            "Gia đình có trẻ nhỏ nên hỏi rõ độ sâu hồ bơi, khu vực nông, bậc lên xuống và bề mặt chống trơn. Một hồ bơi đẹp chưa đủ, yếu tố quan trọng hơn là người lớn có thể quan sát trẻ từ phòng khách, sân hoặc khu BBQ.",
            "Bạn cũng nên ưu tiên villa có phòng ngủ ở tầng thấp, cầu thang có tay vịn chắc chắn và cửa ra hồ bơi dễ kiểm soát. Nếu đi cùng ông bà, hãy kiểm tra thêm nhà vệ sinh, bãi đậu xe và khoảng cách từ phòng ngủ đến khu sinh hoạt.",
            "Trước khi chuyển khoản, hãy yêu cầu ảnh hoặc video mới nhất của hồ bơi và khu sân. Điều này giúp gia đình tránh tình trạng ảnh quảng cáo quá cũ hoặc tiện nghi không còn giống mô tả.",
        ],
    },
    {
        id: "blog-03",
        slug: "khung-gio-dep-ngam-bien-chup-anh-vung-tau",
        title: "Những khung giờ đẹp để ngắm biển và chụp ảnh ở Vũng Tàu",
        category: "Khám phá địa phương",
        readTime: "3 phút đọc",
        location: "Bãi Sau, Vũng Tàu",
        excerpt:
            "Từ Bãi Sau đến đường Hạ Long, đây là các khoảng thời gian dễ có ánh sáng đẹp và lịch trình di chuyển nhẹ nhàng.",
        coverImage: villaSunsetImage,
        publishedAt: "2026-04-18",
        content: [
            "Buổi sáng từ 5h30 đến 7h00 là thời điểm phù hợp để tắm biển, đi dạo và chụp ảnh với ánh sáng mềm. Bãi Sau thường đông hơn sau 7h30, vì vậy nhóm đông nên xuất phát sớm nếu muốn có khung hình thoáng.",
            "Cuối buổi chiều từ 16h30 đến 17h45 là khoảng thời gian dễ chụp ảnh đẹp ở cung đường Hạ Long, mũi Nghinh Phong hoặc các quán cà phê hướng biển. Lúc này nắng dịu hơn, màu trời cũng dễ lên ảnh hơn.",
            "Nếu villa gần biển, bạn có thể chia lịch thành hai lần ra biển thay vì dồn vào một buổi. Cách này giúp trẻ nhỏ và người lớn tuổi đỡ mệt, đồng thời vẫn có đủ thời gian tận hưởng hồ bơi hoặc BBQ tại villa.",
        ],
    },
    {
        id: "blog-04",
        slug: "checklist-dat-villa-cho-nhom-dong",
        title: "Checklist đặt villa cho nhóm đông: giá, phòng ngủ và tiện nghi",
        category: "Mẹo lưu trú",
        readTime: "6 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Một danh sách nhanh giúp bạn so sánh sức chứa, phụ thu, bếp, BBQ và chính sách hủy trước khi chốt nơi ở.",
        coverImage: villaGroupImage,
        publishedAt: "2026-04-12",
        content: [
            "Nhóm đông nên bắt đầu bằng số khách thật, số người ngủ lại và số xe di chuyển. Từ đó bạn mới kiểm tra được villa có đủ phòng ngủ, nệm phụ, nhà vệ sinh và chỗ đậu xe hay không.",
            "Khi so sánh giá, đừng chỉ nhìn giá thuê một đêm. Hãy hỏi rõ phụ thu cuối tuần, phụ thu khách vượt chuẩn, phí dọn dẹp, phí sử dụng karaoke hoặc thời gian dùng hồ bơi để tránh phát sinh ngoài dự kiến.",
            "Một checklist tốt cần có ảnh phòng ngủ, bếp, khu BBQ, hồ bơi, nội quy tiếng ồn và chính sách hủy. Nhóm nên thống nhất các khoản này bằng tin nhắn trước khi đặt cọc để dễ đối chiếu khi nhận phòng.",
        ],
    },
    {
        id: "blog-05",
        slug: "kinh-nghiem-dat-villa-vung-tau-lan-dau",
        title: "Kinh nghiệm đặt villa Vũng Tàu lần đầu: hỏi gì trước khi cọc?",
        category: "Kinh nghiệm đặt phòng",
        readTime: "5 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Các câu hỏi quan trọng về vị trí, sức chứa, giờ nhận phòng, tiện nghi và cách xác minh thông tin villa trước khi đặt.",
        coverImage: villaTranPhuImage,
        publishedAt: "2026-04-05",
        content: [
            "Nếu lần đầu đặt villa ở Vũng Tàu, bạn nên hỏi địa chỉ tương đối, khu vực gần biển nào và thời gian di chuyển đến Bãi Sau hoặc trung tâm ăn uống. Vị trí rõ ràng giúp nhóm tính lịch trình thực tế hơn.",
            "Tiếp theo là sức chứa tiêu chuẩn và tối đa. Một số villa có thể nhận thêm khách nhưng cần phụ thu hoặc nệm phụ, vì vậy hãy xác nhận bằng văn bản thay vì chỉ trao đổi miệng.",
            "Trước khi đặt cọc, hãy kiểm tra ảnh mới, thông tin người nhận cọc, chính sách hủy và quy định nhận phòng. Nếu có điểm nào chưa rõ, nên hỏi ngay để tránh hiểu nhầm khi đến nơi.",
        ],
    },
    {
        id: "blog-06",
        slug: "chon-villa-gan-bien-bai-sau",
        title: "Chọn villa gần biển: nên ở gần Bãi Sau hay khu trung tâm?",
        category: "Villa gần biển",
        readTime: "4 phút đọc",
        location: "Bãi Sau, Vũng Tàu",
        excerpt:
            "So sánh ưu điểm của villa gần Bãi Sau, khu trung tâm và các tuyến đường ven biển để chọn đúng nhu cầu chuyến đi.",
        coverImage: villaBaiSauImage,
        publishedAt: "2026-03-30",
        content: [
            "Villa gần Bãi Sau phù hợp với gia đình hoặc nhóm muốn tắm biển nhiều lần trong ngày. Bạn có thể đi bộ hoặc di chuyển rất ngắn, đặc biệt tiện khi có trẻ nhỏ, người lớn tuổi hoặc cần về villa nghỉ giữa buổi.",
            "Khu trung tâm lại hợp với nhóm ưu tiên ăn uống, cà phê và di chuyển linh hoạt. Khoảng cách ra biển có thể xa hơn một chút nhưng bù lại dễ gọi xe, mua đồ và sắp lịch ăn chơi buổi tối.",
            "Khi chọn villa gần biển, hãy hỏi rõ khoảng cách đi bộ thực tế, lối ra biển gần nhất và tình trạng đậu xe. Một số nơi ghi gần biển nhưng đường đi vòng hoặc phải băng qua tuyến đông xe.",
        ],
    },
    {
        id: "blog-07",
        slug: "kinh-nghiem-di-bai-sau-vung-tau",
        title: "Kinh nghiệm đi Bãi Sau Vũng Tàu cho gia đình và nhóm bạn",
        category: "Khám phá địa phương",
        readTime: "4 phút đọc",
        location: "Bãi Sau, Vũng Tàu",
        excerpt:
            "Thời điểm nên đi Bãi Sau, cách chuẩn bị đồ dùng và mẹo sắp lịch tắm biển để không ảnh hưởng giờ nhận phòng.",
        coverImage: villaBaiSauImage,
        publishedAt: "2026-03-24",
        content: [
            "Bãi Sau thường hợp để tắm biển vào sáng sớm hoặc cuối chiều. Nếu đi cuối tuần, nhóm nên ra biển sớm hơn dự kiến vì khu vực gửi xe, tắm nước ngọt và ăn sáng có thể đông.",
            "Bạn nên chuẩn bị khăn riêng, túi chống nước, dép dễ rửa và một bộ đồ khô để thay nhanh. Với trẻ nhỏ, đừng quên kem chống nắng, mũ và nước uống vì nắng biển có thể làm trẻ mất sức nhanh.",
            "Nếu lịch nhận phòng là 14h, nhóm có thể ăn trưa trước, gửi đồ ở xe rồi nhận phòng sau. Không nên tắm biển sát giờ check-in nếu villa chưa sẵn sàng phòng tắm hoặc nơi thay đồ.",
        ],
    },
    {
        id: "blog-08",
        slug: "to-chuc-bbq-tai-villa-vung-tau",
        title: "Kinh nghiệm BBQ tại villa Vũng Tàu: chuẩn bị gì để gọn và vui?",
        category: "Mẹo lưu trú",
        readTime: "5 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Danh sách đồ cần chuẩn bị, cách hỏi host về bếp nướng, than, dụng cụ và quy định dọn dẹp sau bữa BBQ.",
        coverImage: villaBbqImage,
        publishedAt: "2026-03-18",
        content: [
            "BBQ tại villa vui nhất khi nhóm chuẩn bị vừa đủ và phân công rõ người mua đồ, sơ chế, nướng và dọn dẹp. Bạn nên hỏi host villa có sẵn bếp nướng, vỉ, than, kẹp gắp và bàn ngoài trời hay không.",
            "Thực đơn nên ưu tiên món dễ nướng như hải sản, thịt ướp sẵn, rau củ và đồ ăn nhẹ. Nếu nhóm có trẻ nhỏ, hãy chuẩn bị thêm món không cay và đồ ăn có thể dùng ngay khi chờ nướng.",
            "Sau bữa BBQ, nhóm cần gom rác, tắt than đúng cách và trả lại dụng cụ theo hướng dẫn của host. Việc này giúp tránh phí dọn dẹp phát sinh và giữ trải nghiệm tốt cho cả nhóm.",
        ],
    },
    {
        id: "blog-09",
        slug: "checklist-truoc-khi-dat-villa",
        title: "Checklist trước khi đặt villa: 12 điểm nên kiểm tra kỹ",
        category: "Checklist đặt phòng",
        readTime: "6 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Từ ảnh thật, số phòng ngủ, số khách tối đa đến nội quy tiếng ồn và chính sách cọc, đây là checklist nên dùng trước khi đặt.",
        coverImage: villaChecklistImage,
        publishedAt: "2026-03-12",
        content: [
            "Trước khi đặt villa, hãy kiểm tra ảnh tổng thể, phòng ngủ, nhà vệ sinh, bếp, hồ bơi và khu sinh hoạt chung. Ảnh càng rõ thì bạn càng dễ đánh giá villa có phù hợp với nhóm hay không.",
            "Các thông tin bắt buộc cần xác nhận gồm giá thuê, số khách tiêu chuẩn, số khách tối đa, phụ thu, giờ nhận phòng, giờ trả phòng và số tiền cọc. Nếu đi với trẻ nhỏ hoặc người lớn tuổi, hãy hỏi thêm cầu thang và phòng tầng trệt.",
            "Cuối cùng, đừng bỏ qua nội quy tiếng ồn, thời gian dùng karaoke, quy định BBQ và chính sách hủy. Đây là những điểm thường gây tranh cãi nếu hai bên không thống nhất từ đầu.",
        ],
    },
    {
        id: "blog-10",
        slug: "chon-villa-theo-ngan-sach",
        title: "Cách chọn villa theo ngân sách mà vẫn đủ tiện nghi",
        category: "Kinh nghiệm đặt phòng",
        readTime: "4 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Cách chia ngân sách theo đầu người, chọn khu vực hợp lý và ưu tiên tiện nghi quan trọng thay vì chỉ tìm giá thấp.",
        coverImage: villaBudgetImage,
        publishedAt: "2026-03-06",
        content: [
            "Cách dễ nhất để chọn villa theo ngân sách là tính chi phí trên mỗi người, sau đó cộng thêm phần dự phòng cho ăn uống, di chuyển và phụ thu. Con số này thực tế hơn nhiều so với việc chỉ nhìn tổng giá thuê.",
            "Nếu ngân sách vừa phải, nhóm nên ưu tiên villa sạch, đủ phòng ngủ và có bếp tốt trước khi chọn thêm tiện nghi cao cấp. Hồ bơi riêng, karaoke hoặc bàn bida rất đáng cân nhắc nhưng không nên làm vượt ngân sách chung.",
            "Bạn cũng có thể linh hoạt ngày đi. Giá trong tuần thường dễ chịu hơn cuối tuần, còn đặt sớm trong mùa cao điểm giúp nhóm có nhiều lựa chọn hơn với cùng mức tiền.",
        ],
    },
    {
        id: "blog-11",
        slug: "loi-thuong-gap-khi-dat-villa",
        title: "Những lỗi thường gặp khi đặt villa và cách tránh",
        category: "Lưu ý khi đặt",
        readTime: "5 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Đặt quá sát ngày, không hỏi phụ thu, bỏ qua nội quy và chỉ xem ảnh cũ là những lỗi dễ làm chuyến đi kém vui.",
        coverImage: villaTranPhuImage,
        publishedAt: "2026-02-28",
        content: [
            "Lỗi phổ biến nhất là đặt quá sát ngày, đặc biệt vào cuối tuần hoặc dịp lễ. Khi đó lựa chọn ít hơn, giá cao hơn và nhóm dễ phải chấp nhận villa không thật sự phù hợp.",
            "Lỗi thứ hai là không hỏi kỹ phụ thu. Số khách vượt chuẩn, giờ nhận phòng sớm, trả phòng muộn, karaoke hoặc dọn dẹp sau BBQ đều có thể phát sinh chi phí nếu villa có quy định riêng.",
            "Lỗi cuối cùng là chỉ xem ảnh mà không kiểm tra thông tin mới. Bạn nên yêu cầu ảnh hoặc video gần thời điểm đặt, hỏi tình trạng hồ bơi và xác nhận lại tiện nghi quan trọng trước khi cọc.",
        ],
    },
    {
        id: "blog-12",
        slug: "di-vung-tau-cung-gia-dinh",
        title: "Đi Vũng Tàu cùng gia đình: chọn villa sao cho nhàn?",
        category: "Du lịch gia đình",
        readTime: "5 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Ưu tiên vị trí dễ đi, phòng ngủ tiện cho trẻ nhỏ và người lớn tuổi, cùng các tiện nghi giúp cả nhà nghỉ dưỡng thoải mái.",
        coverImage: villaFamilyImage,
        publishedAt: "2026-02-20",
        content: [
            "Chuyến đi gia đình nên đặt sự thuận tiện lên đầu. Villa không nhất thiết phải quá lớn, nhưng cần sạch, dễ di chuyển, có khu sinh hoạt chung và phòng ngủ phù hợp cho nhiều độ tuổi.",
            "Nếu có trẻ nhỏ, hãy chọn villa có bếp để chuẩn bị bữa ăn đơn giản. Nếu có ông bà, hãy ưu tiên phòng tầng thấp, nhà vệ sinh an toàn và khoảng cách không quá xa các điểm ăn uống.",
            "Lịch trình gia đình nên nhẹ hơn nhóm bạn. Thay vì đi nhiều điểm trong ngày, hãy dành thời gian cho hồ bơi, ăn chung và nghỉ ngơi tại villa để mọi người đều thấy thoải mái.",
        ],
    },
    {
        id: "blog-13",
        slug: "di-vung-tau-cung-nhom-ban",
        title: "Đi Vũng Tàu cùng nhóm bạn: chọn villa để vui nhưng không rối",
        category: "Du lịch nhóm",
        readTime: "4 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Cách chọn villa có không gian chung, chia phòng hợp lý và thống nhất ngân sách để nhóm bạn tận hưởng kỳ nghỉ trọn vẹn.",
        coverImage: villaGroupImage,
        publishedAt: "2026-02-14",
        content: [
            "Nhóm bạn thường cần không gian chung rộng hơn số phòng ngủ thật nhiều. Phòng khách, sân, hồ bơi, khu BBQ hoặc phòng karaoke sẽ quyết định phần lớn trải nghiệm của cả nhóm.",
            "Trước khi đặt, nhóm nên chốt số người chắc chắn đi, người có thể phát sinh và cách chia chi phí. Việc này giúp người đại diện đặt phòng tránh phải xử lý quá nhiều thay đổi sát ngày.",
            "Một villa phù hợp cho nhóm bạn cũng cần nội quy rõ ràng về âm thanh và giờ sinh hoạt. Tôn trọng quy định khu dân cư sẽ giúp chuyến đi vui nhưng không gặp rắc rối khi lưu trú.",
        ],
    },
    {
        id: "blog-14",
        slug: "cach-kiem-tra-tien-nghi-villa",
        title: "Cách kiểm tra tiện nghi villa trước khi nhận phòng",
        category: "Checklist đặt phòng",
        readTime: "5 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Những tiện nghi cần kiểm tra khi vừa đến villa: điều hòa, nước nóng, bếp, hồ bơi, karaoke, wifi và thiết bị an toàn.",
        coverImage: villaChecklistImage,
        publishedAt: "2026-02-08",
        content: [
            "Khi nhận phòng, bạn nên đi một vòng cùng host hoặc người bàn giao để kiểm tra điều hòa, nước nóng, wifi, bếp, tủ lạnh và thiết bị giải trí. Nếu có lỗi, hãy báo ngay trong lúc bàn giao.",
            "Với hồ bơi, cần quan sát độ sạch, đèn hồ nếu dùng buổi tối và khu vực xung quanh có trơn hay không. Nếu đi với trẻ nhỏ, hãy thống nhất khu vực người lớn cần giám sát.",
            "Bạn nên chụp lại hiện trạng các khu vực chính khi nhận phòng. Đây không phải để gây khó cho host, mà để hai bên có cơ sở rõ ràng nếu phát sinh hư hỏng hoặc thiếu đồ.",
        ],
    },
    {
        id: "blog-15",
        slug: "chon-villa-co-karaoke-bida-ho-boi",
        title: "Kinh nghiệm chọn villa có karaoke, bida và hồ bơi",
        category: "Tiện nghi villa",
        readTime: "4 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Mẹo chọn villa nhiều tiện ích giải trí nhưng vẫn phù hợp lịch trình, số khách và quy định âm thanh tại khu vực lưu trú.",
        coverImage: villaPoolImage,
        publishedAt: "2026-02-02",
        content: [
            "Villa có karaoke, bida và hồ bơi rất hợp cho nhóm đông vì mọi người có thể giải trí ngay tại nơi ở. Tuy vậy, bạn nên hỏi rõ từng tiện nghi có hoạt động ổn định không và có giới hạn thời gian sử dụng không.",
            "Karaoke thường liên quan đến quy định tiếng ồn, đặc biệt sau 22h. Nhóm nên nắm rõ quy định này từ đầu để sắp lịch hát, BBQ và nghỉ ngơi hợp lý.",
            "Bàn bida, hồ bơi và các thiết bị giải trí cũng cần được kiểm tra khi nhận phòng. Nếu phát hiện hư hỏng sẵn, hãy báo ngay để tránh bị hiểu nhầm là lỗi của nhóm.",
        ],
    },
    {
        id: "blog-16",
        slug: "dat-villa-cuoi-tuan-le-tet",
        title: "Kinh nghiệm đặt villa cuối tuần, lễ Tết không bị động",
        category: "Mùa cao điểm",
        readTime: "5 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Cách đặt sớm, chốt số khách, kiểm tra chính sách cọc và chuẩn bị phương án di chuyển trong các dịp cao điểm.",
        coverImage: villaBeachImage,
        publishedAt: "2026-01-26",
        content: [
            "Cuối tuần, lễ Tết và kỳ nghỉ dài là thời điểm villa đẹp ở Vũng Tàu được giữ chỗ rất nhanh. Nếu nhóm đã chốt ngày, nên tìm và đặt sớm để có nhiều lựa chọn về vị trí, sức chứa và ngân sách.",
            "Trong mùa cao điểm, chính sách cọc và hủy thường chặt hơn ngày thường. Bạn cần đọc kỹ điều kiện đổi ngày, hoàn cọc và số tiền cần thanh toán trước khi xác nhận.",
            "Nhóm cũng nên chuẩn bị kế hoạch di chuyển sớm hơn bình thường. Kẹt xe có thể ảnh hưởng giờ nhận phòng, mua đồ BBQ và lịch đi biển, vì vậy hãy để lịch trình có khoảng đệm.",
        ],
    },
    {
        id: "blog-17",
        slug: "goi-y-khu-vuc-nen-o-tai-vung-tau",
        title: "Gợi ý khu vực nên ở tại Vũng Tàu theo từng kiểu chuyến đi",
        category: "Khu vực lưu trú",
        readTime: "5 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Bãi Sau, trung tâm, Trần Phú và các khu yên tĩnh sẽ phù hợp với những nhu cầu lưu trú khác nhau.",
        coverImage: villaTranPhuImage,
        publishedAt: "2026-01-20",
        content: [
            "Nếu mục tiêu chính là tắm biển, khu Bãi Sau thường là lựa chọn dễ chịu vì gần bãi tắm, nhiều hàng quán và thuận tiện cho gia đình. Đây cũng là khu phù hợp với nhóm đi lần đầu.",
            "Nếu nhóm thích ăn uống, cà phê và di chuyển nhiều điểm, khu trung tâm sẽ linh hoạt hơn. Bạn có thể đi biển bằng xe trong thời gian ngắn nhưng vẫn dễ mua đồ và tìm dịch vụ xung quanh.",
            "Các khu yên tĩnh hơn phù hợp với gia đình muốn nghỉ dưỡng hoặc nhóm cần không gian riêng. Khi chọn những khu này, hãy kiểm tra kỹ khoảng cách đến chợ, siêu thị và các điểm ăn uống.",
        ],
    },
    {
        id: "blog-18",
        slug: "kinh-nghiem-nhan-phong-tra-phong",
        title: "Kinh nghiệm nhận phòng và trả phòng villa suôn sẻ",
        category: "Mẹo lưu trú",
        readTime: "4 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Các bước nên làm khi check-in, kiểm tra hiện trạng, giữ liên lạc với host và bàn giao lại villa đúng quy định.",
        coverImage: villaBudgetImage,
        publishedAt: "2026-01-14",
        content: [
            "Trước giờ nhận phòng, bạn nên báo host thời gian dự kiến đến để việc bàn giao chủ động hơn. Nếu nhóm đến sớm, hãy hỏi trước có thể gửi đồ hoặc nhận phòng sớm không.",
            "Khi vào villa, hãy kiểm tra nhanh số phòng, chìa khóa, thiết bị điện, nước nóng, hồ bơi và khu bếp. Những vấn đề phát hiện sớm thường được xử lý nhanh và ít ảnh hưởng đến trải nghiệm.",
            "Trước khi trả phòng, nhóm nên gom rác, kiểm tra đồ cá nhân, tắt thiết bị điện và bàn giao lại chìa khóa. Nếu cần trả phòng muộn, hãy hỏi host trước thay vì tự kéo dài thời gian lưu trú.",
        ],
    },
    {
        id: "blog-19",
        slug: "chinh-sach-huy-phong-villa-can-biet",
        title: "Chính sách hủy phòng villa cần biết trước khi đặt cọc",
        category: "Lưu ý khi đặt",
        readTime: "4 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Những điểm cần hỏi về hoàn cọc, đổi ngày, hủy do thời tiết và cách lưu lại thỏa thuận để tránh tranh cãi.",
        coverImage: villaChecklistImage,
        publishedAt: "2026-01-08",
        content: [
            "Chính sách hủy phòng là phần nhiều người bỏ qua vì chỉ tập trung vào giá và ảnh villa. Tuy nhiên, đây lại là thông tin rất quan trọng nếu nhóm có người chưa chắc lịch hoặc đi vào mùa mưa.",
            "Bạn nên hỏi rõ các mốc thời gian được hủy, mức hoàn cọc, điều kiện đổi ngày và trường hợp bất khả kháng. Mỗi villa có thể có chính sách khác nhau, nhất là dịp lễ Tết.",
            "Sau khi thống nhất, hãy lưu lại nội dung trao đổi trong tin nhắn. Một thỏa thuận rõ ràng giúp cả khách và host xử lý dễ hơn nếu kế hoạch thay đổi.",
        ],
    },
    {
        id: "blog-20",
        slug: "cach-chon-villa-an-toan-uy-tin",
        title: "Cách chọn villa an toàn, uy tín tại Vũng Tàu",
        category: "An toàn đặt phòng",
        readTime: "6 phút đọc",
        location: "Vũng Tàu",
        excerpt:
            "Cách kiểm tra thông tin villa, ảnh thật, đánh giá, quy trình đặt cọc và các dấu hiệu nên thận trọng trước khi thanh toán.",
        coverImage: villaBeachImage,
        publishedAt: "2026-01-02",
        content: [
            "Một villa uy tín cần có thông tin rõ ràng về vị trí, hình ảnh, tiện nghi, giá và người phụ trách. Nếu thông tin quá mơ hồ hoặc thay đổi liên tục khi bạn hỏi, hãy thận trọng trước khi đặt cọc.",
            "Bạn nên kiểm tra đánh giá, lịch sử hoạt động hoặc các kênh liên hệ chính thức của đơn vị cho thuê. Khi chuyển cọc, hãy xác nhận đúng người nhận và nội dung chuyển khoản liên quan đến ngày lưu trú.",
            "Dấu hiệu cần tránh gồm giá rẻ bất thường vào ngày cao điểm, yêu cầu chuyển cọc gấp, không cung cấp ảnh mới hoặc né tránh câu hỏi về địa chỉ. Chọn chậm hơn một chút nhưng rõ ràng sẽ an toàn hơn cho cả chuyến đi.",
        ],
    },
];


const blogCoverImageBySlug = blogPosts.reduce<Record<string, string>>((result, post) => {
    result[post.slug] = post.coverImage;
    return result;
}, {});

export const resolveBlogCoverImage = (coverImage: string | null | undefined, slug: string) => {
    const normalizedCoverImage = coverImage?.trim();

    if (normalizedCoverImage && !normalizedCoverImage.startsWith("/src/assets/")) {
        return normalizedCoverImage;
    }

    return blogCoverImageBySlug[slug] ?? normalizedCoverImage ?? featuredBlogPost.coverImage;
};

export const formatBlogDate = (publishedAt: string) => {
    const [year, month, day] = publishedAt.split("-");

    return year && month && day ? `${day}/${month}/${year}` : "";
};
