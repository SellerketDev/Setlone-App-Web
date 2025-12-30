/**
 * Binance API 유틸리티
 * 실시간 가상화폐 가격 데이터를 가져옵니다.
 */

/**
 * 가상화폐 심볼을 Binance 심볼로 변환 (예: BTC -> BTCUSDT)
 */
export const getBinanceSymbol = (symbol) => {
  return `${symbol}USDT`
}

/**
 * Binance WebSocket으로 실시간 가격 구독
 * @param {string} symbol - 가상화폐 심볼 (예: BTC, ETH)
 * @param {Function} onPriceUpdate - 가격 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToPrice = (symbol, onPriceUpdate) => {
  const binanceSymbol = getBinanceSymbol(symbol).toLowerCase()
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol}@ticker`)

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.c) { // 현재 가격 (close price)
        const price = parseFloat(data.c)
        const priceString = data.c // 원본 가격 문자열 (소수점 끝까지)
        const priceChange = parseFloat(data.P) // 24시간 가격 변동률 (%)
        const priceChangeAmount = parseFloat(data.p) // 24시간 가격 변동량
        
        onPriceUpdate({
          price,
          priceString, // 원본 문자열 추가
          priceChange: priceChangeAmount,
          priceChangePercent: priceChange,
          high24h: parseFloat(data.h),
          low24h: parseFloat(data.l),
          volume24h: parseFloat(data.v),
          timestamp: Date.now()
        })
      }
    } catch (error) {
      // console.error('Error parsing WebSocket data:', error)
    }
  }

  ws.onerror = (error) => {
    // console.error('WebSocket error:', error)
  }

  ws.onclose = () => {
    // console.log('WebSocket closed, attempting to reconnect...')
    // 재연결 로직은 필요시 추가
  }

  return () => {
    ws.close()
  }
}

/**
 * Binance WebSocket으로 실시간 차트 데이터 구독 (1분봉)
 * @param {string} symbol - 가상화폐 심볼
 * @param {Function} onCandleUpdate - 캔들 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToCandles = (symbol, onCandleUpdate) => {
  const binanceSymbol = getBinanceSymbol(symbol).toLowerCase()
  let ws = null
  let reconnectTimeout = null
  let isManualClose = false
  let reconnectAttempts = 0
  const maxReconnectAttempts = 10

  const connect = () => {
    try {
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol}@kline_1m`)

      ws.onopen = () => {
        // console.log(`✅ Candle WebSocket connected for ${symbol}`)
        reconnectAttempts = 0 // 연결 성공 시 재시도 횟수 리셋
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.k) {
            const kline = data.k
            // 바이낸스는 UTC 타임스탬프를 밀리초 단위로 제공 (kline.t)
            // lightweight-charts는 UTC 타임스탬프를 초 단위로 요구
            const candleData = {
              time: Math.floor(kline.t / 1000), // 밀리초를 초로 변환 (UTC 타임스탬프)
              open: parseFloat(kline.o),
              high: parseFloat(kline.h),
              low: parseFloat(kline.l),
              close: parseFloat(kline.c),
              volume: parseFloat(kline.v),
              isClosed: kline.x // 캔들이 닫혔는지 여부
            }
            
            // 디버깅: 바이낸스 원본 데이터와 변환된 데이터 비교
            // const now = Date.now()
            // if (!window.lastCandleDebugLog || now - window.lastCandleDebugLog > 10000) {
            //   const utcTime = new Date(kline.t) // 바이낸스는 UTC 밀리초 타임스탬프
            //   // KST는 UTC+9이므로 toLocaleString으로 변환 (자동으로 시간대 처리)
            //   const kstTimeString = utcTime.toLocaleString('ko-KR', { 
            //     timeZone: 'Asia/Seoul',
            //     year: 'numeric',
            //     month: '2-digit',
            //     day: '2-digit',
            //     hour: '2-digit',
            //     minute: '2-digit',
            //     second: '2-digit',
            //     hour12: false
            //   })
            //   console.log(`📊 Binance Candle Data (${symbol}):`, {
            //     'Binance Timestamp (ms)': kline.t,
            //     'Binance Original (UTC)': utcTime.toISOString(),
            //     'UTC Time String': utcTime.toLocaleString('en-US', { timeZone: 'UTC' }),
            //     'KST Time': kstTimeString,
            //     'Chart Timestamp (UTC seconds)': candleData.time,
            //     'Chart Time (UTC)': new Date(candleData.time * 1000).toISOString(),
            //     'Chart Time (KST)': new Date(candleData.time * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
            //     'Price (Close)': candleData.close,
            //     'Open': candleData.open,
            //     'High': candleData.high,
            //     'Low': candleData.low,
            //     'Is Closed': candleData.isClosed,
            //     'Binance Symbol': binanceSymbol.toUpperCase()
            //   })
            //   window.lastCandleDebugLog = now
            // }
            
            onCandleUpdate(candleData)
          }
        } catch (error) {
          // console.error('Error parsing candle data:', error)
        }
      }

      ws.onerror = (error) => {
        // console.error(`❌ Candle WebSocket error for ${symbol}:`, error)
      }

      ws.onclose = () => {
        // console.log(`⚠️ Candle WebSocket closed for ${symbol}`)
        if (!isManualClose && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) // 지수 백오프, 최대 30초
          // console.log(`🔄 Reconnecting candle WebSocket for ${symbol} in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)
          reconnectTimeout = setTimeout(() => {
            connect()
          }, delay)
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          // console.error(`❌ Max reconnection attempts reached for ${symbol}`)
        }
      }
    } catch (error) {
      // console.error(`❌ Error creating WebSocket for ${symbol}:`, error)
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
}

/**
 * Binance REST API로 과거 차트 데이터 가져오기
 * @param {string} symbol - 가상화폐 심볼
 * @param {string} interval - 시간 간격 (1m, 5m, 15m, 1h, 4h, 1d 등)
 * @param {number} limit - 가져올 데이터 개수 (최대 1000)
 * @returns {Promise<Array>} 차트 데이터 배열
 */
