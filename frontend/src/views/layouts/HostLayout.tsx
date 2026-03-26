import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/host/Sidebar";
import Topbar from "../components/common/host/Topbar";
import { OWNER_SIDEBAR_ITEMS } from "../components/common/host/constants";

const HostLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
            <div className="flex min-h-screen">
                <Sidebar
                    items={OWNER_SIDEBAR_ITEMS}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <div className="flex min-w-0 flex-1 flex-col">
                    <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
                    <main className="min-w-0 flex-1">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default HostLayout;
