/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from './ApiRequestOptions';

type Resolver<T> = (options: ApiRequestOptions) => Promise<T>;
type Headers = Record<string, string>;

export type OpenAPIConfig = {
    BASE: string;
    VERSION: string;
    WITH_CREDENTIALS: boolean;
    CREDENTIALS: 'include' | 'omit' | 'same-origin';
    TOKEN?: string | Resolver<string> | undefined;
    USERNAME?: string | Resolver<string> | undefined;
    PASSWORD?: string | Resolver<string> | undefined;
    HEADERS?: Headers | Resolver<Headers> | undefined;
    ENCODE_PATH?: ((path: string) => string) | undefined;
};

// Resolve the base API URL from environment variables, mirroring the logic in services/api.ts.
// This ensures the auto-generated OpenAPI services (e.g. AccountOpeningsService) correctly
// target the Render backend in production and never silently fail with empty relative paths.
function resolveOpenApiBase(): string {
    const prodUrl = import.meta.env.VITE_PROD_API_URL as string | undefined;
    const devUrl = import.meta.env.VITE_DEV_API_URL as string | undefined;

    if (prodUrl) {
        // Strip trailing slash as OpenAPI appends paths with a leading slash
        return prodUrl.replace(/\/$/, '');
    }
    if (devUrl) {
        return devUrl.replace(/\/$/, '');
    }
    // Fallback: same origin (BFF proxy mode)
    return '';
}

export const OpenAPI: OpenAPIConfig = {
    BASE: resolveOpenApiBase(),
    VERSION: '1.0.0',
    WITH_CREDENTIALS: false,
    CREDENTIALS: 'include',
    TOKEN: undefined,
    USERNAME: undefined,
    PASSWORD: undefined,
    HEADERS: undefined,
    ENCODE_PATH: undefined,
};
