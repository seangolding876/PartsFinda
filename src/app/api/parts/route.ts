import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');

    let query = supabase.from('parts').select('*');

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (condition && condition !== 'all') {
      query = query.eq('condition', condition);
    }
    if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      // If table doesn't exist, return sample data
      return NextResponse.json({
        parts: [
          {
            id: '1',
            name: 'Brake Pads - Premium Ceramic',
            price: 89.99,
            condition: 'New',
            category: 'Brakes',
            seller_name: 'AutoParts Pro',
            seller_rating: 4.8,
            image_url: '🔧',
            vehicle_compatibility: ['2015-2020 Toyota Camry']
          },
          {
            id: '2',
            name: 'LED Headlight Assembly',
            price: 249.99,
            condition: 'New',
            category: 'Lighting',
            seller_name: 'LightTech Solutions',
            seller_rating: 4.9,
            image_url: '💡',
            vehicle_compatibility: ['2018-2023 Honda Accord']
          }
        ]
      });
    }

    return NextResponse.json({ parts: data || [] });
  } catch (error) {
    console.error('Error fetching parts:', error);
    return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await supabase.from('parts').insert([body]).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ part: data[0] });
  } catch (error) {
    console.error('Error creating part:', error);
    return NextResponse.json({ error: 'Failed to create part' }, { status: 500 });
  }
}
