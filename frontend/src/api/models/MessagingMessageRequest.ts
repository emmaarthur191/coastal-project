/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessagingMessageMessageTypeEnum } from './MessagingMessageMessageTypeEnum';
export type MessagingMessageRequest = {
    thread: string;
    sender: string;
    content?: string | null;
    encrypted_content?: string | null;
    iv?: string | null;
    auth_tag?: string | null;
    message_type?: MessagingMessageMessageTypeEnum;
    is_read?: boolean;
    read_at?: string | null;
    reply_to?: string | null;
    is_starred?: boolean;
    expires_at?: string | null;
    forwarded_from?: string | null;
};

