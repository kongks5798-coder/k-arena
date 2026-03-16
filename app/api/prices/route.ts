import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      BTC: { symbol: "BTC", price: 45230, change24h: 2.34 },
      ETH: { symbol: "ETH", price: 2850, change24h: 1.89 },
      USD: { symbol: "USD", price: 1, change24h: 0 },
      KRW: { symbol: "KRW", price: 1300, change24h: -0.05 },
    },
    timestamp: new Date().toISOString(),
  });
}
