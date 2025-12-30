/**
 * 해외 주식 API 유틸리티
 * 실시간 해외 주식 가격 데이터를 가져옵니다.
 * 네이버증권, 한국투자증권 등의 API를 사용합니다.
 */

/**
 * 원자재 심볼을 Yahoo Finance 심볼로 변환
 */
export const getCommoditySymbol = (symbol) => {
  const symbolMap = {
    'GOLD': 'GC=F',      // Gold Futures
    'SILVER': 'SI=F',    // Silver Futures
    'OIL': 'CL=F',       // Crude Oil Futures
    'COPPER': 'HG=F',    // Copper Futures
    'WHEAT': 'ZW=F',     // Wheat Futures
    'CORN': 'ZC=F'       // Corn Futures
  }
  return symbolMap[symbol] || symbol
}

/**
 * 주식 심볼을 API 형식으로 변환
 */
export const getStockSymbol = (symbol) => {
  // 해외 주식은 그대로 사용 (예: AAPL, MSFT)
  return symbol
}

/**
 * 채권 심볼을 Yahoo Finance 심볼로 변환
 */
export const getBondSymbol = (symbol) => {
  const symbolMap = {
    'US10Y': '^TNX',  // US 10-Year Treasury Yield
    'US30Y': '^TYX',  // US 30-Year Treasury Yield
    'TIPS': 'TIP',    // TIPS ETF
    'LQD': 'LQD'      // Corporate Bond ETF (그대로 사용)
  }
  return symbolMap[symbol] || symbol
}

/**
 * 외화 심볼을 Yahoo Finance 심볼로 변환
 */
export const getCurrencySymbol = (symbol) => {
  const symbolMap = {
    'EURUSD': 'EURUSD=X',  // Euro / US Dollar
    'GBPUSD': 'GBPUSD=X',  // British Pound / US Dollar
    'USDJPY': 'USDJPY=X',  // US Dollar / Japanese Yen
    'USDKRW': 'USDKRW=X',  // US Dollar / Korean Won
    'USDCNY': 'USDCNY=X',  // US Dollar / Chinese Yuan
    'AUDUSD': 'AUDUSD=X'   // Australian Dollar / US Dollar
  }
  return symbolMap[symbol] || symbol
}

