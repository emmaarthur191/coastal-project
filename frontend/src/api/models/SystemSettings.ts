/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SettingTypeEnum } from './SettingTypeEnum';
/**
 * Serializer for system-wide settings.
 */
export type SystemSettings = {
    readonly id: string;
    readonly current_value: string;
    readonly is_valid: string;
    key: string;
    name: string;
    description?: string;
    setting_type?: SettingTypeEnum;
    value: string;
    default_value?: string;
    choices?: any;
    min_value?: string | null;
    max_value?: string | null;
    is_public?: boolean;
    required_role?: string;
    category?: string;
    is_active?: boolean;
    readonly created_at: string;
    readonly updated_at: string;
    created_by?: string | null;
};

