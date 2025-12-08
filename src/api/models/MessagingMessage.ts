/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessagingMessageMessageTypeEnum } from './MessagingMessageMessageTypeEnum';
export type MessagingMessage = {
    readonly id: string;
    thread: string;
    sender: string;
    readonly sender_name: string;
    content?: string | null;
    encrypted_content?: string | null;
    iv?: string | null;
    auth_tag?: string | null;
    message_type?: MessagingMessageMessageTypeEnum;
    readonly timestamp: string;
    is_read?: boolean;
    read_at?: string | null;
    readonly is_from_current_user: boolean;
    reply_to?: string | null;
    readonly reply_to_message: Record<string, any>;
    readonly reactions: Record<string, any>;
    is_starred?: boolean;
    expires_at?: string | null;
    forwarded_from?: string | null;
    readonly forwarded_from_message: Record<string, any>;
};

