/**
 * 선물옵션 API 유틸리티
 * Binance Futures API를 사용하여 실시간 선물 가격 데이터를 가져옵니다.
 */

/**
 * 선물 심볼을 Binance Futures 심볼로 변환
 * @param {string} symbol - 선물 심볼 (예: BTC, ETH, ES, NQ)
 * @returns {string} Binance Futures 심볼 (예: BTCUSDT, ETHUSDT)
 */
export const getFuturesSymbol = (symbol) => {
  // 코인 선물의 경우 USDT 마진 선물로 변환
  const cryptoFutures = ['BTC', 'ETH', 'XRP', 'BNB', 'SOL', 'ADA', 'DOGE', 'DOT']
  if (cryptoFutures.includes(symbol)) {
    return `${symbol}USDT`
  }
  // 일반 선물(ES, NQ 등)은 그대로 반환 (다른 API 사용 필요)
  return symbol
}

/**
 * Binance Futures WebSocket으로 실시간 가격 구독
 * @param {string} symbol - 선물 심볼 (예: BTC, ETH)
 * @param {Function} onPriceUpdate - 가격 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToPrice = (symbol, onPriceUpdate) => {
  const futuresSymbol = getFuturesSymbol(symbol)
  
  // 코인 선물인 경우 Binance Futures 사용
  if (futuresSymbol.endsWith('USDT')) {
    const wsSymbol = futuresSymbol.toLowerCase()
    const ws = new WebSocket(`wss://fstream.binance.com/ws/${wsSymbol}@ticker`)
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5

    const connect = () => {
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.c) { // 현재 가격 (close price)
            const price = parseFloat(data.c)
            const priceString = data.c // 원본 가격 문자열
            const priceChange = parseFloat(data.P) // 24시간 가격 변동률 (%)
            const priceChangeAmount = parseFloat(data.p) // 24시간 가격 변동량

            onPriceUpdate({
              price: price,
              priceString: priceString,
              priceChange: priceChangeAmount,
              priceChangePercent: priceChange,
              high24h: parseFloat(data.h) || price,
              low24h: parseFloat(data.l) || price,
              volume24h: parseFloat(data.v) || 0,
              timestamp: Date.now()
            })
          }
        } catch (error) {
          console.error('Error parsing futures price data:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('Futures WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('Futures WebSocket closed, attempting to reconnect...')
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          setTimeout(() => {
            connect()
          }, delay)
        }
      }
    }

    connect()

    return () => {
      ws.close()
    }
  } else {
    // 일반 선물(ES, NQ 등)은 폴링 방식 사용
    let intervalId = null
    let isActive = true

    const fetchPrice = async () => {
      if (!isActive) return

      try {
        const priceData = await getCurrentPrice(symbol)
        
        if (priceData && isActive) {
          onPriceUpdate({
            price: priceData.price,
            priceString: priceData.priceString || priceData.price.toString(),
            priceChange: priceData.priceChange || 0,
            priceChangePercent: priceData.priceChangePercent || 0,
            high24h: priceData.high24h || priceData.price,
            low24h: priceData.low24h || priceData.price,
            volume24h: priceData.volume24h || 0,
            timestamp: Date.now()
          })
        }
      } catch (error) {
        console.error(`Error fetching futures price for ${symbol}:`, error)
      }
    }

    fetchPrice()
    intervalId = setInterval(fetchPrice, 2000) // 2초마다 업데이트

    return () => {
      isActive = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }
}

/**
 * 실시간 차트 데이터 구독 (1분봉)
 * @param {string} symbol - 선물 심볼
 * @param {Function} onCandleUpdate - 캔들 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToCandles = (symbol, onCandleUpdate) => {
  const futuresSymbol = getFuturesSymbol(symbol)
  
  // 코인 선물인 경우 Binance Futures WebSocket 사용
  if (futuresSymbol.endsWith('USDT')) {
    const wsSymbol = futuresSymbol.toLowerCase()
    const ws = new WebSocket(`wss://fstream.binance.com/ws/${wsSymbol}@kline_1m`)
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5

    const connect = () => {
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.k) {
            const kline = data.k
            const candle = {
              time: Math.floor(kline.t / 1000), // 초 단위 타임스탬프
              open: parseFloat(kline.o),
              high: parseFloat(kline.h),
              low: parseFloat(kline.l),
              close: parseFloat(kline.c),
              volume: parseFloat(kline.v),
              isClosed: kline.x // 캔들이 닫혔는지 여부
            }

            onCandleUpdate(candle)
          }
        } catch (error) {
          console.error('Error parsing futures candle data:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('Futures candle WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('Futures candle WebSocket closed')
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          setTimeout(() => {
            connect()
          }, delay)
        }
      }
    }

    connect()

    return () => {
      ws.close()
    }
  } else {
    // 일반 선물은 폴링 방식
    let intervalId = null
    let isActive = true
    let lastCandleTime = null

    const fetchCandle = async () => {
      if (!isActive) return

      try {
        const candles = await getHistoricalCandles(symbol, '1m', 1)
        
        if (candles && candles.length > 0 && isActive) {
          const latestCandle = candles[candles.length - 1]
          
          if (!lastCandleTime || latestCandle.time > lastCandleTime) {
            lastCandleTime = latestCandle.time
            
            onCandleUpdate({
              time: latestCandle.time,
              open: latestCandle.open,
              high: latestCandle.high,
              low: latestCandle.low,
              close: latestCandle.close,
              volume: latestCandle.volume,
              isClosed: false
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching futures candles for ${symbol}:`, error)
      }
    }

    fetchCandle()
    intervalId = setInterval(fetchCandle, 5000) // 5초마다 업데이트

    return () => {
      isActive = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }
}

/**
 * 과거 차트 데이터 가져오기
 * @param {string} symbol - 선물 심볼
 * @param {string} interval - 시간 간격 (1m, 5m, 15m, 1h, 1d 등)
 * @param {number} limit - 가져올 데이터 개수
 * @returns {Promise<Array>} 차트 데이터 배열
 */
