'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Send, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react'

type OrderType = 'BUY' | 'SELL'
type OrderMethod = 'MARKET' | 'LIMIT'
type AlertType = 'success' | 'error' | 'info'

interface FormData {
  asset: string
  orderType: OrderType
  orderMethod: OrderMethod
  amount: string
  price: string
}

interface FormError {
  field: string
  message: string
}

interface Alert {
  type: AlertType
  message: string
  id: string
}

const OrderForm = () => {
  const [formData, setFormData] = useState<FormData>({
    asset: 'BTC',
    orderType: 'BUY',
    orderMethod: 'MARKET',
    amount: '',
    price: '',
  })

  const [errors, setErrors] = useState<FormError[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 실시간 가격 데이터 (실제로는 API에서 받음)
  const [prices, setPrices] = useState({
    BTC: 45230,
    ETH: 2850,
    USD: 1,
    KRW: 1300,
  })

  const currentPrice = prices[formData.asset as keyof typeof prices] || 0
  const totalAmount = formData.amount ? (parseFloat(formData.amount) * currentPrice) : 0
  const fee = totalAmount * 0.001
  const finalAmount = totalAmount + fee

  // 알림 추가 함수
  const addAlert = useCallback((type: AlertType, message: string) => {
    const id = Date.now().toString()
    setAlerts(prev => [...prev, { type, message, id }])
    
    // 자동으로 5초 후 제거
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id))
    }, 5000)
  }, [])

  // 알림 수동 제거
  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  // 컴포넌트 마운트 시 실제 가격 로드 (시뮬레이션)
  useEffect(() => {
    const loadPrices = async () => {
      setIsLoading(true)
      try {
        // 실제 API 호출
        // const response = await fetch('/api/prices')
        // const data = await response.json()
        // setPrices(data)
        
        // 시뮬레이션: 500ms 후 완료
        await new Promise(resolve => setTimeout(resolve, 500))
        setIsLoading(false)
      } catch (error) {
        addAlert('error', '가격 정보를 불러올 수 없습니다')
        setIsLoading(false)
      }
    }
    
    loadPrices()
  }, [addAlert])

  // 입력값 변경 - 버그: 버튼 클릭 후 선택값이 안 바뀌는 것 수정
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // 해당 필드의 에러 제거
    setErrors(prev => prev.filter(err => err.field !== name))
  }, [])

  // 주문 타입 변경 - 버그: 클릭이 작동 안 하는 것 수정 (e.preventDefault 추가)
  const handleOrderTypeChange = useCallback((type: OrderType) => {
    setFormData(prev => ({ ...prev, orderType: type }))
    setErrors(prev => prev.filter(err => err.field !== 'orderType'))
  }, [])

  // 주문 방식 변경
  const handleOrderMethodChange = useCallback((method: OrderMethod) => {
    setFormData(prev => ({ ...prev, orderMethod: method }))
    setErrors(prev => prev.filter(err => err.field !== 'orderMethod'))
  }, [])

  // 빠른 수량 입력
  const handleQuickAmount = useCallback((percentage: number) => {
    try {
      const balance = 10000 // 모의 잔액
      const amount = (balance / currentPrice) * (percentage / 100)
      setFormData(prev => ({ ...prev, amount: amount.toFixed(8) }))
      setErrors(prev => prev.filter(err => err.field !== 'amount'))
    } catch (error) {
      addAlert('error', '수량 계산 중 오류가 발생했습니다')
    }
  }, [currentPrice, addAlert])

  // 유효성 검사 - 개선된 에러 핸들링
  const validateForm = (): boolean => {
    const newErrors: FormError[] = []

    // 자산 검증
    if (!formData.asset) {
      newErrors.push({ field: 'asset', message: '자산을 선택하세요' })
    }

    // 수량 검증
    if (!formData.amount || formData.amount.trim() === '') {
      newErrors.push({ field: 'amount', message: '수량을 입력하세요' })
    } else {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.push({ field: 'amount', message: '올바른 수량을 입력하세요' })
      } else if (amount < 0.00001) {
        newErrors.push({ field: 'amount', message: '최소 수량은 0.00001입니다' })
      } else if (amount > 1000000) {
        newErrors.push({ field: 'amount', message: '최대 수량은 1,000,000입니다' })
      }
    }

    // 지정가 검증 (LIMIT 주문만)
    if (formData.orderMethod === 'LIMIT') {
      if (!formData.price || formData.price.trim() === '') {
        newErrors.push({ field: 'price', message: '지정 가격을 입력하세요' })
      } else {
        const price = parseFloat(formData.price)
        if (isNaN(price) || price <= 0) {
          newErrors.push({ field: 'price', message: '올바른 가격을 입력하세요' })
        }
      }
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  // API 호출 함수 - 실제 구현
  const submitOrderToAPI = async (orderData: FormData) => {
    try {
      const response = await fetch('/api/trades/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset: orderData.asset,
          type: orderData.orderType,
          method: orderData.orderMethod,
          amount: parseFloat(orderData.amount),
          price: orderData.orderMethod === 'LIMIT' ? parseFloat(orderData.price) : null,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: 주문 처리 실패`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      throw error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다')
    }
  }

  // 폼 제출 - 버그 수정: API 연동, 에러 핸들링
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (!validateForm()) {
      addAlert('error', '입력값을 확인하고 다시 시도하세요')
      return
    }

    setIsSubmitting(true)

    try {
      // API 호출
      const result = await submitOrderToAPI(formData)

      // 성공
      const orderTypeLabel = formData.orderType === 'BUY' ? '매수' : '매도'
      const orderMethodLabel = formData.orderMethod === 'MARKET' ? '시장가' : '지정가'
      
      addAlert('success', `${orderTypeLabel} ${orderMethodLabel} 주문이 접수되었습니다.\nOrder ID: ${result.orderId || 'N/A'}`)

      // 폼 초기화 (2초 후)
      setTimeout(() => {
        setFormData({
          asset: 'BTC',
          orderType: 'BUY',
          orderMethod: 'MARKET',
          amount: '',
          price: '',
        })
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '주문 처리 중 오류가 발생했습니다'
      addAlert('error', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, addAlert])

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-k-teal animate-spin mx-auto mb-3" />
          <p className="text-gray-400">가격 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* 알림 영역 - 화면 상단에 고정 */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg flex gap-3 items-start animate-in slide-in-from-top ${
              alert.type === 'success'
                ? 'bg-k-success/20 border border-k-success/50'
                : alert.type === 'error'
                ? 'bg-k-danger/20 border border-k-danger/50'
                : 'bg-k-blue/20 border border-k-blue/50'
            }`}
          >
            <div className="flex-1">
              {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-k-success flex-shrink-0 mt-0.5" />}
              {alert.type === 'error' && <AlertCircle className="w-5 h-5 text-k-danger flex-shrink-0 mt-0.5" />}
              {alert.type === 'info' && <AlertCircle className="w-5 h-5 text-k-blue flex-shrink-0 mt-0.5" />}
            </div>
            <p className={`text-sm font-semibold whitespace-pre-line flex-1 ${
              alert.type === 'success'
                ? 'text-k-success'
                : alert.type === 'error'
                ? 'text-k-danger'
                : 'text-k-blue'
            }`}>
              {alert.message}
            </p>
            <button
              onClick={() => removeAlert(alert.id)}
              className="flex-shrink-0 mt-0.5 hover:opacity-70 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* 메인 카드 */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">주문 하기</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 자산 선택 */}
          <div>
            <label className="block text-sm font-semibold mb-2">자산 선택</label>
            <select
              name="asset"
              value={formData.asset}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-k-darker/50 border border-k-teal/30 rounded-lg text-white focus:border-k-teal focus:bg-k-darker focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="BTC">Bitcoin (BTC) - ${prices.BTC.toLocaleString()}</option>
              <option value="ETH">Ethereum (ETH) - ${prices.ETH.toLocaleString()}</option>
              <option value="USD">US Dollar (USD) - ${prices.USD.toLocaleString()}</option>
              <option value="KRW">Korean Won (KRW) - ₩{prices.KRW.toLocaleString()}</option>
            </select>
          </div>

          {/* 현재 가격 표시 */}
          <div className="p-4 bg-k-teal/10 rounded-lg border border-k-teal/20">
            <p className="text-gray-400 text-sm mb-1">현재 가격</p>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-k-teal">
                {formData.asset === 'KRW' 
                  ? `₩${currentPrice.toLocaleString()}`
                  : `$${currentPrice.toLocaleString()}`
                }
              </p>
              <p className="text-sm text-k-success">+2.34% 24h</p>
            </div>
          </div>

          {/* BUY/SELL 선택 - 버그 수정: 버튼 클릭 작동 */}
          <div>
            <label className="block text-sm font-semibold mb-3">주문 유형</label>
            <div className="grid grid-cols-2 gap-3">
              {['BUY', 'SELL'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleOrderTypeChange(type as OrderType)}
                  disabled={isSubmitting}
                  className={`py-3 px-4 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.orderType === type
                      ? type === 'BUY'
                        ? 'bg-k-success text-white shadow-lg shadow-k-success/20'
                        : 'bg-k-danger text-white shadow-lg shadow-k-danger/20'
                      : 'bg-k-darker/50 text-gray-300 hover:bg-k-darker active:opacity-80'
                  }`}
                >
                  {type === 'BUY' ? '매수' : '매도'}
                </button>
              ))}
            </div>
          </div>

          {/* 주문 방식 선택 */}
          <div>
            <label className="block text-sm font-semibold mb-3">주문 방식</label>
            <div className="grid grid-cols-2 gap-3">
              {['MARKET', 'LIMIT'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleOrderMethodChange(method as OrderMethod)}
                  disabled={isSubmitting}
                  className={`py-2 px-4 rounded-lg font-semibold transition text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.orderMethod === method
                      ? 'bg-k-teal text-white shadow-lg shadow-k-teal/20'
                      : 'bg-k-darker/50 text-gray-300 hover:bg-k-darker active:opacity-80'
                  }`}
                >
                  {method === 'MARKET' ? '시장가' : '지정가'}
                </button>
              ))}
            </div>
          </div>

          {/* 수량 입력 */}
          <div>
            <label className="block text-sm font-semibold mb-2">수량</label>
            <input
              type="number"
              step="0.00001"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="0.00000"
              className={`w-full px-4 py-3 bg-k-darker/50 border rounded-lg text-white placeholder-gray-500 focus:bg-k-darker focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.some(e => e.field === 'amount')
                  ? 'border-k-danger focus:border-k-danger'
                  : 'border-k-teal/30 focus:border-k-teal'
              }`}
            />
            <p className="text-xs text-gray-400 mt-2">{formData.asset} 수량</p>

            {/* 에러 메시지 */}
            {errors.some(e => e.field === 'amount') && (
              <p className="text-xs text-k-danger mt-1 flex gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                {errors.find(e => e.field === 'amount')?.message}
              </p>
            )}

            {/* 빠른 수량 입력 버튼 */}
            <div className="flex gap-2 mt-3">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickAmount(pct)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs rounded bg-k-teal/20 text-k-teal hover:bg-k-teal/30 transition disabled:opacity-50 disabled:cursor-not-allowed active:opacity-80"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* 지정가 입력 (LIMIT만) */}
          {formData.orderMethod === 'LIMIT' && (
            <div className="animate-in fade-in">
              <label className="block text-sm font-semibold mb-2">지정 가격</label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="0.00"
                className={`w-full px-4 py-3 bg-k-darker/50 border rounded-lg text-white placeholder-gray-500 focus:bg-k-darker focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.some(e => e.field === 'price')
                    ? 'border-k-danger focus:border-k-danger'
                    : 'border-k-teal/30 focus:border-k-teal'
                }`}
              />
              <p className="text-xs text-gray-400 mt-2">주문 가격</p>

              {/* 에러 메시지 */}
              {errors.some(e => e.field === 'price') && (
                <p className="text-xs text-k-danger mt-1 flex gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  {errors.find(e => e.field === 'price')?.message}
                </p>
              )}
            </div>
          )}

          {/* 주문 요약 */}
          {formData.amount && !isNaN(parseFloat(formData.amount)) && parseFloat(formData.amount) > 0 && (
            <div className="p-4 bg-k-darker/50 rounded-lg border border-k-teal/20">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">주문 금액</span>
                  <span className="font-semibold">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">수수료 (0.1%)</span>
                  <span className="font-semibold">${fee.toFixed(2)}</span>
                </div>
                <div className="border-t border-k-teal/20 pt-2 flex justify-between">
                  <span className="text-white font-semibold">총액</span>
                  <span className="font-bold text-k-teal">${finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 모음 */}
          {errors.length > 0 && (
            <div className="p-4 bg-k-danger/20 border border-k-danger/50 rounded-lg space-y-2">
              {errors.map((error, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-k-danger flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-k-danger">{error.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* 제출 버튼 - 버그 수정: disabled 상태 처리 */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className={`w-full py-4 rounded-lg font-bold transition flex items-center justify-center gap-2 min-h-[50px] ${
              isSubmitting
                ? 'opacity-60 cursor-not-allowed'
                : formData.orderType === 'BUY'
                ? 'bg-k-success hover:bg-k-success/90 active:bg-k-success text-white'
                : 'bg-k-danger hover:bg-k-danger/90 active:bg-k-danger text-white'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {formData.orderType === 'BUY' ? '매수 주문' : '매도 주문'}
              </>
            )}
          </button>

          {/* 면책 조항 */}
          <p className="text-xs text-gray-500 text-center">
            이 거래는 테스트 목적입니다. 실제 자산은 움직이지 않습니다.
          </p>
        </form>
      </div>
    </div>
  )
}

export default OrderForm