/**
 * 실시간 원자재 가격 구독
 * @param {string} symbol - 원자재 심볼 (GOLD, SILVER, OIL 등)
 * @param {Function} onPriceUpdate - 가격 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToCommodityPrice = (symbol, onPriceUpdate) => {
  const yahooSymbol = getCommoditySymbol(symbol)
  return subscribeToPrice(yahooSymbol, onPriceUpdate)
}

/**
 * 실시간 채권 가격 구독
 * @param {string} symbol - 채권 심볼 (US10Y, US30Y, TIPS, LQD)
 * @param {Function} onPriceUpdate - 가격 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToBondPrice = (symbol, onPriceUpdate) => {
  const yahooSymbol = getBondSymbol(symbol)
  return subscribeToPrice(yahooSymbol, onPriceUpdate)
}

/**
 * 실시간 외화 가격 구독
 * @param {string} symbol - 외화 심볼 (EURUSD, GBPUSD, USDJPY 등)
 * @param {Function} onPriceUpdate - 가격 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToCurrencyPrice = (symbol, onPriceUpdate) => {
  const yahooSymbol = getCurrencySymbol(symbol)
  return subscribeToPrice(yahooSymbol, onPriceUpdate)
}

/**
 * 실시간 주식 가격 구독 (WebSocket 또는 폴링)
 * @param {string} symbol - 주식 심볼 (예: AAPL, MSFT)
 * @param {Function} onPriceUpdate - 가격 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToPrice = (symbol, onPriceUpdate) => {
  // 한국투자증권 또는 네이버증권 API 사용
  // 일단 폴링 방식으로 구현 (WebSocket이 없는 경우)
  let intervalId = null
  let isActive = true

  const fetchPrice = async () => {
    if (!isActive) return

    try {
      // 한국투자증권 해외주식 현재가 조회 API
      // 또는 네이버증권 해외주식 API 사용
      const priceData = await getCurrentPrice(symbol)
      
      if (priceData && isActive) {
        const updateData = {
          price: priceData.price,
          priceString: priceData.priceString || priceData.price.toString(),
          priceChange: priceData.priceChange || 0,
          priceChangePercent: priceData.priceChangePercent || 0,
          high24h: priceData.high24h || priceData.price,
          low24h: priceData.low24h || priceData.price,
          volume24h: priceData.volume24h || 0,
          timestamp: Date.now()
        }
        
        // 디버깅: 가격 업데이트 로그 (10초마다)
        const now = Date.now()
        if (!window.lastPriceUpdateLog || now - window.lastPriceUpdateLog > 10000) {
          console.log(`📈 Price update for ${symbol}:`, {
            price: updateData.price,
            priceString: updateData.priceString,
            change: updateData.priceChange,
            changePercent: updateData.priceChangePercent,
            timestamp: new Date(updateData.timestamp).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
          })
          window.lastPriceUpdateLog = now
        }
        onPriceUpdate(updateData)
      } else {
        console.warn(`⚠️ No price data received for ${symbol}`)
      }
    } catch (error) {
      console.error(`❌ Error fetching stock price for ${symbol}:`, error)
    }
  }

  // 즉시 한 번 실행
  fetchPrice()

  // 1초마다 업데이트 (실시간)
  intervalId = setInterval(fetchPrice, 1000)

  return () => {
    isActive = false
    if (intervalId) {
      clearInterval(intervalId)
    }
  }
}

/**
 * 실시간 원자재 차트 데이터 구독 (1분봉)
 * @param {string} symbol - 원자재 심볼 (GOLD, SILVER, OIL 등)
 * @param {Function} onCandleUpdate - 캔들 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToCommodityCandles = (symbol, onCandleUpdate) => {
  const yahooSymbol = getCommoditySymbol(symbol)
  return subscribeToCandles(yahooSymbol, onCandleUpdate)
}

/**
 * 실시간 채권 차트 데이터 구독 (1분봉)
 * @param {string} symbol - 채권 심볼 (US10Y, US30Y, TIPS, LQD)
 * @param {Function} onCandleUpdate - 캔들 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToBondCandles = (symbol, onCandleUpdate) => {
  const yahooSymbol = getBondSymbol(symbol)
  return subscribeToCandles(yahooSymbol, onCandleUpdate)
}

/**
 * 실시간 외화 차트 데이터 구독 (1분봉)
 * @param {string} symbol - 외화 심볼 (EURUSD, GBPUSD, USDJPY 등)
 * @param {Function} onCandleUpdate - 캔들 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToCurrencyCandles = (symbol, onCandleUpdate) => {
  const yahooSymbol = getCurrencySymbol(symbol)
  return subscribeToCandles(yahooSymbol, onCandleUpdate)
}

/**
 * 실시간 차트 데이터 구독 (1분봉)
 * @param {string} symbol - 주식 심볼
 * @param {Function} onCandleUpdate - 캔들 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToCandles = (symbol, onCandleUpdate) => {
  // 폴링 방식으로 1분마다 최신 캔들 데이터 가져오기
  let intervalId = null
  let isActive = true
  let lastCandleTime = null

  const fetchCandle = async () => {
    if (!isActive) return

    try {
      // 최신 데이터를 확실히 가져오기 위해 더 많은 캔들 가져오기 (최근 10개)
      // 그리고 현재 시간 기준으로 필터링
      const candles = await getHistoricalCandles(symbol, '1m', 10)
      
      if (candles && candles.length > 0 && isActive) {
        // 현재 시간 기준으로 최신 캔들만 필터링 (최근 5분 이내)
        const now = Math.floor(Date.now() / 1000)
        const fiveMinutesAgo = now - (5 * 60)
        
        // 최신 캔들들 중에서 가장 최신 것 선택
        const recentCandles = candles.filter(c => {
          const time = typeof c.time === 'number' ? Math.floor(c.time) : 0
          return time >= fiveMinutesAgo
        })
        
        // 최신 캔들 선택 (최근 것이 없으면 전체에서 가장 최신 것)
        const latestCandle = recentCandles.length > 0 
          ? recentCandles[recentCandles.length - 1]
          : candles[candles.length - 1]
        
        // 타임스탬프 정수 변환 (반드시 숫자여야 함)
        let candleTime
        if (typeof latestCandle.time === 'number') {
          candleTime = Math.floor(latestCandle.time)
        } else {
          console.warn(`Invalid candle time type for ${symbol}:`, typeof latestCandle.time, latestCandle.time)
          candleTime = Math.floor(Date.now() / 1000)
        }
        
        // 타임스탬프 유효성 검사
        if (isNaN(candleTime) || candleTime <= 0) {
          console.warn(`Invalid candle time value for ${symbol}:`, candleTime)
          candleTime = Math.floor(Date.now() / 1000)
        }
        
        // 새로운 캔들인 경우에만 업데이트 (같은 타임스탬프면 스킵)
        if (!lastCandleTime || candleTime > lastCandleTime) {
          lastCandleTime = candleTime
          
          const candleData = {
            time: candleTime,
            open: parseFloat(latestCandle.open) || 0,
            high: parseFloat(latestCandle.high) || 0,
            low: parseFloat(latestCandle.low) || 0,
            close: parseFloat(latestCandle.close) || 0,
            volume: parseFloat(latestCandle.volume) || 0,
            isClosed: false // 실시간 업데이트 중
          }
          
          // 디버깅: 타임스탬프 확인
          const logNow = Date.now()
          if (!window.lastCandleFetchLog || logNow - window.lastCandleFetchLog > 10000) {
            console.log(`📊 Candle update for ${symbol}:`, {
              time: candleTime,
              timeFormatted: new Date(candleTime * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
              close: candleData.close,
              lastCandleTime: lastCandleTime,
              currentTime: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
              timeDiff: now - candleTime
            })
            window.lastCandleFetchLog = logNow
          }
          
          onCandleUpdate(candleData)
        } else {
          // 같은 타임스탬프면 스킵 (너무 많은 로그 방지)
          const logNow = Date.now()
          if (!window.lastCandleSkipLog || logNow - window.lastCandleSkipLog > 30000) {
            console.log(`⏭️ Skipping duplicate candle for ${symbol}:`, {
              time: candleTime,
              lastCandleTime: lastCandleTime
            })
            window.lastCandleSkipLog = logNow
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching stock candles for ${symbol}:`, error)
    }
  }

  // 즉시 한 번 실행
  fetchCandle()

  // 5초마다 업데이트 (실시간)
  intervalId = setInterval(fetchCandle, 5000)

  return () => {
    isActive = false
    if (intervalId) {
      clearInterval(intervalId)
    }
  }
}

/**
 * 과거 차트 데이터 가져오기
 * @param {string} symbol - 주식 심볼
 * @param {string} interval - 시간 간격 (1m, 5m, 15m, 1h, 1d 등)
 * @param {number} limit - 가져올 데이터 개수
 * @returns {Promise<Array>} 차트 데이터 배열
 */
