/// <reference types="vite/client" />

declare module "*.jsx" {
    import type { ComponentType } from "react";

    const Component: ComponentType<Record<string, unknown>>;
    export default Component;
}

declare module "*.JPG" {
    const src: string;
    export default src;
}