export const getHistoricalCandles = async (symbol, interval = '1m', limit = 500) => {
  try {
    const futuresSymbol = getFuturesSymbol(symbol)
    
    // 코인 선물인 경우 Binance Futures REST API 사용
    if (futuresSymbol.endsWith('USDT')) {
      const binanceInterval = interval === '1m' ? '1m' : interval === '5m' ? '5m' : interval === '15m' ? '15m' : interval === '1h' ? '1h' : '1d'
      const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${futuresSymbol}&interval=${binanceInterval}&limit=${limit}`
      
      console.log(`📡 Fetching historical futures candles from Binance: ${symbol} (${futuresSymbol})`)
      
      let response
      try {
        response = await fetch(url)
      } catch (fetchError) {
        console.error('Fetch error (CORS?):', fetchError)
        // CORS 에러 시 백엔드 프록시 사용 시도
        const proxyUrl = `http://localhost:3000/api/v1/futures/chart/${symbol}?interval=${interval}&limit=${limit}`
        console.log('Trying backend proxy:', proxyUrl)
        try {
          response = await fetch(proxyUrl)
        } catch (proxyError) {
          console.error('Backend proxy also failed:', proxyError)
          throw fetchError
        }
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // 백엔드 프록시 응답인 경우 candles 배열 직접 사용
      const candlesData = data.candles || data
      
      const candles = candlesData.map(kline => {
        // 배열 형식인지 객체 형식인지 확인
        if (Array.isArray(kline)) {
          return {
            time: Math.floor(kline[0] / 1000), // 밀리초를 초로 변환
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5])
          }
        } else {
          // 이미 객체 형식인 경우
          return {
            time: kline.time,
            open: kline.open,
            high: kline.high,
            low: kline.low,
            close: kline.close,
            volume: kline.volume
          }
        }
      })

      console.log(`📊 Historical futures candles loaded (${symbol}):`, {
        'Total Candles': candles.length,
        'First Candle': candles[0] ? new Date(candles[0].time * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : 'N/A',
        'Last Candle': candles[candles.length - 1] ? new Date(candles[candles.length - 1].time * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : 'N/A'
      })

      return candles
    } else {
      // 일반 선물은 백엔드 API 또는 모의 데이터 사용
      console.warn(`General futures (${symbol}) not supported yet, using mock data`)
      return generateMockCandles(symbol, limit)
    }
  } catch (error) {
    console.error('Error fetching historical futures candles:', error)
    return generateMockCandles(symbol, limit)
  }
}

/**
 * 현재 가격 가져오기
 * @param {string} symbol - 선물 심볼
 * @returns {Promise<Object>} 현재 가격
 */
export const getCurrentPrice = async (symbol) => {
  try {
    const futuresSymbol = getFuturesSymbol(symbol)
    
    // 코인 선물인 경우 Binance Futures REST API 사용
    if (futuresSymbol.endsWith('USDT')) {
      const url = `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${futuresSymbol}`
      
      console.log(`📡 Fetching futures price from Binance: ${symbol}`)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      const price = parseFloat(data.lastPrice)
      const priceChange = parseFloat(data.priceChange)
      const priceChangePercent = parseFloat(data.priceChangePercent)

      console.log(`✅ Binance Futures price for ${symbol}:`, {
        price,
        change: priceChange,
        changePercent: priceChangePercent.toFixed(2) + '%'
      })

      return {
        price: price,
        priceString: data.lastPrice, // 원본 문자열 유지
        priceChange: priceChange,
        priceChangePercent: priceChangePercent,
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume24h: parseFloat(data.volume)
      }
    } else {
      // 일반 선물은 모의 데이터 사용
      console.warn(`General futures (${symbol}) not supported yet, using mock price`)
      return generateMockPrice(symbol)
    }
  } catch (error) {
    console.error('Error fetching current futures price:', error)
    return generateMockPrice(symbol)
  }
}

/**
 * 모의 캔들 데이터 생성 (일반 선물용)
 */
