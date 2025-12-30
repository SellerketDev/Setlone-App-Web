import React, { useState, useEffect, useMemo, useRef } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import { getToken, fetchWithAuth } from '../utils/auth'
import { getApiUrl } from '../config/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import './StakingPage.css'

const LockupStakingPage = ({ onBack, language: propLanguage, onLoginRequired, initialStakingType }) => {
  // prop으로 받은 language가 있으면 사용, 없으면 localStorage에서 가져오기
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animationFrameRef = useRef(null)
  
  // 스테이킹 타입 선택 (lockup: 락업, unlock: 언락)
  const [stakingType, setStakingType] = useState(initialStakingType || 'lockup') // 'lockup' or 'unlock'
  
  // 락업 기간 선택 (30일, 90일, 180일)
  const [lockupPeriod, setLockupPeriod] = useState(90) // 기본 90일
  
  // 인증 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // 스테이킹 상태
  const [balance, setBalance] = useState(0) // 현재 잔액
  const [stakingAmount, setStakingAmount] = useState('')
  const [isStaking, setIsStaking] = useState(false)
  const [stakingStatus, setStakingStatus] = useState(null) // 'success', 'failed', null
  const [currentStaking, setCurrentStaking] = useState(0) // 현재 스테이킹 중인 금액
  const [totalRewards, setTotalRewards] = useState(0) // 누적 수익
  const [isLoadingStakingData, setIsLoadingStakingData] = useState(false)
  
  // 락업 기간별 APY 및 보상 지급 주기 설정
  const lockupPeriods = [
    { days: 30, apy: 6.5, rewardCycle: 'daily' }, // 30일: 매일
    { days: 90, apy: 7.5, rewardCycle: 'weekly' }, // 90일: 주 1회
    { days: 180, apy: 8.5, rewardCycle: 'monthly' } // 180일: 월 1회
  ]
  
  // 스테이킹 타입에 따른 설정
  const stakingConfig = useMemo(() => {
    if (stakingType === 'lockup') {
      const selectedPeriod = lockupPeriods.find(p => p.days === lockupPeriod) || lockupPeriods[1]
      return {
        apy: selectedPeriod.apy, // 락업: 기간별 APY
        stakingPeriod: lockupPeriod, // 선택된 락업 기간 (일)
        unstakingWaitingPeriod: 7, // 언스테이킹 대기 기간 (일)
        minStakingAmount: 500, // 최소 스테이킹 금액
        canUnstake: false, // 락업 기간 동안 언스테이킹 불가
        lockupEndDate: null // 락업 종료 날짜
      }
    } else {
      return {
        apy: 4.5, // 언락: 낮은 APY
        stakingPeriod: 365, // 언락 기간 (일)
        unstakingWaitingPeriod: 1, // 언스테이킹 대기 기간 (일)
        minStakingAmount: 100, // 최소 스테이킹 금액
        canUnstake: true, // 언제든지 언스테이킹 가능
        lockupEndDate: null
      }
    }
  }, [stakingType, lockupPeriod])
  
  const { apy, stakingPeriod, unstakingWaitingPeriod, minStakingAmount } = stakingConfig
  
  // 언스테이킹 상태
  const [unstakingStatus, setUnstakingStatus] = useState('active') // 'active', 'requested', 'available'
  const [unstakingDaysLeft, setUnstakingDaysLeft] = useState(0) // 언스테이킹 대기 일수
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  
  // 다음 보상 지급 정보
  const [nextRewardDate, setNextRewardDate] = useState(null)
  
  // 락업 기간에 따른 보상 지급 주기 계산
  const rewardPaymentCycle = useMemo(() => {
    if (stakingType === 'lockup') {
      const selectedPeriod = lockupPeriods.find(p => p.days === lockupPeriod) || lockupPeriods[1]
      return selectedPeriod.rewardCycle
    } else {
      // 언락 스테이킹은 매일
      return 'daily'
    }
  }, [stakingType, lockupPeriod])
  
  // 다음 보상 지급 날짜 계산
  useEffect(() => {
    if (isLoggedIn && currentStaking > 0) {
      const today = new Date()
      const nextDate = new Date(today)
      
      if (rewardPaymentCycle === 'daily') {
        // 매일: 다음 날
        nextDate.setDate(today.getDate() + 1)
      } else if (rewardPaymentCycle === 'weekly') {
        // 주 1회: 다음 주 같은 요일
        const daysUntilNextWeek = 7 - today.getDay() + 1
        nextDate.setDate(today.getDate() + daysUntilNextWeek)
      } else if (rewardPaymentCycle === 'monthly') {
        // 월 1회: 다음 달 같은 날짜
        nextDate.setMonth(today.getMonth() + 1)
        // 다음 달에 해당 날짜가 없으면 마지막 날로 조정
        if (nextDate.getDate() !== today.getDate()) {
          nextDate.setDate(0) // 이전 달의 마지막 날
        }
      }
      
      setNextRewardDate(nextDate)
    }
  }, [isLoggedIn, currentStaking, rewardPaymentCycle])
  
  // 다음 보상 지급까지 남은 일수 계산
  const getDaysUntilNextReward = () => {
    if (!nextRewardDate) return 0
    const today = new Date()
    const diffTime = nextRewardDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }
  
  // 예상 연 수익 계산
  const calculateAnnualReward = (amount) => {
    if (!amount || isNaN(parseFloat(amount))) return 0
    const numAmount = parseFloat(amount)
    return (numAmount * apy / 100).toFixed(2)
  }
  
  // 스테이킹 설정
  const maxStakingAmount = balance

  // 인증 상태 체크 및 스테이킹 데이터 로드
  useEffect(() => {
    const token = getToken()
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(!!(token && loggedIn))
    
    // 로그인 상태면 스테이킹 데이터 가져오기
    if (token && loggedIn) {
      loadStakingData()
    }
  }, [])

  // prop language가 변경되면 업데이트
  useEffect(() => {
    if (propLanguage && propLanguage !== language) {
      setLanguage(propLanguage)
    }
  }, [propLanguage, language])

  // 보상 자동 증가 시뮬레이션 (스테이킹 중일 때만)
  useEffect(() => {
    if (!isLoggedIn || currentStaking === 0) return

    const rewardInterval = setInterval(() => {
      // 일일 보상 계산 (APY / 365)
      const dailyReward = (currentStaking * apy / 100) / 365
      // 1분마다 보상 증가 (실제로는 하루에 한 번)
      const minuteReward = dailyReward / (24 * 60)
      setTotalRewards(prev => prev + minuteReward)
    }, 60000) // 1분마다 업데이트

    return () => clearInterval(rewardInterval)
  }, [isLoggedIn, currentStaking, apy])

  // 우주 배경 효과 초기화
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const particleCount = 80
    const particles = []
    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.opacity = Math.random() * 0.5 + 0.3
        this.glow = Math.random() > 0.7
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = this.glow 
          ? `rgba(100, 150, 255, ${this.opacity})` 
          : `rgba(255, 255, 255, ${this.opacity})`
        ctx.fill()
        
        if (this.glow) {
          ctx.shadowBlur = 10
          ctx.shadowColor = 'rgba(100, 150, 255, 0.8)'
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }
    particlesRef.current = particles

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(100, 150, 255, ${0.2 * (1 - distance / 150)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      drawConnections()

      animationId = requestAnimationFrame(animate)
    }

    animate()
    animationFrameRef.current = animationId

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  // 스테이킹 데이터 로드
  const loadStakingData = async () => {
    setIsLoadingStakingData(true)
    try {
      // TODO: 실제 API 엔드포인트로 변경
      // const response = await fetchWithAuth(getApiUrl('/api/v1/staking/lockup/status'))
      // const data = await response.json()
      
      // 시뮬레이션 데이터 (실제로는 API에서 가져옴)
      setBalance(10000)
      setCurrentStaking(5000)
      setTotalRewards(250)
      setUnstakingStatus('active')
      setUnstakingDaysLeft(0)
    } catch (error) {
      console.error('Failed to load staking data:', error)
    } finally {
      setIsLoadingStakingData(false)
    }
  }

  // MAX 버튼 클릭
  const handleMaxClick = () => {
    setStakingAmount(balance.toString())
  }

  // 금액 입력 검증
  const validateAmount = (amount) => {
    if (!amount || amount === '') {
      return { valid: false, message: t('staking.enterAmount', language) }
    }
    
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return { valid: false, message: t('staking.invalidAmount', language) }
    }
    
    if (numAmount < minStakingAmount) {
      return { valid: false, message: t('staking.minAmountError', language, { min: minStakingAmount }) }
    }
    
    if (numAmount > maxStakingAmount) {
      return { valid: false, message: t('staking.maxAmountError', language, { max: maxStakingAmount }) }
    }
    
    return { valid: true }
  }

  // 금액 입력 핸들러
  const handleAmountChange = (e) => {
    const value = e.target.value
    // 숫자와 소수점만 허용
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setStakingAmount(value)
    }
  }

  // 예상 수익 계산
  const calculateEstimatedRewards = (amount) => {
    if (!amount || isNaN(parseFloat(amount))) return 0
    const numAmount = parseFloat(amount)
    const dailyReward = (numAmount * apy / 100) / 365
    const totalReward = dailyReward * stakingPeriod
    return totalReward.toFixed(2)
  }

  // 스테이킹 실행
  const handleStakeNow = async () => {
    // 인증 체크 (이미 UI에서 처리하지만 이중 체크)
    if (!isLoggedIn) {
      if (onLoginRequired) {
        onLoginRequired()
      }
      return
    }

    const validation = validateAmount(stakingAmount)
    if (!validation.valid) {
      setStakingStatus('failed')
      setTimeout(() => setStakingStatus(null), 3000)
      return
    }

    setIsStaking(true)
    setStakingStatus(null)

    try {
      // TODO: 실제 API 호출
      // const response = await fetchWithAuth(getApiUrl('/api/v1/staking/lockup'), {
      //   method: 'POST',
      //   body: JSON.stringify({ 
      //     amount: parseFloat(stakingAmount),
      //     type: stakingType 
      //   })
      // })
      
      // 시뮬레이션: 2초 대기
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 성공 처리
      const amount = parseFloat(stakingAmount)
      setBalance(prev => prev - amount)
      setCurrentStaking(prev => prev + amount)
      setStakingAmount('')
      setStakingStatus('success')
      
      // 성공 메시지 3초 후 제거
      setTimeout(() => {
        setStakingStatus(null)
      }, 3000)
    } catch (error) {
      setStakingStatus('failed')
      setTimeout(() => setStakingStatus(null), 3000)
    } finally {
      setIsStaking(false)
    }
  }

  // 언스테이킹 요청 핸들러
  const handleUnstakingRequest = async () => {
    // 인증 체크 (이미 UI에서 처리하지만 이중 체크)
    if (!isLoggedIn) {
      setShowUnstakingModal(false)
      if (onLoginRequired) {
        onLoginRequired()
      }
      return
    }

    // 락업 타입이고 락업 기간이 끝나지 않았으면 언스테이킹 불가
    if (stakingType === 'lockup' && !stakingConfig.canUnstake) {
      setStakingStatus('failed')
      setTimeout(() => setStakingStatus(null), 3000)
      return
    }

    setIsUnstaking(true)
    
    try {
      // TODO: 실제 API 호출
      // const response = await fetchWithAuth(getApiUrl('/api/v1/staking/unstake'), { ... })
      
      // 시뮬레이션: 1초 대기
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 성공 처리
      setUnstakingStatus('requested')
      setUnstakingDaysLeft(unstakingWaitingPeriod)
      setShowUnstakingModal(false)
      setStakingStatus('success')
      
      // 성공 메시지 3초 후 제거
      setTimeout(() => {
        setStakingStatus(null)
      }, 3000)
      
      // 대기 일수 카운트다운 (시뮬레이션)
      const countdown = setInterval(() => {
        setUnstakingDaysLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdown)
            setUnstakingStatus('available')
            return 0
          }
          return prev - 1
        })
      }, 86400000) // 1일 = 86400000ms (실제로는 서버에서 관리)
      
    } catch (error) {
      setStakingStatus('failed')
      setTimeout(() => setStakingStatus(null), 3000)
    } finally {
      setIsUnstaking(false)
    }
  }

  // 언스테이킹 상태 텍스트 가져오기
  const getUnstakingStatusText = () => {
    switch (unstakingStatus) {
      case 'active':
        return t('staking.stakingActive', language)
      case 'requested':
        const daysText = t('staking.unstakingDaysLeft', language).replace('{days}', unstakingDaysLeft.toString())
        return `${t('staking.unstakingRequested', language)} (${daysText})`
      case 'available':
        return t('staking.withdrawAvailable', language)
      default:
        return t('staking.stakingActive', language)
    }
  }

  // 언스테이킹 상태 색상 가져오기
  const getUnstakingStatusColor = () => {
    switch (unstakingStatus) {
      case 'active':
        return '#4facfe'
      case 'requested':
        return '#ffc107'
      case 'available':
        return '#4caf50'
      default:
        return '#4facfe'
    }
  }

  // 총 수익률 계산
  const totalReturnRate = useMemo(() => {
    if (currentStaking === 0) return 0
    return ((totalRewards / currentStaking) * 100).toFixed(2)
  }, [currentStaking, totalRewards])

  // 차트 데이터 생성
  const chartData = useMemo(() => {
    const data = []
    const today = new Date()
    const locale = language === 'ko' ? 'ko-KR' : 'en-US'
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // 진행률 계산 (0부터 1까지)
      const progress = (29 - i) / 29
      
      // 스테이킹 금액: 과거부터 현재까지 점진적으로 증가
      const stakingValue = currentStaking > 0 
        ? Math.max(0, currentStaking * (0.3 + progress * 0.7))
        : 0
      
      // 보상: 과거부터 현재까지 점진적으로 증가
      const rewardsValue = totalRewards > 0
        ? Math.max(0, totalRewards * (0.2 + progress * 0.8))
        : 0
      
      // 수익률 계산 (보상 / 스테이킹 금액)
      const profitRate = stakingValue > 0 ? ((rewardsValue / stakingValue) * 100) : 0
      
      data.push({
        date: date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
        dateFull: date.toLocaleDateString(locale),
        staking: Math.round(stakingValue),
        rewards: Math.round(rewardsValue * 100) / 100,
        profitRate: Math.round(profitRate * 100) / 100
      })
    }
    
    // 마지막 값이 정확히 현재 상태와 일치하도록 보정
    if (data.length > 0) {
      data[data.length - 1].staking = currentStaking
      data[data.length - 1].rewards = totalRewards
      const currentProfitRate = currentStaking > 0 ? ((totalRewards / currentStaking) * 100) : 0
      data[data.length - 1].profitRate = Math.round(currentProfitRate * 100) / 100
    }
    
    return data
  }, [currentStaking, totalRewards, language])

  return (
    <div className="staking-page">
      {/* 우주 배경 효과 */}
      <canvas 
        ref={canvasRef} 
        className="space-background"
      />
      <div className="staking-header">
        <button className="back-button" onClick={onBack}>
          ← {t('staking.backToStaking', language)}
        </button>
        <h1 className="staking-title">{t('staking.options.lockup.title', language)}</h1>
      </div>

      <div className="staking-content">
        <div className="native-staking-form">
          {/* 스테이킹 타입 선택 */}
          <div className="staking-type-selector">
            <button
              className={`staking-type-button ${stakingType === 'lockup' ? 'active' : ''}`}
              onClick={() => setStakingType('lockup')}
            >
              <div className="staking-type-header">
                <div className="staking-type-title-wrapper">
                  <span className="staking-type-title">{t('staking.lockupType', language)}</span>
                  <span className="staking-type-badge staking-type-badge-high-yield">{t('staking.highYield', language)}</span>
                </div>
                <span className="staking-type-apy">{stakingConfig.apy}% APY</span>
              </div>
              <div className="staking-type-info">
                <div className="staking-type-period">
                  <span className="staking-type-icon">🔒</span>
                  <span className="staking-type-period-text">
                    {t('staking.lockupPeriod', language)}: {lockupPeriod} {t('staking.days', language)} ({t('staking.noEarlyWithdrawal', language)})
                  </span>
                </div>
                <span className="staking-type-description">{t('staking.lockupDescription', language)}</span>
              </div>
            </button>
            <button
              className={`staking-type-button ${stakingType === 'unlock' ? 'active' : ''}`}
              onClick={() => setStakingType('unlock')}
            >
              <div className="staking-type-header">
                <div className="staking-type-title-wrapper">
                  <span className="staking-type-title">{t('staking.unlockType', language)}</span>
                  <span className="staking-type-badge staking-type-badge-liquidity">{t('staking.liquidity', language)}</span>
                </div>
                <span className="staking-type-apy">{stakingConfig.apy}% APY</span>
              </div>
              <div className="staking-type-info">
                <div className="staking-type-period">
                  <span className="staking-type-icon">🔓</span>
                  <span className="staking-type-period-text">
                    {t('staking.flexibleWithdrawal', language)}
                  </span>
                </div>
                <span className="staking-type-description">{t('staking.unlockDescription', language)}</span>
                <div className="staking-type-warning">
                  <span className="staking-type-warning-icon">⚠️</span>
                  <span className="staking-type-warning-text">{t('staking.liquidityRiskNotice', language)}</span>
                </div>
              </div>
            </button>
          </div>
          
          {/* 락업 기간 선택 (락업 타입 선택 시에만 표시) */}
          {stakingType === 'lockup' && (
            <div className="lockup-period-selector">
              <label className="lockup-period-label">{t('staking.selectLockupPeriod', language)}</label>
              <div className="lockup-period-options">
                {lockupPeriods.map((period) => (
                  <button
                    key={period.days}
                    className={`lockup-period-button ${lockupPeriod === period.days ? 'active' : ''}`}
                    onClick={() => setLockupPeriod(period.days)}
                  >
                    <span className="lockup-period-days">{period.days} {t('staking.days', language)}</span>
                    <span className="lockup-period-apy">{period.apy}% APY</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 잔액 및 수익률 정보 헤더 */}
          <div className="staking-header-info">
            <div className="staking-header-balance">
              <span className="staking-header-label">{t('staking.totalBalance', language)}</span>
              <span className="staking-header-value">
                {isLoadingStakingData ? '...' : `${(balance + currentStaking).toLocaleString()} SET`}
              </span>
            </div>
            <div className="staking-header-apy">
              <span className="staking-header-label">{t('staking.apy', language)}</span>
              <span className="staking-header-value apy-highlight">{apy}%</span>
            </div>
          </div>

          {/* 잔액 및 스테이킹 정보 */}
          {isLoggedIn ? (
            <div className="staking-info-grid">
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.availableBalance', language)}</span>
                <span className="staking-info-value">
                  {isLoadingStakingData ? '...' : `${balance.toLocaleString()} SET`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.currentStaking', language)}</span>
                <span className="staking-info-value">
                  {isLoadingStakingData ? '...' : `${currentStaking.toLocaleString()} SET`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.totalRewards', language)}</span>
                <span className="staking-info-value rewards-value">
                  {isLoadingStakingData ? '...' : `+${totalRewards.toLocaleString()} SET`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.totalReturn', language)}</span>
                <span className="staking-info-value profit-value">
                  {totalReturnRate > 0 ? `+${totalReturnRate}%` : '0%'}
                </span>
              </div>
            </div>
          ) : (
            <div className="staking-login-required-message">
              <p>{t('staking.loginRequired', language)}</p>
              <button 
                className="staking-login-button"
                onClick={() => onLoginRequired && onLoginRequired()}
              >
                {t('staking.goToLogin', language)}
              </button>
            </div>
          )}

          {/* 스테이킹 입력 섹션 */}
          {isLoggedIn && (
            <div className="staking-action-section">
              {/* 락업 타입 선택 시 기간 정보 표시 */}
              {stakingType === 'lockup' && (
                <div className="lockup-info-box">
                  <div className="lockup-info-item">
                    <span className="lockup-info-label">{t('staking.lockupPeriod', language)}</span>
                    <span className="lockup-info-value">{lockupPeriod} {t('staking.days', language)}</span>
                  </div>
                  <div className="lockup-info-item">
                    <span className="lockup-info-label">{t('staking.earlyWithdrawal', language)}</span>
                    <span className="lockup-info-value lockup-info-value-warning">{t('staking.notAvailable', language)}</span>
                  </div>
                </div>
              )}
              
              {/* 언락 타입 선택 시 유동성 리스크 안내 */}
              {stakingType === 'unlock' && (
                <div className="unlock-info-box">
                  <div className="unlock-info-warning">
                    <span className="unlock-info-icon">⚠️</span>
                    <span className="unlock-info-text">{t('staking.liquidityRiskNotice', language)}</span>
                  </div>
                </div>
              )}
              
              <div className="staking-input-container">
                <div className="staking-input-header">
                  <label className="staking-input-label">
                    {t('staking.stakingAmount', language)}
                  </label>
                  <span className="staking-input-hint">
                    {t('staking.minStakingReason', language, { min: minStakingAmount })}
                  </span>
                </div>
                <div className="staking-input-wrapper">
                  <input
                    type="text"
                    className="staking-amount-input"
                    placeholder={t('staking.enterAmount', language)}
                    value={stakingAmount}
                    onChange={handleAmountChange}
                    disabled={isStaking}
                  />
                  <button
                    className="staking-max-button"
                    onClick={handleMaxClick}
                    disabled={isStaking || balance === 0}
                  >
                    {t('staking.max', language)}
                  </button>
                </div>
                {stakingAmount && parseFloat(stakingAmount) > 0 && (
                  <div className="staking-estimated-rewards">
                    <div className="staking-estimated-item">
                      <span className="staking-estimated-label">{t('staking.estimatedRewards', language)}</span>
                      <span className="staking-estimated-value">
                        {calculateEstimatedRewards(stakingAmount)} SET
                      </span>
                    </div>
                    <div className="staking-estimated-item">
                      <span className="staking-estimated-label">{t('staking.estimatedAnnualReward', language)}</span>
                      <span className="staking-estimated-value annual-reward">
                        약 +{calculateAnnualReward(stakingAmount)} SET
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                className="staking-stake-button-primary" 
                onClick={handleStakeNow}
                disabled={isStaking || !stakingAmount || parseFloat(stakingAmount) <= 0}
              >
                {isStaking ? t('staking.staking', language) : t('staking.stakeNow', language)}
              </button>
            </div>
          )}

          {/* 스테이킹 내역 및 차트 */}
          {isLoggedIn && (
            <div className="staking-history-section">
              <div className="staking-history-header">
                <h3 className="staking-history-title">{t('staking.stakingHistory', language)}</h3>
                {totalReturnRate > 0 && (
                  <div className="total-profit-badge">
                    {t('staking.totalReturn', language)}: <span className="profit-highlight">+{totalReturnRate}%</span>
                  </div>
                )}
              </div>
              
              {/* 차트 */}
              <div className="staking-chart-container">
                {/* 수익률 표시 헤더 */}
                <div className="staking-chart-header">
                  <div className="staking-chart-return-info">
                    <span className="staking-chart-return-label">{t('staking.totalReturn', language)}</span>
                    <span className="staking-chart-return-value positive">
                      +{totalReturnRate}%
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                    <defs>
                      <linearGradient id="colorStakingLockup" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="#00f2fe" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRewardsLockup" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4facfe" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="#4facfe" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#4facfe" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="rgba(255, 255, 255, 0.08)" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255, 255, 255, 0.5)"
                      tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
                      tickLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="rgba(255, 255, 255, 0.5)"
                      tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
                      tickLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `${(value / 1000000).toFixed(1)}M`
                        } else if (value >= 1000) {
                          return `${(value / 1000).toFixed(1)}K`
                        }
                        return value.toLocaleString()
                      }}
                      width={60}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.98)',
                        border: '1px solid rgba(79, 172, 254, 0.3)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        padding: '14px 16px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                      }}
                      labelStyle={{ 
                        color: '#4facfe', 
                        marginBottom: '10px', 
                        fontWeight: '600',
                        fontSize: '13px'
                      }}
                      itemStyle={{ 
                        color: '#ffffff',
                        fontSize: '13px',
                        padding: '4px 0'
                      }}
                      formatter={(value, name, props) => {
                        const data = props.payload
                        const locale = language === 'ko' ? 'ko-KR' : 'en-US'
                        const numValue = parseFloat(value) || 0
                        
                        if (name === t('staking.chartStakingAmount', language)) {
                          return [`${numValue.toLocaleString(locale, { maximumFractionDigits: 0 })} SET`, name]
                        } else if (name === t('staking.chartTotalRewards', language)) {
                          const stakingAmount = data?.staking || 0
                          const rewardsAmount = numValue
                          const profitRate = stakingAmount > 0 ? ((rewardsAmount / stakingAmount) * 100).toFixed(2) : 0
                          return [
                            `${rewardsAmount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SET (+${profitRate}%)`, 
                            name
                          ]
                        }
                        return [`${numValue.toLocaleString(locale, { maximumFractionDigits: 0 })} SET`, name]
                      }}
                      labelFormatter={(label) => {
                        return label
                      }}
                      separator=""
                    />
                    <Legend 
                      wrapperStyle={{ 
                        paddingTop: '16px', 
                        paddingBottom: '8px',
                        fontSize: '13px'
                      }}
                      iconType="circle"
                      iconSize={8}
                      align="center"
                      verticalAlign="bottom"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="staking" 
                      stroke="#00f2fe" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorStakingLockup)"
                      name={t('staking.chartStakingAmount', language)}
                      dot={false}
                      activeDot={{ r: 5, fill: '#00f2fe', strokeWidth: 2, stroke: '#ffffff' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="rewards" 
                      stroke="#4facfe" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorRewardsLockup)"
                      name={t('staking.chartTotalRewards', language)}
                      dot={false}
                      activeDot={{ r: 5, fill: '#4facfe', strokeWidth: 2, stroke: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 다음 보상 지급 정보 */}
              {nextRewardDate && (
                <div className="next-reward-card">
                  <div className="next-reward-content">
                    <span className="next-reward-label">{t('staking.nextRewardPayment', language)}</span>
                    <span className="next-reward-value">
                      {nextRewardDate.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                      })} (D-{getDaysUntilNextReward()})
                    </span>
                  </div>
                  <div className="reward-cycle-info">
                    <span className="reward-cycle-label">{t('staking.rewardPaymentCycle', language)}</span>
                    <span className="reward-cycle-value">
                      {rewardPaymentCycle === 'daily' 
                        ? t('staking.daily', language)
                        : rewardPaymentCycle === 'weekly'
                        ? t('staking.weekly', language)
                        : t('staking.monthly', language)
                      }
                    </span>
                  </div>
                </div>
              )}

              <div className="staking-history-stats">
                {/* 상태 시각화 */}
                <div className="staking-status-visualization">
                  <div className={`status-indicator ${unstakingStatus === 'active' ? 'active' : 'inactive'}`}>
                    <span className="status-dot">●</span>
                    <span className="status-text">{t('staking.statusActive', language)}</span>
                  </div>
                  <div className={`status-indicator ${unstakingStatus === 'requested' ? 'active' : 'inactive'}`}>
                    <span className="status-dot">○</span>
                    <span className="status-text">{t('staking.statusRequested', language)}</span>
                  </div>
                  <div className={`status-indicator ${unstakingStatus === 'available' ? 'active' : 'inactive'}`}>
                    <span className="status-dot">○</span>
                    <span className="status-text">{t('staking.statusAvailable', language)}</span>
                  </div>
                </div>
                
                <div className="staking-history-item">
                  <span className="staking-history-label">{t('staking.unstakingStatus', language)}</span>
                  <span 
                    className="staking-history-value staking-status-badge"
                    style={{ color: getUnstakingStatusColor() }}
                  >
                    {getUnstakingStatusText()}
                  </span>
                </div>
                
                {/* 언스테이킹 안내 문구 */}
                {unstakingStatus === 'active' && currentStaking > 0 && (
                  <div className="unstaking-warning-box">
                    <div className="unstaking-warning-icon">⚠️</div>
                    <div className="unstaking-warning-content">
                      <div className="unstaking-warning-title">{t('staking.unstakingWarning', language)}</div>
                      <div className="unstaking-warning-message">
                        {t('staking.unstakingWarningMessage', language, { days: unstakingWaitingPeriod })}
                      </div>
                    </div>
                  </div>
                )}
                
                {unstakingStatus === 'active' && currentStaking > 0 && stakingConfig.canUnstake && (
                  <div className="staking-unstake-button-container">
                    <button
                      className="staking-unstake-button"
                      onClick={() => setShowUnstakingModal(true)}
                    >
                      {t('staking.unstakingRequest', language)}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 상태 메시지 */}
          {stakingStatus && (
            <div className={`staking-status-message ${stakingStatus === 'success' ? 'staking-success' : 'staking-error'}`}>
              {stakingStatus === 'success' 
                ? t('staking.stakingSuccess', language)
                : t('staking.stakingFailed', language)
              }
            </div>
          )}
        </div>
      </div>

      {/* 언스테이킹 안내 모달 */}
      {showUnstakingModal && (
        <div className="staking-modal-overlay" onClick={() => setShowUnstakingModal(false)}>
          <div className="staking-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="staking-modal-header">
              <h3 className="staking-modal-title">{t('staking.unstakingInfoTitle', language)}</h3>
              <button 
                className="staking-modal-close"
                onClick={() => setShowUnstakingModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="staking-modal-body">
              <div className="staking-modal-info-box">
                <p className="staking-modal-message">
                  {t('staking.unstakingInfoMessage', language)}
                </p>
                <p className="staking-modal-detail">
                  {t('staking.unstakingInfoDetail', language)}
                </p>
                <div className="staking-modal-waiting-period">
                  <span className="staking-modal-waiting-label">
                    {t('staking.unstakingWaitingPeriod', language)}
                  </span>
                  <span className="staking-modal-waiting-value">
                    {unstakingWaitingPeriod} {t('staking.days', language)}
                  </span>
                </div>
              </div>
            </div>

            <div className="staking-modal-footer">
              <button
                className="staking-modal-cancel-button"
                onClick={() => setShowUnstakingModal(false)}
                disabled={isUnstaking}
              >
                {t('staking.unstakingCancel', language)}
              </button>
              <button
                className="staking-modal-confirm-button"
                onClick={handleUnstakingRequest}
                disabled={isUnstaking}
              >
                {isUnstaking ? t('staking.staking', language) : t('staking.unstakingConfirm', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LockupStakingPage

