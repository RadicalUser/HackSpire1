import { NextResponse } from 'next/server';

const DETECT_URL = process.env.DETECT_SERVICE_URL || 'http://localhost:5000/api/v1/detect';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(DETECT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log('DETECT SERVICE RAW RESPONSE:', text); // Log raw response for debugging
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { error: 'Invalid JSON from backend', raw: text };
    }
    if (!res.ok) throw new Error(data.error || 'Detection failed');
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('Detection route error:', err);
    return NextResponse.json({ error: 'Detection service failed' }, { status: 500 });
  }
}
