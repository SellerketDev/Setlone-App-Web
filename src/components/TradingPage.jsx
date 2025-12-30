import React, { useState, useEffect, useRef } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts'
import {
  subscribeToPrice as subscribeToCryptoPrice,
  subscribeToCandles as subscribeToCryptoCandles,
  getHistoricalCandles as getCryptoHistoricalCandles,
  getCurrentPrice as getCryptoCurrentPrice,
} from '../utils/binanceApi'
import {
  subscribeToPrice as subscribeToStockPrice,
  subscribeToCandles as subscribeToStockCandles,
  getHistoricalCandles as getStockHistoricalCandles,
  getCurrentPrice as getStockCurrentPrice,
  subscribeToCommodityPrice,
  subscribeToCommodityCandles,
  getCommodityHistoricalCandles,
  getCommodityCurrentPrice,
  subscribeToBondPrice,
  subscribeToBondCandles,
  getBondHistoricalCandles,
  getBondCurrentPrice,
  subscribeToCurrencyPrice,
  subscribeToCurrencyCandles,
  getCurrencyHistoricalCandles,
  getCurrencyCurrentPrice
} from '../utils/stockApi'
import {
  subscribeToPrice as subscribeToFuturesPrice,
  subscribeToCandles as subscribeToFuturesCandles,
  getHistoricalCandles as getFuturesHistoricalCandles,
  getCurrentPrice as getFuturesCurrentPrice,
} from '../utils/futuresApi'
import './TradingPage.css'

