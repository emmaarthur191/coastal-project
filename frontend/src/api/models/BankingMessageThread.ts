/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for MessageThread model.
 */
export type BankingMessageThread = {
    readonly id: string;
    readonly participants: Array<any>;
    subject?: string | null;
    readonly created_at: string;
    readonly updated_at: string;
    readonly unread_count: number;
    readonly last_message_preview: Record<string, any>;
    readonly last_message_at: string;
    shared_secret?: string;
    public_keys?: any;
};

