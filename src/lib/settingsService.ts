import { query } from '@/lib/db';

export class SettingsService {
  // Get all settings
  static async getAllSettings(): Promise<Record<string, any>> {
    try {
      const result = await query(
        'SELECT setting_key, setting_value, setting_type FROM system_settings'
      );
      
      const settings: Record<string, any> = {};
      
      result.rows.forEach((row: any) => {
        settings[row.setting_key] = this.parseSettingValue(
          row.setting_value, 
          row.setting_type
        );
      });
      
      return settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {};
    }
  }

  // Update multiple settings
  static async updateMultipleSettings(settings: Record<string, any>): Promise<boolean> {
    try {
      await query('BEGIN');
      
      for (const [key, value] of Object.entries(settings)) {
        const settingType = this.getTypeFromValue(value);
        const jsonValue = JSON.stringify(value);
        
        await query(
          `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (setting_key) 
           DO UPDATE SET setting_value = $2, setting_type = $3, updated_at = CURRENT_TIMESTAMP`,
          [key, jsonValue, settingType]
        );
      }
      
      await query('COMMIT');
      return true;
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error updating multiple settings:', error);
      return false;
    }
  }

  // Reset to default settings
  static async resetToDefault(): Promise<boolean> {
    try {
      await query(`
        UPDATE system_settings SET 
          setting_value = CASE setting_key
            WHEN 'site_name' THEN '"PartsFinda"'
            WHEN 'site_description' THEN '"Auto Parts Marketplace"'
            WHEN 'admin_email' THEN '"admin@partsfinda.com"'
            WHEN 'timezone' THEN '"UTC+5"'
            WHEN 'date_format' THEN '"DD/MM/YYYY"'
            WHEN 'items_per_page' THEN '20'
            WHEN 'session_timeout' THEN '60'
            WHEN 'password_min_length' THEN '6'
            WHEN 'max_login_attempts' THEN '5'
            WHEN 'enable_2fa' THEN 'false'
            WHEN 'enable_captcha' THEN 'true'
            WHEN 'email_notifications' THEN 'true'
            WHEN 'sms_notifications' THEN 'false'
            WHEN 'new_user_alerts' THEN 'true'
            WHEN 'payment_alerts' THEN 'true'
            WHEN 'system_alerts' THEN 'true'
            WHEN 'currency' THEN '"USD"'
            WHEN 'tax_rate' THEN '0'
            WHEN 'payment_methods' THEN '["stripe", "paypal"]'
            WHEN 'auto_renewal' THEN 'true'
            WHEN 'invoice_prefix' THEN '"INV"'
            WHEN 'theme' THEN '"light"'
            WHEN 'primary_color' THEN '"#3B82F6"'
            WHEN 'logo_url' THEN '"/logo.png"'
            WHEN 'favicon_url' THEN '"/favicon.ico"'
            WHEN 'language' THEN '"en"'
            ELSE setting_value
          END,
          updated_at = CURRENT_TIMESTAMP
      `);

      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }

  // Helper function to parse setting value based on type
  private static parseSettingValue(value: any, type: string): any {
    try {
      const parsed = JSON.parse(value);
      
      switch (type) {
        case 'number':
          return Number(parsed);
        case 'boolean':
          return Boolean(parsed);
        case 'array':
          return Array.isArray(parsed) ? parsed : [parsed];
        case 'object':
          return typeof parsed === 'object' ? parsed : {};
        default:
          return String(parsed);
      }
    } catch (error) {
      return value;
    }
  }

  // Helper function to determine type from value
  private static getTypeFromValue(value: any): string {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    return 'string';
  }
}