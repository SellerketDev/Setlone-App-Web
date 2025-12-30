import React, { useState, useEffect, useMemo, useRef } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import { getToken, fetchWithAuth } from '../utils/auth'
import { getApiUrl } from '../config/api'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import './StakingPage.css'

const StakingPage = ({ onBack, language: propLanguage, onNativeStaking, onLockupStaking, onLiquidStakingDetail, onRestakingDetail, onCefiStakingDetail, onDefiStakingDetail, onLoginRequired }) => {
  // prop으로 받은 language가 있으면 사용, 없으면 localStorage에서 가져오기
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [selectedStaking, setSelectedStaking] = useState(null)
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animationFrameRef = useRef(null)
  
  // 인증 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // 리퀴드 스테이킹 동의 상태
  const [liquidAgreements, setLiquidAgreements] = useState({
    understandLST: false,
    understandRisk: false,
    understandDifference: false
  })
  
  // 리스테이킹 동의 상태
  const [restakingAgreements, setRestakingAgreements] = useState({
    understandDifference: false,
    understandSlashing: false,
    understandVariable: false,
    understandHighRisk: false
  })
  
  // DeFi 스테이킹 동의 상태
  const [defiAgreements, setDefiAgreements] = useState({
    understandDecentralized: false,
    understandSmartContract: false,
    understandNoGuarantee: false,
    understandIrreversible: false
  })
  
  // 네이티브 스테이킹 상태
  const [balance, setBalance] = useState(0) // 현재 잔액
  const [stakingAmount, setStakingAmount] = useState('')
  const [isStaking, setIsStaking] = useState(false)
  const [stakingStatus, setStakingStatus] = useState(null) // 'success', 'failed', null
  const [currentStaking, setCurrentStaking] = useState(0) // 현재 스테이킹 중인 금액
  const [totalRewards, setTotalRewards] = useState(0) // 누적 수익
  const [apy, setApy] = useState(5.5) // 연간 수익률 (%)
  const [stakingPeriod, setStakingPeriod] = useState(365) // 스테이킹 기간 (일)
  const [isLoadingStakingData, setIsLoadingStakingData] = useState(false)
  
  // 언스테이킹 상태
  const [unstakingStatus, setUnstakingStatus] = useState('active') // 'active', 'requested', 'available'
  const [unstakingDaysLeft, setUnstakingDaysLeft] = useState(0) // 언스테이킹 대기 일수
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const unstakingWaitingPeriod = 3 // 언스테이킹 대기 기간 (일)
  
  // 스테이킹 설정
  const minStakingAmount = 100
  const maxStakingAmount = balance

  // 총 수익률 계산
  const totalReturnRate = useMemo(() => {
    if (currentStaking === 0) return 0
    return ((totalRewards / currentStaking) * 100).toFixed(2)
  }, [currentStaking, totalRewards])

  // 차트 데이터 생성 (예시 데이터)
  const chartData = useMemo(() => {
    const data = []
    const today = new Date()
    const locale = language === 'ko' ? 'ko-KR' : 'en-US'
    
    // 최근 30일간의 데이터 생성
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // 스테이킹 금액은 점진적으로 증가 (예시)
      const baseStaking = currentStaking * 0.7
      const variation = Math.sin(i / 5) * (currentStaking * 0.1)
      const stakingValue = baseStaking + variation + (29 - i) * (currentStaking * 0.01)
      
      // 누적 수익도 점진적으로 증가
      const baseRewards = totalRewards * 0.7
      const rewardsVariation = Math.cos(i / 7) * (totalRewards * 0.1)
      const rewardsValue = baseRewards + rewardsVariation + (29 - i) * (totalRewards * 0.01)
      
      // 수익률 계산
      const profitRate = stakingValue > 0 ? ((rewardsValue / stakingValue) * 100).toFixed(2) : 0
      
      data.push({
        date: date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
        dateFull: date.toLocaleDateString(locale),
        staking: Math.max(0, Math.round(stakingValue)),
        rewards: Math.max(0, Math.round(rewardsValue * 10) / 10),
        profitRate: parseFloat(profitRate)
      })
    }
    return data
  }, [currentStaking, totalRewards, language])

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

  // 스테이킹 데이터 로드
  const loadStakingData = async () => {
    setIsLoadingStakingData(true)
    try {
      // TODO: 실제 API 엔드포인트로 변경
      // const response = await fetchWithAuth(getApiUrl('/api/v1/staking/status'))
      // const data = await response.json()
      
      // 시뮬레이션 데이터 (실제로는 API에서 가져옴)
      // 예시: API 응답 구조
      // {
      //   balance: 10000,
      //   currentStaking: 5000,
      //   totalRewards: 250,
      //   apy: 5.5,
      //   unstakingStatus: 'active',
      //   unstakingDaysLeft: 0
      // }
      
      // 임시: 로컬 스토리지나 API에서 가져오기
      setBalance(10000)
      setCurrentStaking(5000)
      setTotalRewards(250)
      setApy(5.5)
      setUnstakingStatus('active')
      setUnstakingDaysLeft(0)
    } catch (error) {
      console.error('Failed to load staking data:', error)
    } finally {
      setIsLoadingStakingData(false)
    }
  }

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

    // 파티클 생성
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
        this.glow = Math.random() > 0.7 // 일부 파티클만 더 밝게
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

    // 파티클 초기화
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }
    particlesRef.current = particles

    // 연결선 그리기
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

    // 애니메이션 루프
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

  const stakingOptions = [
    {
      id: 'native'
    },
    {
      id: 'lockup'
    },
    {
      id: 'liquid'
    },
    {
      id: 'restaking'
    },
    {
      id: 'cefi'
    },
    {
      id: 'defi'
    }
  ]

  const handleSeeMore = (staking) => {
    // 모든 스테이킹은 모달로 표시
    setSelectedStaking(staking)
  }

  const handleCloseDetail = () => {
    setSelectedStaking(null)
    // 리퀴드 스테이킹 동의 상태 초기화
    setLiquidAgreements({
      understandLST: false,
      understandRisk: false,
      understandDifference: false
    })
    // 리스테이킹 동의 상태 초기화
    setRestakingAgreements({
      understandDifference: false,
      understandSlashing: false,
      understandVariable: false,
      understandHighRisk: false
    })
  }

  const getStakingDetail = (id) => {
    const detail = {
      title: t(`staking.details.${id}.title`, language),
      content: t(`staking.details.${id}.content`, language)
    }
    
    // 네이티브 스테이킹과 락업 스테이킹의 경우 추가 정보 가져오기
    if (id === 'native' || id === 'lockup') {
      try {
        const additionalInfo = t(`staking.details.${id}.additionalInfo`, language)
        if (additionalInfo && Array.isArray(additionalInfo)) {
          detail.additionalInfo = additionalInfo
        }
      } catch (e) {
        // 번역이 없으면 무시
      }
    }
    
    return detail
  }

  const handleParticipateNativeStaking = () => {
    if (onNativeStaking) {
      onNativeStaking()
    } else {
      // 기본 동작: 모달 닫기
      handleCloseDetail()
    }
  }

  // MAX 버튼 클릭
  const handleMaxClick = () => {
    setStakingAmount(balance.toString())
  }

  // 금액 입력 검증
  const validateAmount = (amount) => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return { valid: false, message: t('staking.invalidAmount', language) }
    }
    if (numAmount < minStakingAmount) {
      return { valid: false, message: `${t('staking.minStakingAmount', language)}: ${minStakingAmount}` }
    }
    if (numAmount > balance) {
      return { valid: false, message: t('staking.insufficientBalance', language) }
    }
    return { valid: true }
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
      // const response = await fetch('/api/v1/staking/native', { ... })
      
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

  // 금액 입력 핸들러
  const handleAmountChange = (e) => {
    const value = e.target.value
    // 숫자와 소수점만 허용
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setStakingAmount(value)
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

    setIsUnstaking(true)
    
    try {
      // TODO: 실제 API 호출
      // const response = await fetch('/api/v1/staking/unstake', { ... })
      
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

  return (
    <div className="staking-page">
      {/* 우주 배경 효과 */}
      <canvas 
        ref={canvasRef} 
        className="space-background"
      />
      <div className="staking-header">
        <button className="back-button" onClick={onBack}>
          ← {t('staking.back', language)}
        </button>
        <h1 className="staking-title">
          {t('staking.title', language)}
        </h1>
      </div>

      <div className="staking-content">
        <div className="staking-grid">
          {stakingOptions.map((option) => (
            <div key={option.id} className="staking-card">
              <div className="staking-card-header">
                <h3 className="staking-card-title">
                  {t(`staking.options.${option.id}.title`, language)}
                </h3>
              </div>
              <p className="staking-card-description">
                {t(`staking.options.${option.id}.description`, language)}
              </p>
              <button
                className="staking-see-more-btn"
                onClick={() => handleSeeMore(option)}
              >
                {t('staking.seeMore', language)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 상세 설명 플로팅 화면 */}
      {selectedStaking && (
        <div className="staking-detail-overlay" onClick={handleCloseDetail}>
          <div className="staking-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staking-detail-header">
              <h2 className="staking-detail-title">
                {getStakingDetail(selectedStaking.id).title}
              </h2>
              <button className="staking-detail-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>
            
            <div className="staking-detail-content">
              {selectedStaking.id === 'native' ? (
                <>
                  {/* 스테이킹이란? 설명 섹션 */}
                  <div className="staking-explanation-section">
                    <h3 className="staking-explanation-title">
                      {t('staking.whatIsStaking', language)}
                    </h3>
                    <p className="staking-explanation-text">
                      {t('staking.stakingExplanation', language)}
                    </p>
                    <div className="staking-benefits-box">
                      <h4 className="staking-benefits-title">
                        {t('staking.stakingBenefits', language)}
                      </h4>
                      <div className="staking-benefits-list">
                        <div className="staking-benefit-item">
                          <span className="staking-benefit-icon">✓</span>
                          <span className="staking-benefit-text">{t('staking.stakingBenefit1', language)}</span>
                        </div>
                        <div className="staking-benefit-item">
                          <span className="staking-benefit-icon">✓</span>
                          <span className="staking-benefit-text">{t('staking.stakingBenefit2', language)}</span>
                        </div>
                        <div className="staking-benefit-item">
                          <span className="staking-benefit-icon">✓</span>
                          <span className="staking-benefit-text">{t('staking.stakingBenefit3', language)}</span>
                        </div>
                        <div className="staking-benefit-item">
                          <span className="staking-benefit-icon">✓</span>
                          <span className="staking-benefit-text">{t('staking.stakingBenefit4', language)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 스테이킹 설명 */}
                  <div className="native-staking-info-section">
                    <p className="staking-detail-text">
                      {getStakingDetail(selectedStaking.id).content}
                    </p>
                    
                    {/* 스테이킹 추가 설명 */}
                    {(() => {
                      try {
                        const additionalInfo = t(`staking.details.${selectedStaking.id}.additionalInfo`, language)
                        if (additionalInfo && Array.isArray(additionalInfo)) {
                          return (
                            <div className="staking-additional-info">
                              {additionalInfo.map((info, index) => (
                                <div key={index} className="staking-info-item">
                                  <span className="staking-info-bullet">•</span>
                                  <span className="staking-info-text">{info}</span>
                                </div>
                              ))}
                            </div>
                          )
                        }
                      } catch (e) {
                        // 번역이 없으면 무시
                      }
                      return null
                    })()}
                  </div>
                </>
              ) : selectedStaking.id === 'lockup' ? (
                <>
                  {/* 락업 VS 언락 스테이킹 비교 모달 */}
                  <div className="lockup-unlock-comparison-modal">
                    {/* 락업 스테이킹 섹션 */}
                    <div className="staking-comparison-section">
                      <div className="staking-comparison-header lockup-header">
                        <h3 className="staking-comparison-title">{t('staking.lockupType', language)}</h3>
                        <span className="staking-comparison-badge staking-comparison-badge-high-yield">{t('staking.highYield', language)}</span>
                      </div>

                      {/* 1. 상단 히어로 문구 */}
                      <div className="staking-hero-section">
                        <h4 className="staking-hero-title">{t('staking.lockupHeroTitle', language)}</h4>
                        <p className="staking-hero-description">{t('staking.lockupHeroDescription', language)}</p>
                      </div>

                      {/* 2. 상품 핵심 요약 카드 */}
                      <div className="staking-summary-card">
                        <h4 className="staking-summary-title">{t('staking.lockupSummaryTitle', language)}</h4>
                        <p className="staking-summary-content">{t('staking.lockupSummaryContent', language)}</p>
                      </div>

                      {/* 3. 핵심 정보 영역 */}
                      <div className="staking-key-info">
                        <div className="staking-key-info-item">
                          <span className="staking-key-info-label">{t('staking.apy', language)}</span>
                          <span className="staking-key-info-value">{t('staking.lockupApyValue', language)}</span>
                        </div>
                        <div className="staking-key-info-item">
                          <span className="staking-key-info-label">{t('staking.lockupPeriod', language)}</span>
                          <span className="staking-key-info-value">{t('staking.lockupPeriodValue', language)}</span>
                        </div>
                        <div className="staking-key-info-item">
                          <span className="staking-key-info-label">{t('staking.earlyWithdrawal', language)}</span>
                          <span className="staking-key-info-value staking-key-info-value-no">{t('staking.notAvailable', language)}</span>
                        </div>
                        <div className="staking-key-info-item">
                          <span className="staking-key-info-label">{t('staking.rewardPayment', language)}</span>
                          <span className="staking-key-info-value">{t('staking.lockupRewardPayment', language)}</span>
                        </div>
                        <div className="staking-key-info-item">
                          <span className="staking-key-info-label">{t('staking.minStakingAmount', language)}</span>
                          <span className="staking-key-info-value">{t('staking.lockupMinAmount', language)}</span>
                        </div>
                      </div>

                      {/* 4. 중요 안내 박스 */}
                      <div className="staking-warning-box">
                        <div className="staking-warning-header">
                          <span className="staking-warning-title">{t('staking.importantNotice', language)}</span>
                        </div>
                        <p className="staking-warning-content">{t('staking.lockupWarningContent', language)}</p>
                      </div>

                      {/* 5. 추천 대상 */}
                      <div className="staking-recommendation-section">
                        <h4 className="staking-recommendation-title">{t('staking.recommendedFor', language)}</h4>
                        <div className="staking-recommendation-list">
                          <div className="staking-recommendation-item">
                            <span className="staking-recommendation-icon">✔</span>
                            <span className="staking-recommendation-text">{t('staking.lockupRecommend1', language)}</span>
                          </div>
                          <div className="staking-recommendation-item">
                            <span className="staking-recommendation-icon">✔</span>
                            <span className="staking-recommendation-text">{t('staking.lockupRecommend2', language)}</span>
                          </div>
                          <div className="staking-recommendation-item">
                            <span className="staking-recommendation-icon">✔</span>
                            <span className="staking-recommendation-text">{t('staking.lockupRecommend3', language)}</span>
                          </div>
                        </div>
                      </div>

                      {/* 6. 보상 관련 안내 */}
                      <div className="staking-reward-notice">
                        <p className="staking-reward-notice-text">{t('staking.lockupRewardNotice', language)}</p>
                      </div>
                    </div>

                    {/* 언락 스테이킹 섹션 */}
                    <div className="staking-comparison-section">
                      <div className="staking-comparison-header unlock-header">
                        <h3 className="staking-comparison-title">{t('staking.unlockType', language)}</h3>
                        <span className="staking-comparison-badge staking-comparison-badge-liquidity">{t('staking.liquidity', language)}</span>
                      </div>

                      {/* 1. 상단 히어로 문구 */}
                      <div className="staking-hero-section">
                        <h4 className="staking-hero-title">{t('staking.unlockHeroTitle', language)}</h4>
                        <p className="staking-hero-description">{t('staking.unlockHeroDescription', language)}</p>
                      </div>

                      {/* 2. 상품 핵심 요약 카드 */}
                      <div className="staking-summary-card">
                        <h4 className="staking-summary-title">{t('staking.unlockSummaryTitle', language)}</h4>
                        <p className="staking-summary-content">{t('staking.unlockSummaryContent', language)}</p>
                      </div>

                      {/* 3. 핵심 정보 영역 */}
                      <div className="staking-key-info">
                        <div className="staking-key-info-item">
                          <span className="staking-key-info-label">{t('staking.apy', language)}</span>
                          <span className="staking-key-info-value">{t('staking.unlockApyValue', language)}</span>
                        </div>
                        <div className="staking-key-info-item">
                          <span className="staking-key-info-label">{t('staking.withdrawalCondition', language)}</span>
                          <span className="staking-key-info-value">{t('staking.unlockWithdrawalCondition', language)}</span>
                        </div>
                        <div className="staking-key-info-item">
                          <span className="staking-key-info-label">{t('staking.rewardPayment', language)}</span>
                          <span className="staking-key-info-value">{t('staking.unlockRewardPayment', language)}</span>
                        </div>
                        <div className="staking-key-info-item">
                          <span className="staking-key-info-label">{t('staking.minStakingAmount', language)}</span>
                          <span className="staking-key-info-value">{t('staking.unlockMinAmount', language)}</span>
                        </div>
                      </div>

                      {/* 4. 유동성 안내 박스 */}
                      <div className="staking-warning-box staking-liquidity-box">
                        <div className="staking-warning-header">
                          <span className="staking-warning-title">{t('staking.liquidityNotice', language)}</span>
                        </div>
                        <p className="staking-warning-content">{t('staking.liquidityRiskNotice', language)}</p>
                      </div>

                      {/* 5. 추천 대상 */}
                      <div className="staking-recommendation-section">
                        <h4 className="staking-recommendation-title">{t('staking.recommendedFor', language)}</h4>
                        <div className="staking-recommendation-list">
                          <div className="staking-recommendation-item">
                            <span className="staking-recommendation-icon">✔</span>
                            <span className="staking-recommendation-text">{t('staking.unlockRecommend1', language)}</span>
                          </div>
                          <div className="staking-recommendation-item">
                            <span className="staking-recommendation-icon">✔</span>
                            <span className="staking-recommendation-text">{t('staking.unlockRecommend2', language)}</span>
                          </div>
                          <div className="staking-recommendation-item">
                            <span className="staking-recommendation-icon">✔</span>
                            <span className="staking-recommendation-text">{t('staking.unlockRecommend3', language)}</span>
                          </div>
                        </div>
                      </div>

                      {/* 6. 보상 관련 안내 */}
                      <div className="staking-reward-notice">
                        <p className="staking-reward-notice-text">{t('staking.unlockRewardNotice', language)}</p>
                      </div>
                    </div>

                    {/* 7. 공통 하단 고지 */}
                    <div className="staking-common-notice">
                      <p className="staking-common-notice-text">{t('staking.commonNotice', language)}</p>
                    </div>
                  </div>
                </>
              ) : selectedStaking.id === 'liquid' ? (
                <>
                  {/* 1. 상단 히어로 문구 */}
                  <div className="staking-hero-section">
                    <h4 className="staking-hero-title">{t('staking.liquidStaking', language)}</h4>
                    <p className="staking-hero-description">{t('staking.liquidStakingSubtitle', language)}</p>
                    <div className="liquid-staking-warning-badge">
                      <span className="warning-icon">⚠️</span>
                      <span>{t('staking.liquidStakingWarning', language)}</span>
                    </div>
                  </div>

                  {/* 2. 상품 핵심 요약 카드 */}
                  <div className="staking-summary-card">
                    <h4 className="staking-summary-title">{t('staking.liquidStaking', language)}</h4>
                    <p className="staking-summary-content">{getStakingDetail(selectedStaking.id).content}</p>
                  </div>

                  {/* 3. 핵심 구조 설명 */}
                  <div className="liquid-staking-structure">
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">🔒</div>
                      <div className="structure-arrow">↓</div>
                      <h5 className="structure-title">{t('staking.stakingLabel', language)}</h5>
                      <p className="structure-description">{t('staking.stakingDescription', language)}</p>
                    </div>
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">🪙</div>
                      <div className="structure-arrow">↓</div>
                      <h5 className="structure-title">{t('staking.lstReceive', language)}</h5>
                      <p className="structure-description">{t('staking.lstReceiveDescription', language)}</p>
                    </div>
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">💼</div>
                      <h5 className="structure-title">{t('staking.utilization', language)}</h5>
                      <p className="structure-description">{t('staking.utilizationDescription', language)}</p>
                    </div>
                  </div>

                  {/* 4. 핵심 정보 영역 */}
                  <div className="staking-key-info">
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.apy', language)}</span>
                      <span className="staking-key-info-value">{t('staking.liquidStakingApy', language)}</span>
                    </div>
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.lstToken', language)}</span>
                      <span className="staking-key-info-value">{t('staking.liquidStakingLstTokens', language)}</span>
                    </div>
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.utilization', language)}</span>
                      <span className="staking-key-info-value">{t('staking.possible', language)}</span>
                    </div>
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.minStakingAmount', language)}</span>
                      <span className="staking-key-info-value">{t('staking.liquidStakingMinAmount', language)}</span>
                    </div>
                  </div>

                  {/* 5. 리스크 안내 박스 */}
                  <div className="staking-warning-box staking-risk-box">
                    <div className="staking-warning-header">
                      <span className="staking-warning-title">{t('staking.liquidStakingRisk', language)}</span>
                    </div>
                    <ul className="staking-risk-list">
                      <li>{t('staking.risk1', language)}</li>
                      <li>{t('staking.risk2', language)}</li>
                      <li>{t('staking.risk3', language)}</li>
                    </ul>
                  </div>

                  {/* 6. LST 활용 안내 */}
                  <div className="staking-recommendation-section">
                    <h4 className="staking-recommendation-title">{t('staking.lstUtilizationGuide', language)}</h4>
                    <div className="staking-recommendation-list">
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">🔁</span>
                        <span className="staking-recommendation-text">{t('staking.trading', language)} (DEX)</span>
                      </div>
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">🏦</span>
                        <span className="staking-recommendation-text">{t('staking.additionalDeposit', language)} (DeFi)</span>
                      </div>
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">🧱</span>
                        <span className="staking-recommendation-text">{t('staking.collateral', language)}</span>
                      </div>
                    </div>
                    <p className="staking-reward-notice-text">
                      {t('staking.lstUtilizationNotice', language)}
                    </p>
                  </div>

                  {/* 동의 섹션 */}
                  <div className="staking-agreement-box">
                    <h4 className="staking-agreement-title">{t('staking.agreementTitle', language)}</h4>
                    <div className="staking-agreement-list">
                      <label className="staking-agreement-item">
                        <input
                          type="checkbox"
                          checked={liquidAgreements.understandLST}
                          onChange={() => setLiquidAgreements(prev => ({
                            ...prev,
                            understandLST: !prev.understandLST
                          }))}
                        />
                        <span>{t('staking.agreement1', language)}</span>
                      </label>
                      <label className="staking-agreement-item">
                        <input
                          type="checkbox"
                          checked={liquidAgreements.understandRisk}
                          onChange={() => setLiquidAgreements(prev => ({
                            ...prev,
                            understandRisk: !prev.understandRisk
                          }))}
                        />
                        <span>{t('staking.agreement2', language)}</span>
                      </label>
                      <label className="staking-agreement-item">
                        <input
                          type="checkbox"
                          checked={liquidAgreements.understandDifference}
                          onChange={() => setLiquidAgreements(prev => ({
                            ...prev,
                            understandDifference: !prev.understandDifference
                          }))}
                        />
                        <span>{t('staking.agreement3', language)}</span>
                      </label>
                    </div>
                  </div>
                </>
              ) : selectedStaking.id === 'restaking' ? (
                <>
                  {/* 1. 상단 히어로 문구 */}
                  <div className="staking-hero-section">
                    <h4 className="staking-hero-title">{t('staking.restaking', language)}</h4>
                    <p className="staking-hero-description">{t('staking.restakingSubtitle', language)}</p>
                    <div className="liquid-staking-warning-badge" style={{ background: 'rgba(255, 87, 34, 0.2)', border: '1px solid rgba(255, 87, 34, 0.4)' }}>
                      <span className="warning-icon">⚠️</span>
                      <span>{t('staking.restakingWarning', language)}</span>
                    </div>
                  </div>

                  {/* 2. 상품 핵심 요약 카드 */}
                  <div className="staking-summary-card">
                    <h4 className="staking-summary-title">{t('staking.restaking', language)}</h4>
                    <p className="staking-summary-content">{t('staking.restakingSummary', language)}</p>
                  </div>

                  {/* 3. 핵심 구조 설명 */}
                  <div className="liquid-staking-structure">
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">🔒</div>
                      <div className="structure-arrow">↓</div>
                      <h5 className="structure-title">{t('staking.existingStaking', language)}</h5>
                      <p className="structure-description">{t('staking.existingStakingDescription', language)}</p>
                    </div>
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">🔗</div>
                      <div className="structure-arrow">↓</div>
                      <h5 className="structure-title">{t('staking.restakingConnection', language)}</h5>
                      <p className="structure-description">{t('staking.restakingConnectionDescription', language)}</p>
                    </div>
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">💰</div>
                      <h5 className="structure-title">{t('staking.additionalReward', language)}</h5>
                      <p className="structure-description">{t('staking.additionalRewardDescription', language)}</p>
                    </div>
                  </div>

                  {/* 4. 핵심 정보 영역 */}
                  <div className="staking-key-info">
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.basicStaking', language)}</span>
                      <span className="staking-key-info-value">{t('staking.inProgress', language)}</span>
                    </div>
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.additionalReward', language)}</span>
                      <span className="staking-key-info-value">{t('staking.variable', language)}</span>
                    </div>
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.participatingService', language)}</span>
                      <span className="staking-key-info-value">{t('staking.avs', language)}</span>
                    </div>
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.riskLevel', language)}</span>
                      <span className="staking-key-info-value" style={{ color: '#ff5722' }}>{t('staking.high', language)}</span>
                    </div>
                  </div>

                  {/* 5. 리스크 안내 박스 */}
                  <div className="staking-warning-box staking-risk-box">
                    <div className="staking-warning-header">
                      <span className="staking-warning-title">{t('staking.restakingRisk', language)}</span>
                    </div>
                    <ul className="staking-risk-list">
                      <li>{t('staking.restakingRisk1', language)}</li>
                      <li>{t('staking.restakingRisk2', language)}</li>
                      <li>{t('staking.restakingRisk3', language)}</li>
                      <li>{t('staking.restakingRisk4', language)}</li>
                    </ul>
                    <div className="staking-risk-notice">
                      <p className="staking-risk-notice-text">{t('staking.restakingRiskNotice', language)}</p>
                    </div>
                  </div>

                  {/* 6. 보상 관련 안내 */}
                  <div className="staking-reward-notice">
                    <p className="staking-reward-notice-text">{t('staking.restakingRewardNotice', language)}</p>
                  </div>

                  {/* 동의 섹션 */}
                  <div className="staking-agreement-box">
                    <h4 className="staking-agreement-title">{t('staking.agreementTitle', language)}</h4>
                    <div className="staking-agreement-list">
                      <label className="staking-agreement-item">
                        <input
                          type="checkbox"
                          checked={restakingAgreements.understandDifference}
                          onChange={() => setRestakingAgreements(prev => ({
                            ...prev,
                            understandDifference: !prev.understandDifference
                          }))}
                        />
                        <span>{t('staking.restakingAgreement1', language)}</span>
                      </label>
                      <label className="staking-agreement-item">
                        <input
                          type="checkbox"
                          checked={restakingAgreements.understandSlashing}
                          onChange={() => setRestakingAgreements(prev => ({
                            ...prev,
                            understandSlashing: !prev.understandSlashing
                          }))}
                        />
                        <span>{t('staking.restakingAgreement2', language)}</span>
                      </label>
                      <label className="staking-agreement-item">
                        <input
                          type="checkbox"
                          checked={restakingAgreements.understandVariable}
                          onChange={() => setRestakingAgreements(prev => ({
                            ...prev,
                            understandVariable: !prev.understandVariable
                          }))}
                        />
                        <span>{t('staking.restakingAgreement3', language)}</span>
                      </label>
                      <label className="staking-agreement-item">
                        <input
                          type="checkbox"
                          checked={restakingAgreements.understandHighRisk}
                          onChange={() => setRestakingAgreements(prev => ({
                            ...prev,
                            understandHighRisk: !prev.understandHighRisk
                          }))}
                        />
                        <span>{t('staking.restakingAgreement4', language)}</span>
                      </label>
                    </div>
                  </div>
                </>
              ) : selectedStaking.id === 'cefi' ? (
                <>
                  {/* 1. 상단 히어로 문구 */}
                  <div className="staking-hero-section">
                    <h4 className="staking-hero-title">{t('staking.cefiStaking', language)}</h4>
                    <p className="staking-hero-description">{t('staking.cefiStakingSubtitle', language)}</p>
                    <div className="liquid-staking-warning-badge" style={{ background: 'rgba(79, 172, 254, 0.2)', border: '1px solid rgba(79, 172, 254, 0.4)' }}>
                      <span className="warning-icon">ℹ️</span>
                      <span>{t('staking.cefiStakingWarning', language)}</span>
                    </div>
                  </div>

                  {/* 2. 상품 핵심 요약 카드 */}
                  <div className="staking-summary-card">
                    <h4 className="staking-summary-title">{t('staking.cefiStakingWhatIs', language)}</h4>
                    <p className="staking-summary-content">{t('staking.cefiStakingSummary', language)}</p>
                  </div>

                  {/* 3. CeFi vs 네이티브 스테이킹 차이점 */}
                  <div className="staking-key-info">
                    <h4 className="staking-key-info-title">{t('staking.cefiVsNative', language)}</h4>
                    <p className="staking-key-info-description" style={{ marginBottom: '20px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      중앙화 플랫폼(CeFi)과 네이티브 스테이킹의 차이를 비교합니다.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* 플랫폼 타입 */}
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '12px', 
                        padding: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          marginBottom: '12px',
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}>
                          {t('staking.platformType', language)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(79, 172, 254, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(79, 172, 254, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#4facfe',
                              minWidth: '50px'
                            }}>CeFi</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.cefiPlatformType', language)}
                            </span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(0, 242, 254, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(0, 242, 254, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#00f2fe',
                              minWidth: '50px'
                            }}>Native</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.nativePlatformType', language)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 자산 관리 */}
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '12px', 
                        padding: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          marginBottom: '12px',
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}>
                          {t('staking.management', language)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(79, 172, 254, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(79, 172, 254, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#4facfe',
                              minWidth: '50px'
                            }}>CeFi</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.cefiManagement', language)}
                            </span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(0, 242, 254, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(0, 242, 254, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#00f2fe',
                              minWidth: '50px'
                            }}>Native</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.nativeManagement', language)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 출금 속도 */}
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '12px', 
                        padding: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          marginBottom: '12px',
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}>
                          {t('staking.withdrawalSpeed', language)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(79, 172, 254, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(79, 172, 254, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#4facfe',
                              minWidth: '50px'
                            }}>CeFi</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.cefiWithdrawalSpeed', language)}
                            </span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(0, 242, 254, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(0, 242, 254, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#00f2fe',
                              minWidth: '50px'
                            }}>Native</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.nativeWithdrawalSpeed', language)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 기술 지식 필요 */}
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '12px', 
                        padding: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          marginBottom: '12px',
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}>
                          {t('staking.technicalKnowledge', language)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(79, 172, 254, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(79, 172, 254, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#4facfe',
                              minWidth: '50px'
                            }}>CeFi</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.cefiTechnicalKnowledge', language)}
                            </span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(0, 242, 254, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(0, 242, 254, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#00f2fe',
                              minWidth: '50px'
                            }}>Native</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.nativeTechnicalKnowledge', language)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. 핵심 구조 설명 */}
                  <div className="liquid-staking-structure">
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">🏦</div>
                      <div className="structure-arrow">↓</div>
                      <h5 className="structure-title">{t('staking.centralizedPlatform', language)}</h5>
                      <p className="structure-description">{t('staking.centralizedPlatformDescription', language)}</p>
                    </div>
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">💰</div>
                      <div className="structure-arrow">↓</div>
                      <h5 className="structure-title">{t('staking.stableRewards', language)}</h5>
                      <p className="structure-description">{t('staking.stableRewardsDescription', language)}</p>
                    </div>
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">⚡</div>
                      <h5 className="structure-title">{t('staking.easyAccess', language)}</h5>
                      <p className="structure-description">{t('staking.easyAccessDescription', language)}</p>
                    </div>
                  </div>

                  {/* 5. 핵심 정보 영역 */}
                  <div className="staking-key-info">
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.apy', language)}</span>
                      <span className="staking-key-info-value">{t('staking.cefiApyValue', language)}</span>
                    </div>
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.withdrawalCondition', language)}</span>
                      <span className="staking-key-info-value">{t('staking.cefiWithdrawalCondition', language)}</span>
                    </div>
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.rewardPayment', language)}</span>
                      <span className="staking-key-info-value">{t('staking.cefiRewardPayment', language)}</span>
                    </div>
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.minStakingAmount', language)}</span>
                      <span className="staking-key-info-value">{t('staking.cefiMinAmount', language)}</span>
                    </div>
                  </div>

                  {/* 6. CeFi 스테이킹의 장점 */}
                  <div className="staking-recommendation-section">
                    <h4 className="staking-recommendation-title">{t('staking.cefiAdvantages', language)}</h4>
                    <div className="staking-recommendation-list">
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">✓</span>
                        <span className="staking-recommendation-text">{t('staking.cefiAdvantage1', language)}</span>
                      </div>
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">✓</span>
                        <span className="staking-recommendation-text">{t('staking.cefiAdvantage2', language)}</span>
                      </div>
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">✓</span>
                        <span className="staking-recommendation-text">{t('staking.cefiAdvantage3', language)}</span>
                      </div>
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">✓</span>
                        <span className="staking-recommendation-text">{t('staking.cefiAdvantage4', language)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 7. 리스크 안내 박스 */}
                  <div className="staking-warning-box staking-risk-box">
                    <div className="staking-warning-header">
                      <span className="staking-warning-title">{t('staking.cefiStakingRisk', language)}</span>
                    </div>
                    <ul className="staking-risk-list">
                      <li>{t('staking.cefiRisk1', language)}</li>
                      <li>{t('staking.cefiRisk2', language)}</li>
                      <li>{t('staking.cefiRisk3', language)}</li>
                      <li>{t('staking.cefiRisk4', language)}</li>
                      <li>{t('staking.cefiRisk5', language)}</li>
                    </ul>
                    <div className="staking-risk-notice">
                      <p className="staking-risk-notice-text">{t('staking.cefiStakingRiskNotice', language)}</p>
                    </div>
                  </div>

                  {/* 8. 추천 대상 */}
                  <div className="staking-recommendation-section">
                    <h4 className="staking-recommendation-title">{t('staking.recommendedFor', language)}</h4>
                    <div className="staking-recommendation-list">
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">✔</span>
                        <span className="staking-recommendation-text">{t('staking.cefiRecommend1', language)}</span>
                      </div>
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">✔</span>
                        <span className="staking-recommendation-text">{t('staking.cefiRecommend2', language)}</span>
                      </div>
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">✔</span>
                        <span className="staking-recommendation-text">{t('staking.cefiRecommend3', language)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 9. 보상 관련 안내 */}
                  <div className="staking-reward-notice">
                    <p className="staking-reward-notice-text">{t('staking.cefiRewardNotice', language)}</p>
                  </div>

                  {/* 10. 공통 하단 고지 */}
                  <div className="staking-common-notice">
                    <p className="staking-common-notice-text">{t('staking.cefiCommonNotice', language)}</p>
                  </div>
                </>
              ) : selectedStaking.id === 'defi' ? (
                <>
                  {/* 1. 상단 히어로 문구 */}
                  <div className="staking-hero-section">
                    <h4 className="staking-hero-title">{t('staking.defiStaking', language)}</h4>
                    <p className="staking-hero-description">{t('staking.defiStakingSubtitle', language)}</p>
                    <div className="liquid-staking-warning-badge" style={{ background: 'rgba(255, 87, 34, 0.2)', border: '1px solid rgba(255, 87, 34, 0.4)' }}>
                      <span className="warning-icon">⚠️</span>
                      <span>{t('staking.defiStakingWarning', language)}</span>
                    </div>
                  </div>

                  {/* 2. 상품 핵심 요약 카드 */}
                  <div className="staking-summary-card">
                    <h4 className="staking-summary-title">{t('staking.defiStakingWhatIs', language)}</h4>
                    <p className="staking-summary-content">{t('staking.defiStakingSummary', language)}</p>
                  </div>

                  {/* 3. CeFi vs DeFi 비교 테이블 */}
                  <div className="staking-key-info">
                    <h4 className="staking-key-info-title">{t('staking.cefiVsDefi', language)}</h4>
                    <p className="staking-key-info-description" style={{ marginBottom: '20px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      중앙화 플랫폼(CeFi)과 탈중앙화 프로토콜(DeFi)의 차이를 비교합니다.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* 자산 보관 */}
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '12px', 
                        padding: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          marginBottom: '12px',
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}>
                          {t('staking.assetCustody', language)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(79, 172, 254, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(79, 172, 254, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#4facfe',
                              minWidth: '50px'
                            }}>CeFi</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.cefiAssetCustody', language)}
                            </span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(255, 87, 34, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 87, 34, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#ff5722',
                              minWidth: '50px'
                            }}>DeFi</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.defiAssetCustody', language)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 실행 주체 */}
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '12px', 
                        padding: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          marginBottom: '12px',
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}>
                          {t('staking.executionEntity', language)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(79, 172, 254, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(79, 172, 254, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#4facfe',
                              minWidth: '50px'
                            }}>CeFi</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.cefiExecutionEntity', language)}
                            </span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(255, 87, 34, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 87, 34, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#ff5722',
                              minWidth: '50px'
                            }}>DeFi</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.defiExecutionEntity', language)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 출금 */}
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '12px', 
                        padding: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          marginBottom: '12px',
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}>
                          {t('staking.withdrawal', language)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(79, 172, 254, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(79, 172, 254, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#4facfe',
                              minWidth: '50px'
                            }}>CeFi</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.cefiWithdrawal', language)}
                            </span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(255, 87, 34, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 87, 34, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#ff5722',
                              minWidth: '50px'
                            }}>DeFi</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.defiWithdrawal', language)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 실패 책임 */}
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '12px', 
                        padding: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          marginBottom: '12px',
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}>
                          {t('staking.failureResponsibility', language)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(79, 172, 254, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(79, 172, 254, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#4facfe',
                              minWidth: '50px'
                            }}>CeFi</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.cefiFailureResponsibility', language)}
                            </span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '10px',
                            background: 'rgba(255, 87, 34, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 87, 34, 0.3)'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              color: '#ff5722',
                              minWidth: '50px'
                            }}>DeFi</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                              {t('staking.defiFailureResponsibility', language)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. 작동 방식 설명 (시각적) */}
                  <div className="liquid-staking-structure">
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">🔗</div>
                      <div className="structure-arrow">↓</div>
                      <h5 className="structure-title">{t('staking.walletConnection', language)}</h5>
                      <p className="structure-description">{t('staking.walletConnectionDescription', language)}</p>
                    </div>
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">✅</div>
                      <div className="structure-arrow">↓</div>
                      <h5 className="structure-title">{t('staking.tokenApproval', language)}</h5>
                      <p className="structure-description">{t('staking.tokenApprovalDescription', language)}</p>
                    </div>
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">📝</div>
                      <div className="structure-arrow">↓</div>
                      <h5 className="structure-title">{t('staking.smartContractDeposit', language)}</h5>
                      <p className="structure-description">{t('staking.smartContractDepositDescription', language)}</p>
                    </div>
                    <div className="liquid-staking-structure-card">
                      <div className="structure-icon">💰</div>
                      <h5 className="structure-title">{t('staking.rewardGeneration', language)}</h5>
                      <p className="structure-description">{t('staking.rewardGenerationDescription', language)}</p>
                    </div>
                  </div>

                  {/* 5. 핵심 정보 영역 */}
                  <div className="staking-key-info">
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.protocol', language)}</span>
                      <span className="staking-key-info-value">{t('staking.defiProtocolValue', language)}</span>
                    </div>
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.network', language)}</span>
                      <span className="staking-key-info-value">{t('staking.defiNetworkValue', language)}</span>
                    </div>
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.rewardMethod', language)}</span>
                      <span className="staking-key-info-value">{t('staking.defiRewardMethod', language)}</span>
                    </div>
                    <div className="staking-key-info-item">
                      <span className="staking-key-info-label">{t('staking.riskLevel', language)}</span>
                      <span className="staking-key-info-value" style={{ color: '#ff5722' }}>{t('staking.defiRiskLevel', language)}</span>
                    </div>
                  </div>

                  {/* 6. 리스크 안내 박스 */}
                  <div className="staking-warning-box staking-risk-box">
                    <div className="staking-warning-header">
                      <span className="staking-warning-title">{t('staking.defiStakingRisk', language)}</span>
                    </div>
                    <ul className="staking-risk-list">
                      <li>{t('staking.defiRisk1', language)}</li>
                      <li>{t('staking.defiRisk2', language)}</li>
                      <li>{t('staking.defiRisk3', language)}</li>
                      <li>{t('staking.defiRisk4', language)}</li>
                      <li>{t('staking.defiRisk5', language)}</li>
                    </ul>
                    <div className="staking-risk-notice">
                      <p className="staking-risk-notice-text">{t('staking.defiStakingRiskNotice', language)}</p>
                    </div>
                  </div>

                  {/* 7. 추천 대상 */}
                  <div className="staking-recommendation-section">
                    <h4 className="staking-recommendation-title">{t('staking.recommendedFor', language)}</h4>
                    <div className="staking-recommendation-list">
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">✔</span>
                        <span className="staking-recommendation-text">{t('staking.defiRecommend1', language)}</span>
                      </div>
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">✔</span>
                        <span className="staking-recommendation-text">{t('staking.defiRecommend2', language)}</span>
                      </div>
                      <div className="staking-recommendation-item">
                        <span className="staking-recommendation-icon">✔</span>
                        <span className="staking-recommendation-text">{t('staking.defiRecommend3', language)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 8. 보상 관련 안내 */}
                  <div className="staking-reward-notice">
                    <p className="staking-reward-notice-text">{t('staking.defiRewardNotice', language)}</p>
                  </div>

                  {/* 9. 동의 섹션 */}
                  <div className="staking-agreement-box">
                    <h4 className="staking-agreement-title">{t('staking.agreementTitle', language)}</h4>
                    <div className="staking-agreement-list">
                      <label className="staking-agreement-item">
                        <input
                          type="checkbox"
                          checked={defiAgreements.understandDecentralized}
                          onChange={() => setDefiAgreements(prev => ({
                            ...prev,
                            understandDecentralized: !prev.understandDecentralized
                          }))}
                        />
                        <span>{t('staking.defiAgreement1', language)}</span>
                      </label>
                      <label className="staking-agreement-item">
                        <input
                          type="checkbox"
                          checked={defiAgreements.understandSmartContract}
                          onChange={() => setDefiAgreements(prev => ({
                            ...prev,
                            understandSmartContract: !prev.understandSmartContract
                          }))}
                        />
                        <span>{t('staking.defiAgreement2', language)}</span>
                      </label>
                      <label className="staking-agreement-item">
                        <input
                          type="checkbox"
                          checked={defiAgreements.understandNoGuarantee}
                          onChange={() => setDefiAgreements(prev => ({
                            ...prev,
                            understandNoGuarantee: !prev.understandNoGuarantee
                          }))}
                        />
                        <span>{t('staking.defiAgreement3', language)}</span>
                      </label>
                      <label className="staking-agreement-item">
                        <input
                          type="checkbox"
                          checked={defiAgreements.understandIrreversible}
                          onChange={() => setDefiAgreements(prev => ({
                            ...prev,
                            understandIrreversible: !prev.understandIrreversible
                          }))}
                        />
                        <span>{t('staking.defiAgreement4', language)}</span>
                      </label>
                    </div>
                  </div>

                  {/* 10. 공통 하단 고지 */}
                  <div className="staking-common-notice">
                    <p className="staking-common-notice-text">{t('staking.defiCommonNotice', language)}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="staking-status-message">
                    {t('staking.comingSoon', language)}
                  </div>
                  <p className="staking-detail-text">
                    {getStakingDetail(selectedStaking.id).content}
                  </p>
                </>
              )}
            </div>

            <div className="staking-detail-footer">
              <button 
                className="staking-back-button" 
                onClick={handleCloseDetail}
              >
                {t('staking.backToStaking', language)}
              </button>
              {selectedStaking.id === 'native' ? (
                <button 
                  className="staking-participate-button" 
                  onClick={() => {
                    // 인증 체크
                    const token = getToken()
                    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
                    
                    if (!token || !loggedIn) {
                      // 비로그인 상태면 로그인 페이지로 이동
                      handleCloseDetail()
                      if (onLoginRequired) {
                        onLoginRequired()
                      }
                    } else {
                      // 로그인 상태면 네이티브 스테이킹 페이지로 이동
                      if (onNativeStaking) {
                        onNativeStaking()
                      }
                      handleCloseDetail()
                    }
                  }}
                >
                  {t('staking.participateNativeStaking', language)}
                </button>
              ) : selectedStaking.id === 'lockup' ? (
                <div className="staking-comparison-buttons">
                  <div className="staking-button-wrapper">
                    <button 
                      className="staking-participate-button staking-lockup-button" 
                      onClick={() => {
                        // 인증 체크
                        const token = getToken()
                        const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
                        
                        if (!token || !loggedIn) {
                          // 비로그인 상태면 로그인 페이지로 이동
                          handleCloseDetail()
                          if (onLoginRequired) {
                            onLoginRequired()
                          }
                        } else {
                          // 로그인 상태면 락업 스테이킹 페이지로 이동
                          if (onLockupStaking) {
                            onLockupStaking()
                          }
                          handleCloseDetail()
                        }
                      }}
                    >
                      {t('staking.startLockupStaking', language)}
                    </button>
                    <p className="staking-button-hint">{t('staking.lockupButtonHint', language)}</p>
                  </div>
                  <div className="staking-button-wrapper">
                    <button 
                      className="staking-participate-button staking-unlock-button" 
                      onClick={() => {
                        // 인증 체크
                        const token = getToken()
                        const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
                        
                        if (!token || !loggedIn) {
                          // 비로그인 상태면 로그인 페이지로 이동
                          handleCloseDetail()
                          if (onLoginRequired) {
                            onLoginRequired()
                          }
                        } else {
                          // 로그인 상태면 락업 스테이킹 페이지로 이동 (언락 타입 선택)
                          if (onLockupStaking) {
                            // 언락 타입으로 이동하도록 prop 전달
                            onLockupStaking('unlock')
                          }
                          handleCloseDetail()
                        }
                      }}
                    >
                      {t('staking.startUnlockStaking', language)}
                    </button>
                    <p className="staking-button-hint">{t('staking.unlockButtonHint', language)}</p>
                  </div>
                </div>
              ) : selectedStaking.id === 'liquid' ? (
                <button 
                  className={`staking-participate-button ${!(liquidAgreements.understandLST && liquidAgreements.understandRisk && liquidAgreements.understandDifference) ? 'disabled' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    console.log('리퀴드 스테이킹 시작하기 버튼 클릭됨')
                    console.log('동의 상태:', liquidAgreements)
                    console.log('onLiquidStakingDetail prop:', onLiquidStakingDetail)
                    
                    // 동의 체크
                    const allAgreed = liquidAgreements.understandLST && liquidAgreements.understandRisk && liquidAgreements.understandDifference
                    if (!allAgreed) {
                      console.log('동의 체크 실패 - 모든 체크박스를 선택해주세요')
                      alert(t('staking.pleaseAgreeAll', language) || '모든 동의 사항을 체크해주세요')
                      return
                    }
                    
                    // 인증 체크
                    const token = getToken()
                    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
                    
                    console.log('인증 상태:', { token: !!token, loggedIn })
                    
                    if (!token || !loggedIn) {
                      // 비로그인 상태면 로그인 페이지로 이동
                      console.log('비로그인 상태 - 로그인 페이지로 이동')
                      handleCloseDetail()
                      if (onLoginRequired) {
                        onLoginRequired()
                      }
                    } else {
                      // 로그인 상태면 리퀴드 스테이킹 상세 페이지로 이동
                      console.log('로그인 상태 - 리퀴드 스테이킹 상세 페이지로 이동')
                      // 기본 상품으로 ETH 선택
                      if (onLiquidStakingDetail) {
                        const product = { id: 'eth', name: 'ETH', apy: 3.5, lstToken: 'stETH', risk: 'medium' }
                        console.log('상품 정보:', product)
                        onLiquidStakingDetail(product)
                        // 동의 상태 초기화
                        setLiquidAgreements({
                          understandLST: false,
                          understandRisk: false,
                          understandDifference: false
                        })
                        // 모달 닫기
                        handleCloseDetail()
                      } else {
                        console.error('onLiquidStakingDetail prop이 전달되지 않았습니다!')
                        alert(t('staking.pageNavigationFailed', language) || '페이지 이동에 실패했습니다. 다시 시도해주세요.')
                      }
                    }
                  }}
                >
                  {t('staking.startLiquidStaking', language)}
                </button>
              ) : selectedStaking.id === 'restaking' ? (
                <button 
                  className={`staking-participate-button ${!(restakingAgreements.understandDifference && restakingAgreements.understandSlashing && restakingAgreements.understandVariable && restakingAgreements.understandHighRisk) ? 'disabled' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    // 동의 체크
                    const allAgreed = restakingAgreements.understandDifference && 
                                     restakingAgreements.understandSlashing && 
                                     restakingAgreements.understandVariable && 
                                     restakingAgreements.understandHighRisk
                    if (!allAgreed) {
                      alert(t('staking.pleaseAgreeAll', language) || '모든 동의 사항을 체크해주세요')
                      return
                    }
                    
                    // 인증 체크
                    const token = getToken()
                    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
                    
                    if (!token || !loggedIn) {
                      handleCloseDetail()
                      if (onLoginRequired) {
                        onLoginRequired()
                      }
                    } else {
                      if (onRestakingDetail) {
                        const product = { id: 'eth', name: 'ETH', apy: 3.5 }
                        onRestakingDetail(product)
                        setRestakingAgreements({
                          understandDifference: false,
                          understandSlashing: false,
                          understandVariable: false,
                          understandHighRisk: false
                        })
                        handleCloseDetail()
                      }
                    }
                  }}
                >
                  {t('staking.startRestaking', language)}
                </button>
              ) : selectedStaking.id === 'cefi' ? (
                <button 
                  className="staking-participate-button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    // 인증 체크
                    const token = getToken()
                    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
                    
                    if (!token || !loggedIn) {
                      handleCloseDetail()
                      if (onLoginRequired) {
                        onLoginRequired()
                      }
                    } else {
                      if (onCefiStakingDetail) {
                        const product = { id: 'cefi', name: 'SET', apy: 6.0 }
                        onCefiStakingDetail(product)
                        handleCloseDetail()
                      }
                    }
                  }}
                >
                  {t('staking.startCefiStaking', language)}
                </button>
              ) : selectedStaking.id === 'defi' ? (
                <button 
                  className={`staking-participate-button ${!(defiAgreements.understandDecentralized && defiAgreements.understandSmartContract && defiAgreements.understandNoGuarantee && defiAgreements.understandIrreversible) ? 'disabled' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    // 동의 체크
                    const allAgreed = defiAgreements.understandDecentralized && 
                                     defiAgreements.understandSmartContract && 
                                     defiAgreements.understandNoGuarantee && 
                                     defiAgreements.understandIrreversible
                    if (!allAgreed) {
                      alert(t('staking.pleaseAgreeAll', language) || '모든 동의 사항을 체크해주세요')
                      return
                    }
                    
                    // 인증 체크
                    const token = getToken()
                    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
                    
                    if (!token || !loggedIn) {
                      handleCloseDetail()
                      if (onLoginRequired) {
                        onLoginRequired()
                      }
                    } else {
                      if (onDefiStakingDetail) {
                        const product = { id: 'defi', name: 'ETH', protocol: 'Lido', network: 'Ethereum', risk: 'medium' }
                        onDefiStakingDetail(product)
                        setDefiAgreements({
                          understandDecentralized: false,
                          understandSmartContract: false,
                          understandNoGuarantee: false,
                          understandIrreversible: false
                        })
                        handleCloseDetail()
                      }
                    }
                  }}
                >
                  {t('staking.startDefiStaking', language)}
                </button>
              ) : (
                <button className="staking-back-button" onClick={handleCloseDetail}>
                  {t('staking.backToStaking', language)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

export default StakingPage
