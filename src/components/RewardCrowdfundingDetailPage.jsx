import React, { useState, useEffect, useRef } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import { getToken, fetchWithAuth } from '../utils/auth'
import { getApiUrl } from '../config/api'
import './CrowdfundingPage.css'

const RewardCrowdfundingDetailPage = ({ onBack, language: propLanguage, project, onLoginRequired }) => {
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animationFrameRef = useRef(null)
  
  // 크라우드펀딩 상태
  const [balance, setBalance] = useState(0)
  const [fundingAmount, setFundingAmount] = useState('')
  const [isFunding, setIsFunding] = useState(false)
  const [fundingStatus, setFundingStatus] = useState(null)
  const [currentFunding, setCurrentFunding] = useState(0)
  const [totalRaised, setTotalRaised] = useState(0)
  const [targetAmount, setTargetAmount] = useState(100000)
  const [fundingProgress, setFundingProgress] = useState(0)
  const [backersCount, setBackersCount] = useState(0)
  const [daysLeft, setDaysLeft] = useState(30)
  const [isLoadingFundingData, setIsLoadingFundingData] = useState(false)
  const [selectedReward, setSelectedReward] = useState(null)
  const [fundingHistory, setFundingHistory] = useState([])
  const [completedFundings, setCompletedFundings] = useState([]) // 완료된 펀딩 내역

  // 프로젝트 정보 (기본값)
  const projectInfo = project || {
    id: 'reward-1',
    name: t('crowdfunding.sampleProject', language),
    description: t('crowdfunding.sampleProjectDescription', language),
    creator: t('crowdfunding.projectCreator', language),
    category: t('crowdfunding.product', language),
    rewards: [
      { id: 1, amount: 10000, title: t('crowdfunding.earlyBird', language), description: t('crowdfunding.reward1Description', language), quantity: 100, remaining: 50 },
      { id: 2, amount: 50000, title: t('crowdfunding.premiumPackage', language), description: t('crowdfunding.reward2Description', language), quantity: 50, remaining: 20 },
      { id: 3, amount: 100000, title: t('crowdfunding.vipPackage', language), description: t('crowdfunding.reward3Description', language), quantity: 20, remaining: 5 }
    ]
  }

  // 펀딩 진행률 계산
  useEffect(() => {
    const progress = targetAmount > 0 ? ((totalRaised / targetAmount) * 100).toFixed(1) : 0
    setFundingProgress(Math.min(100, parseFloat(progress)))
  }, [totalRaised, targetAmount])

  // 펀딩 내역에서 현재 펀딩 금액 자동 계산
  useEffect(() => {
    const totalFromHistory = fundingHistory.reduce((sum, record) => sum + record.amount, 0)
    setCurrentFunding(totalFromHistory)
  }, [fundingHistory])

  // 남은 기간 자동 감소 시뮬레이션
  useEffect(() => {
    const dayInterval = setInterval(() => {
      setDaysLeft(prev => {
        if (prev > 0) {
          return prev - 1
        }
        return 0
      })
    }, 86400000) // 1일마다 업데이트 (실제로는 하루에 한 번)

    return () => clearInterval(dayInterval)
  }, [])

  // 인증 상태 체크 및 펀딩 데이터 로드
  useEffect(() => {
    const token = getToken()
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(!!(token && loggedIn))
    
    if (token && loggedIn) {
      loadFundingData()
    }
  }, [])

  // prop language가 변경되면 업데이트
  useEffect(() => {
    if (propLanguage && propLanguage !== language) {
      setLanguage(propLanguage)
    }
  }, [propLanguage, language])

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

  // 펀딩 데이터 로드
  const loadFundingData = async () => {
    setIsLoadingFundingData(true)
    try {
      // TODO: 실제 API 엔드포인트로 변경
      setTimeout(() => {
        const initialHistory = [
          { id: 1, date: new Date('2025-01-15'), amount: 10000, reward: t('crowdfunding.earlyBird', language), status: 'completed', projectStatus: 'completed', rewardStatus: 'delivered' },
          { id: 2, date: new Date('2025-01-20'), amount: 50000, reward: t('crowdfunding.premiumPackage', language), status: 'completed', projectStatus: 'completed', rewardStatus: 'shipping' }
        ]
        // 펀딩 내역의 총합 계산
        const totalFromHistory = initialHistory.reduce((sum, record) => sum + record.amount, 0)
        
        // 완료된 펀딩만 필터링
        const completed = initialHistory.filter(record => record.projectStatus === 'completed')
        setCompletedFundings(completed)
        
        // 초기 잔액 설정 (펀딩 내역을 고려)
        const initialBalance = 50000
        setBalance(initialBalance)
        // currentFunding은 내역에서 자동 계산되므로 설정하지 않음
        setTotalRaised(75000)
        setTargetAmount(100000)
        setBackersCount(45)
        setDaysLeft(25)
        setFundingHistory(initialHistory)
        setIsLoadingFundingData(false)
      }, 500)
    } catch (error) {
      // console.error('Failed to load funding data:', error)
      setIsLoadingFundingData(false)
    }
  }

  // 금액 입력 핸들러
  const handleAmountChange = (e) => {
    const value = e.target.value
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFundingAmount(value)
    }
  }

  // MAX 버튼 클릭
  const handleMaxClick = () => {
    setFundingAmount(balance.toString())
  }

  // 리워드 선택
  const handleSelectReward = (reward) => {
    setSelectedReward(reward)
    setFundingAmount(reward.amount.toString())
  }

  // 펀딩 실행
  const handleFundNow = async () => {
    if (!isLoggedIn) {
      if (onLoginRequired) {
        onLoginRequired()
      }
      return
    }

    if (!selectedReward) {
      alert(t('crowdfunding.selectRewardFirst', language))
      return
    }

    const amount = parseFloat(fundingAmount)
    if (isNaN(amount) || amount <= 0) {
      alert(t('crowdfunding.invalidAmount', language))
      return
    }

    if (amount < selectedReward.amount) {
      alert(t('crowdfunding.minAmountError', language, { min: selectedReward.amount }))
      return
    }

    if (amount > balance) {
      alert(t('crowdfunding.insufficientBalance', language))
      return
    }

    setIsFunding(true)
    setFundingStatus(null)

    try {
      // TODO: 실제 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 상태 업데이트 - 정확한 금액으로 업데이트
      const newBalance = balance - amount
      const newTotalRaised = totalRaised + amount
      const newBackersCount = backersCount + 1
      
      setBalance(newBalance)
      setTotalRaised(newTotalRaised)
      setBackersCount(newBackersCount)
      
      // 펀딩 내역에 추가 (currentFunding은 내역에서 자동 계산됨)
      const newFundingRecord = {
        id: Date.now(),
        date: new Date(),
        amount: amount,
        reward: selectedReward.title,
        status: 'completed',
        projectStatus: 'in_progress',
        rewardStatus: 'pending'
      }
      setFundingHistory(prev => [newFundingRecord, ...prev])
      
      // 완료된 펀딩 목록 업데이트
      setCompletedFundings(prev => prev.filter(record => record.projectStatus === 'completed'))
      
      setFundingAmount('')
      setSelectedReward(null)
      setFundingStatus('success')
      
      setTimeout(() => {
        setFundingStatus(null)
      }, 3000)
      
      // loadFundingData()는 초기값으로 리셋하므로 호출하지 않음
      // 실제 API 연동 시에는 API 응답으로 상태를 업데이트해야 함
    } catch (error) {
      // console.error('Funding failed:', error)
      setFundingStatus('failed')
      setTimeout(() => {
        setFundingStatus(null)
      }, 3000)
    } finally {
      setIsFunding(false)
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
          ← {t('crowdfunding.back', language)}
        </button>
        <h1 className="staking-title">
          {t('crowdfunding.details.reward.title', language)}
        </h1>
      </div>

      <div className="staking-content">
        <div className="native-staking-form">

          {/* 상단 요약 카드 */}
          <div className="staking-header-info">
            <div className="staking-header-balance">
              <span className="staking-header-label">{t('crowdfunding.targetAmount', language)}</span>
              <span className="staking-header-value">
                {targetAmount.toLocaleString()} {t('crowdfunding.currency', language)}
              </span>
            </div>
            <div className="staking-header-apy">
              <span className="staking-header-label">{t('crowdfunding.daysLeft', language)}</span>
              <span className="staking-header-value apy-highlight">{daysLeft}{t('crowdfunding.days', language)}</span>
            </div>
          </div>

          {/* 펀딩 진행률 */}
          <div className="staking-info-box" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                {t('crowdfunding.totalRaised', language)}
              </span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>
                {totalRaised.toLocaleString()} / {targetAmount.toLocaleString()} {t('crowdfunding.currency', language)}
              </span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '12px', 
              background: 'rgba(255, 255, 255, 0.1)', 
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${fundingProgress}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '12px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <span>{fundingProgress}% {t('crowdfunding.achieved', language)}</span>
              <span>{backersCount}{t('crowdfunding.people', language)} {t('crowdfunding.backers', language)}</span>
            </div>
          </div>

          {/* 프로젝트 정보 */}
          {isLoggedIn ? (
            <div className="staking-info-grid">
              <div className="staking-info-card">
                <span className="staking-info-label">{t('crowdfunding.availableBalance', language)}</span>
                <span className="staking-info-value">
                  {isLoadingFundingData ? '...' : `${balance.toLocaleString()} ${t('crowdfunding.currency', language)}`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('crowdfunding.myFunding', language)}</span>
                <span className="staking-info-value">
                  {isLoadingFundingData ? '...' : `${currentFunding.toLocaleString()} ${t('crowdfunding.currency', language)}`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('crowdfunding.totalRaised', language)}</span>
                <span className="staking-info-value rewards-value">
                  {isLoadingFundingData ? '...' : `${totalRaised.toLocaleString()} ${t('crowdfunding.currency', language)}`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('crowdfunding.backers', language)}</span>
                <span className="staking-info-value">
                  {isLoadingFundingData ? '...' : `${backersCount}${t('crowdfunding.people', language)}`}
                </span>
              </div>
            </div>
          ) : (
            <div className="staking-login-required-message">
              <p>{t('crowdfunding.loginRequired', language)}</p>
              <button 
                className="staking-login-button"
                onClick={() => onLoginRequired && onLoginRequired()}
              >
                {t('crowdfunding.goToLogin', language)}
              </button>
            </div>
          )}

          {/* 리워드 선택 */}
          <div className="staking-info-box" style={{ marginBottom: '24px' }}>
            <h3 className="staking-info-box-title">{t('crowdfunding.selectReward', language)}</h3>
            <div className="staking-info-box-content">
              {projectInfo.rewards.map((reward) => (
                <div 
                  key={reward.id}
                  onClick={() => handleSelectReward(reward)}
                  style={{
                    padding: '16px',
                    marginBottom: '12px',
                    background: selectedReward?.id === reward.id 
                      ? 'rgba(102, 126, 234, 0.2)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: selectedReward?.id === reward.id
                      ? '2px solid #667eea'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                        {reward.title}
                      </div>
                      <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {reward.description}
                      </div>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#667eea' }}>
                      {reward.amount.toLocaleString()} {t('crowdfunding.currency', language)}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '8px' }}>
                    {t('crowdfunding.remaining', language)}: {reward.remaining} / {reward.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 펀딩 입력 섹션 */}
          {isLoggedIn && selectedReward && (
            <div className="staking-action-section">
              <div className="staking-input-container">
                <div className="staking-input-header">
                  <label className="staking-input-label">
                    {t('crowdfunding.fundingAmount', language)}
                  </label>
                  <span className="staking-input-hint">
                    {t('crowdfunding.minAmount', language)}: {selectedReward.amount.toLocaleString()} {t('crowdfunding.currency', language)}
                  </span>
                </div>
                <div className="staking-input-wrapper">
                  <input
                    type="text"
                    className="staking-amount-input"
                    placeholder={t('crowdfunding.enterAmount', language)}
                    value={fundingAmount}
                    onChange={handleAmountChange}
                    disabled={isFunding}
                  />
                  <button
                    className="staking-max-button"
                    onClick={handleMaxClick}
                    disabled={isFunding || balance === 0}
                  >
                    {t('staking.max', language)}
                  </button>
                </div>
                {fundingAmount && parseFloat(fundingAmount) > 0 && (
                  <div className="staking-estimated-rewards">
                    <div className="staking-estimated-item">
                      <span className="staking-estimated-label">{t('crowdfunding.selectedReward', language)}</span>
                      <span className="staking-estimated-value">
                        {selectedReward.title} ({selectedReward.amount.toLocaleString()} {t('crowdfunding.currency', language)})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 리스크 안내 박스 */}
          <div className="staking-warning-box staking-risk-box">
            <div className="staking-warning-header">
              <span className="staking-warning-title">{t('crowdfunding.riskNotice', language)}</span>
            </div>
            <ul className="staking-risk-list">
              <li>{t('crowdfunding.risk1', language)}</li>
              <li>{t('crowdfunding.risk2', language)}</li>
              <li>{t('crowdfunding.risk3', language)}</li>
            </ul>
            <div className="staking-risk-notice">
              <p className="staking-risk-notice-text">{t('crowdfunding.riskNoticeText', language)}</p>
            </div>
          </div>

          {/* 펀딩 실행 버튼 */}
          {isLoggedIn && selectedReward && (
            <div className="staking-action-section">
              <button 
                className="staking-stake-button-primary" 
                onClick={handleFundNow}
                disabled={
                  isFunding || 
                  !fundingAmount || 
                  parseFloat(fundingAmount) <= 0 ||
                  parseFloat(fundingAmount) < selectedReward.amount
                }
              >
                {isFunding ? t('crowdfunding.funding', language) : t('crowdfunding.fundNow', language)}
              </button>
            </div>
          )}

          {/* 상태 메시지 */}
          {fundingStatus && (
            <div className={`staking-status-message ${fundingStatus === 'success' ? 'staking-success' : 'staking-error'}`}>
              {fundingStatus === 'success' 
                ? t('crowdfunding.fundingSuccess', language)
                : t('crowdfunding.fundingFailed', language)
              }
            </div>
          )}

          {/* 완료된 펀딩 요약 */}
          {isLoggedIn && completedFundings.length > 0 && (() => {
            const totalCompletedAmount = completedFundings.reduce((sum, record) => sum + record.amount, 0)
            const rewardCounts = completedFundings.reduce((acc, record) => {
              acc[record.reward] = (acc[record.reward] || 0) + 1
              return acc
            }, {})
            const uniqueRewards = Object.keys(rewardCounts).length
            const deliveredCount = completedFundings.filter(r => r.rewardStatus === 'delivered').length
            const shippingCount = completedFundings.filter(r => r.rewardStatus === 'shipping').length
            
            return (
              <div className="staking-info-box" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)', border: '1px solid rgba(102, 126, 234, 0.3)' }}>
                <h3 className="staking-info-box-title" style={{ color: '#667eea', marginBottom: '16px' }}>
                  {t('crowdfunding.completedFundingSummary', language)}
                </h3>
                <div className="staking-info-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div className="staking-info-card" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <span className="staking-info-label">{t('crowdfunding.completedProjects', language)}</span>
                    <span className="staking-info-value" style={{ color: '#667eea', fontWeight: '600' }}>
                      {completedFundings.length}{t('crowdfunding.projects', language)}
                    </span>
                  </div>
                  <div className="staking-info-card" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <span className="staking-info-label">{t('crowdfunding.totalCompletedFunding', language)}</span>
                    <span className="staking-info-value" style={{ color: '#ffffff', fontWeight: '600' }}>
                      {totalCompletedAmount.toLocaleString()} {t('crowdfunding.currency', language)}
                    </span>
                  </div>
                  <div className="staking-info-card" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <span className="staking-info-label">{t('crowdfunding.receivedRewards', language)}</span>
                    <span className="staking-info-value" style={{ color: '#4facfe', fontWeight: '600' }}>
                      {uniqueRewards}{t('crowdfunding.types', language)}
                    </span>
                  </div>
                  <div className="staking-info-card" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <span className="staking-info-label">{t('crowdfunding.rewardStatus', language)}</span>
                    <span className="staking-info-value" style={{ color: '#4caf50', fontWeight: '600' }}>
                      {deliveredCount}{t('crowdfunding.delivered', language)} / {shippingCount}{t('crowdfunding.shipping', language)}
                    </span>
                  </div>
                </div>
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                    {t('crowdfunding.receivedRewardList', language)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(rewardCounts).map(([reward, count]) => (
                      <div key={reward} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '6px 0',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <span style={{ fontSize: '13px', color: '#ffffff' }}>{reward}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#667eea' }}>
                          {count}{t('crowdfunding.count', language)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 펀딩 내역 */}
          {isLoggedIn && fundingHistory.length > 0 && (
            <div className="staking-history-section">
              <div className="staking-history-header">
                <h3 className="staking-history-title">{t('crowdfunding.fundingHistory', language)}</h3>
                {(() => {
                  // 펀딩 내역의 총합 계산
                  const totalFromHistory = fundingHistory.reduce((sum, record) => sum + record.amount, 0)
                  return totalFromHistory > 0 && (
                    <div className="total-profit-badge">
                      {t('crowdfunding.myTotalFunding', language)}: <span className="profit-highlight">{totalFromHistory.toLocaleString()} {t('crowdfunding.currency', language)}</span>
                    </div>
                  )
                })()}
              </div>
              
              <div className="staking-transaction-history" style={{ marginTop: '24px' }}>
                <div className="staking-transaction-list">
                  {fundingHistory.map((record) => {
                    const isProjectCompleted = record.projectStatus === 'completed'
                    
                    return (
                      <div key={record.id} className="staking-transaction-item">
                        <div className="staking-transaction-info">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                            <span className="staking-transaction-type">{record.reward}</span>
                            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                              {record.date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            {isProjectCompleted && record.rewardStatus && (
                              <span style={{ 
                                fontSize: '11px', 
                                color: record.rewardStatus === 'delivered' 
                                  ? '#4caf50' 
                                  : record.rewardStatus === 'shipping'
                                  ? '#2196f3'
                                  : 'rgba(255, 255, 255, 0.6)',
                                marginTop: '2px'
                              }}>
                                {record.rewardStatus === 'delivered' 
                                  ? t('crowdfunding.rewardDelivered', language)
                                  : record.rewardStatus === 'shipping'
                                  ? t('crowdfunding.rewardShipping', language)
                                  : t('crowdfunding.rewardPending', language)
                                }
                              </span>
                            )}
                          </div>
                          <span className="staking-transaction-amount">
                            {record.amount.toLocaleString()} {t('crowdfunding.currency', language)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                          <div style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: record.status === 'completed' 
                              ? 'rgba(76, 175, 80, 0.2)' 
                              : 'rgba(255, 152, 0, 0.2)',
                            color: record.status === 'completed' 
                              ? '#4caf50' 
                              : '#ff9800'
                          }}>
                            {record.status === 'completed' 
                              ? t('crowdfunding.completed', language)
                              : t('crowdfunding.pending', language)
                            }
                          </div>
                          {record.projectStatus && (
                            <div style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '500',
                              background: record.projectStatus === 'completed' 
                                ? 'rgba(76, 175, 80, 0.15)' 
                                : record.projectStatus === 'failed'
                                ? 'rgba(244, 67, 54, 0.15)'
                                : 'rgba(33, 150, 243, 0.15)',
                              color: record.projectStatus === 'completed' 
                                ? '#4caf50' 
                                : record.projectStatus === 'failed'
                                ? '#f44336'
                                : '#2196f3'
                            }}>
                              {record.projectStatus === 'completed' 
                                ? t('crowdfunding.projectCompleted', language)
                                : record.projectStatus === 'failed'
                                ? t('crowdfunding.projectFailed', language)
                                : t('crowdfunding.projectInProgress', language)
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RewardCrowdfundingDetailPage