const TradingPage = ({ item, language: propLanguage, onBack }) => {
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [tradingMode, setTradingMode] = useState('manual') // manual, auto
  const [orderType, setOrderType] = useState('market') // market, limit
  const [side, setSide] = useState('buy') // buy, sell (또는 long, short for futures)
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  // 선물 거래 관련 상태
  const [leverage, setLeverage] = useState(10) // 레버리지 (1x ~ 100x)
  const [positionType, setPositionType] = useState('long') // long, short (선물 거래용)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [currentPriceString, setCurrentPriceString] = useState('0')
  const [priceChange, setPriceChange] = useState(0)
  const [priceChangePercent, setPriceChangePercent] = useState(0)
  const [isLoading, setIsLoading] = useState(true)


  // AI 트레이딩 관련 상태
  const [aiStrategy, setAiStrategy] = useState('momentum') // momentum, mean_reversion, trend_following
  const [isAiTradingActive, setIsAiTradingActive] = useState(false)
  const [aiSignals, setAiSignals] = useState([]) // AI 신호 배열
  const [tradeHistory, setTradeHistory] = useState([]) // 통합 거래 내역 (수동 + 자동)
  const [tradeHistoryFilter, setTradeHistoryFilter] = useState('all') // all, manual, auto
  const [tradingStats, setTradingStats] = useState({
    totalTrades: 0,
    winRate: 0,
    totalProfit: 0,
    profitPercent: 0
  })
  const [notifications, setNotifications] = useState([]) // 알림 메시지

  // 자산 현황 상태
  const initialTotalAssets = 5000
  const [assets, setAssets] = useState({
    totalAssets: initialTotalAssets, // 총 자산 (USD)
    initialAssets: initialTotalAssets, // 초기 자산 (수익률 계산용) - 현재 총 자산과 동일하게 시작
    cashBalance: 5000, // 현금 잔고
    holdings: {
      amount: 0, // 보유 수량
      averagePrice: 0, // 평균 매수가
      currentValue: 0, // 현재 평가액
      profitLoss: 0, // 평가 손익
      profitLossPercent: 0 // 평가 손익률
    }
  })

  // 초기 자산을 현재 총 자산으로 설정 (컴포넌트 마운트 시 한 번만)
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      setAssets(prev => ({
        ...prev,
        initialAssets: prev.totalAssets // 초기 자산을 현재 총 자산과 동일하게 설정
      }))
    }
  }, []) // 마운트 시 한 번만 실행

  // 보유 수량이 없으면 매수 탭으로 강제 전환
  useEffect(() => {
    if (assets.holdings.amount === 0 && side === 'sell') {
      setSide('buy')
    }
  }, [assets.holdings.amount, side])

  // 리스크 관리 설정
  const [riskSettings, setRiskSettings] = useState({
    stopLoss: 5, // 손절: 5%
    takeProfit: 10, // 익절: 10%
    maxLoss: 20, // 최대 손실: 20%
    positionSize: 10 // 포지션 크기: 10% (잔고의 10%)
  })

  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const wsUnsubscribeRef = useRef(null)
  const candleUnsubscribeRef = useRef(null)
  const lastChartTimeRef = useRef(null) // 차트의 마지막 타임스탬프 추적

  // AI 트레이딩 관련 refs
  const priceHistoryRef = useRef([]) // 가격 히스토리 (전략 분석용)
  const lastSignalTimeRef = useRef(0) // 마지막 신호 생성 시간
  const aiTradingIntervalRef = useRef(null) // AI 트레이딩 인터벌
  const positionsRef = useRef([]) // 현재 포지션 (매수/매도)

  useEffect(() => {
    if (propLanguage && propLanguage !== language) {
      setLanguage(propLanguage)
    }
  }, [propLanguage, language])

  // 가상화폐인 경우 Binance API로 실시간 데이터 받기
  useEffect(() => {
    // 주식, 암호화폐, 선물은 API를 사용하므로 여기서는 다른 카테고리만 처리
    if (item.category !== 'crypto' && item.category !== 'stocks' && item.category !== 'futures' && item.category !== 'commodities' && item.category !== 'etf' && item.category !== 'bonds' && item.category !== 'currency') {
      // 가상화폐, 주식, 선물, 원자재, ETF, 채권, 외화가 아닌 경우 기존 시뮬레이션 사용
      const basePrice = 150
      const interval = setInterval(() => {
        const change = (Math.random() - 0.5) * basePrice * 0.02
        const newPrice = basePrice + change
        setCurrentPrice(newPrice)
        setPriceChange(change)
        setPriceChangePercent((change / basePrice) * 100)
      }, 2000)
      setCurrentPrice(basePrice)
      setIsLoading(false)
      return () => clearInterval(interval)
    }

    // 가상화폐, 주식, 선물인 경우 API 사용
    let isMounted = true

    const initializeData = async () => {
      try {
        // 카테고리에 따라 다른 API 사용
        const isCrypto = item.category === 'crypto'
        const isStock = item.category === 'stocks'
        const isFutures = item.category === 'futures'
        const isCommodity = item.category === 'commodities'
        const isETF = item.category === 'etf'
        const isBond = item.category === 'bonds'
        const isCurrency = item.category === 'currency'
        const getPrice = isCrypto ? getCryptoCurrentPrice
          : (isStock ? getStockCurrentPrice
            : (isFutures ? getFuturesCurrentPrice
              : (isCommodity ? getCommodityCurrentPrice
                : (isETF ? getStockCurrentPrice
                  : (isBond ? getBondCurrentPrice
                    : (isCurrency ? getCurrencyCurrentPrice : null))))))
        const subscribePrice = isCrypto ? subscribeToCryptoPrice
          : (isStock ? subscribeToStockPrice
            : (isFutures ? subscribeToFuturesPrice
              : (isCommodity ? subscribeToCommodityPrice
                : (isETF ? subscribeToStockPrice
                  : (isBond ? subscribeToBondPrice
                    : (isCurrency ? subscribeToCurrencyPrice : null))))))

        if (!getPrice || !subscribePrice) {
          // 지원하지 않는 카테고리
          setIsLoading(false)
          return
        }

        // 초기 가격 가져오기
        const initialPriceData = await getPrice(item.symbol)

        if (isMounted && initialPriceData) {
          setCurrentPrice(initialPriceData.price)
          setCurrentPriceString(initialPriceData.priceString || initialPriceData.price.toString())
        }

        // 실시간 가격 구독
        const unsubscribePrice = subscribePrice(item.symbol, (data) => {
          if (isMounted) {

            setCurrentPrice(data.price)
            setCurrentPriceString(data.priceString || data.price.toString())
            setPriceChange(data.priceChange)
            setPriceChangePercent(data.priceChangePercent)
            setIsLoading(false)


            // 자산 현황 업데이트 (현재 평가액)
            setAssets(prev => {
              const newCurrentValue = prev.holdings.amount * data.price
              const newProfitLoss = newCurrentValue - (prev.holdings.averagePrice * prev.holdings.amount)
              const newProfitLossPercent = prev.holdings.averagePrice > 0 && prev.holdings.amount > 0
                ? (newProfitLoss / (prev.holdings.averagePrice * prev.holdings.amount)) * 100
                : 0

              const newTotalAssets = prev.cashBalance + newCurrentValue

              // 선물 거래 청산 체크 (바이낸스 방식)
              if (item.category === 'futures' && prev.holdings.amount !== 0) {
                // 사용된 마진 계산
                const posAmount = Math.abs(prev.holdings.amount)
                const entPrice = prev.holdings.averagePrice
                const usedMargin = (entPrice * posAmount) / leverage

                // 바이낸스 방식 손익 계산
                const isLong = prev.holdings.amount > 0
                const unrealizedPnL = isLong
                  ? (data.price - entPrice) * posAmount * leverage // 롱: (현재가 - 진입가) * 수량 * 레버리지
                  : (entPrice - data.price) * posAmount * leverage // 숏: (진입가 - 현재가) * 수량 * 레버리지

                // 현재 마진 = 사용된 마진 + 손익
                const currentMargin = usedMargin + unrealizedPnL

                // 바이낸스 기준: 유지 증거금률 계산
                // 유지 증거금률 = (유지 증거금 / 포지션 가치) * 100
                // 바이낸스는 일반적으로 유지 증거금률이 0.5% ~ 2% 정도
                // 여기서는 1%를 기준으로 사용 (포지션 크기에 따라 조정 가능)
                const positionSize = Math.abs(prev.holdings.amount) * data.price
                const maintenanceMarginRate = 0.01 // 1% (바이낸스 기준)
                const requiredMaintenanceMargin = positionSize * maintenanceMarginRate

                // 현재 마진이 유지 증거금보다 낮으면 청산
                if (currentMargin < requiredMaintenanceMargin && currentMargin < usedMargin) {
                  // 자동 청산 실행
                  const marginRatio = usedMargin > 0 ? (currentMargin / usedMargin) * 100 : 0

                  // 청산 알림 추가
                  setNotifications(prev => [...prev, {
                    id: Date.now(),
                    type: 'liquidation',
                    message: language === 'ko'
                      ? `⚠️ 강제 청산: ${item.symbol} 포지션이 마진 부족으로 청산되었습니다.`
                      : `⚠️ Liquidation: ${item.symbol} position liquidated due to insufficient margin.`,
                    timestamp: Date.now()
                  }])

                  // 포지션 청산: 마진 반환 (손실 반영)
                  const remainingMargin = Math.max(0, currentMargin) // 음수 방지
                  const liquidationLoss = usedMargin - remainingMargin

                  return {
                    totalAssets: prev.cashBalance + remainingMargin, // 남은 마진만 반환
                    initialAssets: prev.initialAssets,
                    cashBalance: prev.cashBalance + remainingMargin,
                    holdings: {
                      amount: 0,
                      averagePrice: 0,
                      currentValue: 0,
                      profitLoss: -liquidationLoss, // 청산 손실
                      profitLossPercent: -((liquidationLoss / usedMargin) * 100)
                    }
                  }
                }
              }

              return {
                ...prev,
                totalAssets: newTotalAssets,
                initialAssets: prev.initialAssets, // 초기 자산은 유지
                holdings: {
                  ...prev.holdings,
                  currentValue: newCurrentValue,
                  profitLoss: newProfitLoss,
                  profitLossPercent: newProfitLossPercent
                }
              }
            })
          }
        })
        wsUnsubscribeRef.current = unsubscribePrice


      } catch (error) {
        // console.error('Error initializing price data:', error)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initializeData()

    return () => {
      isMounted = false
      if (wsUnsubscribeRef.current) {
        wsUnsubscribeRef.current()
      }
    }
  }, [item])

  // 차트 초기화 (컨테이너가 준비된 후) - 모든 카테고리 (암호화폐, 주식, 선물, 원자재, ETF, 채권, 외화)
  useEffect(() => {
    // 모든 카테고리에서 lightweight-charts 사용
    if (item.category !== 'crypto' && item.category !== 'stocks' && item.category !== 'futures' && item.category !== 'commodities' && item.category !== 'etf' && item.category !== 'bonds' && item.category !== 'currency') {
      return
    }

    let isMounted = true
    let timer = null

    const initializeChart = async () => {
      // 컨테이너가 없거나 이미 차트가 있으면 리턴
      if (!chartContainerRef.current) {
        return
      }

      if (chartRef.current) {
        return
      }

      try {
        // 차트 생성
        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#ffffff',
          },
          grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
          },
          width: chartContainerRef.current.clientWidth,
          height: 400,
          handleScroll: {
            mouseWheel: false, /* 가로 스크롤은 드래그로만 (마우스 휠은 줌에 사용) */
            pressedMouseMove: true, /* 마우스 드래그로 좌우 이동 */
            horzTouchDrag: true, /* 가로 터치 드래그 */
            vertTouchDrag: false, /* 세로 터치 드래그 비활성화 (차트가 아래로 내려가지 않도록) */
          },
          handleScale: {
            axisPressedMouseMove: {
              time: true,
              price: true,
            },
            axisDoubleClickReset: {
              time: true,
              price: true,
            },
            axisTouchDrag: {
              time: true,
              price: true,
            },
            mouseWheel: true, /* 마우스 휠 세로 스크롤 = 줌인/줌아웃 */
            pinch: true, /* 핀치 줌 */
          },
          crosshair: {
            mode: 0, // Normal mode (allows interaction)
            vertLine: {
              color: '#758696',
              width: 1,
              style: 0,
              visible: true,
              labelVisible: true,
            },
            horzLine: {
              color: '#758696',
              width: 1,
              style: 0,
              visible: true,
              labelVisible: true,
            },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            timezone: 'Asia/Seoul', // 한국 시간대 설정
            rightOffset: 0,
            barSpacing: 6,
            minBarSpacing: 0.5,
            fixLeftEdge: false,
            fixRightEdge: false,
            lockVisibleTimeRangeOnResize: false,
            rightBarStaysOnScroll: false,
            borderVisible: true,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            allowShiftVisibleRangeOnWhitespaceClick: true,
            allowBoldLabels: true,
          },
          rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            visible: true,
            ticksVisible: true,
            entireTextOnly: false,
          },
          leftPriceScale: {
            visible: false,
          },
          localization: {
            locale: 'ko-KR',
            timeFormatter: (businessDayOrTimestamp) => {
              try {
                // 타임스탬프는 UTC 기준 (바이낸스와 동일)
                // KST로 변환하여 표시
                let timestamp
                if (typeof businessDayOrTimestamp === 'number') {
                  timestamp = businessDayOrTimestamp
                } else if (businessDayOrTimestamp && typeof businessDayOrTimestamp.year === 'number') {
                  // BusinessDay 형식인 경우
                  const date = new Date(Date.UTC(businessDayOrTimestamp.year, businessDayOrTimestamp.month - 1, businessDayOrTimestamp.day))
                  timestamp = Math.floor(date.getTime() / 1000)
                } else {
                  timestamp = businessDayOrTimestamp
                }

                // UTC 타임스탬프를 KST로 변환
                const utcDate = new Date(timestamp * 1000)

                // KST 시간 계산 (UTC+9)
                const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))

                // MM/DD HH:mm 형식으로 포맷팅
                const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0')
                const day = String(kstDate.getUTCDate()).padStart(2, '0')
                const hours = String(kstDate.getUTCHours()).padStart(2, '0')
                const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0')

                const formatted = `${month}/${day} ${hours}:${minutes}`


                return formatted
              } catch (error) {
                // 에러 발생 시 기본값 반환
                return String(businessDayOrTimestamp)
              }
            }
          },
        })

        // lightweight-charts 5.x에서는 addSeries를 사용하며, CandlestickSeries 상수를 첫 번째 인자로 전달
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#4caf50',
          downColor: '#f44336',
          borderVisible: false,
          wickUpColor: '#4caf50',
          wickDownColor: '#f44336',
        })

        chartRef.current = chart
        seriesRef.current = candlestickSeries

        // 차트 상호작용 옵션 명시적으로 적용
        chart.applyOptions({
          handleScroll: {
            mouseWheel: false, /* 가로 스크롤은 드래그로만 (마우스 휠은 줌에 사용) */
            pressedMouseMove: true, /* 마우스 드래그로 좌우 이동 */
            horzTouchDrag: true, /* 가로 터치 드래그 */
            vertTouchDrag: false, /* 세로 터치 드래그 비활성화 (차트가 아래로 내려가지 않도록) */
          },
          handleScale: {
            axisPressedMouseMove: {
              time: true,
              price: true,
            },
            axisDoubleClickReset: {
              time: true,
              price: true,
            },
            axisTouchDrag: {
              time: true,
              price: true,
            },
            mouseWheel: true, /* 마우스 휠 세로 스크롤 = 줌인/줌아웃 */
            pinch: true, /* 핀치 줌 */
          },
          timeScale: {
            rightBarStaysOnScroll: false,
            allowShiftVisibleRangeOnWhitespaceClick: true,
          },
        })

        // 카테고리에 따라 다른 API 사용
        const isCrypto = item.category === 'crypto'
        const isStock = item.category === 'stocks'
        const isFutures = item.category === 'futures'
        const isCommodity = item.category === 'commodities'
        const isETF = item.category === 'etf'
        const isBond = item.category === 'bonds'
        const isCurrency = item.category === 'currency'
        const getHistorical = isCrypto ? getCryptoHistoricalCandles
          : (isStock ? getStockHistoricalCandles
            : (isFutures ? getFuturesHistoricalCandles
              : (isCommodity ? getCommodityHistoricalCandles
                : (isETF ? getStockHistoricalCandles
                  : (isBond ? getBondHistoricalCandles
                    : (isCurrency ? getCurrencyHistoricalCandles : null))))))
        const subscribeCandles = isCrypto ? subscribeToCryptoCandles
          : (isStock ? subscribeToStockCandles
            : (isFutures ? subscribeToFuturesCandles
              : (isCommodity ? subscribeToCommodityCandles
                : (isETF ? subscribeToStockCandles
                  : (isBond ? subscribeToBondCandles
                    : (isCurrency ? subscribeToCurrencyCandles : null))))))

        if (!getHistorical || !subscribeCandles) {
          // API 함수 없음
          return
        }

        // 과거 데이터 로드
        const historicalData = await getHistorical(item.symbol, '1m', 500)

        if (isMounted && historicalData.length > 0) {
          // 마지막 타임스탬프 저장 (ref 사용)
          const lastCandle = historicalData[historicalData.length - 1]
          if (lastCandle && typeof lastCandle.time === 'number') {
            lastChartTimeRef.current = Math.floor(lastCandle.time)
          }

          candlestickSeries.setData(historicalData)
        }

        // 실시간 차트 데이터 구독
        const unsubscribeCandles = subscribeCandles(item.symbol, (candle) => {
          if (isMounted && seriesRef.current && chartRef.current) {
            // 실시간으로 캔들 업데이트 (닫힌 캔들과 진행 중인 캔들 모두)
            // lightweight-charts는 같은 time의 캔들을 자동으로 업데이트함
            try {
              // 타임스탬프가 정수인지 확인 (객체인 경우 처리)
              let candleTime
              if (typeof candle.time === 'number') {
                candleTime = Math.floor(candle.time)
              } else if (candle.time && typeof candle.time === 'object') {
                // 객체인 경우 타임스탬프 추출 시도
                if (candle.time.getTime) {
                  candleTime = Math.floor(candle.time.getTime() / 1000)
                } else if (candle.time.valueOf) {
                  candleTime = Math.floor(candle.time.valueOf() / 1000)
                } else {
                  // 객체의 속성에서 타임스탬프 찾기 시도
                  const timeValue = candle.time.time || candle.time.timestamp || candle.time
                  candleTime = typeof timeValue === 'number'
                    ? Math.floor(timeValue)
                    : Math.floor(Date.now() / 1000)
                }
              } else if (typeof candle.time === 'string') {
                // 문자열인 경우
                candleTime = Math.floor(new Date(candle.time).getTime() / 1000)
              } else {
                candleTime = Math.floor(Date.now() / 1000)
              }

              // 타임스탬프가 유효한 숫자인지 최종 확인
              if (isNaN(candleTime) || candleTime <= 0) {
                // 유효하지 않은 타임스탬프
                candleTime = Math.floor(Date.now() / 1000)
              }

              // lightweight-charts는 "Cannot update oldest data" 에러를 방지하기 위해
              // 새로운 타임스탬프가 마지막 타임스탬프보다 크거나 같아야 함
              // 같으면 같은 캔들 업데이트 (허용), 더 작으면 스킵
              if (lastChartTimeRef.current !== null && candleTime < lastChartTimeRef.current) {
                // 오래된 캔들 업데이트 스킵
                return
              }

              // 마지막 타임스탬프 업데이트
              if (lastChartTimeRef.current === null || candleTime >= lastChartTimeRef.current) {
                lastChartTimeRef.current = candleTime
              }

              const candleUpdate = {
                time: candleTime,
                open: parseFloat(candle.open) || 0,
                high: parseFloat(candle.high) || 0,
                low: parseFloat(candle.low) || 0,
                close: parseFloat(candle.close) || 0,
              }

              // 차트 업데이트 (모든 업데이트마다 호출)
              if (seriesRef.current && typeof seriesRef.current.update === 'function') {
                seriesRef.current.update(candleUpdate)

              }
            } catch (error) {
              // 에러 발생 시 조용히 처리
            }
          }
        })
        candleUnsubscribeRef.current = unsubscribeCandles

      } catch (error) {
        // 에러 발생 시 조용히 처리
      }
    }

    // DOM이 완전히 렌더링된 후 초기화 (여러 번 시도)
    const tryInitialize = () => {
      if (chartContainerRef.current && !chartRef.current) {
        initializeChart()
      } else if (!chartContainerRef.current) {
        // 아직 컨테이너가 없으면 다시 시도 (최대 10번)
        let retryCount = 0
        const maxRetries = 10
        const retryInterval = setInterval(() => {
          retryCount++
          if (chartContainerRef.current && !chartRef.current) {
            clearInterval(retryInterval)
            initializeChart()
          } else if (retryCount >= maxRetries) {
            clearInterval(retryInterval)
            // 차트 초기화 실패
          }
        }, 100)

        return () => clearInterval(retryInterval)
      }
    }

    timer = setTimeout(tryInitialize, 200)

    // 차트 리사이즈 핸들러
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      isMounted = false
      if (timer) {
        clearTimeout(timer)
      }
      if (candleUnsubscribeRef.current) {
        candleUnsubscribeRef.current()
      }
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        seriesRef.current = null
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [item])

  const handleAmountChange = (e) => {
    const value = e.target.value
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      let newAmount = value

      // 매도 시 보유 수량을 초과하지 않도록 제한
      if (side === 'sell' && assets.holdings.amount > 0) {
        const numValue = parseFloat(value)
        if (!isNaN(numValue) && numValue > assets.holdings.amount) {
          newAmount = assets.holdings.amount.toString()
          alert(language === 'ko'
            ? `보유 수량(${assets.holdings.amount.toFixed(4)})을 초과할 수 없습니다.`
            : `Cannot exceed holdings (${assets.holdings.amount.toFixed(4)}).`
          )
        }
      }

      setAmount(newAmount)
    }
  }

  const handlePriceChange = (e) => {
    const value = e.target.value
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setPrice(value)
    }
  }

  const handlePercentageClick = (percent) => {
    if (side === 'buy') {
      // 매수: 현금 잔고의 일정 비율만큼 자동 입력
      const orderPrice = orderType === 'market' ? currentPrice : (parseFloat(price) || currentPrice)
      const availableBalance = assets.cashBalance
      const maxAmount = (availableBalance * percent / 100) / orderPrice
      const calculatedAmount = Math.max(0, maxAmount).toFixed(8)
      setAmount(calculatedAmount)
    } else {
      // 매도: 보유 수량의 일정 비율만큼 자동 입력
      if (assets.holdings.amount === 0) {
        alert(language === 'ko' ? '보유한 코인이 없어 매도할 수 없습니다.' : 'You have no coins to sell.')
        return
      }
      const availableAmount = assets.holdings.amount
      const calculatedAmount = Math.min(availableAmount, (availableAmount * percent / 100)).toFixed(8)
      setAmount(calculatedAmount)
    }
  }

  // 가상화폐 가격 포맷팅 함수 (소수점 끝까지 표시, 의미 없는 0 제거)
  // AI 트레이딩 전략 함수들
  const analyzeMomentumStrategy = (priceHistory) => {
    if (priceHistory.length < 3) return null

    const recent = priceHistory.slice(-5)
    const priceChange = (recent[recent.length - 1] - recent[0]) / recent[0] * 100

    // 테스트 모드: 임계값을 매우 낮춤 (0.05% 변화면 신호 생성)
    const threshold = 0.05
    if (priceChange > threshold) {
      return { action: 'BUY', confidence: Math.min(95, 50 + priceChange * 30) }
    } else if (priceChange < -threshold) {
      return { action: 'SELL', confidence: Math.min(95, 50 + Math.abs(priceChange) * 30) }
    }

    // 테스트를 위해 가격 변동이 거의 없어도 랜덤하게 신호 생성 (10% 확률)
    if (Math.random() < 0.1 && Math.abs(priceChange) < 0.1) {
      const randomAction = Math.random() > 0.5 ? 'BUY' : 'SELL'
      return { action: randomAction, confidence: 55 + Math.random() * 20 }
    }

    return null
  }

  const analyzeMeanReversionStrategy = (priceHistory) => {
    if (priceHistory.length < 5) return null

    const recent = priceHistory.slice(-10)
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length
    const current = recent[recent.length - 1]
    const deviation = (current - avg) / avg * 100

    // 테스트 모드: 임계값을 매우 낮춤 (0.1% 편차면 신호 생성)
    const threshold = 0.1
    if (deviation > threshold) {
      return { action: 'SELL', confidence: Math.min(95, 50 + deviation * 40) }
    } else if (deviation < -threshold) {
      return { action: 'BUY', confidence: Math.min(95, 50 + Math.abs(deviation) * 40) }
    }

    // 테스트를 위해 편차가 작아도 랜덤하게 신호 생성 (10% 확률)
    if (Math.random() < 0.1 && Math.abs(deviation) < 0.2) {
      const randomAction = deviation > 0 ? 'SELL' : 'BUY'
      return { action: randomAction, confidence: 55 + Math.random() * 20 }
    }

    return null
  }

  const analyzeTrendFollowingStrategy = (priceHistory) => {
    if (priceHistory.length < 10) return null

    const shortTerm = priceHistory.slice(-5)
    const longTerm = priceHistory.slice(-20, -5)
    if (longTerm.length === 0) return null

    const shortAvg = shortTerm.reduce((a, b) => a + b, 0) / shortTerm.length
    const longAvg = longTerm.reduce((a, b) => a + b, 0) / longTerm.length
    const trend = (shortAvg - longAvg) / longAvg * 100

    // 테스트 모드: 임계값을 매우 낮춤 (0.05% 추세면 신호 생성)
    const threshold = 0.05
    if (trend > threshold) {
      return { action: 'BUY', confidence: Math.min(95, 50 + trend * 40) }
    } else if (trend < -threshold) {
      return { action: 'SELL', confidence: Math.min(95, 50 + Math.abs(trend) * 40) }
    }

    // 테스트를 위해 추세가 약해도 랜덤하게 신호 생성 (10% 확률)
    if (Math.random() < 0.1 && Math.abs(trend) < 0.1) {
      const randomAction = trend > 0 ? 'BUY' : 'SELL'
      return { action: randomAction, confidence: 55 + Math.random() * 20 }
    }

    return null
  }

  // AI 트레이딩 분석 및 신호 생성
  const generateAISignal = () => {
    if (priceHistoryRef.current.length < 5) return null

    let signal = null
    switch (aiStrategy) {
      case 'momentum':
        signal = analyzeMomentumStrategy(priceHistoryRef.current)
        break
      case 'mean_reversion':
        signal = analyzeMeanReversionStrategy(priceHistoryRef.current)
        break
      case 'trend_following':
        signal = analyzeTrendFollowingStrategy(priceHistoryRef.current)
        break
      default:
        return null
    }

    if (signal) {
      const now = Date.now()
      // 테스트 모드: 2초 간격으로 신호 생성 (프로덕션에서는 30초)
      const minSignalInterval = 2000 // 2초
      if (now - lastSignalTimeRef.current < minSignalInterval) {
        return null
      }
      lastSignalTimeRef.current = now

      return {
        type: signal.action === 'BUY' ? 'buy' : 'sell',
        action: signal.action,
        confidence: Math.round(signal.confidence),
        timestamp: now,
        price: currentPrice
      }
    }
    return null
  }

  // AI 트레이딩 실행 (신호에 따라 거래 시뮬레이션)
  // ⚠️ 현재는 시뮬레이션 모드입니다. 실제 거래소와 연결하려면 Binance API 키가 필요합니다.
  const executeAITrade = (signal) => {

    // 매수 신호인 경우 잔고 확인
    if (signal.action === 'BUY') {
      if (assets.cashBalance <= 0) {
        // 잔고 부족
        return // 잔고가 없으면 거래 실행하지 않음
      }
    }

    // 매도 신호인 경우 보유 수량 확인
    if (signal.action === 'SELL') {
      if (assets.holdings.amount === 0) {
        return // 보유 수량이 없으면 거래 실행하지 않음
      }
    }

    // 시뮬레이션: 랜덤한 수익/손실 생성
    // 실제 거래를 하려면 여기서 Binance API를 호출해야 합니다
    const isWin = Math.random() > 0.4 // 60% 승률
    const profitPercent = isWin
      ? (Math.random() * 3 + 0.5) // 0.5% ~ 3.5% 수익
      : -(Math.random() * 2 + 0.3) // -0.3% ~ -2.3% 손실

    // 거래 수량 계산
    let tradeAmount = 0
    if (signal.action === 'BUY') {
      // 매수: 잔고의 일정 비율만큼 매수 가능한 수량 계산
      const availableBalance = assets.cashBalance

      // 잔고가 없으면 거래 실행하지 않음
      if (availableBalance <= 0) {
        return
      }

      const maxTradeValue = availableBalance * (riskSettings.positionSize / 100) // 잔고의 10% (기본값)
      const maxAmount = maxTradeValue / signal.price // 매수 가능한 최대 수량
      tradeAmount = Math.min(maxAmount, availableBalance / signal.price) // 잔고를 초과하지 않도록 제한

      // 거래 수량이 0 이하이면 거래 실행하지 않음
      if (tradeAmount <= 0) {
        return
      }

      // 최종 거래 금액이 잔고를 초과하는지 확인
      const finalCost = tradeAmount * signal.price
      if (finalCost > availableBalance) {
        // 잔고에 맞게 수량 조정
        tradeAmount = availableBalance / signal.price
      }
    } else {
      // 매도: 보유 수량의 일정 비율만큼 매도
      const availableAmount = assets.holdings.amount
      const maxAmount = availableAmount * (riskSettings.positionSize / 100) // 보유 수량의 10% (기본값)
      tradeAmount = Math.min(maxAmount, availableAmount) // 보유 수량을 초과하지 않도록 제한
    }

    const profit = tradeAmount * currentPrice * (profitPercent / 100);

    // 거래 내역 생성
    const trade = {
      id: Date.now(),
      timestamp: Date.now(),
      symbol: item.symbol,
      action: item.category === 'futures'
        ? (signal.action === 'BUY' ? 'LONG' : 'SHORT')
        : signal.action,
      category: item.category, // 선물/일반 거래 구분용
      type: 'MARKET',
      price: signal.price,
      amount: tradeAmount,
      profit: profit,
      profitPercent: profitPercent,
      isWin: isWin,
      strategy: aiStrategy,
      confidence: signal.confidence,
      isManual: false // AI 자동 거래
    }


    // 자산 현황 업데이트
    setAssets(prev => {
      let newHoldings = { ...prev.holdings }
      let newCashBalance = prev.cashBalance

      if (signal.action === 'BUY') {
        // 매수: 현금 감소, 보유량 증가
        const cost = tradeAmount * signal.price

        // 잔고 확인 (이중 체크)
        if (prev.cashBalance < cost || cost <= 0) {
          return prev // 잔고 부족 시 거래 실행하지 않음
        }

        // 잔고를 초과하지 않도록 최종 확인
        if (cost > prev.cashBalance) {
          return prev
        }

        newCashBalance = prev.cashBalance - cost

        if (newHoldings.amount === 0) {
          newHoldings.averagePrice = signal.price
          newHoldings.amount = tradeAmount
        } else {
          // 평균 단가 계산
          const totalCost = (newHoldings.averagePrice * newHoldings.amount) + cost
          newHoldings.amount += tradeAmount
          newHoldings.averagePrice = totalCost / newHoldings.amount
        }
      } else {
        // 매도: 현금 증가, 보유량 감소
        if (prev.holdings.amount < tradeAmount) {
          return prev // 보유 수량 부족 시 거래 실행하지 않음
        }

        const revenue = tradeAmount * signal.price
        newCashBalance = prev.cashBalance + revenue
        newHoldings.amount = prev.holdings.amount - tradeAmount

        if (newHoldings.amount === 0) {
          newHoldings.averagePrice = 0
        }
      }

      // 현재 평가액 및 손익 계산 (최신 가격 사용)
      const latestPrice = currentPrice > 0 ? currentPrice : signal.price
      newHoldings.currentValue = newHoldings.amount * latestPrice
      newHoldings.profitLoss = newHoldings.currentValue - (newHoldings.averagePrice * newHoldings.amount)
      newHoldings.profitLossPercent = newHoldings.averagePrice > 0 && newHoldings.amount > 0
        ? (newHoldings.profitLoss / (newHoldings.averagePrice * newHoldings.amount)) * 100
        : 0

      const newTotalAssets = newCashBalance + newHoldings.currentValue

      // 자산 업데이트 완료

      return {
        totalAssets: newTotalAssets,
        initialAssets: prev.initialAssets, // 초기 자산은 유지
        cashBalance: newCashBalance,
        holdings: newHoldings
      }
    })

    // 거래 내역 추가 (AI 자동 거래)
    setTradeHistory(prev => {
      const newHistory = [trade, ...prev]
      return newHistory.slice(0, 50) // 최대 50개까지만 유지
    })

    // 알림 추가
    const notification = {
      id: Date.now(),
      type: signal.action === 'BUY' ? 'buy' : 'sell',
      message: language === 'ko'
        ? item.category === 'futures'
          ? `${signal.action === 'BUY' ? '롱' : '숏'} 진입: ${item.symbol} ${tradeAmount.toFixed(4)}개 @ ${item.category === 'crypto' ? formatCryptoPrice(signal.price?.toString() || '0') : signal.price.toFixed(2)}`
          : `${signal.action === 'BUY' ? '매수' : '매도'} 주문 실행: ${item.symbol} ${tradeAmount.toFixed(4)}개 @ ${item.category === 'crypto' ? formatCryptoPrice(signal.price?.toString() || '0') : signal.price.toFixed(2)}`
        : item.category === 'futures'
          ? `${signal.action === 'BUY' ? 'Long' : 'Short'} entered: ${item.symbol} ${tradeAmount.toFixed(4)} @ ${item.category === 'crypto' ? formatCryptoPrice(signal.price?.toString() || '0') : signal.price.toFixed(2)}`
          : `${signal.action} order executed: ${item.symbol} ${tradeAmount.toFixed(4)} @ ${item.category === 'crypto' ? formatCryptoPrice(signal.price?.toString() || '0') : signal.price.toFixed(2)}`,
      profit: profit,
      profitPercent: profitPercent
    }

    setNotifications(prev => {
      const newNotifications = [notification, ...prev]
      return newNotifications.slice(0, 10) // 최대 10개까지만 유지
    })

    // 3초 후 알림 자동 제거
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 3000)

    // 통계 업데이트
    setTradingStats(prev => {
      const newTotalTrades = prev.totalTrades + 1
      const newWins = isWin ? (prev.winRate * prev.totalTrades / 100) + 1 : (prev.winRate * prev.totalTrades / 100)
      const newWinRate = (newWins / newTotalTrades) * 100
      const newTotalProfit = prev.totalProfit + profit
      const newProfitPercent = prev.profitPercent + profitPercent

      return {
        totalTrades: newTotalTrades,
        winRate: newWinRate,
        totalProfit: newTotalProfit,
        profitPercent: newProfitPercent
      }
    })
  }

  // AI 트레이딩 활성화 시 주기적 분석
  useEffect(() => {
    if (!isAiTradingActive || tradingMode !== 'auto') {
      if (aiTradingIntervalRef.current) {
        clearInterval(aiTradingIntervalRef.current)
        aiTradingIntervalRef.current = null
      }
      return
    }

    // 가격 히스토리 업데이트
    const updatePriceHistory = () => {
      if (currentPrice > 0) {
        priceHistoryRef.current.push(currentPrice)
        // 최대 50개까지만 유지
        if (priceHistoryRef.current.length > 50) {
          priceHistoryRef.current.shift()
        }
      }
    }

    // 초기 가격 히스토리 구축 (시뮬레이션) - 테스트를 위해 더 많은 변동성 추가
    if (priceHistoryRef.current.length === 0 && currentPrice > 0) {
      const basePrice = currentPrice
      for (let i = 0; i < 20; i++) {
        // 더 큰 변동성으로 신호 생성 확률 증가
        priceHistoryRef.current.push(basePrice * (1 + (Math.random() - 0.5) * 0.05))
      }
    }

    // 주기적으로 가격 히스토리 업데이트 및 신호 생성
    updatePriceHistory()

    // 테스트를 위해 2초마다 분석 (프로덕션에서는 5초 또는 더 길게 설정)
    const analysisInterval = 2000 // 2초

    aiTradingIntervalRef.current = setInterval(() => {
      updatePriceHistory()
      const signal = generateAISignal()

      if (signal) {
        // 신호 추가
        setAiSignals(prev => {
          const newSignals = [signal, ...prev]
          // 최대 20개까지만 유지
          return newSignals.slice(0, 20)
        })

        // ⚡ AI가 자동으로 거래 실행 (사용자 개입 불필요)
        executeAITrade(signal)
      }
    }, analysisInterval)

    return () => {
      if (aiTradingIntervalRef.current) {
        clearInterval(aiTradingIntervalRef.current)
        aiTradingIntervalRef.current = null
      }
    }
  }, [isAiTradingActive, tradingMode, aiStrategy]) // currentPrice 제거하여 불필요한 재시작 방지

  // 가격 변경 시 히스토리 업데이트
  useEffect(() => {
    if (isAiTradingActive && currentPrice > 0) {
      priceHistoryRef.current.push(currentPrice)
      if (priceHistoryRef.current.length > 50) {
        priceHistoryRef.current.shift()
      }
    }
  }, [currentPrice, isAiTradingActive])

  const formatCryptoPrice = (priceStr) => {
    if (!priceStr) return '0'

    // 숫자가 아닌 경우 그대로 반환
    const price = parseFloat(priceStr)
    if (isNaN(price)) return priceStr

    // 원본 문자열에서 소수점 부분 추출
    const str = priceStr.toString()
    const parts = str.split('.')

    if (parts.length === 1) {
      // 정수인 경우 천 단위 구분자 추가
      return price.toLocaleString('en-US')
    }

    // 소수점이 있는 경우
    const integerPart = parseInt(parts[0]).toLocaleString('en-US')
    let decimalPart = parts[1]

    // 끝의 0 제거 (의미 있는 숫자는 유지)
    decimalPart = decimalPart.replace(/0+$/, '')

    // 소수점 부분이 모두 0이면 정수로만 표시
    if (decimalPart === '') {
      return integerPart
    }

    return `${integerPart}.${decimalPart}`
  }

  const handleOrderSubmit = () => {
    // 선물 거래에서 포지션이 있고 종료 버튼을 누른 경우
    if (item.category === 'futures' && assets.holdings.amount !== 0) {
      // 현재 포지션 전체 종료
      const orderPrice = currentPrice // 시장가로 종료
      const closeAmount = Math.abs(assets.holdings.amount)
      const isLong = assets.holdings.amount > 0

      // 자산 현황 업데이트 (포지션 종료)
      setAssets(prev => {
        const entryPrice = prev.holdings.averagePrice
        const positionValue = entryPrice * closeAmount

        // 청산 손익 계산
        const closePnL = isLong
          ? (orderPrice - entryPrice) * closeAmount * leverage // 롱 종료: (종료가 - 진입가) * 수량 * 레버리지
          : (entryPrice - orderPrice) * closeAmount * leverage // 숏 종료: (진입가 - 종료가) * 수량 * 레버리지

        // 사용된 마진 반환 + 손익
        const usedMargin = positionValue / leverage
        const returnedMargin = usedMargin + closePnL

        return {
          totalAssets: prev.cashBalance + returnedMargin,
          initialAssets: prev.initialAssets,
          cashBalance: prev.cashBalance + returnedMargin,
          holdings: {
            amount: 0,
            averagePrice: 0,
            currentValue: 0,
            profitLoss: 0,
            profitLossPercent: 0
          }
        }
      })

      // 거래 내역 추가
      const trade = {
        id: Date.now(),
        timestamp: Date.now(),
        symbol: item.symbol,
        action: isLong ? 'LONG_CLOSE' : 'SHORT_CLOSE',
        type: 'MARKET',
        price: orderPrice,
        amount: closeAmount,
        leverage: leverage,
        category: 'futures',
        strategy: 'manual',
        isManual: true,
        profit: isLong
          ? (orderPrice - assets.holdings.averagePrice) * closeAmount * leverage
          : (assets.holdings.averagePrice - orderPrice) * closeAmount * leverage,
        profitPercent: 0
      }

      setTradeHistory(prev => {
        const newHistory = [trade, ...prev]
        return newHistory.slice(0, 50)
      })

      // 알림 추가
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: isLong ? 'buy' : 'sell',
        message: language === 'ko'
          ? `${isLong ? '롱' : '숏'} 포지션 종료: ${item.symbol} ${closeAmount.toFixed(4)}개 @ ${item.category === 'crypto' ? formatCryptoPrice(orderPrice.toString()) : orderPrice.toFixed(2)}`
          : `${isLong ? 'Long' : 'Short'} position closed: ${item.symbol} ${closeAmount.toFixed(4)} @ ${item.category === 'crypto' ? formatCryptoPrice(orderPrice.toString()) : orderPrice.toFixed(2)}`,
        timestamp: Date.now()
      }])

      // 폼 초기화
      setAmount('')
      setPrice('')

      return
    }

    // 일반 거래 또는 선물 거래 진입
    if (!amount || parseFloat(amount) <= 0) {
      alert(language === 'ko' ? '수량을 입력해주세요.' : 'Please enter amount.')
      return
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      alert(language === 'ko' ? '가격을 입력해주세요.' : 'Please enter price.')
      return
    }

    const orderPrice = orderType === 'market' ? currentPrice : parseFloat(price)
    let orderAmount = parseFloat(amount)
    const orderValue = orderPrice * orderAmount

    // 선물 거래인 경우 마진 계산
    if (item.category === 'futures') {
      const requiredMargin = orderValue / leverage
      if (assets.cashBalance < requiredMargin) {
        alert(language === 'ko'
          ? `마진이 부족합니다. 필요 마진: $${requiredMargin.toFixed(2)}, 가용 마진: $${assets.cashBalance.toFixed(2)}`
          : `Insufficient margin. Required: $${requiredMargin.toFixed(2)}, Available: $${assets.cashBalance.toFixed(2)}`)
        return
      }
    }

    // 일반 거래: 매도 시 보유 수량 확인 및 제한 (선물 거래는 제외)
    if (item.category !== 'futures' && side === 'sell') {
      if (assets.holdings.amount === 0) {
        alert(language === 'ko' ? '보유한 코인이 없어 매도할 수 없습니다.' : 'You have no coins to sell.')
        return
      }
      // 보유 수량을 초과하지 않도록 제한
      if (orderAmount > assets.holdings.amount) {
        alert(language === 'ko' ? `보유 수량(${assets.holdings.amount.toFixed(4)})을 초과할 수 없습니다.` : `Cannot exceed holdings (${assets.holdings.amount.toFixed(4)}).`)
        orderAmount = assets.holdings.amount // 최대 보유 수량으로 제한
      }
    }

    // 선물 거래: 포지션 청산 시에만 보유 수량 확인 (롱 포지션을 청산하거나 숏 포지션을 청산할 때)
    // 단, 새로운 포지션 진입(롱/숏)은 코인 보유 없이도 가능
    if (item.category === 'futures') {
      // 기존 포지션이 있고, 반대 방향으로 거래하는 경우 (청산)
      if (assets.holdings.amount !== 0) {
        const isLongPosition = assets.holdings.amount > 0
        const isShortPosition = assets.holdings.amount < 0

        // 롱 포지션이 있는데 숏 진입하려는 경우 = 롱 청산
        if (isLongPosition && positionType === 'short') {
          // 롱 포지션을 청산하려면 보유 수량만큼만 가능
          if (orderAmount > Math.abs(assets.holdings.amount)) {
            alert(language === 'ko'
              ? `롱 포지션 청산: 보유 수량(${Math.abs(assets.holdings.amount).toFixed(4)})을 초과할 수 없습니다.`
              : `Long position liquidation: Cannot exceed holdings (${Math.abs(assets.holdings.amount).toFixed(4)}).`)
            orderAmount = Math.abs(assets.holdings.amount)
          }
        }
        // 숏 포지션이 있는데 롱 진입하려는 경우 = 숏 청산
        else if (isShortPosition && positionType === 'long') {
          // 숏 포지션을 청산하려면 보유 수량만큼만 가능
          if (orderAmount > Math.abs(assets.holdings.amount)) {
            alert(language === 'ko'
              ? `숏 포지션 청산: 보유 수량(${Math.abs(assets.holdings.amount).toFixed(4)})을 초과할 수 없습니다.`
              : `Short position liquidation: Cannot exceed holdings (${Math.abs(assets.holdings.amount).toFixed(4)}).`)
            orderAmount = Math.abs(assets.holdings.amount)
          }
        }
      }
    }

    // 일반 거래: 매수 시 잔고 확인 (선물 거래가 아닌 경우)
    if (item.category !== 'futures' && side === 'buy') {
      if (assets.cashBalance < orderValue) {
        alert(language === 'ko'
          ? `잔고가 부족합니다. 필요 금액: $${orderValue.toFixed(2)}, 잔고: $${assets.cashBalance.toFixed(2)}`
          : `Insufficient balance. Required: $${orderValue.toFixed(2)}, Balance: $${assets.cashBalance.toFixed(2)}`)
        return
      }
    }

    // 자산 현황 업데이트
    setAssets(prev => {
      let newHoldings = { ...prev.holdings }
      let newCashBalance = prev.cashBalance

      // 선물 거래인 경우 (바이낸스 방식)
      if (item.category === 'futures') {
        const requiredMargin = orderValue / leverage
        const currentPosition = newHoldings.amount // 양수=롱, 음수=숏, 0=없음
        const isLongPosition = currentPosition > 0
        const isShortPosition = currentPosition < 0

        // 바이낸스 선물 거래 로직:
        // 1. 같은 방향 진입: 포지션 추가 (평균 단가 계산)
        // 2. 반대 방향 진입: 포지션 청산 후 남은 수량으로 새 포지션 진입
        // 3. 청산 시: 사용된 마진 반환 + 손익 반영

        if (positionType === 'long') {
          // 롱 진입
          if (isShortPosition) {
            // 숏 포지션이 있으면 청산
            const shortAmount = Math.abs(currentPosition)
            const closeAmount = Math.min(orderAmount, shortAmount)
            const remainingAmount = orderAmount - closeAmount

            // 숏 청산 손익: (진입가 - 청산가) * 수량 * 레버리지
            const shortEntryPrice = newHoldings.averagePrice
            const closePnL = (shortEntryPrice - orderPrice) * closeAmount * leverage

            // 사용된 마진 반환
            const usedMargin = (shortEntryPrice * shortAmount) / leverage
            const returnedMargin = usedMargin + closePnL
            newCashBalance = prev.cashBalance + returnedMargin

            // 청산 후 남은 수량이 있으면 롱 진입
            if (remainingAmount > 0) {
              const remainingMargin = (orderPrice * remainingAmount) / leverage
              if (newCashBalance >= remainingMargin) {
                newCashBalance = newCashBalance - remainingMargin
                newHoldings.amount = remainingAmount
                newHoldings.averagePrice = orderPrice
              } else {
                // 마진 부족 시 청산만
                newHoldings.amount = 0
                newHoldings.averagePrice = 0
              }
            } else {
              // 완전 청산
              newHoldings.amount = 0
              newHoldings.averagePrice = 0
            }
          } else if (isLongPosition) {
            // 롱 포지션 추가 (평균 단가 계산)
            if (newCashBalance < requiredMargin) {
              // 마진 부족
              return prev
            }
            const existingValue = newHoldings.averagePrice * currentPosition
            const newValue = orderValue
            const totalValue = existingValue + newValue
            newHoldings.amount = currentPosition + orderAmount
            newHoldings.averagePrice = totalValue / newHoldings.amount
            newCashBalance = prev.cashBalance - requiredMargin
          } else {
            // 새로운 롱 진입
            if (newCashBalance < requiredMargin) {
              // 마진 부족
              return prev
            }
            newHoldings.amount = orderAmount
            newHoldings.averagePrice = orderPrice
            newCashBalance = prev.cashBalance - requiredMargin
          }
        } else {
          // 숏 진입
          if (isLongPosition) {
            // 롱 포지션이 있으면 청산
            const longAmount = currentPosition
            const closeAmount = Math.min(orderAmount, longAmount)
            const remainingAmount = orderAmount - closeAmount

            // 롱 청산 손익: (청산가 - 진입가) * 수량 * 레버리지
            const longEntryPrice = newHoldings.averagePrice
            const closePnL = (orderPrice - longEntryPrice) * closeAmount * leverage

            // 사용된 마진 반환
            const usedMargin = (longEntryPrice * longAmount) / leverage
            const returnedMargin = usedMargin + closePnL
            newCashBalance = prev.cashBalance + returnedMargin

            // 청산 후 남은 수량이 있으면 숏 진입
            if (remainingAmount > 0) {
              const remainingMargin = (orderPrice * remainingAmount) / leverage
              if (newCashBalance >= remainingMargin) {
                newCashBalance = newCashBalance - remainingMargin
                newHoldings.amount = -remainingAmount // 숏은 음수
                newHoldings.averagePrice = orderPrice
              } else {
                // 마진 부족 시 청산만
                newHoldings.amount = 0
                newHoldings.averagePrice = 0
              }
            } else {
              // 완전 청산
              newHoldings.amount = 0
              newHoldings.averagePrice = 0
            }
          } else if (isShortPosition) {
            // 숏 포지션 추가 (평균 단가 계산)
            if (newCashBalance < requiredMargin) {
              // 마진 부족
              return prev
            }
            const shortAmount = Math.abs(currentPosition)
            const existingValue = newHoldings.averagePrice * shortAmount
            const newValue = orderValue
            const totalValue = existingValue + newValue
            newHoldings.amount = -(shortAmount + orderAmount) // 숏은 음수
            newHoldings.averagePrice = totalValue / Math.abs(newHoldings.amount)
            newCashBalance = prev.cashBalance - requiredMargin
          } else {
            // 새로운 숏 진입
            if (newCashBalance < requiredMargin) {
              // 마진 부족
              return prev
            }
            newHoldings.amount = -orderAmount // 숏은 음수
            newHoldings.averagePrice = orderPrice
            newCashBalance = prev.cashBalance - requiredMargin
          }
        }
      } else if (side === 'buy') {
        // 일반 거래: 매수
        // 이미 위에서 잔고 체크를 했으므로 여기서는 실행
        newCashBalance = prev.cashBalance - orderValue

        if (newHoldings.amount === 0) {
          newHoldings.averagePrice = orderPrice
          newHoldings.amount = orderAmount
        } else {
          // 평균 단가 계산
          const totalCost = (newHoldings.averagePrice * newHoldings.amount) + orderValue
          newHoldings.amount += orderAmount
          newHoldings.averagePrice = totalCost / newHoldings.amount
        }
      } else {
        // 일반 거래: 매도
        // 이미 위에서 보유 수량 체크를 했으므로 여기서는 실행

        newCashBalance = prev.cashBalance + orderValue
        newHoldings.amount = newHoldings.amount - orderAmount

        if (newHoldings.amount === 0) {
          newHoldings.averagePrice = 0
        }
      }

      // 현재 평가액 및 손익 계산 (최신 가격 사용)
      const latestPrice = currentPrice > 0 ? currentPrice : orderPrice

      // 선물 거래인 경우 바이낸스 방식 손익 계산
      if (item.category === 'futures' && newHoldings.amount !== 0) {
        const positionAmount = Math.abs(newHoldings.amount)
        const entryPrice = newHoldings.averagePrice
        const isLong = newHoldings.amount > 0

        // 바이낸스 선물 손익 계산
        // 롱: (현재가 - 진입가) * 수량 * 레버리지
        // 숏: (진입가 - 현재가) * 수량 * 레버리지
        const unrealizedPnL = isLong
          ? (latestPrice - entryPrice) * positionAmount * leverage
          : (entryPrice - latestPrice) * positionAmount * leverage

        // 사용된 마진
        const usedMargin = (entryPrice * positionAmount) / leverage

        // 총 자산 = 현금 잔고 + 미실현 손익
        newHoldings.currentValue = positionAmount * latestPrice // 포지션 현재 가치 (참고용)
        newHoldings.profitLoss = unrealizedPnL
        newHoldings.profitLossPercent = usedMargin > 0 ? (unrealizedPnL / usedMargin) * 100 : 0

        const newTotalAssets = newCashBalance + unrealizedPnL

        // 선물 자산 업데이트 완료

        return {
          totalAssets: newTotalAssets,
          initialAssets: prev.initialAssets,
          cashBalance: newCashBalance,
          holdings: newHoldings
        }
      } else {
        // 일반 거래 손익 계산
        newHoldings.currentValue = newHoldings.amount * latestPrice
        newHoldings.profitLoss = newHoldings.currentValue - (newHoldings.averagePrice * newHoldings.amount)
        newHoldings.profitLossPercent = newHoldings.averagePrice > 0 && newHoldings.amount > 0
          ? (newHoldings.profitLoss / (newHoldings.averagePrice * newHoldings.amount)) * 100
          : 0

        const newTotalAssets = newCashBalance + newHoldings.currentValue

        // 수동 거래 자산 업데이트 완료

        return {
          totalAssets: newTotalAssets,
          initialAssets: prev.initialAssets, // 초기 자산은 유지
          cashBalance: newCashBalance,
          holdings: newHoldings
        }
      }
    })

    // 거래 내역 추가 (수동 거래)
    const trade = {
      id: Date.now(),
      timestamp: Date.now(),
      symbol: item.symbol,
      action: item.category === 'futures'
        ? (positionType === 'long' ? 'LONG' : 'SHORT')
        : (side === 'buy' ? 'BUY' : 'SELL'),
      type: orderType === 'market' ? 'MARKET' : 'LIMIT',
      price: orderPrice,
      amount: orderAmount,
      leverage: item.category === 'futures' ? leverage : undefined,
      category: item.category, // 선물/일반 거래 구분용
      strategy: 'manual', // 수동 거래 표시
      isManual: true // 수동 거래 플래그
    }

    // 매도인 경우에만 손익 계산
    if (side === 'sell') {
      const avgPrice = assets.holdings.averagePrice
      if (avgPrice > 0) {
        const cost = avgPrice * orderAmount
        const revenue = orderPrice * orderAmount
        trade.profit = revenue - cost
        trade.profitPercent = ((revenue - cost) / cost) * 100
        trade.isWin = trade.profit >= 0
      } else {
        trade.profit = 0
        trade.profitPercent = 0
        trade.isWin = false
      }
    } else {
      // 매수인 경우 손익은 0 (아직 매도하지 않음)
      trade.profit = 0
      trade.profitPercent = 0
      trade.isWin = false
    }

    // 거래 내역 추가 (수동 거래)
    setTradeHistory(prev => {
      const newHistory = [trade, ...prev]
      return newHistory.slice(0, 50) // 최대 50개까지만 유지
    })

    // 알림 추가
    const notification = {
      id: Date.now(),
      type: side,
      message: language === 'ko'
        ? item.category === 'futures'
          ? `${positionType === 'long' ? '롱' : '숏'} 진입: ${item.symbol} ${orderAmount.toFixed(4)}개 @ ${item.category === 'crypto' ? formatCryptoPrice(orderPrice.toString()) : orderPrice.toFixed(2)}`
          : `${side === 'buy' ? '매수' : '매도'} 주문 실행: ${item.symbol} ${orderAmount.toFixed(4)}개 @ ${item.category === 'crypto' ? formatCryptoPrice(orderPrice.toString()) : orderPrice.toFixed(2)}`
        : item.category === 'futures'
          ? `${positionType === 'long' ? 'Long' : 'Short'} entered: ${item.symbol} ${orderAmount.toFixed(4)} @ ${item.category === 'crypto' ? formatCryptoPrice(orderPrice.toString()) : orderPrice.toFixed(2)}`
          : `${side === 'buy' ? 'Buy' : 'Sell'} order executed: ${item.symbol} ${orderAmount.toFixed(4)} @ ${item.category === 'crypto' ? formatCryptoPrice(orderPrice.toString()) : orderPrice.toFixed(2)}`,
      profit: trade.profit || 0,
      profitPercent: trade.profitPercent || 0
    }

    setNotifications(prev => {
      const newNotifications = [notification, ...prev]
      return newNotifications.slice(0, 10) // 최대 10개까지만 유지
    })

    // 3초 후 알림 자동 제거
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 3000)

    // 주문 제출 로직 (실제로는 API 호출)
    const orderData = {
      symbol: item.symbol,
      side,
      type: orderType,
      amount: orderAmount,
      price: orderPrice
    }

    alert(
      language === 'ko'
        ? item.category === 'futures'
          ? `${positionType === 'long' ? '롱' : '숏'} 진입 주문이 제출되었습니다.`
          : `${side === 'buy' ? '매수' : '매도'} 주문이 제출되었습니다.`
        : item.category === 'futures'
          ? `${positionType === 'long' ? 'Long' : 'Short'} entry order submitted.`
          : `${side === 'buy' ? 'Buy' : 'Sell'} order submitted.`
    )

    // 폼 초기화
    setAmount('')
    setPrice('')
  }

  const totalValue = amount && currentPrice ? (parseFloat(amount) * currentPrice).toFixed(8) : '0.00000000'

  return (
    <div className="trading-page">
      {/* 실시간 알림 */}
      <div className="trading-notifications">
        {notifications.map((notification) => (
          <div key={notification.id} className={`trading-notification ${notification.type}`}>
            <div className="notification-icon">
              {notification.type === 'buy' ? '📈' : '📉'}
            </div>
            <div className="notification-content">
              <div className="notification-message">{notification.message}</div>
              {notification.profit !== undefined && notification.profitPercent !== undefined && (
                <div className={`notification-profit ${notification.profit >= 0 ? 'positive' : 'negative'}`}>
                  {notification.profit >= 0 ? '+' : ''}{notification.profit.toFixed(2)} ({notification.profitPercent >= 0 ? '+' : ''}{notification.profitPercent.toFixed(2)}%)
                </div>
              )}
            </div>
            <button
              className="notification-close"
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="trading-header">
        <button className="trading-back-button" onClick={onBack}>
          ← {t('trading.back', language)}
        </button>
        <div className="trading-symbol-info">
          <h1 className="trading-symbol">{item.symbol}</h1>
          <p className="trading-name">{item.name}</p>
        </div>
      </div>

      <div className="trading-content">
        {/* 거래 모드 전환 탭 */}
        <div className="trading-mode-tabs">
          <button
            className={`mode-tab ${tradingMode === 'manual' ? 'active' : ''}`}
            onClick={() => setTradingMode('manual')}
          >
            {t('trading.mode.manual', language)}
          </button>
          <button
            className={`mode-tab ${tradingMode === 'auto' ? 'active' : ''}`}
            onClick={() => setTradingMode('auto')}
          >
            {t('trading.mode.auto', language)}
          </button>
        </div>

        {/* AI 트레이딩 설정 섹션 */}
        {tradingMode === 'auto' && (
          <div className="ai-trading-config-section">
            <div className="ai-trading-header-info">
              <h3 className="ai-trading-title">{t('trading.aiTrading.title', language)}</h3>
              <div className="simulation-mode-badge">
                {language === 'ko' ? '🔬 시뮬레이션 모드' : '🔬 Simulation Mode'}
              </div>
            </div>
            <p className="simulation-mode-notice">
              {language === 'ko'
                ? '현재는 시뮬레이션 모드로 작동합니다. 실제 돈 없이도 테스트할 수 있습니다. 실제 거래를 하려면 거래소 API 키가 필요합니다.'
                : 'Currently running in simulation mode. You can test without real money. Real trading requires exchange API keys.'
              }
            </p>

            {/* 전략 선택 */}
            <div className="ai-strategy-selector">
              <label>{t('trading.aiTrading.strategy', language)}</label>
              <div className="strategy-options">
                {['momentum', 'mean_reversion', 'trend_following'].map((strategy) => (
                  <button
                    key={strategy}
                    className={`strategy-btn ${aiStrategy === strategy ? 'active' : ''}`}
                    onClick={() => setAiStrategy(strategy)}
                  >
                    <div className="strategy-name">
                      {t(`trading.aiTrading.strategies.${strategy}`, language)}
                    </div>
                    <div className="strategy-desc">
                      {t(`trading.aiTrading.strategyDesc.${strategy}`, language)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 자동 거래 시작/중지 버튼 */}
            <div className="ai-trading-control">
              <button
                className={`ai-trading-toggle-btn ${isAiTradingActive ? 'active' : ''}`}
                onClick={() => {
                  setIsAiTradingActive(!isAiTradingActive)
                }}
              >
                {isAiTradingActive
                  ? t('trading.aiTrading.stop', language)
                  : t('trading.aiTrading.start', language)
                }
              </button>
              <div className={`ai-trading-status ${isAiTradingActive ? 'active' : ''}`}>
                {isAiTradingActive
                  ? t('trading.aiTrading.active', language)
                  : t('trading.aiTrading.inactive', language)
                }
              </div>
            </div>

            {/* 통계 */}
            <div className="ai-trading-stats">
              <div className="stat-item">
                <span className="stat-label">{t('trading.aiTrading.stats.totalTrades', language)}</span>
                <span className="stat-value">{tradingStats.totalTrades}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('trading.aiTrading.stats.winRate', language)}</span>
                <span className="stat-value">{tradingStats.winRate.toFixed(1)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('trading.aiTrading.stats.totalProfit', language)}</span>
                <span className={`stat-value ${tradingStats.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                  {tradingStats.totalProfit >= 0 ? '+' : ''}{tradingStats.totalProfit.toFixed(2)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('trading.aiTrading.stats.profitPercent', language)}</span>
                <span className={`stat-value ${tradingStats.profitPercent >= 0 ? 'positive' : 'negative'}`}>
                  {tradingStats.profitPercent >= 0 ? '+' : ''}{tradingStats.profitPercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* 리스크 관리 설정 */}
            <div className="ai-risk-management-section">
              <h4>{language === 'ko' ? '리스크 관리 설정' : 'Risk Management Settings'}</h4>
              <div className="risk-settings-grid">
                <div className="risk-setting-item">
                  <label>{language === 'ko' ? '손절 (%)' : 'Stop Loss (%)'}</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={riskSettings.stopLoss}
                    onChange={(e) => setRiskSettings(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) || 0 }))}
                    className="risk-input"
                    disabled={isAiTradingActive}
                  />
                </div>
                <div className="risk-setting-item">
                  <label>{language === 'ko' ? '익절 (%)' : 'Take Profit (%)'}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={riskSettings.takeProfit}
                    onChange={(e) => setRiskSettings(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) || 0 }))}
                    className="risk-input"
                    disabled={isAiTradingActive}
                  />
                </div>
                <div className="risk-setting-item">
                  <label>{language === 'ko' ? '최대 손실 (%)' : 'Max Loss (%)'}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={riskSettings.maxLoss}
                    onChange={(e) => setRiskSettings(prev => ({ ...prev, maxLoss: parseFloat(e.target.value) || 0 }))}
                    className="risk-input"
                    disabled={isAiTradingActive}
                  />
                </div>
                <div className="risk-setting-item">
                  <label>{language === 'ko' ? '포지션 크기 (%)' : 'Position Size (%)'}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={riskSettings.positionSize}
                    onChange={(e) => setRiskSettings(prev => ({ ...prev, positionSize: parseFloat(e.target.value) || 1 }))}
                    className="risk-input"
                    disabled={isAiTradingActive}
                  />
                </div>
              </div>
              {isAiTradingActive && (
                <p className="risk-settings-note">
                  {language === 'ko'
                    ? '※ 자동 거래 중에는 설정을 변경할 수 없습니다.'
                    : '※ Settings cannot be changed while auto trading is active.'
                  }
                </p>
              )}
            </div>


            {/* AI 신호 */}
            <div className="ai-signals-section">
              <div className="signals-section-header">
                <h4>{t('trading.aiTrading.signals', language)}</h4>
                <span className="signals-note">
                  {language === 'ko'
                    ? '(신호 생성 시 자동 거래 실행)'
                    : '(Auto-executed when signal generated)'
                  }
                </span>
              </div>
              {aiSignals.length > 0 ? (
                <div className="signals-list">
                  {aiSignals.map((signal, index) => (
                    <div key={index} className={`signal-item ${signal.type}`}>
                      <span className="signal-time">{new Date(signal.timestamp).toLocaleTimeString()}</span>
                      <span className="signal-action">
                        {signal.action === 'BUY'
                          ? (language === 'ko' ? '매수' : 'BUY')
                          : (language === 'ko' ? '매도' : 'SELL')
                        }
                      </span>
                      <span className="signal-price">
                        {item.category === 'crypto'
                          ? formatCryptoPrice(signal.price?.toString() || '0')
                          : signal.price?.toFixed(2) || '0.00'
                        }
                      </span>
                      <span className="signal-confidence">
                        {language === 'ko' ? '신뢰도' : 'Confidence'}: {signal.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-signals">{t('trading.aiTrading.noSignals', language)}</p>
              )}
            </div>
          </div>
        )}

        {/* 자산 현황 */}
        <div className="trading-assets-section">
          <h3 className="assets-section-title">
            {language === 'ko' ? '내 자산 현황' : 'My Assets'}
          </h3>
          <div className="assets-grid">
            <div className="asset-item total">
              <div className="asset-label">
                {language === 'ko' ? '총 자산' : 'Total Assets'}
              </div>
              <div className="asset-value">
                ${assets.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {assets.initialAssets !== null && assets.initialAssets > 0 && (
                <div className={`asset-subvalue ${assets.totalAssets >= assets.initialAssets ? 'positive' : 'negative'}`}>
                  {language === 'ko' ? '수익률' : 'Return'}: {assets.totalAssets >= assets.initialAssets ? '+' : ''}
                  {((assets.totalAssets - assets.initialAssets) / assets.initialAssets * 100).toFixed(2)}%
                </div>
              )}
            </div>
            <div className="asset-item cash">
              <div className="asset-label">
                {language === 'ko' ? '현금 잔고' : 'Cash Balance'}
              </div>
              <div className="asset-value">
                ${assets.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="asset-item holdings">
              <div className="asset-label">
                {language === 'ko' ? '보유 수량' : 'Holdings'}
              </div>
              <div className="asset-value">
                {assets.holdings.amount.toFixed(4)} {item.symbol}
              </div>
              {assets.holdings.amount > 0 && (
                <div className="asset-subvalue">
                  {language === 'ko' ? '평균 단가' : 'Avg Price'}: {item.category === 'crypto'
                    ? formatCryptoPrice(assets.holdings.averagePrice.toString())
                    : assets.holdings.averagePrice.toFixed(2)
                  }
                </div>
              )}
            </div>
            {assets.holdings.amount > 0 && (
              <div className={`asset-item pnl ${assets.holdings.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                <div className="asset-label">
                  {language === 'ko' ? '평가 손익' : 'Unrealized P/L'}
                </div>
                <div className="asset-value">
                  {assets.holdings.profitLoss >= 0 ? '+' : ''}${assets.holdings.profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="asset-subvalue">
                  ({assets.holdings.profitLossPercent >= 0 ? '+' : ''}{assets.holdings.profitLossPercent.toFixed(2)}%)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 가격 정보 */}
        <div className="trading-price-section">
          <div className="trading-current-price">
            {isLoading || currentPrice === 0 ? (
              <span className="price-value loading">{t('trading.loading', language)}</span>
            ) : (
              <>
                <span className="price-value">
                  ${item.category === 'crypto'
                    ? formatCryptoPrice(currentPriceString || currentPrice.toString())
                    : currentPrice.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })
                  }
                </span>
                <span className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
                  {priceChange >= 0 ? '+' : ''}{item.category === 'crypto' ? formatCryptoPrice(priceChange.toString()) : priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </>
            )}
          </div>
        </div>

        {/* 차트 영역 */}
        <div className="trading-chart-section">
          {item.category === 'crypto' || item.category === 'stocks' || item.category === 'futures' || item.category === 'commodities' || item.category === 'etf' || item.category === 'bonds' || item.category === 'currency' ? (
            <div ref={chartContainerRef} className="trading-chart-container">
              {isLoading && (
                <div className="trading-chart-placeholder">
                  <p>{t('trading.loading', language)}</p>
                </div>
              )}
              <div className="chart-data-source">
                {item.category === 'crypto' && 'Data: Binance'}
                {item.category === 'stocks' && 'Data: Yahoo Finance'}
                {item.category === 'futures' && 'Data: Binance Futures'}
                {item.category === 'commodities' && 'Data: Yahoo Finance'}
                {item.category === 'etf' && 'Data: Yahoo Finance'}
                {item.category === 'bonds' && 'Data: Yahoo Finance'}
                {item.category === 'currency' && 'Data: Yahoo Finance'}
              </div>
            </div>
          ) : (
            <div className="trading-chart-placeholder">
              <p>{t('trading.chartPlaceholder', language)}</p>
            </div>
          )}
        </div>

        {/* 주문 입력 폼 */}
        <div className="trading-order-section">
          <div className="trading-order-tabs">
            {item.category === 'futures' ? (
              // 선물 거래: 포지션 상태에 따라 다르게 표시
              assets.holdings.amount === 0 ? (
                // 포지션 없음: 롱/숏 진입 탭
                <>
                  <button
                    className={`order-tab ${positionType === 'long' ? 'active buy' : ''}`}
                    onClick={() => setPositionType('long')}
                  >
                    {language === 'ko' ? '롱 진입' : 'Open Long'}
                  </button>
                  <button
                    className={`order-tab ${positionType === 'short' ? 'active sell' : ''}`}
                    onClick={() => setPositionType('short')}
                  >
                    {language === 'ko' ? '숏 진입' : 'Open Short'}
                  </button>
                </>
              ) : (
                // 포지션 있음: 현재 포지션 정보만 표시
                <div className="current-position-info">
                  <span className="position-badge">
                    {assets.holdings.amount > 0
                      ? (language === 'ko' ? '롱 포지션' : 'Long Position')
                      : (language === 'ko' ? '숏 포지션' : 'Short Position')
                    }
                  </span>
                  <span className="position-amount">
                    {Math.abs(assets.holdings.amount).toFixed(4)} {item.symbol}
                  </span>
                </div>
              )
            ) : (
              // 일반 거래: 매수/매도
              <>
                <button
                  className={`order-tab ${side === 'buy' ? 'active buy' : ''}`}
                  onClick={() => setSide('buy')}
                >
                  {t('trading.buy', language)}
                </button>
                <button
                  className={`order-tab ${side === 'sell' ? 'active sell' : ''} ${assets.holdings.amount === 0 ? 'disabled' : ''}`}
                  onClick={() => {
                    if (assets.holdings.amount > 0) {
                      setSide('sell')
                    } else {
                      alert(language === 'ko' ? '보유한 코인이 없어 매도할 수 없습니다. 먼저 매수해주세요.' : 'You have no coins to sell. Please buy first.')
                    }
                  }}
                  disabled={assets.holdings.amount === 0}
                >
                  {t('trading.sell', language)}
                </button>
              </>
            )}
          </div>

          {/* 선물 거래: 레버리지 설정 */}
          {item.category === 'futures' && (
            <div className="futures-leverage-section">
              <label>{language === 'ko' ? '레버리지' : 'Leverage'}</label>
              <div className="leverage-buttons">
                {[1, 5, 10, 20, 50, 100].map(lev => (
                  <button
                    key={lev}
                    className={`leverage-btn ${leverage === lev ? 'active' : ''}`}
                    onClick={() => setLeverage(lev)}
                  >
                    {lev}x
                  </button>
                ))}
              </div>
              <div className="leverage-info">
                {language === 'ko'
                  ? `레버리지 ${leverage}x: ${leverage}배 레버리지로 거래합니다. 손익이 ${leverage}배 증폭됩니다.`
                  : `Leverage ${leverage}x: Trade with ${leverage}x leverage. Profit/loss will be amplified ${leverage}x.`
                }
              </div>
            </div>
          )}

          <div className="trading-order-type">
            <button
              className={`order-type-btn ${orderType === 'market' ? 'active' : ''}`}
              onClick={() => setOrderType('market')}
            >
              {t('trading.market', language)}
            </button>
            <button
              className={`order-type-btn ${orderType === 'limit' ? 'active' : ''}`}
              onClick={() => setOrderType('limit')}
            >
              {t('trading.limit', language)}
            </button>
          </div>

          <div className="trading-order-form">
            {orderType === 'limit' && (
              <div className="order-input-group">
                <label>{t('trading.price', language)}</label>
                <input
                  type="text"
                  value={price}
                  onChange={handlePriceChange}
                  placeholder={item.category === 'crypto' ? (currentPriceString || currentPrice.toString()) : currentPrice.toFixed(2)}
                  className="order-input"
                />
              </div>
            )}

            <div className="order-input-group">
              <label>
                {t('trading.amount', language)}
                {item.category === 'futures' && assets.holdings.amount !== 0 ? (
                  <span className="available-balance">
                    ({language === 'ko' ? '종료 수량' : 'Close Amount'}: {Math.abs(assets.holdings.amount).toFixed(4)} {item.symbol})
                  </span>
                ) : side === 'buy' && (
                  <span className="available-balance">
                    ({language === 'ko' ? '가능' : 'Available'}: ${assets.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                )}
                {side === 'sell' && assets.holdings.amount > 0 && (
                  <span className="available-balance">
                    ({language === 'ko' ? '보유' : 'Holding'}: {assets.holdings.amount.toFixed(4)} {item.symbol})
                  </span>
                )}
              </label>
              {item.category === 'futures' && assets.holdings.amount !== 0 ? (
                // 포지션이 있을 때는 수량 입력 비활성화 (전체 종료)
                <input
                  type="text"
                  value={Math.abs(assets.holdings.amount).toFixed(4)}
                  disabled
                  className="order-input disabled-input"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              ) : (
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="order-input"
                />
              )}
              <div className="amount-percentage-buttons">
                <button onClick={() => handlePercentageClick(25)}>25%</button>
                <button onClick={() => handlePercentageClick(50)}>50%</button>
                <button onClick={() => handlePercentageClick(75)}>75%</button>
                <button onClick={() => handlePercentageClick(100)}>100%</button>
              </div>
            </div>

            <div className="order-summary">
              <div className="summary-row">
                <span>{t('trading.total', language)}</span>
                <span>${totalValue}</span>
              </div>
              {item.category === 'futures' && parseFloat(amount) > 0 && (
                <>
                  <div className="summary-row">
                    <span>{language === 'ko' ? '레버리지' : 'Leverage'}</span>
                    <span>{leverage}x</span>
                  </div>
                  <div className="summary-row">
                    <span>{language === 'ko' ? '필요 마진' : 'Required Margin'}</span>
                    <span>${(parseFloat(totalValue) / leverage).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className={`summary-row ${(parseFloat(totalValue) / leverage) > assets.cashBalance ? 'insufficient' : ''}`}>
                    <span>{language === 'ko' ? '가용 마진' : 'Available Margin'}</span>
                    <span>${assets.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {(parseFloat(totalValue) / leverage) > assets.cashBalance && (
                    <div className="summary-warning">
                      {language === 'ko' ? '⚠️ 마진이 부족합니다.' : '⚠️ Insufficient margin'}
                    </div>
                  )}
                </>
              )}
              {item.category !== 'futures' && side === 'buy' && parseFloat(amount) > 0 && (
                <div className={`summary-row ${parseFloat(totalValue) > assets.cashBalance ? 'insufficient' : ''}`}>
                  <span>{language === 'ko' ? '잔고' : 'Balance'}</span>
                  <span>${assets.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {item.category !== 'futures' && side === 'buy' && parseFloat(totalValue) > assets.cashBalance && (
                <div className="summary-warning">
                  {language === 'ko' ? '⚠️ 잔고가 부족합니다.' : '⚠️ Insufficient balance'}
                </div>
              )}
              {item.category !== 'futures' && side === 'sell' && parseFloat(amount) > assets.holdings.amount && (
                <div className="summary-warning">
                  {language === 'ko' ? '⚠️ 보유 수량이 부족합니다.' : '⚠️ Insufficient holdings'}
                </div>
              )}
            </div>

            <button
              className={`order-submit-btn ${item.category === 'futures'
                ? (assets.holdings.amount === 0 ? positionType : 'close')
                : side}`}
              onClick={handleOrderSubmit}
              disabled={item.category === 'futures' && assets.holdings.amount !== 0
                ? false // 종료 버튼은 항상 활성화 (수량 입력 불필요)
                : (!amount || (orderType === 'limit' && !price))}
            >
              {item.category === 'futures'
                ? (assets.holdings.amount === 0
                  ? (positionType === 'long'
                    ? (language === 'ko' ? '롱 진입' : 'Open Long')
                    : (language === 'ko' ? '숏 진입' : 'Open Short'))
                  : (language === 'ko' ? '포지션 종료' : 'Close Position'))
                : (side === 'buy' ? t('trading.buyOrder', language) : t('trading.sellOrder', language))
              }
            </button>
          </div>
        </div>


        {/* 거래 내역 - 수동 모드와 자동 모드 모두 표시 */}
        <div className="ai-trade-history-section">
          <div className="trade-history-header-section">
            <h4>{language === 'ko' ? '거래 내역' : 'Trade History'}</h4>
            <div className="trade-history-filter-buttons">
              <button
                className={`filter-btn ${tradeHistoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTradeHistoryFilter('all')}
              >
                {language === 'ko' ? '전체' : 'All'}
              </button>
              <button
                className={`filter-btn ${tradeHistoryFilter === 'manual' ? 'active' : ''}`}
                onClick={() => setTradeHistoryFilter('manual')}
              >
                {language === 'ko' ? '수동' : 'Manual'}
              </button>
              <button
                className={`filter-btn ${tradeHistoryFilter === 'auto' ? 'active' : ''}`}
                onClick={() => setTradeHistoryFilter('auto')}
              >
                {language === 'ko' ? 'AI' : 'AI'}
              </button>
            </div>
          </div>
          <p className="trade-history-description">
            {language === 'ko'
              ? '수동 거래와 AI 자동 거래 내역을 모두 확인할 수 있습니다.'
              : 'View both manual and AI auto trade history.'
            }
          </p>
          {(() => {
            const filteredHistory = tradeHistory.filter(trade => {
              if (tradeHistoryFilter === 'all') return true
              if (tradeHistoryFilter === 'manual') return trade.isManual === true
              if (tradeHistoryFilter === 'auto') return trade.isManual !== true
              return true
            })

            return filteredHistory.length > 0 ? (
              <div className="trade-history-table">
                <div className="trade-history-header">
                  <span>{t('trading.aiTrading.trade.time', language)}</span>
                  <span>{t('trading.aiTrading.trade.action', language)}</span>
                  <span>{t('trading.aiTrading.trade.price', language)}</span>
                  <span>{t('trading.aiTrading.trade.amount', language)}</span>
                  <span>{t('trading.aiTrading.trade.profit', language)}</span>
                </div>
                <div className="trade-history-body">
                  {filteredHistory.map((trade) => (
                    <div key={trade.id} className={`trade-history-row ${trade.isWin ? 'win' : (trade.action === 'BUY' || trade.action === 'LONG' ? '' : 'loss')}`}>
                      <span className="trade-time">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                      <span className={`trade-action ${trade.action.toLowerCase().replace('_', '-')}`}>
                        {trade.action === 'LONG'
                          ? (language === 'ko' ? '롱' : 'LONG')
                          : trade.action === 'SHORT'
                            ? (language === 'ko' ? '숏' : 'SHORT')
                            : trade.action === 'LONG_CLOSE'
                              ? (language === 'ko' ? '롱 종료' : 'LONG CLOSE')
                              : trade.action === 'SHORT_CLOSE'
                                ? (language === 'ko' ? '숏 종료' : 'SHORT CLOSE')
                                : trade.action === 'BUY'
                                  ? (language === 'ko' ? '매수' : 'BUY')
                                  : (language === 'ko' ? '매도' : 'SELL')
                        }
                        {trade.isManual ? (
                          <span className="trade-type-badge manual">
                            {language === 'ko' ? '수동' : 'Manual'}
                          </span>
                        ) : (
                          <span className="trade-type-badge auto">
                            {language === 'ko' ? 'AI' : 'AI'}
                          </span>
                        )}
                      </span>
                      <span className="trade-price">
                        ${item.category === 'crypto'
                          ? formatCryptoPrice(trade.price?.toString() || '0')
                          : trade.price?.toFixed(2) || '0.00'
                        }
                      </span>
                      <span className="trade-amount">{trade.amount.toFixed(4)}</span>
                      <span className={`trade-profit ${trade.profit >= 0 ? 'positive' : 'negative'}`}>
                        {(trade.action === 'SELL' || trade.action === 'SHORT' || trade.action === 'LONG' || trade.action === 'LONG_CLOSE' || trade.action === 'SHORT_CLOSE') ? (
                          <>
                            {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)} ({trade.profitPercent >= 0 ? '+' : ''}{trade.profitPercent.toFixed(2)}%)
                          </>
                        ) : (
                          <span className="no-profit">-</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="no-trades">{language === 'ko' ? '거래 내역이 없습니다.' : 'No trades yet.'}</p>
            )
          })()}
        </div>

      </div>
    </div>
  )
}

export default TradingPage

