/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for individual messages.
 */
export type Message = {
    readonly id: number;
    thread: number;
    readonly sender: number | null;
    readonly sender_name: string;
    readonly sender_email: string;
    content?: string | null;
    encrypted_content?: string | null;
    iv?: string | null;
    auth_tag?: string | null;
    message_type?: string;
    is_system_message?: boolean;
    attachment_url?: string | null;
    attachment_name?: string;
    readonly created_at: string;
    readonly edited_at: string | null;
    readonly is_read_by_me: string;
};

