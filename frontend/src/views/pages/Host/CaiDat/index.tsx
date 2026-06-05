import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "../shared";
import {
    getInitials,
    hostCardClass,
    inputClassName,
    labelClassName,
    pageWrapperClass,
    primaryButtonClass,
    secondaryButtonClass,
} from "../sharedStyles";
import type { ApiUser } from "../../../../models/entities/User";
import { getMe, updateMe, updateMyAvatar } from "../../../../services/userService";
import { uploadFileToR2 } from "../../../../services/api/uploadsApi";
import {
    getHostBankAccount,
    getVietnamBanks,
    saveHostBankAccount,
    type VietnamBank,
} from "../../../../services/hostService";

type SettingsTab = "profile" | "bank";

type BankForm = {
    bankCode: string;
    bankName: string;
    bankShortName: string;
    bankBin: string;
    accountNumber: string;
    accountHolderName: string;
    branchName: string;
};

const tabs: Array<{ value: SettingsTab; label: string }> = [
    { value: "profile", label: "Hồ sơ" },
    { value: "bank", label: "Tài khoản ngân hàng" },
];

const emptyBankForm: BankForm = {
    bankCode: "",
    bankName: "",
    bankShortName: "",
    bankBin: "",
    accountNumber: "",
    accountHolderName: "",
    branchName: "",
};

const normalizeSearchText = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const formatBankLabel = (bank: Pick<VietnamBank, "code" | "name" | "shortName" | "bin">) =>
    `${bank.shortName || bank.code} - ${bank.name}${bank.bin ? ` (${bank.bin})` : ""}`;

