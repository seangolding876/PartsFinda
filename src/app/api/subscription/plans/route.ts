import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Fetch all subscription plans with their features
    const plansResult = await query(`
      SELECT 
        sp.plan_id,
        sp.plan_name,
        sp.price,
        sp.duration_days,
        sp.request_delay_hours,
        sp.created_at,
        json_agg(
          json_build_object(
            'feature_id', sf.feature_id,
            'feature_text', sf.feature_text
          )
        ) as features
      FROM subscription_plans sp
      LEFT JOIN subscription_features sf ON sp.plan_id = sf.plan_id
      GROUP BY sp.plan_id, sp.plan_name, sp.price, sp.duration_days, sp.request_delay_hours, sp.created_at
      ORDER BY sp.price ASC
    `);

    const plans = plansResult.rows.map(plan => ({
      id: plan.plan_id,
      name: plan.plan_name,
      price: parseFloat(plan.price),
      duration_days: plan.duration_days,
      request_delay_hours: plan.request_delay_hours,
      features: plan.features.filter((f: any) => f.feature_id !== null),
      recommended: plan.plan_name === 'premium' // Mark premium as recommended
    }));

    return NextResponse.json({
      success: true,
      data: plans
    });

  } catch (error: any) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subscription plans',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}