/**
 * ServiceRequest model - matches backend ServiceRequest model
 */
export interface ServiceRequest {
    id?: number;
    user?: number;
    request_type: 'statement' | 'checkbook' | 'card_replacement' | 'account_closure' | 'address_change' | 'other';
    description?: string;
    delivery_method?: 'email' | 'sms' | 'pickup' | 'mail';
    status?: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
    admin_notes?: string;
    processed_by?: number;
    processed_at?: string;
    created_at?: string;
    updated_at?: string;
}
