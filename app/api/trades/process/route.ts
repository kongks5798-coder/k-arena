import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset, type, method, amount, price } = body;

    if (!asset || !type || !method || !amount) {
      return NextResponse.json({ success: false, message: "필수 항목을 입력하세요.", code: "MISSING_FIELDS" }, { status: 400 });
    }
    if (!["BUY", "SELL"].includes(type)) {
      return NextResponse.json({ success: false, message: "주문 유형이 올바르지 않습니다." }, { status: 400 });
    }
    if (amount <= 0 || amount > 1_000_000) {
      return NextResponse.json({ success: false, message: "수량이 올바르지 않습니다." }, { status: 400 });
    }
    if (method === "LIMIT" && !price) {
      return NextResponse.json({ success: false, message: "지정가 주문에 가격을 입력하세요." }, { status: 400 });
    }

    const PRICES: Record<string, number> = { BTC: 45230, ETH: 2850, USD: 1, KRW: 1300 };
    const execPrice = method === "MARKET" ? (PRICES[asset] ?? 1) : price;
    const orderId = "ORD-" + Date.now();
    const fee = amount * execPrice * 0.001;

    return NextResponse.json({
      success: true,
      message: "주문이 접수되었습니다.",
      orderId,
      asset,
      type,
      method,
      amount,
      price: execPrice,
      fee: parseFloat(fee.toFixed(4)),
      total: parseFloat((amount * execPrice + fee).toFixed(4)),
      timestamp: new Date().toISOString(),
      status: "pending",
    }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "주문 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
