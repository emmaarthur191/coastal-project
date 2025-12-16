/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ThreadTypeEnum } from './ThreadTypeEnum';
/**
 * Serializer for message threads.
 */
export type MessageThread = {
    readonly id: number;
    subject: string;
    thread_type?: ThreadTypeEnum;
    participants: Array<number>;
    readonly participant_list: string;
    participant_ids?: Array<number>;
    readonly created_by: number | null;
    readonly created_by_name: string;
    is_archived?: boolean;
    is_pinned?: boolean;
    readonly last_message_at: string | null;
    readonly created_at: string;
    readonly updated_at: string;
    readonly messages: string;
    readonly unread_count: string;
    readonly last_message_preview: string;
};