export const getHistoricalCandles = async (symbol, interval = '1m', limit = 500) => {
  try {
    const binanceSymbol = getBinanceSymbol(symbol)
    const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`
    // console.log(`📡 Fetching historical candles from Binance: ${url}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 첫 번째와 마지막 캔들 데이터 확인
    if (data.length > 0) {
      const firstCandle = data[0]
      const lastCandle = data[data.length - 1]
      const firstTime = new Date(firstCandle[0]) // 바이낸스는 UTC 밀리초
      const lastTime = new Date(lastCandle[0])
      // console.log(`📊 Historical candles loaded (${symbol}):`, {
      //   'Total Candles': data.length,
      //   'First Candle Timestamp (ms)': firstCandle[0],
      //   'First Candle (UTC)': firstTime.toISOString(),
      //   'First Candle (KST)': firstTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      //   'Last Candle Timestamp (ms)': lastCandle[0],
      //   'Last Candle (UTC)': lastTime.toISOString(),
      //   'Last Candle (KST)': lastTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      //   'First Price': parseFloat(firstCandle[4]),
      //   'Last Price': parseFloat(lastCandle[4]),
      //   'Binance Symbol': binanceSymbol
      // })
    }
    
    return data.map(kline => ({
      time: Math.floor(kline[0] / 1000), // 밀리초를 초로 변환 (UTC 타임스탬프)
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5])
    }))
  } catch (error) {
    // console.error('Error fetching historical candles:', error)
    return []
  }
}

/**
 * Binance REST API로 현재 가격 가져오기
 * @param {string} symbol - 가상화폐 심볼
 * @returns {Promise<Object>} 현재 가격 (price: number, priceString: string)
 */
export const getCurrentPrice = async (symbol) => {
  try {
    const binanceSymbol = getBinanceSymbol(symbol)
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return {
      price: parseFloat(data.price),
      priceString: data.price // 원본 가격 문자열
    }
  } catch (error) {
    // console.error('Error fetching current price:', error)
    return null
  }
}

/**
 * Binance WebSocket으로 실시간 호가창 데이터 구독
 * @param {string} symbol - 가상화폐 심볼
 * @param {Function} onOrderbookUpdate - 호가창 업데이트 콜백 함수
 * @returns {Function} 연결 종료 함수
 */
export const subscribeToOrderbook = (symbol, onOrderbookUpdate) => {
  const binanceSymbol = getBinanceSymbol(symbol).toLowerCase()
  let ws = null
  let reconnectTimeout = null
  let isManualClose = false
  let reconnectAttempts = 0
  const maxReconnectAttempts = 10

  const connect = () => {
    try {
      // Binance depth stream (20 levels)
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol}@depth20@100ms`)

      ws.onopen = () => {
        // console.log(`✅ Orderbook WebSocket connected for ${symbol}`)
        reconnectAttempts = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.bids && data.asks) {
            // bids: 매수 호가 (낮은 가격부터 높은 가격 순)
            // asks: 매도 호가 (낮은 가격부터 높은 가격 순)
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
          // console.error('Error parsing orderbook data:', error)
        }
      }

      ws.onerror = (error) => {
        // console.error(`❌ Orderbook WebSocket error for ${symbol}:`, error)
      }

      ws.onclose = () => {
        // console.log(`⚠️ Orderbook WebSocket closed for ${symbol}`)
        if (!isManualClose && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          // console.log(`🔄 Reconnecting orderbook WebSocket for ${symbol} in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)
          reconnectTimeout = setTimeout(() => {
            connect()
          }, delay)
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          // console.error(`❌ Max reconnection attempts reached for ${symbol}`)
        }
      }
    } catch (error) {
      // console.error(`❌ Error creating orderbook WebSocket for ${symbol}:`, error)
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
}

