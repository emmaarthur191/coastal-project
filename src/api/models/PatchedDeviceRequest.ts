/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeviceTypeEnum } from './DeviceTypeEnum';
export type PatchedDeviceRequest = {
    device_id?: string;
    device_name?: string;
    device_type?: DeviceTypeEnum;
    user_agent?: string | null;
    ip_address?: string | null;
    is_active?: boolean;
};

