import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const RPC = 'https://polygon-bor-rpc.publicnode.com'
const KAUS = '0xfBfbb12E10f8b3418C278147F37507526670B247'
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const THRESHOLD = BigInt('1000') * BigInt(10 ** 18) // 1000 KAUS

async function rpc(method: string, params: unknown[]) {
  const r = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    cache: 'no-store',
  })
  const d = await r.json()
  return d.result
}

async function sendTelegram(msg: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
  })
}

interface EthLog {
  data: string
  topics: string[]
  transactionHash: string
}

export async function GET(req: Request) {
  // Vercel cron auth check
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const blockHex = await rpc('eth_blockNumber', [])
    const latest = parseInt(blockHex, 16)
    const from = '0x' + (latest - 100).toString(16)

    const logs: EthLog[] = await rpc('eth_getLogs', [{
      fromBlock: from,
      toBlock: 'latest',
      address: KAUS,
      topics: [TRANSFER_TOPIC],
    }])

    const alerts: string[] = []
    for (const log of (logs || [])) {
      const value = BigInt(log.data)
      if (value >= THRESHOLD) {
        const from_addr = '0x' + log.topics[1].slice(26)
        const to_addr = '0x' + log.topics[2].slice(26)
        const amount = (value / BigInt(10 ** 18)).toString()
        const msg = `🚀 <b>대형 KAUS 이동 감지!</b>\n💰 금액: ${amount} KAUS\n📤 From: ${from_addr.slice(0, 8)}...${from_addr.slice(-4)}\n📥 To: ${to_addr.slice(0, 8)}...${to_addr.slice(-4)}\n🔗 <a href="https://polygonscan.com/tx/${log.transactionHash}">PolygonScan</a>`
        await sendTelegram(msg)
        alerts.push(msg)
      }
    }

    return NextResponse.json({ ok: true, checked: logs?.length || 0, alerts: alerts.length })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
