/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ThreadTypeEnum } from './ThreadTypeEnum';
import type { User } from './User';
export type MessagingMessageThread = {
    readonly id: string;
    subject: string;
    description?: string | null;
    thread_type?: ThreadTypeEnum;
    readonly participants: Array<User>;
    readonly admins: Array<User>;
    readonly created_by: string;
    readonly created_at: string;
    readonly updated_at: string;
    is_active?: boolean;
    readonly last_message: Record<string, any>;
    readonly unread_count: number;
    readonly participant_count: number;
    readonly can_manage: boolean;
};

