import React, { useState, useEffect, useRef } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import { subscribeToPrice, getCurrentPrice } from '../utils/binanceApi'
import './MiningPage.css'

const MiningPage = ({ onBack, language: propLanguage }) => {
  // prop으로 받은 language가 있으면 사용, 없으면 localStorage에서 가져오기
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [selectedMining, setSelectedMining] = useState(null)

  // 비트코인 채굴 관련 상태
  const [btcPrice, setBtcPrice] = useState(null)
  const [miningStatus, setMiningStatus] = useState('idle') // idle, mining, paused
  const [hashRate, setHashRate] = useState(0)
  const [minedAmount, setMinedAmount] = useState(0)
  const [miningTime, setMiningTime] = useState(0)
  const [miningHistory, setMiningHistory] = useState([])
  const [rewardHistory, setRewardHistory] = useState([])
  const [claimedRewards, setClaimedRewards] = useState([]) // 수령한 보상 내역

  // 이더리움 노드참여 관련 상태
  const [ethPrice, setEthPrice] = useState(null)
  const [nodeStatus, setNodeStatus] = useState('idle') // idle, active, paused
  const [stakedAmount, setStakedAmount] = useState(0)
  const [rewardAmount, setRewardAmount] = useState(0)
  const [participationTime, setParticipationTime] = useState(0)
  const [participationHistory, setParticipationHistory] = useState([])

  const miningIntervalRef = useRef(null)
  const timeIntervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const unsubscribePriceRef = useRef(null)

  const nodeIntervalRef = useRef(null)
  const nodeTimeIntervalRef = useRef(null)
  const nodeStartTimeRef = useRef(null)
  const unsubscribeEthPriceRef = useRef(null)

  // prop language가 변경되면 업데이트
  useEffect(() => {
    if (propLanguage && propLanguage !== language) {
      setLanguage(propLanguage)
    }
  }, [propLanguage, language])

  // prop이 없을 경우 localStorage 변경 감지
  useEffect(() => {
    if (propLanguage) return // prop이 있으면 감지 불필요

    const handleStorageChange = (e) => {
      if (e.key === 'language') {
        const newLang = getCurrentLanguage()
        setLanguage(newLang)
      }
    }

    const checkLanguage = () => {
      const currentLang = getCurrentLanguage()
      if (currentLang !== language) {
        setLanguage(currentLang)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(checkLanguage, 200)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [language, propLanguage])

  // 비트코인 가격 구독
  useEffect(() => {
    if (selectedMining?.id === 'bitcoin') {
      // 초기 가격 가져오기
      getCurrentPrice('BTC').then(priceData => {
        if (priceData) {
          setBtcPrice(priceData)
        }
      })

      // 실시간 가격 구독
      const unsubscribe = subscribeToPrice('BTC', (priceData) => {
        setBtcPrice(priceData)
      })
      unsubscribePriceRef.current = unsubscribe

      return () => {
        if (unsubscribe) unsubscribe()
      }
    } else {
      // 비트코인이 아닐 때 구독 해제
      if (unsubscribePriceRef.current) {
        unsubscribePriceRef.current()
        unsubscribePriceRef.current = null
      }
    }
  }, [selectedMining])

  // 이더리움 가격 구독
  useEffect(() => {
    if (selectedMining?.id === 'ethereum') {
      // 초기 가격 가져오기
      getCurrentPrice('ETH').then(priceData => {
        if (priceData) {
          setEthPrice(priceData)
        }
      })

      // 실시간 가격 구독
      const unsubscribe = subscribeToPrice('ETH', (priceData) => {
        setEthPrice(priceData)
      })
      unsubscribeEthPriceRef.current = unsubscribe

      return () => {
        if (unsubscribe) unsubscribe()
      }
    } else {
      // 이더리움이 아닐 때 구독 해제
      if (unsubscribeEthPriceRef.current) {
        unsubscribeEthPriceRef.current()
        unsubscribeEthPriceRef.current = null
      }
    }
  }, [selectedMining])

  // 채굴 시작
  const handleStartMining = () => {
    if (miningStatus === 'mining') return

    setMiningStatus('mining')
    startTimeRef.current = Date.now()
    setMiningTime(0)

    // 해시레이트 시뮬레이션 (100-150 TH/s 범위)
    const baseHashRate = 100 + Math.random() * 50
    setHashRate(baseHashRate)

    // 채굴 시뮬레이션 (1초마다 업데이트)
    miningIntervalRef.current = setInterval(() => {
      // 해시레이트 약간 변동
      const newHashRate = baseHashRate + (Math.random() - 0.5) * 10
      setHashRate(newHashRate)

      // 채굴된 양 증가 (시뮬레이션: 시간당 약 0.00001 BTC)
      const miningRate = 0.00001 / 3600 // 초당 채굴량
      setMinedAmount(prev => prev + miningRate)
    }, 1000)

    // 시간 업데이트
    timeIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setMiningTime(elapsed)
      }
    }, 1000)
  }

  // 채굴 중지
  const handleStopMining = () => {
    setMiningStatus('idle')

    if (miningIntervalRef.current) {
      clearInterval(miningIntervalRef.current)
      miningIntervalRef.current = null
    }

    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current)
      timeIntervalRef.current = null
    }

    // 채굴 내역에 추가
    if (minedAmount > 0) {
      const historyEntry = {
        id: Date.now(),
        time: new Date().toISOString(),
        amount: minedAmount,
        hashRate: hashRate,
        duration: miningTime
      }
      setMiningHistory(prev => [historyEntry, ...prev])

      // 보상 내역에 추가 (가격이 있으면)
      if (btcPrice) {
        const rewardEntry = {
          id: Date.now(),
          time: new Date().toISOString(),
          amount: minedAmount,
          value: minedAmount * btcPrice.price,
          price: btcPrice.price
        }
        setRewardHistory(prev => [rewardEntry, ...prev])
      }

      setMinedAmount(0)
      setMiningTime(0)
    }
  }

  // 이더리움 노드 참여 시작
  const handleStartNode = () => {
    if (nodeStatus === 'active') return

    setNodeStatus('active')
    nodeStartTimeRef.current = Date.now()
    setParticipationTime(0)

    // 스테이킹 수량 설정 (시뮬레이션: 32 ETH)
    setStakedAmount(32)

    // 노드 참여 시뮬레이션 (1초마다 업데이트)
    nodeIntervalRef.current = setInterval(() => {
      // 보상 증가 (시뮬레이션: 연간 4% APY 기준)
      const apy = 0.04
      const rewardRate = apy / (365 * 24 * 3600) // 초당 보상률
      setRewardAmount(prev => prev + (32 * rewardRate))
    }, 1000)

    // 시간 업데이트
    nodeTimeIntervalRef.current = setInterval(() => {
      if (nodeStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - nodeStartTimeRef.current) / 1000)
        setParticipationTime(elapsed)
      }
    }, 1000)
  }

  // 이더리움 노드 참여 중지
  const handleStopNode = () => {
    setNodeStatus('idle')

    if (nodeIntervalRef.current) {
      clearInterval(nodeIntervalRef.current)
      nodeIntervalRef.current = null
    }

    if (nodeTimeIntervalRef.current) {
      clearInterval(nodeTimeIntervalRef.current)
      nodeTimeIntervalRef.current = null
    }

    // 참여 내역에 추가
    if (rewardAmount > 0) {
      const historyEntry = {
        id: Date.now(),
        time: new Date().toISOString(),
        stakedAmount: stakedAmount,
        rewardAmount: rewardAmount,
        duration: participationTime
      }
      setParticipationHistory(prev => [historyEntry, ...prev])

      setRewardAmount(0)
      setParticipationTime(0)
      setStakedAmount(0)
    }
  }

  // 비트코인 보상 수령
  const handleClaimReward = (rewardId) => {
    const reward = rewardHistory.find(r => r.id === rewardId)
    if (reward) {
      // 수령한 보상에 추가
      setClaimedRewards(prev => [reward, ...prev])
      // 출금 가능한 보상에서 제거
      setRewardHistory(prev => prev.filter(r => r.id !== rewardId))
    }
  }

  // 비트코인 전체 보상 수령
  const handleClaimAllRewards = () => {
    if (rewardHistory.length > 0) {
      setClaimedRewards(prev => [...rewardHistory, ...prev])
      setRewardHistory([])
    }
  }

  // 이더리움 보상 수령
  const handleClaimEthReward = (rewardId) => {
    const reward = participationHistory.find(r => r.id === rewardId)
    if (reward) {
      setEthClaimedRewards(prev => [reward, ...prev])
      setParticipationHistory(prev => prev.filter(r => r.id !== rewardId))
    }
  }

  // 이더리움 전체 보상 수령
  const handleClaimAllEthRewards = () => {
    if (participationHistory.length > 0) {
      setEthClaimedRewards(prev => [...participationHistory, ...prev])
      setParticipationHistory([])
    }
  }

  // 코인별 보상 수령
  const handleClaimCoinReward = (coinSymbol, rewardId) => {
    const history = coinMiningHistory[coinSymbol] || []
    const reward = history.find(r => r.id === rewardId)
    if (reward) {
      setCoinClaimedRewards(prev => ({
        ...prev,
        [coinSymbol]: [reward, ...(prev[coinSymbol] || [])]
      }))
      setCoinMiningHistory(prev => ({
        ...prev,
        [coinSymbol]: (prev[coinSymbol] || []).filter(r => r.id !== rewardId)
      }))
    }
  }

  // 코인별 전체 보상 수령
  const handleClaimAllCoinRewards = (coinSymbol) => {
    const history = coinMiningHistory[coinSymbol] || []
    if (history.length > 0) {
      setCoinClaimedRewards(prev => ({
        ...prev,
        [coinSymbol]: [...history, ...(prev[coinSymbol] || [])]
      }))
      setCoinMiningHistory(prev => ({
        ...prev,
        [coinSymbol]: []
      }))
    }
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (miningIntervalRef.current) {
        clearInterval(miningIntervalRef.current)
      }
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current)
      }
      if (unsubscribePriceRef.current) {
        unsubscribePriceRef.current()
      }
      if (nodeIntervalRef.current) {
        clearInterval(nodeIntervalRef.current)
      }
      if (nodeTimeIntervalRef.current) {
        clearInterval(nodeTimeIntervalRef.current)
      }
      if (unsubscribeEthPriceRef.current) {
        unsubscribeEthPriceRef.current()
      }
      // 코인 가격 구독 해제
      Object.values(unsubscribeCoinPriceRef.current).forEach(unsubscribe => {
        if (unsubscribe) unsubscribe()
      })
      // 코인 채굴 인터벌 정리
      Object.values(coinMiningIntervalRef.current).forEach(interval => {
        if (interval) clearInterval(interval)
      })
      Object.values(coinTimeIntervalRef.current).forEach(interval => {
        if (interval) clearInterval(interval)
      })
    }
  }, [])

  const miningOptions = [
    {
      id: 'bitcoin'
    },
    {
      id: 'ethereum'
    },
    {
      id: 'coins'
    }
  ]

  // 채굴 가능한 코인 목록
  const mineableCoins = [
    {
      id: 'LTC',
      symbol: 'LTC',
      name: 'Litecoin',
      algorithm: 'Scrypt',
      blockReward: '6.25 LTC',
      networkHashRate: '500+ TH/s',
      profitability: 'Medium',
      description: 'Litecoin은 비트코인의 포크로, 더 빠른 거래 속도와 낮은 수수료를 제공합니다.'
    },
    {
      id: 'BCH',
      symbol: 'BCH',
      name: 'Bitcoin Cash',
      algorithm: 'SHA-256',
      blockReward: '6.25 BCH',
      networkHashRate: '2+ EH/s',
      profitability: 'Medium',
      description: 'Bitcoin Cash는 비트코인의 하드포크로, 더 큰 블록 크기를 가진 암호화폐입니다.'
    },
    {
      id: 'XMR',
      symbol: 'XMR',
      name: 'Monero',
      algorithm: 'RandomX',
      blockReward: '0.6 XMR',
      networkHashRate: '2+ GH/s',
      profitability: 'High',
      description: 'Monero는 프라이버시 중심의 암호화폐로, 거래의 익명성을 보장합니다.'
    },
    {
      id: 'DASH',
      symbol: 'DASH',
      name: 'Dash',
      algorithm: 'X11',
      blockReward: '2.5 DASH',
      networkHashRate: '5+ PH/s',
      profitability: 'Medium',
      description: 'Dash는 빠른 거래와 낮은 수수료를 제공하는 디지털 현금입니다.'
    },
    {
      id: 'ZEC',
      symbol: 'ZEC',
      name: 'Zcash',
      algorithm: 'Equihash',
      blockReward: '2.5 ZEC',
      networkHashRate: '5+ GSol/s',
      profitability: 'Medium',
      description: 'Zcash는 선택적 프라이버시를 제공하는 암호화폐입니다.'
    },
    {
      id: 'DOGE',
      symbol: 'DOGE',
      name: 'Dogecoin',
      algorithm: 'Scrypt',
      blockReward: '10,000 DOGE',
      networkHashRate: '400+ TH/s',
      profitability: 'Low',
      description: 'Dogecoin은 밈 기반의 암호화폐로, 빠른 거래와 낮은 수수료를 제공합니다.'
    },
    {
      id: 'RVN',
      symbol: 'RVN',
      name: 'Ravencoin',
      algorithm: 'KAWPOW',
      blockReward: '2,500 RVN',
      networkHashRate: '5+ TH/s',
      profitability: 'Medium',
      description: 'Ravencoin은 자산 전송에 특화된 블록체인 플랫폼입니다.'
    },
    {
      id: 'ETC',
      symbol: 'ETC',
      name: 'Ethereum Classic',
      algorithm: 'Ethash',
      blockReward: '3.2 ETC',
      networkHashRate: '20+ TH/s',
      profitability: 'Low',
      description: 'Ethereum Classic은 이더리움의 원래 체인을 유지하는 암호화폐입니다.'
    }
  ]

  const [selectedCoin, setSelectedCoin] = useState(null)
  const [coinPrice, setCoinPrice] = useState({})
  const unsubscribeCoinPriceRef = useRef({})

  // 각 코인별 채굴 상태 관리
  const [coinMiningStatus, setCoinMiningStatus] = useState({}) // { LTC: 'idle', BCH: 'mining', ... }
  const [coinHashRate, setCoinHashRate] = useState({}) // { LTC: 0, BCH: 100, ... }
  const [coinMinedAmount, setCoinMinedAmount] = useState({}) // { LTC: 0, BCH: 0.001, ... }
  const [coinMiningTime, setCoinMiningTime] = useState({}) // { LTC: 0, BCH: 3600, ... }
  const [coinMiningHistory, setCoinMiningHistory] = useState({}) // { LTC: [], BCH: [], ... }
  const [coinClaimedRewards, setCoinClaimedRewards] = useState({}) // { LTC: [], BCH: [], ... }
  const [ethClaimedRewards, setEthClaimedRewards] = useState([]) // 이더리움 수령한 보상

  const coinMiningIntervalRef = useRef({}) // { LTC: intervalId, BCH: intervalId, ... }
  const coinTimeIntervalRef = useRef({}) // { LTC: intervalId, BCH: intervalId, ... }
  const coinStartTimeRef = useRef({}) // { LTC: timestamp, BCH: timestamp, ... }

  const handleSeeMore = (mining) => {
    setSelectedMining(mining)
    // 비트코인 선택 시 채굴 상태 초기화하지 않음 (이미 채굴 중이면 유지)
  }

  const handleCoinSelect = (coin) => {
    setSelectedCoin(coin)
    // 코인 가격 가져오기
    if (!coinPrice[coin.symbol]) {
      getCurrentPrice(coin.symbol).then(priceData => {
        if (priceData) {
          setCoinPrice(prev => ({
            ...prev,
            [coin.symbol]: priceData
          }))
        }
      })

      // 실시간 가격 구독
      const unsubscribe = subscribeToPrice(coin.symbol, (priceData) => {
        setCoinPrice(prev => ({
          ...prev,
          [coin.symbol]: priceData
        }))
      })
      unsubscribeCoinPriceRef.current[coin.symbol] = unsubscribe
    }

    // 초기 상태 설정 (없는 경우)
    if (!coinMiningStatus[coin.symbol]) {
      setCoinMiningStatus(prev => ({ ...prev, [coin.symbol]: 'idle' }))
      setCoinHashRate(prev => ({ ...prev, [coin.symbol]: 0 }))
      setCoinMinedAmount(prev => ({ ...prev, [coin.symbol]: 0 }))
      setCoinMiningTime(prev => ({ ...prev, [coin.symbol]: 0 }))
      setCoinMiningHistory(prev => ({ ...prev, [coin.symbol]: [] }))
    }
  }

  // 코인별 채굴 시작
  const handleStartCoinMining = (coinSymbol) => {
    if (coinMiningStatus[coinSymbol] === 'mining') return

    setCoinMiningStatus(prev => ({ ...prev, [coinSymbol]: 'mining' }))
    coinStartTimeRef.current[coinSymbol] = Date.now()
    setCoinMiningTime(prev => ({ ...prev, [coinSymbol]: 0 }))

    // 해시레이트 시뮬레이션 (코인별로 다른 범위)
    const hashRateRanges = {
      'LTC': { min: 50, max: 100 }, // TH/s
      'BCH': { min: 80, max: 120 },
      'XMR': { min: 2, max: 5 }, // kH/s
      'DASH': { min: 3, max: 6 }, // GH/s
      'ZEC': { min: 2, max: 4 }, // kSol/s
      'DOGE': { min: 40, max: 80 }, // TH/s
      'RVN': { min: 3, max: 6 }, // TH/s
      'ETC': { min: 15, max: 25 } // MH/s
    }

    const range = hashRateRanges[coinSymbol] || { min: 50, max: 100 }
    const baseHashRate = range.min + Math.random() * (range.max - range.min)
    setCoinHashRate(prev => ({ ...prev, [coinSymbol]: baseHashRate }))

    // 채굴 시뮬레이션 (1초마다 업데이트)
    coinMiningIntervalRef.current[coinSymbol] = setInterval(() => {
      // 해시레이트 약간 변동
      const currentHashRate = coinHashRate[coinSymbol] || baseHashRate
      const newHashRate = currentHashRate + (Math.random() - 0.5) * (range.max - range.min) * 0.1
      setCoinHashRate(prev => ({ ...prev, [coinSymbol]: newHashRate }))

      // 채굴된 양 증가 (시뮬레이션: 코인별로 다른 비율)
      const miningRates = {
        'LTC': 0.00001 / 3600, // 초당 채굴량
        'BCH': 0.000008 / 3600,
        'XMR': 0.000001 / 3600,
        'DASH': 0.000005 / 3600,
        'ZEC': 0.000003 / 3600,
        'DOGE': 0.1 / 3600,
        'RVN': 0.01 / 3600,
        'ETC': 0.00002 / 3600
      }

      const miningRate = miningRates[coinSymbol] || 0.00001 / 3600
      setCoinMinedAmount(prev => ({
        ...prev,
        [coinSymbol]: (prev[coinSymbol] || 0) + miningRate
      }))
    }, 1000)

    // 시간 업데이트
    coinTimeIntervalRef.current[coinSymbol] = setInterval(() => {
      if (coinStartTimeRef.current[coinSymbol]) {
        const elapsed = Math.floor((Date.now() - coinStartTimeRef.current[coinSymbol]) / 1000)
        setCoinMiningTime(prev => ({ ...prev, [coinSymbol]: elapsed }))
      }
    }, 1000)
  }

  // 코인별 채굴 중지
  const handleStopCoinMining = (coinSymbol) => {
    setCoinMiningStatus(prev => ({ ...prev, [coinSymbol]: 'idle' }))

    if (coinMiningIntervalRef.current[coinSymbol]) {
      clearInterval(coinMiningIntervalRef.current[coinSymbol])
      delete coinMiningIntervalRef.current[coinSymbol]
    }

    if (coinTimeIntervalRef.current[coinSymbol]) {
      clearInterval(coinTimeIntervalRef.current[coinSymbol])
      delete coinTimeIntervalRef.current[coinSymbol]
    }

    // 채굴 내역에 추가
    const minedAmount = coinMinedAmount[coinSymbol] || 0
    if (minedAmount > 0) {
      const historyEntry = {
        id: Date.now(),
        time: new Date().toISOString(),
        amount: minedAmount,
        hashRate: coinHashRate[coinSymbol] || 0,
        duration: coinMiningTime[coinSymbol] || 0
      }
      setCoinMiningHistory(prev => ({
        ...prev,
        [coinSymbol]: [historyEntry, ...(prev[coinSymbol] || [])]
      }))

      setCoinMinedAmount(prev => ({ ...prev, [coinSymbol]: 0 }))
      setCoinMiningTime(prev => ({ ...prev, [coinSymbol]: 0 }))
    }
  }

  const handleCloseDetail = () => {
    setSelectedMining(null)
  }

  const getMiningDetail = (id) => {
    return {
      title: t(`mining.details.${id}.title`, language),
      content: t(`mining.details.${id}.content`, language)
    }
  }

  // 시간 포맷팅 (초를 시:분:초로)
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // 코인별 해시레이트 단위 반환
  const getHashRateUnit = (symbol) => {
    const units = {
      'LTC': 'TH/s',
      'BCH': 'TH/s',
      'XMR': 'kH/s',
      'DASH': 'GH/s',
      'ZEC': 'kSol/s',
      'DOGE': 'TH/s',
      'RVN': 'TH/s',
      'ETC': 'MH/s'
    }
    return units[symbol] || 'TH/s'
  }

  // 예상 수익 계산
  const estimatedProfit = btcPrice && minedAmount > 0
    ? minedAmount * btcPrice.price
    : 0

  // 예상 보상 계산 (이더리움)
  const estimatedEthReward = ethPrice && rewardAmount > 0
    ? rewardAmount * ethPrice.price
    : 0

  // 비트코인 채굴 정보
  const getBitcoinMiningInfo = () => {
    if (selectedMining?.id !== 'bitcoin') return null

    return {
      difficulty: '81.73 T',
      expectedReward: '6.25 BTC/block',
      hashRateRequired: '100+ TH/s',
      powerConsumption: '3,250 W'
    }
  }

  // 이더리움 노드 정보
  const getEthereumNodeInfo = () => {
    if (selectedMining?.id !== 'ethereum') return null

    return {
      minimumStake: '32 ETH',
      apy: '4.0%',
      rewardRate: '0.0001 ETH/day',
      validatorCount: '1,000,000+'
    }
  }

  const bitcoinInfo = getBitcoinMiningInfo()
  const ethereumInfo = getEthereumNodeInfo()

  return (
    <div className="mining-page">
      <div className="mining-header">
        <button className="back-button" onClick={onBack}>
          ← {t('mining.back', language)}
        </button>
        <h1 className="mining-title">
          {t('mining.title', language)}
        </h1>
      </div>

      <div className="mining-content">
        <div className="mining-grid">
          {miningOptions.map((option) => (
            <div key={option.id} className="mining-card">
              <div className="mining-card-header">
                <h3 className="mining-card-title">
                  {t(`mining.options.${option.id}.title`, language)}
                </h3>
              </div>
              <p className="mining-card-description">
                {t(`mining.options.${option.id}.description`, language)}
              </p>
              <button
                className="mining-see-more-btn"
                onClick={() => handleSeeMore(option)}
              >
                {t('mining.seeMore', language)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 비트코인 채굴 상세 모달 */}
      {selectedMining && selectedMining.id === 'bitcoin' && (
        <div className="mining-detail-overlay" onClick={handleCloseDetail}>
          <div className="mining-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mining-detail-header">
              <h2 className="mining-detail-title">
                {getMiningDetail(selectedMining.id).title}
              </h2>
              <button className="mining-detail-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>

            <div className="mining-detail-content">
              {/* 채굴 정보 대시보드 */}
              <div className="mining-dashboard">
                <div className="mining-info-grid">
                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.currentPrice', language)}</div>
                    <div className="mining-info-value">
                      {btcPrice ? `$${parseFloat(btcPrice.priceString).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Loading...'}
                    </div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.miningDifficulty', language)}</div>
                    <div className="mining-info-value">{bitcoinInfo?.difficulty || 'N/A'}</div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.expectedReward', language)}</div>
                    <div className="mining-info-value">{bitcoinInfo?.expectedReward || 'N/A'}</div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.hashRate', language)}</div>
                    <div className="mining-info-value">
                      {hashRate > 0 ? `${hashRate.toFixed(2)} TH/s` : '0 TH/s'}
                    </div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.powerConsumption', language)}</div>
                    <div className="mining-info-value">{bitcoinInfo?.powerConsumption || 'N/A'}</div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.statusLabel', language)}</div>
                    <div className="mining-info-value">
                      <span className={`mining-status-badge ${miningStatus}`}>
                        {t(`mining.miningStatus.${miningStatus}`, language)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 실시간 채굴 통계 */}
                <div className="mining-stats">
                  <h3 className="mining-stats-title">{t('mining.realTimeStats', language)}</h3>
                  <div className="mining-stats-grid">
                    <div className="mining-stat-item">
                      <div className="mining-stat-label">{t('mining.minedAmount', language)}</div>
                      <div className="mining-stat-value">
                        {minedAmount > 0 ? `${minedAmount.toFixed(8)} BTC` : '0.00000000 BTC'}
                      </div>
                    </div>

                    <div className="mining-stat-item">
                      <div className="mining-stat-label">{t('mining.estimatedProfit', language)}</div>
                      <div className="mining-stat-value">
                        {estimatedProfit > 0 ? `$${estimatedProfit.toFixed(2)}` : '$0.00'}
                      </div>
                    </div>

                    <div className="mining-stat-item">
                      <div className="mining-stat-label">{t('mining.miningTime', language)}</div>
                      <div className="mining-stat-value">{formatTime(miningTime)}</div>
                    </div>
                  </div>
                </div>

                {/* 채굴 내역 */}
                <div className="mining-history-section">
                  <h3 className="mining-history-title">{t('mining.miningHistory', language)}</h3>
                  {miningHistory.length > 0 ? (
                    <div className="mining-history-table">
                      <div className="mining-history-header">
                        <div>{t('mining.time', language)}</div>
                        <div>{t('mining.amount', language)}</div>
                        <div>{t('mining.hashRate', language)}</div>
                        <div>{t('mining.miningTime', language)}</div>
                      </div>
                      {miningHistory.slice(0, 10).map((entry) => (
                        <div key={entry.id} className="mining-history-row">
                          <div>{new Date(entry.time).toLocaleString()}</div>
                          <div>{entry.amount.toFixed(8)} BTC</div>
                          <div>{entry.hashRate.toFixed(2)} TH/s</div>
                          <div>{formatTime(entry.duration)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mining-no-data">{t('mining.noHistory', language)}</div>
                  )}
                </div>

                {/* 출금 가능 보상 */}
                <div className="mining-reward-section">
                  <div className="mining-reward-header-section">
                    <h3 className="mining-reward-title">{t('mining.availableRewards', language)}</h3>
                    {rewardHistory.length > 0 && (
                      <button
                        className="mining-claim-all-btn"
                        onClick={handleClaimAllRewards}
                      >
                        {t('mining.claimAll', language)}
                      </button>
                    )}
                  </div>
                  {rewardHistory.length > 0 ? (
                    <div className="mining-reward-table">
                      <div className="mining-reward-header">
                        <div>{t('mining.time', language)}</div>
                        <div>{t('mining.amount', language)}</div>
                        <div>{t('mining.reward', language)}</div>
                        <div>{t('mining.claim', language)}</div>
                      </div>
                      {rewardHistory.map((entry) => (
                        <div key={entry.id} className="mining-reward-row">
                          <div>{new Date(entry.time).toLocaleString()}</div>
                          <div>{entry.amount.toFixed(8)} BTC</div>
                          <div>${entry.value.toFixed(2)}</div>
                          <div>
                            <button
                              className="mining-claim-btn"
                              onClick={() => handleClaimReward(entry.id)}
                            >
                              {t('mining.claimReward', language)}
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="mining-reward-total">
                        <div>{t('mining.totalAvailable', language)}</div>
                        <div>
                          {rewardHistory.reduce((sum, entry) => sum + entry.value, 0).toFixed(2)} USD
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mining-no-data">{t('mining.noAvailableRewards', language)}</div>
                  )}
                </div>

                {/* 수령한 보상 내역 */}
                {claimedRewards.length > 0 && (
                  <div className="mining-reward-section">
                    <h3 className="mining-reward-title">{t('mining.claimedRewards', language)}</h3>
                    <div className="mining-reward-table">
                      <div className="mining-reward-header">
                        <div>{t('mining.time', language)}</div>
                        <div>{t('mining.amount', language)}</div>
                        <div>{t('mining.reward', language)}</div>
                        <div>{t('mining.status', language)}</div>
                      </div>
                      {claimedRewards.slice(0, 10).map((entry) => (
                        <div key={entry.id} className="mining-reward-row claimed">
                          <div>{new Date(entry.time).toLocaleString()}</div>
                          <div>{entry.amount.toFixed(8)} BTC</div>
                          <div>${entry.value.toFixed(2)}</div>
                          <div className="mining-claimed-badge">✓ {t('mining.claimedRewards', language)}</div>
                        </div>
                      ))}
                      <div className="mining-reward-total claimed-total">
                        <div>{t('mining.totalClaimed', language)}</div>
                        <div>
                          {claimedRewards.reduce((sum, entry) => sum + entry.amount, 0).toFixed(8)} BTC
                          <span className="mining-reward-usd">
                            {' '}(${claimedRewards.reduce((sum, entry) => sum + entry.value, 0).toFixed(2)})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mining-detail-footer">
              <button
                className={`mining-start-button ${miningStatus === 'mining' ? 'mining-stop-button' : ''}`}
                onClick={miningStatus === 'mining' ? handleStopMining : handleStartMining}
              >
                {miningStatus === 'mining' ? t('mining.stopMining', language) : t('mining.startMining', language)}
              </button>
              <button className="mining-back-button" onClick={handleCloseDetail}>
                {t('mining.backToMining', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이더리움 노드참여 상세 모달 */}
      {selectedMining && selectedMining.id === 'ethereum' && (
        <div className="mining-detail-overlay" onClick={handleCloseDetail}>
          <div className="mining-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mining-detail-header">
              <h2 className="mining-detail-title">
                {getMiningDetail(selectedMining.id).title}
              </h2>
              <button className="mining-detail-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>

            <div className="mining-detail-content">
              {/* 노드 정보 대시보드 */}
              <div className="mining-dashboard">
                <div className="mining-info-grid">
                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.currentPrice', language)}</div>
                    <div className="mining-info-value">
                      {ethPrice ? `$${parseFloat(ethPrice.priceString).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Loading...'}
                    </div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.minimumStake', language)}</div>
                    <div className="mining-info-value">{ethereumInfo?.minimumStake || 'N/A'}</div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.apy', language)}</div>
                    <div className="mining-info-value">{ethereumInfo?.apy || 'N/A'}</div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.rewardRate', language)}</div>
                    <div className="mining-info-value">{ethereumInfo?.rewardRate || 'N/A'}</div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.validatorCount', language)}</div>
                    <div className="mining-info-value">{ethereumInfo?.validatorCount || 'N/A'}</div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.nodeStatus', language)}</div>
                    <div className="mining-info-value">
                      <span className={`mining-status-badge ${nodeStatus}`}>
                        {t(`mining.nodeStatusOptions.${nodeStatus}`, language)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 실시간 노드 참여 통계 */}
                <div className="mining-stats">
                  <h3 className="mining-stats-title">실시간 노드 참여 통계</h3>
                  <div className="mining-stats-grid">
                    <div className="mining-stat-item">
                      <div className="mining-stat-label">{t('mining.stakedAmount', language)}</div>
                      <div className="mining-stat-value">
                        {stakedAmount > 0 ? `${stakedAmount.toFixed(2)} ETH` : '0.00 ETH'}
                      </div>
                    </div>

                    <div className="mining-stat-item">
                      <div className="mining-stat-label">{t('mining.estimatedReward', language)}</div>
                      <div className="mining-stat-value">
                        {estimatedEthReward > 0 ? `$${estimatedEthReward.toFixed(2)}` : '$0.00'}
                      </div>
                    </div>

                    <div className="mining-stat-item">
                      <div className="mining-stat-label">{t('mining.participationTime', language)}</div>
                      <div className="mining-stat-value">{formatTime(participationTime)}</div>
                    </div>
                  </div>
                </div>

                {/* 출금 가능 보상 */}
                <div className="mining-reward-section">
                  <div className="mining-reward-header-section">
                    <h3 className="mining-reward-title">{t('mining.availableRewards', language)}</h3>
                    {participationHistory.length > 0 && (
                      <button
                        className="mining-claim-all-btn"
                        onClick={handleClaimAllEthRewards}
                      >
                        {t('mining.claimAll', language)}
                      </button>
                    )}
                  </div>
                  {participationHistory.length > 0 ? (
                    <div className="mining-reward-table">
                      <div className="mining-reward-header">
                        <div>{t('mining.time', language)}</div>
                        <div>{t('mining.stakingAmount', language)}</div>
                        <div>{t('mining.reward', language)}</div>
                        <div>{t('mining.claim', language)}</div>
                      </div>
                      {participationHistory.map((entry) => (
                        <div key={entry.id} className="mining-reward-row">
                          <div>{new Date(entry.time).toLocaleString()}</div>
                          <div>{entry.stakedAmount.toFixed(2)} ETH</div>
                          <div>
                            {entry.rewardAmount.toFixed(6)} ETH
                            {ethPrice && (
                              <span className="mining-reward-usd">
                                {' '}(${(entry.rewardAmount * ethPrice.price).toFixed(2)})
                              </span>
                            )}
                          </div>
                          <div>
                            <button
                              className="mining-claim-btn"
                              onClick={() => handleClaimEthReward(entry.id)}
                            >
                              {t('mining.claimReward', language)}
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="mining-reward-total">
                        <div>{t('mining.totalAvailable', language)}</div>
                        <div>
                          {participationHistory.reduce((sum, entry) => sum + entry.rewardAmount, 0).toFixed(6)} ETH
                          {ethPrice && (
                            <span className="mining-reward-usd">
                              {' '}(${(participationHistory.reduce((sum, entry) => sum + entry.rewardAmount, 0) * ethPrice.price).toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mining-no-data">{t('mining.noAvailableRewards', language)}</div>
                  )}
                </div>

                {/* 수령한 보상 내역 */}
                {ethClaimedRewards.length > 0 && (
                  <div className="mining-reward-section">
                    <h3 className="mining-reward-title">{t('mining.claimedRewards', language)}</h3>
                    <div className="mining-reward-table">
                      <div className="mining-reward-header">
                        <div>{t('mining.time', language)}</div>
                        <div>{t('mining.stakingAmount', language)}</div>
                        <div>{t('mining.reward', language)}</div>
                        <div>{t('mining.status', language)}</div>
                      </div>
                      {ethClaimedRewards.slice(0, 10).map((entry) => (
                        <div key={entry.id} className="mining-reward-row claimed">
                          <div>{new Date(entry.time).toLocaleString()}</div>
                          <div>{entry.stakedAmount.toFixed(2)} ETH</div>
                          <div>
                            {entry.rewardAmount.toFixed(6)} ETH
                            {ethPrice && (
                              <span className="mining-reward-usd">
                                {' '}(${(entry.rewardAmount * ethPrice.price).toFixed(2)})
                              </span>
                            )}
                          </div>
                          <div className="mining-claimed-badge">✓ {t('mining.claimedRewards', language)}</div>
                        </div>
                      ))}
                      <div className="mining-reward-total claimed-total">
                        <div>{t('mining.totalClaimed', language)}</div>
                        <div>
                          {ethClaimedRewards.reduce((sum, entry) => sum + entry.rewardAmount, 0).toFixed(6)} ETH
                          {ethPrice && (
                            <span className="mining-reward-usd">
                              {' '}(${(ethClaimedRewards.reduce((sum, entry) => sum + entry.rewardAmount, 0) * ethPrice.price).toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mining-detail-footer">
              <button
                className={`mining-start-button ${nodeStatus === 'active' ? 'mining-stop-button' : ''}`}
                onClick={nodeStatus === 'active' ? handleStopNode : handleStartNode}
              >
                {nodeStatus === 'active' ? t('mining.stopNode', language) : t('mining.startNode', language)}
              </button>
              <button className="mining-back-button" onClick={handleCloseDetail}>
                {t('mining.backToMining', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 채굴 가능 코인보기 모달 */}
      {selectedMining && selectedMining.id === 'coins' && (
        <div className="mining-detail-overlay" onClick={handleCloseDetail}>
          <div className="mining-detail-modal mining-coins-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mining-detail-header">
              <h2 className="mining-detail-title">
                {t('mining.coinList', language)}
              </h2>
              <button className="mining-detail-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>

            <div className="mining-detail-content">
              <div className="mining-coins-grid">
                {mineableCoins.map((coin) => (
                  <div
                    key={coin.id}
                    className="mining-coin-card"
                    onClick={() => handleCoinSelect(coin)}
                  >
                    <div className="mining-coin-header">
                      <h3 className="mining-coin-name">{coin.name}</h3>
                      <span className="mining-coin-symbol">{coin.symbol}</span>
                    </div>
                    <div className="mining-coin-price">
                      {coinPrice[coin.symbol]
                        ? `$${parseFloat(coinPrice[coin.symbol].priceString || coinPrice[coin.symbol].price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : 'Loading...'}
                    </div>
                    <div className="mining-coin-status">
                      <span className={`mining-status-badge ${coinMiningStatus[coin.symbol] || 'idle'}`}>
                        {t(`mining.miningStatus.${coinMiningStatus[coin.symbol] || 'idle'}`, language)}
                      </span>
                    </div>
                    <div className="mining-coin-info">
                      <div className="mining-coin-info-item">
                        <span className="mining-coin-info-label">{t('mining.algorithm', language)}</span>
                        <span className="mining-coin-info-value">{coin.algorithm}</span>
                      </div>
                      <div className="mining-coin-info-item">
                        <span className="mining-coin-info-label">{t('mining.profitability', language)}</span>
                        <span className={`mining-coin-profitability ${coin.profitability.toLowerCase()}`}>
                          {coin.profitability}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mining-detail-footer">
              <button className="mining-back-button" onClick={handleCloseDetail}>
                {t('mining.backToMining', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 코인 상세 정보 모달 */}
      {selectedCoin && (
        <div className="mining-detail-overlay" onClick={() => setSelectedCoin(null)}>
          <div className="mining-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mining-detail-header">
              <h2 className="mining-detail-title">
                {selectedCoin.name} ({selectedCoin.symbol})
              </h2>
              <button className="mining-detail-close" onClick={() => setSelectedCoin(null)}>
                ×
              </button>
            </div>

            <div className="mining-detail-content">
              <div className="mining-dashboard">
                <div className="mining-info-grid">
                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.currentPrice', language)}</div>
                    <div className="mining-info-value">
                      {coinPrice[selectedCoin.symbol]
                        ? `$${parseFloat(coinPrice[selectedCoin.symbol].priceString || coinPrice[selectedCoin.symbol].price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : 'Loading...'}
                    </div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.algorithm', language)}</div>
                    <div className="mining-info-value">{selectedCoin.algorithm}</div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.blockReward', language)}</div>
                    <div className="mining-info-value">{selectedCoin.blockReward}</div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.networkHashRate', language)}</div>
                    <div className="mining-info-value">{selectedCoin.networkHashRate}</div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.hashRate', language)}</div>
                    <div className="mining-info-value">
                      {coinHashRate[selectedCoin.symbol] > 0
                        ? `${coinHashRate[selectedCoin.symbol].toFixed(2)} ${getHashRateUnit(selectedCoin.symbol)}`
                        : '0'}
                    </div>
                  </div>

                  <div className="mining-info-card">
                    <div className="mining-info-label">{t('mining.statusLabel', language)}</div>
                    <div className="mining-info-value">
                      <span className={`mining-status-badge ${coinMiningStatus[selectedCoin.symbol] || 'idle'}`}>
                        {t(`mining.miningStatus.${coinMiningStatus[selectedCoin.symbol] || 'idle'}`, language)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 실시간 채굴 통계 */}
                <div className="mining-stats">
                  <h3 className="mining-stats-title">{t('mining.realTimeStats', language)}</h3>
                  <div className="mining-stats-grid">
                    <div className="mining-stat-item">
                      <div className="mining-stat-label">{t('mining.minedAmount', language)}</div>
                      <div className="mining-stat-value">
                        {(coinMinedAmount[selectedCoin.symbol] || 0) > 0
                          ? `${(coinMinedAmount[selectedCoin.symbol] || 0).toFixed(8)} ${selectedCoin.symbol}`
                          : `0.00000000 ${selectedCoin.symbol}`}
                      </div>
                    </div>

                    <div className="mining-stat-item">
                      <div className="mining-stat-label">{t('mining.estimatedProfit', language)}</div>
                      <div className="mining-stat-value">
                        {coinPrice[selectedCoin.symbol] && (coinMinedAmount[selectedCoin.symbol] || 0) > 0
                          ? `$${((coinMinedAmount[selectedCoin.symbol] || 0) * coinPrice[selectedCoin.symbol].price).toFixed(2)}`
                          : '$0.00'}
                      </div>
                    </div>

                    <div className="mining-stat-item">
                      <div className="mining-stat-label">{t('mining.miningTime', language)}</div>
                      <div className="mining-stat-value">{formatTime(coinMiningTime[selectedCoin.symbol] || 0)}</div>
                    </div>
                  </div>
                </div>

                {/* 출금 가능 보상 */}
                <div className="mining-reward-section">
                  <div className="mining-reward-header-section">
                    <h3 className="mining-reward-title">{t('mining.availableRewards', language)}</h3>
                    {coinMiningHistory[selectedCoin.symbol] && coinMiningHistory[selectedCoin.symbol].length > 0 && (
                      <button
                        className="mining-claim-all-btn"
                        onClick={() => handleClaimAllCoinRewards(selectedCoin.symbol)}
                      >
                        {t('mining.claimAll', language)}
                      </button>
                    )}
                  </div>
                  {coinMiningHistory[selectedCoin.symbol] && coinMiningHistory[selectedCoin.symbol].length > 0 ? (
                    <div className="mining-reward-table">
                      <div className="mining-reward-header">
                        <div>{t('mining.time', language)}</div>
                        <div>{t('mining.amount', language)}</div>
                        <div>{t('mining.reward', language)}</div>
                        <div>{t('mining.claim', language)}</div>
                      </div>
                      {coinMiningHistory[selectedCoin.symbol].map((entry) => {
                        const rewardValue = coinPrice[selectedCoin.symbol]
                          ? entry.amount * coinPrice[selectedCoin.symbol].price
                          : 0
                        return (
                          <div key={entry.id} className="mining-reward-row">
                            <div>{new Date(entry.time).toLocaleString()}</div>
                            <div>{entry.amount.toFixed(8)} {selectedCoin.symbol}</div>
                            <div>
                              {rewardValue > 0 ? `$${rewardValue.toFixed(2)}` : 'Calculating...'}
                            </div>
                            <div>
                              <button
                                className="mining-claim-btn"
                                onClick={() => handleClaimCoinReward(selectedCoin.symbol, entry.id)}
                              >
                                {t('mining.claimReward', language)}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      <div className="mining-reward-total">
                        <div>{t('mining.totalAvailable', language)}</div>
                        <div>
                          {coinMiningHistory[selectedCoin.symbol].reduce((sum, entry) => sum + entry.amount, 0).toFixed(8)} {selectedCoin.symbol}
                          {coinPrice[selectedCoin.symbol] && (
                            <span className="mining-reward-usd">
                              {' '}(${(coinMiningHistory[selectedCoin.symbol].reduce((sum, entry) => sum + entry.amount, 0) * coinPrice[selectedCoin.symbol].price).toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mining-no-data">{t('mining.noAvailableRewards', language)}</div>
                  )}
                </div>

                {/* 수령한 보상 내역 */}
                {coinClaimedRewards[selectedCoin.symbol] && coinClaimedRewards[selectedCoin.symbol].length > 0 && (
                  <div className="mining-reward-section">
                    <h3 className="mining-reward-title">{t('mining.claimedRewards', language)}</h3>
                    <div className="mining-reward-table">
                      <div className="mining-reward-header">
                        <div>{t('mining.time', language)}</div>
                        <div>{t('mining.amount', language)}</div>
                        <div>{t('mining.reward', language)}</div>
                        <div>{t('mining.status', language)}</div>
                      </div>
                      {coinClaimedRewards[selectedCoin.symbol].slice(0, 10).map((entry) => {
                        const rewardValue = coinPrice[selectedCoin.symbol]
                          ? entry.amount * coinPrice[selectedCoin.symbol].price
                          : 0
                        return (
                          <div key={entry.id} className="mining-reward-row claimed">
                            <div>{new Date(entry.time).toLocaleString()}</div>
                            <div>{entry.amount.toFixed(8)} {selectedCoin.symbol}</div>
                            <div>{rewardValue > 0 ? `$${rewardValue.toFixed(2)}` : 'Calculating...'}</div>
                            <div className="mining-claimed-badge">✓ {t('mining.claimedRewards', language)}</div>
                          </div>
                        )
                      })}
                      <div className="mining-reward-total claimed-total">
                        <div>{t('mining.totalClaimed', language)}</div>
                        <div>
                          {coinClaimedRewards[selectedCoin.symbol].reduce((sum, entry) => sum + entry.amount, 0).toFixed(8)} {selectedCoin.symbol}
                          {coinPrice[selectedCoin.symbol] && (
                            <span className="mining-reward-usd">
                              {' '}(${(coinClaimedRewards[selectedCoin.symbol].reduce((sum, entry) => sum + entry.amount, 0) * coinPrice[selectedCoin.symbol].price).toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mining-coin-description">
                  <h3 className="mining-coin-description-title">{t('mining.coinDetails', language)}</h3>
                  <p className="mining-coin-description-text">{selectedCoin.description}</p>
                </div>
              </div>
            </div>

            <div className="mining-detail-footer">
              <button
                className={`mining-start-button ${(coinMiningStatus[selectedCoin.symbol] || 'idle') === 'mining' ? 'mining-stop-button' : ''}`}
                onClick={(coinMiningStatus[selectedCoin.symbol] || 'idle') === 'mining'
                  ? () => handleStopCoinMining(selectedCoin.symbol)
                  : () => handleStartCoinMining(selectedCoin.symbol)}
              >
                {(coinMiningStatus[selectedCoin.symbol] || 'idle') === 'mining'
                  ? t('mining.stopMining', language)
                  : t('mining.startMining', language)}
              </button>
              <button className="mining-back-button" onClick={() => setSelectedCoin(null)}>
                {t('mining.backToMining', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 다른 채굴 옵션 상세 모달 (비트코인, 이더리움, 코인보기 외) */}
      {selectedMining && selectedMining.id !== 'bitcoin' && selectedMining.id !== 'ethereum' && selectedMining.id !== 'coins' && (
        <div className="mining-detail-overlay" onClick={handleCloseDetail}>
          <div className="mining-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mining-detail-header">
              <h2 className="mining-detail-title">
                {getMiningDetail(selectedMining.id).title}
              </h2>
              <button className="mining-detail-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>

            <div className="mining-detail-content">
              <div className="mining-status-message">
                {t('mining.comingSoon', language)}
              </div>
              <p className="mining-detail-text">
                {getMiningDetail(selectedMining.id).content}
              </p>
            </div>

            <div className="mining-detail-footer">
              <button className="mining-back-button" onClick={handleCloseDetail}>
                {t('mining.backToMining', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MiningPage
