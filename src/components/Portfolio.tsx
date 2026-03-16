'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { ArrowUpRight, ArrowDownLeft, Eye, EyeOff, Download, RefreshCw } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type TabType = 'overview' | 'history' | 'analytics' | 'settings'
type SortKey = 'date' | 'amount' | 'asset' | 'type'
type SortOrder = 'asc' | 'desc'

interface Asset {
  symbol: string
  name: string
  amount: number
  currentPrice: number
  purchasePrice: number
  change24h: number
}

interface Transaction {
  id: string
  type: 'BUY' | 'SELL'
  asset: string
  amount: number
  price: number
  total: number
  fee: number
  date: Date
  status: 'completed' | 'pending' | 'failed'
}

interface AnalyticsData {
  date: string
  balance: number
  profit: number
  volume: number
}

const Portfolio = () => {
  // 상태 관리
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [hideBalance, setHideBalance] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // 자산 데이터
  const [assets] = useState<Asset[]>([
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: 0.5234,
      currentPrice: 45230,
      purchasePrice: 42100,
      change24h: 2.34,
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 3.15,
      currentPrice: 2850,
      purchasePrice: 2650,
      change24h: 1.89,
    },
    {
      symbol: 'USD',
      name: 'US Dollar',
      amount: 5000,
      currentPrice: 1,
      purchasePrice: 1,
      change24h: 0,
    },
  ])

  // 거래 내역 데이터
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'BUY',
      asset: 'BTC',
      amount: 0.5234,
      price: 42100,
      total: 22029.704,
      fee: 22.03,
      date: new Date('2024-03-10'),
      status: 'completed',
    },
    {
      id: '2',
      type: 'BUY',
      asset: 'ETH',
      amount: 3.15,
      price: 2650,
      total: 8347.5,
      fee: 8.35,
      date: new Date('2024-03-08'),
      status: 'completed',
    },
    {
      id: '3',
      type: 'SELL',
      asset: 'BTC',
      amount: 0.1,
      price: 44500,
      total: 4450,
      fee: 4.45,
      date: new Date('2024-03-05'),
      status: 'completed',
    },
    {
      id: '4',
      type: 'BUY',
      asset: 'ETH',
      amount: 1.5,
      price: 2500,
      total: 3750,
      fee: 3.75,
      date: new Date('2024-03-01'),
      status: 'completed',
    },
  ])

  // 분석 데이터
  const analyticsData: AnalyticsData[] = useMemo(() => {
    const dates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      return d.toISOString().split('T')[0]
    })

    return dates.map((date, idx) => ({
      date: date.slice(5),
      balance: 30000 + (idx * 150) + Math.random() * 1000,
      profit: idx * 120 + Math.random() * 500,
      volume: Math.random() * 50000 + 10000,
    }))
  }, [])

  // 계산된 값
  const totalBalance = useMemo(() => {
    return assets.reduce((sum, asset) => sum + (asset.amount * asset.currentPrice), 0)
  }, [assets])

  const totalInvested = useMemo(() => {
    return assets.reduce((sum, asset) => sum + (asset.amount * asset.purchasePrice), 0)
  }, [assets])

  const totalProfit = totalBalance - totalInvested
  const profitPercent = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0

  // 정렬된 거래 내역
  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      let aVal: any = a[sortKey]
      let bVal: any = b[sortKey]

      if (sortKey === 'date') {
        aVal = a.date.getTime()
        bVal = b.date.getTime()
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [transactions, sortKey, sortOrder])

  // 탭 변경 - 버그 수정: 클릭 작동
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
  }, [])

  // 정렬 변경
  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }, [sortKey, sortOrder])

  // 새로고침
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))
      // 실제로는 여기서 데이터를 새로 로드함
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // 차트 색상
  const COLORS = ['#00D084', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']

  const pieData = useMemo(() => {
    return assets
      .filter(a => a.currentPrice > 0)
      .map(asset => ({
        name: asset.symbol,
        value: asset.amount * asset.currentPrice,
      }))
      .filter(item => item.value > 0)
  }, [assets])

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold">포트폴리오</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-k-darker/50 hover:bg-k-darker transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="새로고침"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 총 잔액 표시 */}
        <div className="mt-6 p-6 bg-gradient-to-br from-k-teal/20 to-k-blue/20 rounded-xl border border-k-teal/30">
          <p className="text-gray-400 text-sm mb-2">총 자산</p>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className={`text-4xl font-bold transition-all ${hideBalance ? 'blur-lg' : ''}`}>
                  ${totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  className="p-1 hover:bg-k-darker/50 rounded transition"
                  title={hideBalance ? '표시' : '숨기기'}
                >
                  {hideBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              <p className={`text-sm text-gray-400 mt-1 ${
                totalProfit >= 0 ? 'text-k-success' : 'text-k-danger'
              }`}>
                {totalProfit >= 0 ? '+' : ''} ${totalProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })} ({profitPercent.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 - 버그 수정: 클릭 작동 */}
      <div className="mb-8 border-b border-k-teal/20">
        <div className="flex gap-8">
          {[
            { id: 'overview', label: '개요', icon: '📊' },
            { id: 'history', label: '거래 내역', icon: '📜' },
            { id: 'analytics', label: '분석', icon: '📈' },
            { id: 'settings', label: '설정', icon: '⚙️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`py-3 px-1 border-b-2 transition font-semibold ${
                activeTab === tab.id
                  ? 'border-k-teal text-k-teal'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="animate-in fade-in">
        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 자산 목록 */}
            <div>
              <h2 className="text-2xl font-bold mb-4">보유 자산</h2>
              <div className="grid grid-cols-1 gap-4">
                {assets.map(asset => {
                  const value = asset.amount * asset.currentPrice
                  const change = ((asset.currentPrice - asset.purchasePrice) / asset.purchasePrice) * 100
                  const profit = value - (asset.amount * asset.purchasePrice)

                  return (
                    <div
                      key={asset.symbol}
                      className="p-4 bg-k-darker/50 rounded-lg border border-k-teal/20 hover:border-k-teal/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-lg">{asset.symbol}</p>
                            <p className="text-gray-400 text-sm">{asset.name}</p>
                          </div>
                          <p className="text-sm text-gray-400">
                            {asset.amount.toFixed(8)} {asset.symbol} @ ${asset.currentPrice.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl">${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                          <p className={`text-sm font-semibold ${
                            profit >= 0 ? 'text-k-success' : 'text-k-danger'
                          }`}>
                            {profit >= 0 ? '+' : ''} ${profit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </p>
                          <p className={`text-xs mt-1 ${
                            change >= 0 ? 'text-k-success' : 'text-k-danger'
                          }`}>
                            {change >= 0 ? '+' : ''} {change.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 자산 분포 차트 */}
            {pieData.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">자산 분포</h2>
                <div className="p-6 bg-k-darker/50 rounded-lg border border-k-teal/20">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${(value / totalBalance * 100).toFixed(1)}%`}
                        outerRadius={100}
                        fill="#00D084"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0a0e27',
                          border: '1px solid rgba(0, 208, 132, 0.3)',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => `$${(value as number).toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 최근 거래 */}
            <div>
              <h2 className="text-2xl font-bold mb-4">최근 거래</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sortedTransactions.slice(0, 5).map(tx => (
                  <div
                    key={tx.id}
                    className="p-4 bg-k-darker/50 rounded-lg border border-k-teal/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        tx.type === 'BUY'
                          ? 'bg-k-success/20'
                          : 'bg-k-danger/20'
                      }`}>
                        {tx.type === 'BUY'
                          ? <ArrowDownLeft className={`w-5 h-5 text-k-success`} />
                          : <ArrowUpRight className={`w-5 h-5 text-k-danger`} />
                        }
                      </div>
                      <div>
                        <p className="font-semibold">
                          {tx.type === 'BUY' ? '매수' : '매도'} {tx.asset}
                        </p>
                        <p className="text-sm text-gray-400">
                          {tx.date.toLocaleDateString('ko-KR')} - {tx.amount} {tx.asset}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${tx.total.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                      <p className={`text-sm ${
                        tx.status === 'completed' ? 'text-k-success' : tx.status === 'pending' ? 'text-yellow-400' : 'text-k-danger'
                      }`}>
                        {tx.status === 'completed' ? '완료' : tx.status === 'pending' ? '대기 중' : '실패'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 거래 내역 탭 */}
        {activeTab === 'history' && (
          <div>
            <div className="mb-6 flex gap-4 items-center overflow-x-auto">
              {(['date', 'amount', 'asset', 'type'] as SortKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                    sortKey === key
                      ? 'bg-k-teal text-white'
                      : 'bg-k-darker/50 text-gray-300 hover:bg-k-darker'
                  }`}
                >
                  {key === 'date' && '날짜'}
                  {key === 'amount' && '수량'}
                  {key === 'asset' && '자산'}
                  {key === 'type' && '유형'}
                  {sortKey === key && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedTransactions.map(tx => (
                <div
                  key={tx.id}
                  className="p-4 bg-k-darker/50 rounded-lg border border-k-teal/20 hover:border-k-teal/50 transition"
                >
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">날짜</p>
                      <p className="font-semibold">{tx.date.toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">유형</p>
                      <p className={`font-semibold ${tx.type === 'BUY' ? 'text-k-success' : 'text-k-danger'}`}>
                        {tx.type === 'BUY' ? '매수' : '매도'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">자산</p>
                      <p className="font-semibold">{tx.asset}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">수량/가격</p>
                      <p className="font-semibold">{tx.amount} @ ${tx.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">총액</p>
                      <p className="font-semibold">${tx.total.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 분석 탭 */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* 잔액 추이 */}
            <div>
              <h2 className="text-2xl font-bold mb-4">잔액 추이</h2>
              <div className="p-6 bg-k-darker/50 rounded-lg border border-k-teal/20">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D084" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00D084" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 208, 132, 0.1)" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0e27',
                        border: '1px solid rgba(0, 208, 132, 0.3)',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => `$${(value as number).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#00D084"
                      fillOpacity={1}
                      fill="url(#colorBalance)"
                      name="잔액"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 거래량 */}
            <div>
              <h2 className="text-2xl font-bold mb-4">거래량</h2>
              <div className="p-6 bg-k-darker/50 rounded-lg border border-k-teal/20">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 208, 132, 0.1)" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0e27',
                        border: '1px solid rgba(0, 208, 132, 0.3)',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => `$${(value as number).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                    />
                    <Bar dataKey="volume" fill="#00D084" name="거래량" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 설정 탭 */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="p-6 bg-k-darker/50 rounded-lg border border-k-teal/20">
              <h2 className="text-2xl font-bold mb-6">포트폴리오 설정</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">잔액 표시</p>
                    <p className="text-sm text-gray-400">포트폴리오 페이지에서 잔액을 표시합니다</p>
                  </div>
                  <button
                    onClick={() => setHideBalance(!hideBalance)}
                    className={`px-4 py-2 rounded-lg transition ${
                      hideBalance
                        ? 'bg-k-darker text-gray-400'
                        : 'bg-k-teal text-white'
                    }`}
                  >
                    {hideBalance ? '숨김' : '표시'}
                  </button>
                </div>

                <div className="border-t border-k-teal/20 pt-4">
                  <p className="font-semibold mb-2">데이터 내보내기</p>
                  <button className="flex items-center gap-2 px-4 py-2 bg-k-teal/20 text-k-teal rounded-lg hover:bg-k-teal/30 transition">
                    <Download className="w-4 h-4" />
                    CSV 내보내기
                  </button>
                </div>

                <div className="border-t border-k-teal/20 pt-4">
                  <p className="font-semibold text-k-danger">위험 영역</p>
                  <button className="mt-2 px-4 py-2 bg-k-danger/20 text-k-danger rounded-lg hover:bg-k-danger/30 transition">
                    포트폴리오 초기화
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Portfolio
