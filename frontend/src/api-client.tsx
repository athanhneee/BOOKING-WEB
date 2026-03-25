type RegisterFieldName = "name" | "email" | "phone" | "password";

export type RegisterFieldErrors = Partial<Record<RegisterFieldName, string>>;

export type RegisterFormData = {
    name: string;
    email: string;
    phone: string;
    password: string;
};

type ValidationErrorItem = {
    msg?: string;
    path?: string;
};

type ApiErrorResponse = {
    message?: string | ValidationErrorItem[];
    errors?: ValidationErrorItem[];
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
    status: number;
    fieldErrors: RegisterFieldErrors;

    constructor(message: string, status: number, fieldErrors: RegisterFieldErrors = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}

const normalizeValidationErrors = (items: ValidationErrorItem[]): RegisterFieldErrors => {
    const fieldErrors: RegisterFieldErrors = {};

    items.forEach((item) => {
        const field = item.path as RegisterFieldName | undefined;

        if (field && !fieldErrors[field] && item.msg) {
            fieldErrors[field] = item.msg;
        }
    });

    return fieldErrors;
};

const buildApiError = async (response: Response) => {
    let data: ApiErrorResponse | null = null;

    try {
        data = (await response.json()) as ApiErrorResponse;
    } catch {
        data = null;
    }

    const validationItems = Array.isArray(data?.message)
        ? data.message
        : Array.isArray(data?.errors)
          ? data.errors
          : [];

    const fieldErrors = normalizeValidationErrors(validationItems);
    const fallbackFieldMessage = Object.values(fieldErrors)[0];
    const message =
        typeof data?.message === "string" ? data.message : fallbackFieldMessage ?? "Không thể hoàn tất đăng ký. Vui lòng thử lại.";

    return new ApiError(message, response.status, fieldErrors);
};

export const register = async (formData: RegisterFormData) => {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
    });

    if (!response.ok) {
        throw await buildApiError(response);
    }
};
