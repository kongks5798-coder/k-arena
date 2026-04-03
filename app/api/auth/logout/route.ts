import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
    return NextResponse.json({ success: true, message: '로그아웃 완료' })
  } catch {
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 })
  }
}
