import type { ReactNode } from "react";
import logo from "../../../assets/img/logo_mau.svg";

type AuthCardProps = {
    title: string;
    description: string;
    children: ReactNode;
    align?: "center" | "left";
};

const AuthCard = ({ title, description, children, align = "center" }: AuthCardProps) => {
    const headerClassName = align === "left" ? "items-start text-left" : "items-center text-center";
    const titleClassName = align === "left" ? "max-w-lg" : undefined;
    const descriptionClassName = align === "left" ? "max-w-lg" : "max-w-md";

    return (
        <section className="font-sans rounded-2xl border border-white/70 bg-white/88 px-6 py-8 shadow-[0_36px_120px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:px-10 sm:py-10">
            <div className={`flex flex-col ${headerClassName}`}>
                <img src={logo} alt="Minh Thanh Villa" className="h-16 w-auto sm:h-20" />
                <h1 className={`mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl ${titleClassName ?? ""}`}>
                    {title}
                </h1>
                <p className={`mt-3 text-base leading-7 text-slate-500 sm:text-lg ${descriptionClassName}`}>{description}</p>
            </div>

            <div className="mt-8 sm:mt-10">{children}</div>
        </section>
    );
};

export default AuthCard;
