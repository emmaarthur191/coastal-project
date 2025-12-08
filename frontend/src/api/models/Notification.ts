/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NotificationStatusEnum } from './NotificationStatusEnum';
import type { NotificationTypeEnum } from './NotificationTypeEnum';
import type { SeverityEnum } from './SeverityEnum';
/**
 * Serializer for Notification model.
 */
export type Notification = {
    readonly id: string;
    notification_type: NotificationTypeEnum;
    priority?: SeverityEnum;
    status?: NotificationStatusEnum;
    recipient: string;
    sender?: string | null;
    readonly sender_name: string | null;
    title: string;
    message: string;
    action_url?: string;
    cash_advance?: string | null;
    refund?: string | null;
    complaint?: string | null;
    transaction?: string | null;
    readonly created_at: string;
    readonly read_at: string | null;
    expires_at?: string | null;
};

