import { NextRequest, NextResponse } from 'next/server';
import { SettingsService } from '@/lib/settingsService';

export const dynamic = 'force-dynamic';

// GET - All settings
export async function GET(request: NextRequest) {
  try {
    const settings = await SettingsService.getAllSettings();

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST - Update multiple settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    const success = await SettingsService.updateMultipleSettings(settings);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}