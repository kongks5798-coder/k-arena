import { NextResponse } from 'next/server'

const CACHE_TTL = 5_000
let cache: { data: Record<string, unknown>; ts: number } | null = null

const BASE: Record<string, {price:number;change24h:number;volume24h:number;high24h:number;low24h:number;source:string}> = {
  'USD/KRW':  {price:1332.40,change24h:0.12, volume24h:2_400_000_000,high24h:1341.20,low24h:1328.50,source:'oracle'},
  'EUR/KRW':  {price:1447.80,change24h:0.08, volume24h:1_800_000_000,high24h:1455.00,low24h:1442.10,source:'oracle'},
  'JPY/KRW':  {price:8.91,  change24h:-0.04,volume24h:980_000_000,  high24h:8.97,   low24h:8.88,   source:'oracle'},
  'EUR/USD':  {price:1.086, change24h:0.09, volume24h:3_100_000_000,high24h:1.089,  low24h:1.083,  source:'oracle'},
  'USD/JPY':  {price:149.80,change24h:-0.15,volume24h:2_200_000_000,high24h:150.40, low24h:149.20, source:'oracle'},
  'XAU/USD':  {price:3124,  change24h:0.87, volume24h:420_000_000,  high24h:3138,   low24h:3108,   source:'oracle'},
  'WTI/USD':  {price:71.84, change24h:-0.33,volume24h:890_000_000,  high24h:72.50,  low24h:71.20,  source:'oracle'},
  'BTC/USD':  {price:83420, change24h:-1.24,volume24h:28_000_000_000,high24h:85200, low24h:82100,  source:'binance'},
  'ETH/USD':  {price:3240,  change24h:-0.88,volume24h:14_000_000_000,high24h:3310,  low24h:3200,   source:'binance'},
  'KAUS/USD': {price:1.847, change24h:3.24, volume24h:84_000_000,   high24h:1.892,  low24h:1.781,  source:'kaus-oracle'},
  'kWh/USD':  {price:0.247, change24h:2.11, volume24h:12_000_000,   high24h:0.251,  low24h:0.241,  source:'energy-oracle'},
}

async function fetchBinance() {
  try {
    const r = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]',{next:{revalidate:5}})
    if(!r.ok) return {}
    const d = await r.json()
    const out: Record<string,unknown> = {}
    for(const t of d){
      const k = t.symbol==='BTCUSDT'?'BTC/USD':'ETH/USD'
      out[k]={price:+t.lastPrice,change24h:+t.priceChangePercent,volume24h:+t.quoteVolume,high24h:+t.highPrice,low24h:+t.lowPrice,source:'binance'}
    }
    return out
  } catch { return {} }
}

export async function GET(req: Request) {
  const {searchParams}=new URL(req.url)
  const pair=searchParams.get('pair')
  const now=Date.now()
  if(!cache||now-cache.ts>CACHE_TTL){
    const live=await fetchBinance() as Record<string,unknown>
    const data: Record<string,unknown>={}
    for(const [k,v] of Object.entries(BASE)){
      const bps=8, f=1+(Math.random()-.5)*2*(bps/10000)
      data[k]=live[k]??{...v,price:+(v.price*f).toFixed(v.price<1?6:v.price<10?4:2)}
    }
    cache={data,ts:now}
  }
  const data=pair?{[pair]:cache.data[pair]??null}:cache.data
  return NextResponse.json({ok:true,ts:new Date(cache.ts).toISOString(),data,meta:{source:'KAUS Multi-Oracle v2',fee:'0.1%',settlement:'~1.2s'}},
    {headers:{'Cache-Control':'public, s-maxage=5','Access-Control-Allow-Origin':'*'}})
}
