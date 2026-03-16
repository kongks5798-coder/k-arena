"use client";
import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

interface PricePoint {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

const ASSETS = [
  { symbol: "BTC", name: "Bitcoin", basePrice: 45230, color: "#F7931A" },
  { symbol: "ETH", name: "Ethereum", basePrice: 2850, color: "#627EEA" },
  { symbol: "SOL", name: "Solana", basePrice: 142, color: "#9945FF" },
];

const TIMEFRAMES = ["1H", "4H", "1D", "1W"];

function generateHistory(basePrice: number, points: number): PricePoint[] {
  const data: PricePoint[] = [];
  let price = basePrice * (0.92 + Math.random() * 0.08);
  const now = Date.now();
  for (let i = points; i >= 0; i--) {
    const change = (Math.random() - 0.48) * basePrice * 0.012;
    price = Math.max(price + change, basePrice * 0.7);
    const open = price;
    const high = price * (1 + Math.random() * 0.008);
    const low = price * (1 - Math.random() * 0.008);
    const ts = new Date(now - i * 60 * 60 * 1000);
    data.push({
      time: ts.getHours().toString().padStart(2, "0") + ":00",
      price: Math.round(price * 100) / 100,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      volume: Math.round(Math.random() * 1000 + 200),
    });
  }
  return data;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: PricePoint }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#12163a] border border-[#1e2d52] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{d.time}</p>
      <p className="text-white font-bold text-base">${d.price.toLocaleString()}</p>
      <div className="mt-1 space-y-0.5 text-gray-400">
        <p>고가 <span className="text-green-400">${d.high.toLocaleString()}</span></p>
        <p>저가 <span className="text-red-400">${d.low.toLocaleString()}</span></p>
        <p>거래량 <span className="text-gray-300">{d.volume.toLocaleString()}</span></p>
      </div>
    </div>
  );
};

export default function PriceChart() {
  const [selectedAsset, setSelectedAsset] = useState(0);
  const [selectedTf, setSelectedTf] = useState(2);
  const [data, setData] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [change24h, setChange24h] = useState(0);
  const [isLive, setIsLive] = useState(true);

  const asset = ASSETS[selectedAsset];

  const refresh = useCallback(() => {
    const history = generateHistory(asset.basePrice, 48);
    setData(history);
    const last = history[history.length - 1].price;
    const first = history[0].price;
    setCurrentPrice(last);
    setChange24h(((last - first) / first) * 100);
  }, [asset.basePrice]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setData(prev => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        const change = (Math.random() - 0.48) * asset.basePrice * 0.003;
        const newPrice = Math.max(last.price + change, asset.basePrice * 0.7);
        const now = new Date();
        const newPoint: PricePoint = {
          time: now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0"),
          price: Math.round(newPrice * 100) / 100,
          open: last.price,
          high: Math.max(last.price, newPrice) * (1 + Math.random() * 0.003),
          low: Math.min(last.price, newPrice) * (1 - Math.random() * 0.003),
          volume: Math.round(Math.random() * 500 + 100),
        };
        const updated = [...prev.slice(-47), newPoint];
        setCurrentPrice(newPoint.price);
        setChange24h(((newPoint.price - updated[0].price) / updated[0].price) * 100);
        return updated;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isLive, asset.basePrice]);

  const minPrice = data.length ? Math.min(...data.map(d => d.low)) * 0.999 : 0;
  const maxPrice = data.length ? Math.max(...data.map(d => d.high)) * 1.001 : 0;
  const isPositive = change24h >= 0;
  const chartColor = isPositive ? "#00d4aa" : "#ff4d4f";

  return (
    <div className="bg-[#0d1033] border border-[#1e2d52] rounded-2xl overflow-hidden" data-testid="price-chart">
      {/* Header */}
      <div className="p-5 border-b border-[#1e2d52]">
        <div className="flex items-start justify-between">
          <div>
            {/* Asset tabs */}
            <div className="flex gap-2 mb-3">
              {ASSETS.map((a, i) => (
                <button
                  key={a.symbol}
                  onClick={() => setSelectedAsset(i)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    selectedAsset === i
                      ? "text-black"
                      : "bg-[#1a2040] text-gray-400 hover:text-white"
                  }`}
                  style={selectedAsset === i ? { backgroundColor: a.color } : {}}
                  data-testid={`asset-tab-${a.symbol}`}
                >
                  {a.symbol}
                </button>
              ))}
            </div>
            <p className="text-gray-400 text-xs">{asset.name} / USDT</p>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl font-black text-white" data-testid="current-price">
                ${currentPrice.toLocaleString()}
              </span>
              <span className={`text-sm font-bold ${isPositive ? "text-[#00d4aa]" : "text-red-400"}`} data-testid="price-change">
                {isPositive ? "+" : ""}{change24h.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLive ? "bg-[#00d4aa] animate-pulse" : "bg-gray-500"}`} />
              <button
                onClick={() => setIsLive(v => !v)}
                className="text-xs text-gray-400 hover:text-white transition"
                data-testid="live-toggle"
              >
                {isLive ? "실시간" : "일시정지"}
              </button>
            </div>
            {/* Timeframe */}
            <div className="flex gap-1">
              {TIMEFRAMES.map((tf, i) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTf(i)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                    selectedTf === i
                      ? "bg-[#1e2d52] text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="p-4" data-testid="chart-area">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2040" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "#4a5568", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={7}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              tick={{ fill: "#4a5568", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${Math.round(v).toLocaleString()}`}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={currentPrice}
              stroke={chartColor}
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: chartColor, strokeWidth: 0 }}
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Bar */}
      <div className="px-4 pb-4">
        <p className="text-gray-500 text-xs mb-2">거래량</p>
        <ResponsiveContainer width="100%" height={50}>
          <LineChart data={data} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
            <XAxis dataKey="time" hide />
            <YAxis hide />
            <Line
              type="monotone"
              dataKey="volume"
              stroke="#1e3a5f"
              strokeWidth={1}
              dot={false}
              fill="#1e3a5f"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 border-t border-[#1e2d52]">
        {[
          { label: "24H 고가", value: `$${Math.round(maxPrice).toLocaleString()}`, color: "text-green-400" },
          { label: "24H 저가", value: `$${Math.round(minPrice).toLocaleString()}`, color: "text-red-400" },
          { label: "24H 거래량", value: data.reduce((s, d) => s + d.volume, 0).toLocaleString(), color: "text-gray-300" },
          { label: "시가총액", value: `$${(currentPrice * 19700000).toLocaleString(undefined, { notation: "compact" })}`, color: "text-gray-300" },
        ].map(stat => (
          <div key={stat.label} className="p-3 text-center border-r border-[#1e2d52] last:border-0">
            <p className="text-gray-500 text-[10px] mb-1">{stat.label}</p>
            <p className={`text-xs font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
