export const APP_ROUTES = {
    home: "/",
    search: "/search",
    login: "/dang-nhap",
    register: "/dang-ky",
    forgotPassword: "/quen-mat-khau",
    villaDetail: (villaId: string) => `/villa/${villaId}`,
} as const;
