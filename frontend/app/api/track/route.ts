/**
 * Analytics tracking API route
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    // Forward to backend analytics API
    const response = await fetch(`${apiUrl}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    return NextResponse.json({ status: 'tracked' })
  } catch (error) {
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
  }
}

