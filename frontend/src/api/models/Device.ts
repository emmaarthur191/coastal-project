/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeviceTypeEnum } from './DeviceTypeEnum';
export type Device = {
    readonly id: string;
    device_id: string;
    device_name: string;
    device_type?: DeviceTypeEnum;
    user_agent?: string | null;
    ip_address?: string | null;
    readonly last_seen: string;
    is_active?: boolean;
    readonly created_at: string;
};

