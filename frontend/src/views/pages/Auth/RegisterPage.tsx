import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { LuArrowRight, LuEye, LuEyeOff, LuLock, LuMail, LuPhone, LuUserRound } from "react-icons/lu";
import { APP_ROUTES } from "../../../config/routes";
import { registerAccount, resolvePostAuthRoute } from "../../../services/authService";
import AuthCard from "../../components/auth/AuthCard";
import AuthInput from "../../components/auth/AuthInput";

const primaryButtonClass =
    "inline-flex min-h-15 w-full items-center justify-center gap-3 rounded-full bg-[#5d53f7] px-6 py-4 text-lg font-semibold text-white shadow-[0_18px_40px_-18px_rgba(93,83,247,0.8)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#4b40ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5d53f7]";

const secondaryButtonClass =
    "inline-flex min-h-15 w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-4 text-lg font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50";

const getPasswordStrength = (password: string) => {
    let score = 0;

    if (password.length >= 8) {
        score += 1;
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
        score += 1;
    }

    if (/\d/.test(password)) {
        score += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
    }

    if (score <= 1) {
        return { score, label: "Yếu", color: "bg-rose-400" };
    }

    if (score === 2) {
        return { score, label: "Trung bình", color: "bg-amber-400" };
    }

    if (score === 3) {
        return { score, label: "Khá", color: "bg-emerald-400" };
    }

    return { score, label: "Mạnh", color: "bg-emerald-500" };
};

const RegisterPage = () => {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("Đặng Minh Thành");
    const [phoneNumber, setPhoneNumber] = useState("0929399893");
    const [email, setEmail] = useState("athanhnee@gmail.com");
    const [password, setPassword] = useState("123456");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setIsSubmitting(true);
        setError("");

        try {
            const user = registerAccount({ fullName, phoneNumber, email, password });
            navigate(resolvePostAuthRoute(user), { replace: true });
        } catch (submissionError) {
            setError(submissionError instanceof Error ? submissionError.message : "Không thể tạo tài khoản lúc này.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthCard title="Đăng ký tài khoản" description="Tạo tài khoản để bắt đầu đặt chỗ, theo dõi chuyến đi và lưu lại các nơi ở bạn yêu thích.">
            <form className="space-y-5" onSubmit={handleSubmit}>
                <AuthInput
                    label="Họ và tên"
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    icon={<LuUserRound />}
                    placeholder="Nhập họ và tên"
                    required
                />

                <AuthInput
                    label="Số điện thoại"
                    type="tel"
                    name="phoneNumber"
                    autoComplete="tel"
                    inputMode="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    icon={<LuPhone />}
                    placeholder="Nhập số điện thoại của bạn"
                    required
                />

                <AuthInput
                    label="Email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    icon={<LuMail />}
                    placeholder="Nhập email của bạn"
                    required
                />

                <div>
                    <AuthInput
                        label="Mật khẩu"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        icon={<LuLock />}
                        placeholder="Tạo mật khẩu"
                        required
                        endAdornment={
                            <button
                                type="button"
                                onClick={() => setShowPassword((current) => !current)}
                                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                className="cursor-pointer text-[22px] text-slate-400 transition-colors hover:text-slate-600"
                            >
                                {showPassword ? <LuEyeOff /> : <LuEye />}
                            </button>
                        }
                    />

                    <div className="mt-4 space-y-2">
                        <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: 4 }, (_, index) => (
                                <span
                                    key={index}
                                    className={`h-1.5 rounded-full ${index < passwordStrength.score ? passwordStrength.color : "bg-slate-200"}`}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-slate-500">
                            Độ mạnh mật khẩu: <span className="font-semibold text-slate-700">{passwordStrength.label}</span>
                        </p>
                    </div>
                </div>

                {error ? <p className="text-sm font-medium text-rose-500">{error}</p> : null}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`${primaryButtonClass} ${isSubmitting ? "cursor-not-allowed opacity-70 hover:translate-y-0" : ""}`}
                >
                    {isSubmitting ? "Đang tạo tài khoản" : "Đăng ký"}
                    <LuArrowRight className="text-xl" />
                </button>
            </form>

            <div className="mt-7 text-center text-base text-slate-700 sm:text-lg">
                Bạn đã có tài khoản{" "}
                <Link to={APP_ROUTES.login} className="font-semibold text-[#5d53f7] transition-colors hover:text-[#4b40ef]">
                    Đăng nhập
                </Link>
            </div>

            <div className="my-7 flex items-center gap-4 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                HOẶC
                <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button type="button" className={secondaryButtonClass}>
                <FcGoogle className="text-[28px]" />
                Đăng nhập với Google
            </button>
        </AuthCard>
    );
};

export default RegisterPage;
