import { LuChevronRight, LuPlaneTakeoff, LuUserRound } from "react-icons/lu";
import { cn } from "../../../../utils";

export type AccountTab = "profile" | "trips";

type ProfileSidebarProps = {
    activeTab: AccountTab;
    onTabChange: (tab: AccountTab) => void;
};

const sidebarItems: Array<{
    key: AccountTab;
    label: string;
    icon: typeof LuUserRound;
}> = [
        { key: "profile", label: "Giới thiệu bản thân", icon: LuUserRound },
        { key: "trips", label: "Chuyến đi trước đây", icon: LuPlaneTakeoff },
    ];

const ProfileSidebar = ({ activeTab, onTabChange }: ProfileSidebarProps) => {
    return (
        <>
            <div className="overflow-x-auto pb-1 lg:hidden">
                <div className="flex min-w-max gap-3">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.key;

                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => onTabChange(item.key)}
                                className={cn(
                                    "flex min-h-11 items-center gap-2.5 rounded-3xl border px-4 py-3 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-800 shadow-sm"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                                )}
                            >
                                <Icon size={16} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <aside className="hidden lg:block">
                <div className="sticky top-28 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-4 px-3 pt-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tài khoản</p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Hồ sơ</h2>
                    </div>

                    <nav className="space-y-2">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.key;

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => onTabChange(item.key)}
                                    className={cn(
                                        "flex w-full items-center gap-3 rounded-3xl border-l-4 px-4 py-3.5 text-left transition-all duration-200",
                                        isActive
                                            ? "border-l-cyan-600 bg-cyan-300/10 text-cyan-800"
                                            : "border-l-transparent text-slate-600 hover:bg-slate-50",
                                    )}
                                >
                                    <Icon size={16} className={isActive ? "text-cyan-600" : "text-slate-400"} />
                                    <span className="flex-1 text-[15px] font-medium">{item.label}</span>
                                    <LuChevronRight size={16} className={isActive ? "text-cyan-500" : "text-slate-300"} />
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>
        </>
    );
};

export default ProfileSidebar;