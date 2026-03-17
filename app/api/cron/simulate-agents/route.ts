import { NextResponse } from 'next/server'
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({error:'Unauthorized'},{status:401})
  }
  const agents = ['AGT-0042','AGT-0117','AGT-0223','AGT-0089','AGT-0156','AGT-0301']
  const pairs = ['XAU/KAUS','USD/KAUS','ETH/KAUS','BTC/KAUS','OIL/KAUS','EUR/KAUS']
  const sb = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  const results = []
  if (sb && key) {
    const count = Math.floor(Math.random()*4)+1
    for (let i=0;i<count;i++) {
      const tx = {
        agent_id:agents[Math.floor(Math.random()*agents.length)],
        pair:pairs[Math.floor(Math.random()*pairs.length)],
        amount:parseFloat((Math.random()*10000+1000).toFixed(2)),
        direction:Math.random()>0.5?'BUY':'SELL',
        fee:parseFloat((Math.random()*10+1).toFixed(4)),
        status:'CONFIRMED',
      }
      try {
        const res = await fetch(`${sb}/rest/v1/transactions`,{
          method:'POST',
          headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=minimal'},
          body:JSON.stringify(tx),
        })
        results.push({...tx,saved:res.ok})
      } catch(e){results.push({error:String(e)})}
    }
  } else {
    results.push({simulated:true,agents_active:6})
  }
  return NextResponse.json({status:'ok',executed_at:new Date().toISOString(),transactions:results.length,results})
}
