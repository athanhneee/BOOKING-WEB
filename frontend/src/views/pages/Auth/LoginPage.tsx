import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { LuArrowRight, LuEye, LuEyeOff, LuLock, LuUserRound } from "react-icons/lu";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { APP_ROUTES } from "../../../config/routes";
import {
    loginWithCredentials,
    loginWithGoogleIdToken,
    resolvePostAuthRoute,
} from "../../../services/authService";
import AuthCard from "../../components/auth/AuthCard";
import AuthInput from "../../components/auth/AuthInput";

const primaryButtonClass =
    "inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-[#5d53f7] px-6 py-3 text-base font-semibold text-white shadow-[0_18px_40px_-18px_rgba(93,83,247,0.8)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5d53f7] sm:min-h-15 sm:py-4 sm:text-lg";

const secondaryButtonClass =
    "inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:min-h-15 sm:py-4 sm:text-lg";

const LoginPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const redirectAfterLogin = (user: Parameters<typeof resolvePostAuthRoute>[0]) => {
        const redirectTo = new URLSearchParams(location.search).get("redirectTo");
        navigate(resolvePostAuthRoute(user, redirectTo), { replace: true });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setIsSubmitting(true);
        setError("");

        try {
            const user = await loginWithCredentials({ identifier, password });
            redirectAfterLogin(user);
        } catch (submissionError) {
            setError(submissionError instanceof Error ? submissionError.message : "Không thể đăng nhập lúc này.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSuccess = async (response: CredentialResponse) => {
        setIsSubmitting(true);
        setError("");

        try {
            const idToken = response.credential;

            if (!idToken) {
                throw new Error("Google không trả về thông tin xác thực. Vui lòng thử lại.");
            }

            const user = await loginWithGoogleIdToken(idToken);
            redirectAfterLogin(user);
        } catch (googleError) {
            setError(googleError instanceof Error ? googleError.message : "Không thể đăng nhập với Google.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthCard
            title="Đăng nhập tài khoản"
            description="Đăng nhập tận hưởng tối đa những lợi ích."
        >
            <form className="space-y-5" onSubmit={handleSubmit}>
                <AuthInput
                    label="Email hoặc số điện thoại"
                    type="text"
                    name="identifier"
                    autoComplete="username"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    icon={<LuUserRound />}
                    placeholder="Email hoặc số điện thoại"
                    required
                />

                <div>
                    <AuthInput
                        label="Mật khẩu"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        icon={<LuLock />}
                        placeholder="Nhập mật khẩu"
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

                    <div className="mt-3 text-right">
                        <Link
                            to={APP_ROUTES.forgotPassword}
                            className="text-sm font-semibold text-cyan-500 transition-colors hover:text-[#4b40ef] sm:text-base"
                        >
                            Quên mật khẩu
                        </Link>
                    </div>
                </div>

                {error ? <p className="text-sm font-medium text-rose-500">{error}</p> : null}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`${primaryButtonClass} ${isSubmitting ? "cursor-not-allowed opacity-70 hover:translate-y-0" : ""}`}
                >
                    {isSubmitting ? "Đang đăng nhập" : "Đăng nhập"}
                    <LuArrowRight className="text-xl" />
                </button>
            </form>

            <div className="mt-7 text-center text-base text-slate-700 sm:text-lg">
                Tôi chưa có tài khoản{" "}
                <Link to={APP_ROUTES.register} className="font-semibold text-cyan-500 transition-colors hover:text-[#4b40ef]">
                    Đăng ký
                </Link>
            </div>

            <div className="my-7 flex items-center gap-4 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                HOẶC
                <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="relative w-full">
                {/* Custom styled button visible to user */}
                <button type="button" disabled={isSubmitting} className={`${secondaryButtonClass} pointer-events-none`}>
                    <FcGoogle className="text-[28px]" />
                    Đăng nhập với Google
                </button>

                {/* Invisible GoogleLogin overlay that captures clicks and returns id_token */}
                <div className="absolute inset-0 overflow-hidden rounded-full opacity-[0.01] [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:!w-full">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError("Đăng nhập Google thất bại. Vui lòng thử lại.")}
                        size="large"
                        width="400"
                    />
                </div>
            </div>
        </AuthCard>
    );
};

export default LoginPage;