import { NextResponse } from 'next/server'
export async function GET(req: Request) {
  const type = new URL(req.url).searchParams.get('type') || 'market_summary'
  try {
    const statsRes = await fetch('https://karena.fieldnine.io/api/stats', { cache: 'no-store' })
    if (!statsRes.ok) throw new Error(`stats fetch failed: ${statsRes.status}`)
    const stats = await statsRes.json()
    const { pairs, agents, signals } = stats
    const topPairs = pairs.slice(0,3).map((p: {pair:string;change:number}) => `${p.pair}(${p.change>0?'+':''}${p.change}%)`).join(', ')
    const bullish = signals.filter((s: {direction:string}) => s.direction==='LONG').length
    const bearish = signals.filter((s: {direction:string}) => s.direction==='SHORT').length
    const prompts: Record<string,string> = {
      market_summary: `You are K-Arena AI analyst. Data: ${topPairs}, ${agents.filter((a:{status:string})=>a.status==='ONLINE').length} AI agents online, ${bullish} bullish vs ${bearish} bearish signals. Write a 2-paragraph market intelligence report.`,
      risk_alert: `K-Arena risk engine: ${bullish} LONG vs ${bearish} SHORT signals. Respond ONLY with JSON: {"risk_level":"LOW|MEDIUM|HIGH","alerts":[{"type":"string","severity":"string","details":"string"}],"recommendation":"string"}`,
      pair_analysis: `Analyze markets: ${pairs.map((p:{pair:string;change:number;price:number})=>`${p.pair}=${p.price}(${p.change}%)`).join(', ')}. Respond ONLY with JSON: [{"pair":"string","trend":"string","signal":"LONG|SHORT|NEUTRAL","reasoning":"string"}]`,
    }
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({error:'ANTHROPIC_API_KEY not set'},{status:500})
    const res = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:600,messages:[{role:'user',content:prompts[type]||prompts.market_summary}]}),
    })
    const data = await res.json()
    const rawText = data.content?.[0]?.text || ''
    let analysis: unknown = rawText
    if (type !== 'market_summary') { try { analysis = JSON.parse(rawText.replace(/```json|```/g,'').trim()) } catch { analysis = {raw:rawText} } }
    return NextResponse.json({type,analysis,generated_at:new Date().toISOString()},{headers:{'Access-Control-Allow-Origin':'*'}})
  } catch(e) { return NextResponse.json({error:String(e)},{status:500}) }
}
