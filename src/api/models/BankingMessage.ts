/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BankingMessageMessageTypeEnum } from './BankingMessageMessageTypeEnum';
/**
 * Serializer for Message model.
 */
export type BankingMessage = {
    readonly id: string;
    thread: string;
    sender: string;
    readonly sender_name: string;
    encrypted_content?: string | null;
    iv?: string | null;
    auth_tag?: string | null;
    readonly timestamp: string;
    is_read?: boolean;
    readonly read_at: string | null;
    message_type?: BankingMessageMessageTypeEnum;
    readonly is_from_current_user: boolean;
};

