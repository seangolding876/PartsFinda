import { NextRequest, NextResponse } from 'next/server';
import { SettingsService } from '@/lib/settingsService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const success = await SettingsService.resetToDefault();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Settings reset to default successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to reset settings' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error resetting settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset settings' },
      { status: 500 }
    );
  }
}