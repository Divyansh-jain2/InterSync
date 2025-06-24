import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const backendRes = await fetch('http://127.0.0.1:8000/api/score-resume', {
      method: 'POST',
      body: formData,
    });
    if (!backendRes.ok) {
      const error = await backendRes.text();
      return new Response(JSON.stringify({ error }), { status: backendRes.status });
    }
    const data = await backendRes.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), { status: 500 });
  }
} 