const CaiDat = () => {
    const [tab, setTab] = useState<SettingsTab>("profile");
    const [profile, setProfile] = useState<ApiUser | null>(null);
    const [profileForm, setProfileForm] = useState({
        fullName: "",
        email: "",
        phone: "",
    });
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement | null>(null);

    const [banks, setBanks] = useState<VietnamBank[]>([]);
    const [bankForm, setBankForm] = useState<BankForm>(emptyBankForm);
    const [bankSearch, setBankSearch] = useState("");
    const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
    const [bankError, setBankError] = useState("");
    const [bankMessage, setBankMessage] = useState("");
    const [loadingBankData, setLoadingBankData] = useState(false);
    const [savingBank, setSavingBank] = useState(false);
    const bankPickerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let ignore = false;

        const loadProfile = async () => {
            try {
                const result = await getMe();
                if (ignore) return;

                setProfile(result.user);
                setProfileForm({
                    fullName: result.user.fullName ?? result.user.name ?? "",
                    email: result.user.email ?? "",
                    phone: result.user.phone ?? "",
                });
            } catch (error) {
                if (!ignore) {
                    setProfileError(error instanceof Error ? error.message : "Không thể tải hồ sơ host.");
                }
            }
        };

        void loadProfile();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        let ignore = false;

        const loadBankData = async () => {
            setLoadingBankData(true);
            setBankError("");

            try {
                const [bankResult, account] = await Promise.all([
                    getVietnamBanks(),
                    getHostBankAccount(),
                ]);

                if (ignore) return;

                setBanks(bankResult.items ?? []);

                if (account) {
                    const nextForm = {
                        bankCode: account.bankCode ?? "",
                        bankName: account.bankName ?? "",
                        bankShortName: account.bankShortName ?? "",
                        bankBin: account.bankBin ?? "",
                        accountNumber: account.accountNumber ?? "",
                        accountHolderName: account.accountHolderName ?? "",
                        branchName: account.branchName ?? "",
                    };

                    setBankForm(nextForm);
                    setBankSearch(
                        `${nextForm.bankShortName || nextForm.bankCode} - ${nextForm.bankName}${nextForm.bankBin ? ` (${nextForm.bankBin})` : ""}`,
                    );
                }
            } catch (error) {
                if (!ignore) {
                    setBankError(error instanceof Error ? error.message : "Không thể tải thông tin tài khoản ngân hàng.");
                }
            } finally {
                if (!ignore) {
                    setLoadingBankData(false);
                }
            }
        };

        void loadBankData();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        const handleMouseDown = (event: MouseEvent) => {
            if (!bankPickerRef.current?.contains(event.target as Node)) {
                setBankDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleMouseDown);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, []);

    const selectedBank = useMemo(
        () => banks.find((bank) => bank.code === bankForm.bankCode) ?? null,
        [banks, bankForm.bankCode],
    );

    const filteredBanks = useMemo(() => {
        const query = normalizeSearchText(bankSearch);

        if (!query) {
            return banks;
        }

        return banks.filter((bank) =>
            normalizeSearchText(`${bank.code} ${bank.shortName} ${bank.name} ${bank.bin ?? ""}`).includes(query),
        );
    }, [banks, bankSearch]);

    const handleAvatarChange = async (file: File | undefined) => {
        if (!file) return;

        setProfileError("");
        setProfileMessage("");
        setUploadingAvatar(true);

        try {
            const uploaded = await uploadFileToR2(file, {
                folder: "avatars",
                maxSizeBytes: 5 * 1024 * 1024,
            });
            const result = await updateMyAvatar({
                url: uploaded.publicUrl,
                key: uploaded.key,
            });
            setProfile(result.user);
            setProfileMessage("Đã cập nhật ảnh đại diện.");
        } catch (error) {
            setProfileError(error instanceof Error ? error.message : "Không thể cập nhật ảnh đại diện.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async () => {
        setProfileError("");
        setProfileMessage("");
        setSavingProfile(true);

        try {
            const result = await updateMe({
                fullName: profileForm.fullName,
                phone: profileForm.phone || null,
            });
            setProfile(result.user);
            setProfileMessage("Đã lưu hồ sơ host.");
        } catch (error) {
            setProfileError(error instanceof Error ? error.message : "Không thể lưu hồ sơ host.");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSelectBank = (bank: VietnamBank) => {
        setBankForm((current) => ({
            ...current,
            bankCode: bank.code,
            bankName: bank.name,
            bankShortName: bank.shortName,
            bankBin: bank.bin ?? "",
        }));
        setBankSearch(formatBankLabel(bank));
        setBankError("");
        setBankDropdownOpen(false);
    };

    const handleSaveBankAccount = async () => {
        setBankError("");
        setBankMessage("");

        if (!selectedBank) {
            setBankError("Vui lòng chọn ngân hàng từ danh sách.");
            return;
        }

        if (!bankForm.accountNumber.trim()) {
            setBankError("Số tài khoản là bắt buộc.");
            return;
        }

        if (!/^\d{6,30}$/.test(bankForm.accountNumber.trim())) {
            setBankError("Số tài khoản chỉ được chứa số và dài từ 6 đến 30 ký tự.");
            return;
        }

        if (!bankForm.accountHolderName.trim()) {
            setBankError("Chủ tài khoản là bắt buộc.");
            return;
        }

        setSavingBank(true);

        try {
            const payload = {
                bankCode: selectedBank.code,
                bankName: selectedBank.name,
                bankShortName: selectedBank.shortName,
                bankBin: selectedBank.bin,
                accountNumber: bankForm.accountNumber.trim(),
                accountHolderName: bankForm.accountHolderName.trim().toUpperCase(),
                branchName: bankForm.branchName.trim() || null,
            };
            const saved = await saveHostBankAccount(payload);
            const nextForm = {
                bankCode: saved.bankCode,
                bankName: saved.bankName,
                bankShortName: saved.bankShortName ?? "",
                bankBin: saved.bankBin ?? "",
                accountNumber: saved.accountNumber,
                accountHolderName: saved.accountHolderName,
                branchName: saved.branchName ?? "",
            };

            setBankForm(nextForm);
            setBankSearch(
                `${nextForm.bankShortName || nextForm.bankCode} - ${nextForm.bankName}${nextForm.bankBin ? ` (${nextForm.bankBin})` : ""}`,
            );
            setBankMessage("Đã lưu thông tin tài khoản ngân hàng.");
        } catch (error) {
            setBankError(error instanceof Error ? error.message : "Không thể lưu thông tin tài khoản ngân hàng.");
        } finally {
            setSavingBank(false);
        }
    };

    return (
        <div className={pageWrapperClass}>
            <div className="mx-auto max-w-6xl space-y-6">
                <PageHeader title="Cài đặt" subtitle="Quản lý hồ sơ host và tài khoản nhận thanh toán." />

                <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                    {tabs.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => setTab(item.value)}
                            className={`rounded-xl px-4 py-2.5 text-sm font-medium ${tab === item.value ? "bg-cyan-300/15 text-cyan-700" : "text-gray-500 hover:bg-gray-50"}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className={hostCardClass}>
                    {tab === "profile" ? (
                        <div className="space-y-6">
                            {profileError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{profileError}</div> : null}
                            {profileMessage ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{profileMessage}</div> : null}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                {profile?.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.fullName ?? profile.name ?? "host"} className="h-20 w-20 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500 text-2xl font-semibold text-white">
                                        {getInitials(profileForm.fullName || "Chủ Nhà")}
                                    </div>
                                )}
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={(event) => {
                                        void handleAvatarChange(event.target.files?.[0]);
                                        event.target.value = "";
                                    }}
                                />
                                <button type="button" disabled={uploadingAvatar} onClick={() => avatarInputRef.current?.click()} className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}>
                                    {uploadingAvatar ? "Đang upload..." : "Thay đổi ảnh"}
                                </button>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2">
                                <input value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="Họ tên" className={inputClassName} />
                                <input value={profileForm.email} readOnly placeholder="Email" className={inputClassName} />
                                <input value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Số điện thoại" className={inputClassName} />
                                <input placeholder="CMND/CCCD" className={inputClassName} />
                                <input placeholder="Địa chỉ" className={`${inputClassName} md:col-span-2`} />
                            </div>
                            <button type="button" disabled={savingProfile} onClick={handleSaveProfile} className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}>
                                {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    ) : null}

                    {tab === "bank" ? (
                        <div className="space-y-6">
                            {bankError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{bankError}</div> : null}
                            {bankMessage ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{bankMessage}</div> : null}

                            <div className="grid gap-5 md:grid-cols-2">
                                <div ref={bankPickerRef} className="relative md:col-span-2">
                                    <label htmlFor="host-bank-search" className={labelClassName}>Chọn ngân hàng</label>
                                    <div className="relative">
                                        <input
                                            id="host-bank-search"
                                            role="combobox"
                                            aria-expanded={bankDropdownOpen}
                                            aria-controls="host-bank-options"
                                            autoComplete="off"
                                            value={bankSearch}
                                            onFocus={() => setBankDropdownOpen(true)}
                                            onChange={(event) => {
                                                setBankSearch(event.target.value);
                                                setBankForm((current) => ({
                                                    ...current,
                                                    bankCode: "",
                                                    bankName: "",
                                                    bankShortName: "",
                                                    bankBin: "",
                                                }));
                                                setBankDropdownOpen(true);
                                            }}
                                            placeholder={loadingBankData ? "Đang tải danh sách ngân hàng..." : "Tìm ngân hàng theo tên, mã hoặc BIN"}
                                            className={`${inputClassName} pr-11`}
                                        />
                                        <button
                                            type="button"
                                            aria-label="Mở danh sách ngân hàng"
                                            onClick={() => setBankDropdownOpen((current) => !current)}
                                            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-50"
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {bankDropdownOpen ? (
                                        <div id="host-bank-options" className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                                            {loadingBankData ? (
                                                <div className="px-3 py-3 text-sm text-gray-500">Đang tải danh sách ngân hàng...</div>
                                            ) : null}
                                            {!loadingBankData && filteredBanks.length === 0 ? (
                                                <div className="px-3 py-3 text-sm text-gray-500">Không tìm thấy ngân hàng phù hợp.</div>
                                            ) : null}
                                            {!loadingBankData && filteredBanks.map((bank) => (
                                                <button
                                                    key={`${bank.code}-${bank.bin ?? ""}`}
                                                    type="button"
                                                    onClick={() => handleSelectBank(bank)}
                                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-cyan-50 ${bank.code === bankForm.bankCode ? "bg-cyan-300/15" : ""}`}
                                                >
                                                    {bank.logo ? <img src={bank.logo} alt="" className="h-7 w-7 shrink-0 rounded-full object-contain" /> : <span className="h-7 w-7 shrink-0 rounded-full bg-cyan-50" />}
                                                    <span className="min-w-0">
                                                        <span className="block text-sm font-semibold text-gray-900">{bank.shortName} - {bank.name}</span>
                                                        <span className="block text-xs text-gray-500">{bank.code}{bank.bin ? ` • BIN ${bank.bin}` : ""}</span>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                <div>
                                    <label htmlFor="host-account-number" className={labelClassName}>Số tài khoản</label>
                                    <input
                                        id="host-account-number"
                                        value={bankForm.accountNumber}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={30}
                                        onChange={(event) => setBankForm((current) => ({ ...current, accountNumber: event.target.value.replace(/\D/g, "").slice(0, 30) }))}
                                        placeholder="Nhập số tài khoản"
                                        className={inputClassName}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="host-account-holder" className={labelClassName}>Chủ tài khoản</label>
                                    <input
                                        id="host-account-holder"
                                        value={bankForm.accountHolderName}
                                        onChange={(event) => setBankForm((current) => ({ ...current, accountHolderName: event.target.value.toUpperCase() }))}
                                        placeholder="NGUYEN VAN A"
                                        className={inputClassName}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="host-bank-branch" className={labelClassName}>Chi nhánh</label>
                                    <input
                                        id="host-bank-branch"
                                        value={bankForm.branchName}
                                        onChange={(event) => setBankForm((current) => ({ ...current, branchName: event.target.value }))}
                                        placeholder="Chi nhánh Vũng Tàu (không bắt buộc)"
                                        className={inputClassName}
                                    />
                                </div>
                            </div>

                            <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                                Thông tin này dùng để nhận thanh toán từ minh thanh villa.
                            </p>
                            <button type="button" disabled={savingBank || loadingBankData} onClick={handleSaveBankAccount} className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}>
                                {savingBank ? "Đang lưu..." : "Lưu thông tin"}
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default CaiDat;
