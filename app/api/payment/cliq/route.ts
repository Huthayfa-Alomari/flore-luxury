import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, items } = body

    // Mock CliQ integration - replace with real API call
    // In production, integrate with CliQ Jordan API

    const transactionId = `CLIQ-${Date.now()}`

    // Mock payment URL - in production this comes from CliQ
    const paymentUrl = `https://sandbox.cliq.jo/pay?amount=${amount}&ref=${transactionId}`

    return NextResponse.json({
      success: true,
      paymentUrl,
      transactionId,
      amount,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}