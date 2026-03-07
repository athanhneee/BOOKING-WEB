import { FaFacebookF, FaTiktok, FaYoutube } from "react-icons/fa";
import { FaThreads } from "react-icons/fa6";
const Footer = () => {
    return (
        <footer className="bg-black text-gray-400 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                {/* Top */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Support */}
                    <div>
                        <h3 className="text-white text-lg font-semibold mb-4">Hỗ trợ</h3>
                        <ul className="space-y-3">
                            <li>Hướng dẫn đặt phòng</li>
                            <li>Chính sách hủy phòng</li>
                            <li>Khiếu nại & Góp ý</li>
                            <li>Câu hỏi thường gặp (FAQ)</li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-white text-lg font-semibold mb-4">Khám phá Vũng Tàu</h3>
                        <ul className="space-y-3">
                            <li>Về chúng tôi</li>
                            <li>Cẩm nang du lịch</li>
                            <li>Dịch vụ đi kèm</li>
                            <li>Ưu đãi thành viên</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white text-lg font-semibold mb-4">Liên hệ</h3>
                        <ul className="space-y-3">
                            <li>Hotline: 0929.399.893</li>
                            <li>Địa chỉ: 28 Thi Sách</li>
                            <li>Email: bookingvillavtdl@gmail.com</li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h3 className="text-white text-lg font-semibold mb-4">Social</h3>

                        <div className="flex space-x-4">

                            <a
                                href="https://www.facebook.com/villavungtauuytin"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black transition duration-300 hover:-translate-y-1 hover:bg-gray-200"
                            >
                                <FaFacebookF />
                            </a>

                            <a
                                href="https://www.threads.com/athanhnee"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black transition duration-300 hover:-translate-y-1 hover:bg-gray-200"
                            >
                                <FaThreads />
                            </a>

                            <a
                                href="https://www.tiktok.com/@minhthanh.villavungtau"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black transition duration-300 hover:-translate-y-1 hover:bg-gray-200"
                            >
                                <FaTiktok />
                            </a>

                            <a
                                href="https://www.youtube.com/@VillaVungTau-MinhThanh"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black transition duration-300 hover:-translate-y-1 hover:bg-gray-200"
                            >
                                <FaYoutube />
                            </a>

                        </div>
                    </div>

                </div>

                {/* Divider --> Khi nao tich hop thanh toan thi them */}
                <div className="border-t border-gray-700 mt-12 pt-6 flex justify-center items-center">

                    <p className="text-sm">© Copyright Villa Vung Tau 2026</p>

                    {/* <div className="flex space-x-4 mt-4 md:mt-0">
                        <img src="/visa.png" className="h-6" />
                        <img src="/mastercard.png" className="h-6" />
                        <img src="/discover.png" className="h-6" />
                        <img src="/paypal.png" className="h-6" />
                    </div> */}

                </div>

            </div>
        </footer>
    );
};

export default Footer;
