/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BankingMessageMessageTypeEnum } from './BankingMessageMessageTypeEnum';
/**
 * Serializer for Message model.
 */
export type BankingMessageRequest = {
    thread: string;
    sender: string;
    encrypted_content?: string | null;
    iv?: string | null;
    auth_tag?: string | null;
    is_read?: boolean;
    message_type?: BankingMessageMessageTypeEnum;
};

