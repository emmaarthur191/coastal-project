/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SettingTypeEnum } from './SettingTypeEnum';
/**
 * Serializer for system-wide settings.
 */
export type PatchedSystemSettingsRequest = {
    key?: string;
    name?: string;
    description?: string;
    setting_type?: SettingTypeEnum;
    value?: string;
    default_value?: string;
    choices?: any;
    min_value?: string | null;
    max_value?: string | null;
    is_public?: boolean;
    required_role?: string;
    category?: string;
    is_active?: boolean;
    created_by?: string | null;
};

