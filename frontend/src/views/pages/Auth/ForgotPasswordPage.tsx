import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuArrowLeft, LuLock, LuMail } from "react-icons/lu";
import { APP_ROUTES } from "../../../config/routes";
import AuthCard from "../../components/auth/AuthCard";
import AuthInput from "../../components/auth/AuthInput";

const primaryButtonClass =
    "inline-flex min-h-15 w-full items-center justify-center gap-3 rounded-full bg-[#5d53f7] px-6 py-4 font-sans text-lg font-semibold text-white shadow-[0_18px_40px_-18px_rgba(93,83,247,0.8)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#4b40ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5d53f7]";

const OTP_LENGTH = 6;
const OTP_RESEND_SECONDS = 23;

const createEmptyOtpDigits = () => Array.from({ length: OTP_LENGTH }, () => "");

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("athanhnee@gmail.com");
    const [step, setStep] = useState<"request" | "otp">("request");
    const [otpDigits, setOtpDigits] = useState<string[]>(createEmptyOtpDigits);
    const [resendCountdown, setResendCountdown] = useState(OTP_RESEND_SECONDS);
    const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

    const isOtpStep = step === "otp";
    const isOtpComplete = otpDigits.every((digit) => digit.length === 1);

    useEffect(() => {
        if (!isOtpStep) {
            return;
        }

        otpRefs.current[0]?.focus();
    }, [isOtpStep]);

    useEffect(() => {
        if (!isOtpStep || resendCountdown <= 0) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setResendCountdown((current) => Math.max(0, current - 1));
        }, 1000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [isOtpStep, resendCountdown]);

    const focusOtpField = (index: number) => {
        otpRefs.current[index]?.focus();
    };

    const handleOtpChange = (index: number, value: string) => {
        const normalizedValue = value.replace(/\D/g, "").slice(-1);

        setOtpDigits((current) => {
            const next = [...current];
            next[index] = normalizedValue;
            return next;
        });

        if (normalizedValue && index < OTP_LENGTH - 1) {
            focusOtpField(index + 1);
        }
    };

    const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
            focusOtpField(index - 1);
        }

        if (event.key === "ArrowLeft" && index > 0) {
            focusOtpField(index - 1);
        }

        if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
            focusOtpField(index + 1);
        }
    };

    const handleOtpPaste = (event: ClipboardEvent<HTMLDivElement>) => {
        event.preventDefault();

        const pastedValue = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (!pastedValue) {
            return;
        }

        const nextDigits = createEmptyOtpDigits();
        pastedValue.split("").forEach((digit, index) => {
            nextDigits[index] = digit;
        });

        setOtpDigits(nextDigits);
        focusOtpField(Math.min(pastedValue.length, OTP_LENGTH) - 1);
    };

    const handleResendOtp = () => {
        if (resendCountdown > 0) {
            return;
        }

        setOtpDigits(createEmptyOtpDigits());
        setResendCountdown(OTP_RESEND_SECONDS);
        focusOtpField(0);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStep("otp");
        setOtpDigits(createEmptyOtpDigits());
        setResendCountdown(OTP_RESEND_SECONDS);
    };

    const handleOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    };

    return (
        <AuthCard
            title={isOtpStep ? "Xác thực mã OTP" : "Đặt lại mật khẩu"}
            description={
                isOtpStep
                    ? `Nhập mã OTP gồm 6 chữ số đã được gửi đến ${email} để tiếp tục đặt lại mật khẩu.`
                    : "Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để bạn tạo mật khẩu mới một cách an toàn."
            }
            align={isOtpStep ? "left" : "center"}
        >
            {isOtpStep ? (
                <>
                    <form className="space-y-6 font-sans" onSubmit={handleOtpSubmit}>
                        <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                            {otpDigits.map((digit, index) => (
                                <input
                                    key={`otp-${index}`}
                                    ref={(element) => {
                                        otpRefs.current[index] = element;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={1}
                                    value={digit}
                                    placeholder="0"
                                    onChange={(event) => handleOtpChange(index, event.target.value)}
                                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                                    className="aspect-[0.82] w-full rounded-[28px] border border-slate-200 bg-white text-center font-sans text-4xl font-semibold text-slate-500 outline-none transition-colors placeholder:text-slate-300 focus:border-[#5d53f7] sm:text-5xl"
                                    aria-label={`Mã OTP số ${index + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={!isOtpComplete}
                            className={`${primaryButtonClass} ${
                                isOtpComplete ? "" : "cursor-not-allowed opacity-60 hover:translate-y-0 hover:bg-[#5d53f7]"
                            }`}
                        >
                            Đặt lại mật khẩu
                            <LuLock className="text-xl" />
                        </button>
                    </form>

                    <div className="mt-7 text-center font-sans text-sm text-slate-600 sm:text-base">
                        <span>Bạn chưa nhận được mã? </span>
                        {resendCountdown > 0 ? (
                            <span className="font-medium text-[#5d53f7]">Gửi lại mã OTP sau {resendCountdown}s</span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                className="font-semibold text-[#5d53f7] transition-colors hover:text-[#4b40ef]"
                            >
                                Gửi lại mã OTP
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <form className="space-y-5 font-sans" onSubmit={handleSubmit}>
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

                        <button type="submit" className={primaryButtonClass}>
                            Gửi liên kết đặt lại
                            <LuLock className="text-xl" />
                        </button>
                    </form>

                    <div className="mt-7 text-center">
                        <Link
                            to={APP_ROUTES.login}
                            className="inline-flex items-center gap-2 font-sans text-base font-semibold text-[#5d53f7] transition-colors hover:text-[#4b40ef]"
                        >
                            <LuArrowLeft />
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </>
            )}
        </AuthCard>
    );
};

export default ForgotPasswordPage;