const generateMockCandles = (symbol, limit) => {
  const basePrice = getBasePrice(symbol)
  const candles = []
  const now = Math.floor(Date.now() / 1000)
  
  for (let i = limit - 1; i >= 0; i--) {
    const time = now - (i * 60) // 1분 간격
    const variation = (Math.random() - 0.5) * 0.02
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
 * 모의 가격 데이터 생성 (일반 선물용)
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
 * Binance Futures WebSocket으로 실시간 호가창 데이터 구독
 * @param {string} symbol - 선물 심볼
 * @param {Function} onOrderbookUpdate - 호가창 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToOrderbook = (symbol, onOrderbookUpdate) => {
  const futuresSymbol = getFuturesSymbol(symbol)
  
  // 코인 선물인 경우 Binance Futures 사용
  if (futuresSymbol.endsWith('USDT')) {
    const wsSymbol = futuresSymbol.toLowerCase()
    let ws = null
    let reconnectTimeout = null
    let isManualClose = false
    let reconnectAttempts = 0
    const maxReconnectAttempts = 10

    const connect = () => {
      try {
        // Binance Futures depth stream (20 levels)
        ws = new WebSocket(`wss://fstream.binance.com/ws/${wsSymbol}@depth20@100ms`)

        ws.onopen = () => {
          console.log(`✅ Futures Orderbook WebSocket connected for ${symbol}`)
          reconnectAttempts = 0
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.bids && data.asks) {
              const bids = data.bids
                .map(([price, quantity]) => ({
                  price: parseFloat(price),
                  quantity: parseFloat(quantity)
                }))
                .sort((a, b) => b.price - a.price) // 높은 가격부터 (상위 5개)
                .slice(0, 5)
              
              const asks = data.asks
                .map(([price, quantity]) => ({
                  price: parseFloat(price),
                  quantity: parseFloat(quantity)
                }))
                .sort((a, b) => a.price - b.price) // 낮은 가격부터 (상위 5개)
                .slice(0, 5)

              const bestBid = bids[0]?.price || 0
              const bestAsk = asks[0]?.price || 0
              const spread = bestAsk - bestBid

              onOrderbookUpdate({
                bids,
                asks,
                spread,
                bestBid,
                bestAsk
              })
            }
          } catch (error) {
            console.error('Error parsing futures orderbook data:', error)
          }
        }

        ws.onerror = (error) => {
          console.error(`❌ Futures Orderbook WebSocket error for ${symbol}:`, error)
        }

        ws.onclose = () => {
          console.log(`⚠️ Futures Orderbook WebSocket closed for ${symbol}`)
          if (!isManualClose && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
            console.log(`🔄 Reconnecting futures orderbook WebSocket for ${symbol} in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)
            reconnectTimeout = setTimeout(() => {
              connect()
            }, delay)
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            console.error(`❌ Max reconnection attempts reached for ${symbol}`)
          }
        }
      } catch (error) {
        console.error(`❌ Error creating futures orderbook WebSocket for ${symbol}:`, error)
        if (!isManualClose && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          reconnectTimeout = setTimeout(() => {
            connect()
          }, delay)
        }
      }
    }

    // 초기 연결
    connect()

    return () => {
      isManualClose = true
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (ws) {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close()
        }
      }
    }
  } else {
    // 일반 선물은 현재 가격 기준 시뮬레이션
    let intervalId = null
    let isActive = true

    const generateMockOrderbook = (currentPrice) => {
      const bids = []
      const asks = []
      
      for (let i = 0; i < 5; i++) {
        const bidPrice = currentPrice * (0.99 - i * 0.001)
        const askPrice = currentPrice * (1.01 + i * 0.001)
        
        bids.push({
          price: bidPrice,
          quantity: Math.random() * 10
        })
        
        asks.push({
          price: askPrice,
          quantity: Math.random() * 10
        })
      }
      
      bids.sort((a, b) => b.price - a.price)
      asks.sort((a, b) => a.price - b.price)
      
      const bestBid = bids[0]?.price || 0
      const bestAsk = asks[0]?.price || 0
      const spread = bestAsk - bestBid
      
      return {
        bids,
        asks,
        spread,
        bestBid,
        bestAsk
      }
    }

    const updateOrderbook = async () => {
      if (!isActive) return
      
      try {
        const priceData = await getCurrentPrice(symbol)
        if (priceData && isActive) {
          const orderbook = generateMockOrderbook(priceData.price)
          onOrderbookUpdate(orderbook)
        }
      } catch (error) {
        console.error(`Error generating mock orderbook for ${symbol}:`, error)
      }
    }

    updateOrderbook()
    intervalId = setInterval(updateOrderbook, 2000) // 2초마다 업데이트

    return () => {
      isActive = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }
}

/**
 * 심볼별 기본 가격 (모의 데이터용)
 */
const getBasePrice = (symbol) => {
  const basePrices = {
    'ES': 4500, // E-mini S&P 500
    'NQ': 15000, // E-mini NASDAQ-100
    'YM': 35000, // E-mini Dow
    'CL': 75, // Crude Oil
    'GC': 2000, // Gold
    'SI': 25 // Silver
  }
  return basePrices[symbol] || 100
}

