import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "이메일과 비밀번호를 입력하세요." }, { status: 400 });
    }
    // Demo: any credentials work
    const token = "demo_token_" + Buffer.from(email).toString("base64");
    return NextResponse.json({
      success: true,
      message: "로그인 완료",
      token,
      user: { id: "user_001", email, username: email.split("@")[0] },
    });
  } catch {
    return NextResponse.json({ success: false, message: "서버 오류" }, { status: 500 });
  }
}
