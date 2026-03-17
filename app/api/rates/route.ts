import { NextResponse } from 'next/server'
function r(min: number, max: number, d=2) { return parseFloat((Math.random()*(max-min)+min).toFixed(d)) }
export async function GET() {
  return NextResponse.json({
    rates:{'USD/KRW':r(1340,1380,0),'EUR/USD':r(1.07,1.11,4),'USD/JPY':r(148,152,2),'BTC/USD':r(85000,92000,0),'ETH/USD':r(3200,3400,0),'XAU/USD':r(2340,2360,2),'KAUS/USD':r(0.98,1.04,4),'WTI/USD':r(78,84,2),'GBP/USD':r(1.26,1.30,4),'AUD/USD':r(0.63,0.66,4)},
    source:'K-Arena Oracle',timestamp:new Date().toISOString(),
  },{headers:{'Access-Control-Allow-Origin':'*','Cache-Control':'no-cache'}})
}