export const getHistoricalCandles = async (symbol, interval = '1m', limit = 500) => {
  try {
    // 백엔드 API를 통해 Yahoo Finance 데이터 가져오기 (CORS 문제 해결)
    // interval에 따라 range 설정
    let range = '1d'
    if (interval === '1m') {
      range = '1d' // 1분봉은 최근 1일
    } else if (interval === '5m') {
      range = '5d'
    } else if (interval === '15m') {
      range = '1mo'
    } else if (interval === '1h') {
      range = '3mo'
    } else if (interval === '1d') {
      range = '1y'
    }

    const apiUrl = `http://localhost:3000/api/v1/stock/chart/${symbol}?interval=${interval}&range=${range}`
    
    console.log(`📡 Fetching historical stock candles via backend API: ${symbol} (${interval}, ${range})`)
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data || !data.candles || data.candles.length === 0) {
      console.warn('Backend API: No data, using mock data')
      return generateMockCandles(symbol, limit)
    }

    const candles = data.candles.slice(0, limit)

    // 타임스탬프를 정수로 변환 (초 단위) - 먼저 변환
    const normalizedCandles = candles.map(candle => {
      let timeValue
      if (typeof candle.time === 'number') {
        // 숫자인 경우: 10자리면 초, 13자리면 밀리초
        if (candle.time > 1e12) {
          timeValue = Math.floor(candle.time / 1000) // 밀리초를 초로 변환
        } else {
          timeValue = Math.floor(candle.time) // 초 단위
        }
      } else if (candle.time && typeof candle.time === 'object') {
        // 객체인 경우 (Date 객체 등)
        timeValue = Math.floor(candle.time.getTime ? candle.time.getTime() / 1000 : Date.now() / 1000)
      } else if (typeof candle.time === 'string') {
        // 문자열인 경우
        timeValue = Math.floor(new Date(candle.time).getTime() / 1000)
      } else {
        timeValue = Math.floor(Date.now() / 1000)
      }
      
      // 타임스탬프 유효성 검사
      if (isNaN(timeValue) || timeValue <= 0) {
        console.warn('Invalid candle time, using current time:', candle.time)
        timeValue = Math.floor(Date.now() / 1000)
      }
      
      return {
        time: timeValue,
        open: parseFloat(candle.open) || 0,
        high: parseFloat(candle.high) || 0,
        low: parseFloat(candle.low) || 0,
        close: parseFloat(candle.close) || 0,
        volume: parseFloat(candle.volume) || 0
      }
    })

    console.log(`📊 Historical stock candles loaded via backend API (${symbol}):`, {
      'Total Candles': normalizedCandles.length,
      'First Candle': normalizedCandles[0] ? new Date(normalizedCandles[0].time * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : 'N/A',
      'Last Candle': normalizedCandles[normalizedCandles.length - 1] ? new Date(normalizedCandles[normalizedCandles.length - 1].time * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : 'N/A'
    })

    return normalizedCandles
  } catch (error) {
    console.error('Error fetching historical stock candles from backend API:', error)
    // 에러 발생 시 모의 데이터 반환
    return generateMockCandles(symbol, limit)
  }
}

/**
 * 원자재 현재 가격 가져오기
 * @param {string} symbol - 원자재 심볼 (GOLD, SILVER, OIL 등)
 * @returns {Promise<Object>} 가격 데이터
 */
export const getCommodityCurrentPrice = async (symbol) => {
  const yahooSymbol = getCommoditySymbol(symbol)
  return await getCurrentPrice(yahooSymbol)
}

/**
 * 채권 현재 가격 가져오기
 * @param {string} symbol - 채권 심볼 (US10Y, US30Y, TIPS, LQD)
 * @returns {Promise<Object>} 가격 데이터
 */
export const getBondCurrentPrice = async (symbol) => {
  const yahooSymbol = getBondSymbol(symbol)
  return await getCurrentPrice(yahooSymbol)
}

/**
 * 외화 현재 가격 가져오기
 * @param {string} symbol - 외화 심볼 (EURUSD, GBPUSD, USDJPY 등)
 * @returns {Promise<Object>} 가격 데이터
 */
export const getCurrencyCurrentPrice = async (symbol) => {
  const yahooSymbol = getCurrencySymbol(symbol)
  return await getCurrentPrice(yahooSymbol)
}

/**
 * 원자재 과거 차트 데이터 가져오기
 * @param {string} symbol - 원자재 심볼 (GOLD, SILVER, OIL 등)
 * @param {string} interval - 간격 (1m, 5m, 1h, 1d 등)
 * @param {number} limit - 가져올 데이터 개수
 * @returns {Promise<Array>} 캔들 데이터 배열
 */
export const getCommodityHistoricalCandles = async (symbol, interval = '1m', limit = 500) => {
  const yahooSymbol = getCommoditySymbol(symbol)
  return await getHistoricalCandles(yahooSymbol, interval, limit)
}

/**
 * 채권 과거 차트 데이터 가져오기
 * @param {string} symbol - 채권 심볼 (US10Y, US30Y, TIPS, LQD)
 * @param {string} interval - 간격 (1m, 5m, 1h, 1d 등)
 * @param {number} limit - 가져올 데이터 개수
 * @returns {Promise<Array>} 캔들 데이터 배열
 */
export const getBondHistoricalCandles = async (symbol, interval = '1m', limit = 500) => {
  const yahooSymbol = getBondSymbol(symbol)
  return await getHistoricalCandles(yahooSymbol, interval, limit)
}

/**
 * 외화 과거 차트 데이터 가져오기
 * @param {string} symbol - 외화 심볼 (EURUSD, GBPUSD, USDJPY 등)
 * @param {string} interval - 간격 (1m, 5m, 1h, 1d 등)
 * @param {number} limit - 가져올 데이터 개수
 * @returns {Promise<Array>} 캔들 데이터 배열
 */
export const getCurrencyHistoricalCandles = async (symbol, interval = '1m', limit = 500) => {
  const yahooSymbol = getCurrencySymbol(symbol)
  return await getHistoricalCandles(yahooSymbol, interval, limit)
}

/**
 * 현재 가격 가져오기
 * @param {string} symbol - 주식 심볼
 * @returns {Promise<Object>} 현재 가격 (price: number, priceString: string)
 */
export const getCurrentPrice = async (symbol) => {
  try {
    // 백엔드 API를 통해 Yahoo Finance 데이터 가져오기 (CORS 문제 해결)
    const apiUrl = `http://localhost:3000/api/v1/stock/price/${symbol}`
    
    console.log(`📡 Fetching stock price via backend API: ${symbol}`)
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data || !data.price) {
      console.warn('Backend API: No data, using mock price')
      return generateMockPrice(symbol)
    }

    console.log(`✅ Stock price for ${symbol}:`, {
      price: data.price,
      change: data.priceChange,
      changePercent: data.priceChangePercent?.toFixed(2) + '%'
    })

    return data
  } catch (error) {
    console.error('Error fetching current stock price from backend API:', error)
    // 에러 발생 시 모의 데이터 반환
    return generateMockPrice(symbol)
  }
}

