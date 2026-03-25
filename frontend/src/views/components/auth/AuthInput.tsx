import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

type AuthInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
    label: string;
    icon: ReactNode;
    endAdornment?: ReactNode;
    helperText?: string;
    error?: string;
    wrapperClassName?: string;
    inputClassName?: string;
};

const buildClassName = (...parts: Array<string | undefined>) => {
    return parts.filter(Boolean).join(" ");
};

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
    ({ label, icon, endAdornment, helperText, error, wrapperClassName, inputClassName, className, ...props }, ref) => {
        return (
            <label className={buildClassName("block font-sans", className)}>
                <span className="mb-3 block text-left text-sm font-medium text-slate-800 sm:text-base">{label}</span>

                <span
                    className={buildClassName(
                        "flex min-h-15 items-center rounded-xl border bg-white px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-colors",
                        error ? "border-rose-300 focus-within:border-rose-400" : "border-slate-200 focus-within:border-[#5d53f7]",
                        wrapperClassName,
                    )}
                >
                    <span className="mr-4 shrink-0 text-[22px] text-slate-500">{icon}</span>
                    <input
                        ref={ref}
                        {...props}
                        className={buildClassName(
                            "h-full w-full border-0 bg-transparent font-sans text-base text-slate-700 outline-none placeholder:text-slate-400 sm:text-lg",
                            inputClassName,
                        )}
                    />
                    {endAdornment ? <span className="ml-4 shrink-0 text-slate-400">{endAdornment}</span> : null}
                </span>

                {error ? <span className="mt-2 block text-sm text-rose-500">{error}</span> : null}
                {!error && helperText ? <span className="mt-2 block text-sm text-slate-500">{helperText}</span> : null}
            </label>
        );
    },
);

AuthInput.displayName = "AuthInput";

export default AuthInput;
