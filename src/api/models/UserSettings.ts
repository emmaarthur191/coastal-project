/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CurrencyEnum } from './CurrencyEnum';
import type { DateFormatEnum } from './DateFormatEnum';
import type { LanguageEnum } from './LanguageEnum';
import type { ThemeEnum } from './ThemeEnum';
import type { TimeFormatEnum } from './TimeFormatEnum';
/**
 * Serializer for comprehensive user settings.
 */
export type UserSettings = {
    readonly id: string;
    theme?: ThemeEnum;
    language?: LanguageEnum;
    currency?: CurrencyEnum;
    date_format?: DateFormatEnum;
    time_format?: TimeFormatEnum;
    dashboard_layout?: any;
    default_dashboard_view?: string;
    items_per_page?: number;
    auto_refresh_interval?: number;
    default_transaction_type?: string;
    require_transaction_confirmation?: boolean;
    show_transaction_receipts?: boolean;
    transaction_notification_threshold?: string;
    session_timeout?: number;
    require_2fa?: boolean;
    login_alerts?: boolean;
    suspicious_activity_alerts?: boolean;
    cash_drawer_shortcuts?: boolean;
    auto_calculate_change?: boolean;
    receipt_printer_enabled?: boolean;
    receipt_printer_address?: string;
    email_notifications?: boolean;
    sms_notifications?: boolean;
    push_notifications?: boolean;
    notification_sound?: boolean;
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
    high_contrast_mode?: boolean;
    large_text?: boolean;
    screen_reader_optimized?: boolean;
    keyboard_navigation?: boolean;
    advanced_mode?: boolean;
    debug_mode?: boolean;
    api_access_enabled?: boolean;
    readonly created_at: string;
    readonly updated_at: string;
    readonly user: string;
};