/**
 * 모의 캔들 데이터 생성 (API 제한 시 사용)
 */
const generateMockCandles = (symbol, limit) => {
  const basePrice = getBasePrice(symbol)
  const candles = []
  const now = Math.floor(Date.now() / 1000)
  
  for (let i = limit - 1; i >= 0; i--) {
    const time = now - (i * 60) // 1분 간격
    const variation = (Math.random() - 0.5) * 0.02 // ±1% 변동
    const open = basePrice * (1 + variation)
    const close = open * (1 + (Math.random() - 0.5) * 0.01)
    const high = Math.max(open, close) * (1 + Math.random() * 0.005)
    const low = Math.min(open, close) * (1 - Math.random() * 0.005)
    
    candles.push({
      time: time,
      open: open,
      high: high,
      low: low,
      close: close,
      volume: Math.floor(Math.random() * 1000000)
    })
  }
  
  return candles
}

/**
 * 모의 가격 데이터 생성 (API 제한 시 사용)
 */
const generateMockPrice = (symbol) => {
  const basePrice = getBasePrice(symbol)
  const variation = (Math.random() - 0.5) * 0.02
  const price = basePrice * (1 + variation)
  
  return {
    price: price,
    priceString: price.toFixed(2),
    priceChange: price - basePrice,
    priceChangePercent: (variation * 100),
    high24h: basePrice * 1.02,
    low24h: basePrice * 0.98,
    volume24h: Math.floor(Math.random() * 10000000)
  }
}

/**
 * 심볼별 기본 가격 (모의 데이터용)
 */
const getBasePrice = (symbol) => {
  const basePrices = {
    // 주식
    'AAPL': 180,
    'MSFT': 380,
    'GOOGL': 140,
    'AMZN': 150,
    'TSLA': 250,
    'META': 320,
    'NVDA': 500,
    'JPM': 160,
    // 원자재 (Yahoo Finance 심볼)
    'GC=F': 2650,    // Gold Futures
    'SI=F': 30,      // Silver Futures
    'CL=F': 75,      // Crude Oil Futures
    'HG=F': 4.5,     // Copper Futures
    'ZW=F': 600,     // Wheat Futures
    'ZC=F': 500      // Corn Futures
  }
  return basePrices[symbol] || 100
}

