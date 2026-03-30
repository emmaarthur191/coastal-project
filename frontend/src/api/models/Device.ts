/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeviceTypeEnum } from './DeviceTypeEnum';
/**
 * Serializer for registered devices.
 */
export type Device = {
    readonly id: number;
    readonly user: number;
    device_token: string;
    device_type?: DeviceTypeEnum;
    device_name?: string;
    is_active?: boolean;
    readonly last_used_at: string;
    readonly created_at: string;
};

