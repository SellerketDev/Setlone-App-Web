import React, { useState, useEffect, useRef } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import { getToken } from '../utils/auth'
import './CrowdfundingPage.css'

const CrowdfundingPage = ({ onBack, language: propLanguage, onRewardCrowdfundingDetail, onInvestmentCrowdfundingDetail, onLoanCrowdfundingDetail, onLoginRequired }) => {
  // prop으로 받은 language가 있으면 사용, 없으면 localStorage에서 가져오기
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [selectedCrowdfunding, setSelectedCrowdfunding] = useState(null)
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animationFrameRef = useRef(null)
  
  // 인증 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [myFundingHistory, setMyFundingHistory] = useState({
    reward: [],
    investment: [],
    loan: []
  })
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // 인증 상태 체크 및 내역 로드
  useEffect(() => {
    const token = getToken()
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(!!(token && loggedIn))
    
    if (token && loggedIn) {
      loadMyFundingHistory()
    }
  }, [])

  // 내 펀딩 내역 로드
  const loadMyFundingHistory = async () => {
    setIsLoadingHistory(true)
    try {
      // TODO: 실제 API 엔드포인트로 변경
      setTimeout(() => {
        setMyFundingHistory({
          reward: [
            { id: 1, date: new Date('2025-01-15'), amount: 10000, reward: t('crowdfunding.earlyBird', language), projectName: t('crowdfunding.smartWatchProject', language), status: 'funding_completed', projectStatus: 'in_progress' },
            { id: 2, date: new Date('2025-01-20'), amount: 50000, reward: t('crowdfunding.premiumPackage', language), projectName: t('crowdfunding.smartWatchProject', language), status: 'funding_completed', projectStatus: 'in_progress' }
          ],
          investment: [
            { id: 1, date: new Date('2025-01-10'), amount: 200000, projectName: t('crowdfunding.aiStartupInvestment', language), projectType: t('crowdfunding.technology', language), status: 'completed', projectStatus: 'completed', actualReturn: 18, profit: 36000 },
            { id: 2, date: new Date('2025-01-18'), amount: 300000, projectName: t('crowdfunding.blockchainProject', language), projectType: t('crowdfunding.fintech', language), status: 'completed', projectStatus: 'completed', actualReturn: 15, profit: 45000 }
          ],
          loan: [
            { id: 1, date: new Date('2025-01-10'), amount: 500000, projectName: t('crowdfunding.realEstateProject', language), interestRate: 8, loanPeriod: 365, status: 'completed', projectStatus: 'completed', actualInterestRate: 8, interestPaid: 40000 },
            { id: 2, date: new Date('2025-01-18'), amount: 300000, projectName: t('crowdfunding.realEstateProject', language), interestRate: 8, loanPeriod: 365, status: 'completed', projectStatus: 'completed', actualInterestRate: 8, interestPaid: 24000 }
          ]
        })
        setIsLoadingHistory(false)
      }, 300)
    } catch (error) {
      // console.error('Failed to load funding history:', error)
      setIsLoadingHistory(false)
    }
  }

  // 내 펀딩 총액 계산
  const getMyTotalFunding = (type) => {
    const history = myFundingHistory[type] || []
    return history.reduce((sum, record) => sum + record.amount, 0)
  }

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

  const crowdfundingOptions = [
    {
      id: 'reward'
    },
    {
      id: 'investment'
    },
    {
      id: 'loan'
    }
  ]

  const handleSeeMore = (crowdfunding) => {
    setSelectedCrowdfunding(crowdfunding)
  }

  const handleCloseDetail = () => {
    setSelectedCrowdfunding(null)
  }

  const getCrowdfundingDetail = (id) => {
    return {
      title: t(`crowdfunding.details.${id}.title`, language),
      content: t(`crowdfunding.details.${id}.content`, language)
    }
  }

  return (
    <div className="crowdfunding-page">
      {/* 우주 배경 효과 */}
      <canvas 
        ref={canvasRef} 
        className="space-background"
      />
      <div className="crowdfunding-header">
        <button className="back-button" onClick={onBack}>
          ← {t('crowdfunding.back', language)}
        </button>
        <h1 className="crowdfunding-title">
          {t('crowdfunding.title', language)}
        </h1>
      </div>

      <div className="crowdfunding-content">
        <div className="crowdfunding-grid">
          {crowdfundingOptions.map((option) => (
            <div key={option.id} className="crowdfunding-card">
              <div className="crowdfunding-card-header">
                <h3 className="crowdfunding-card-title">
                  {t(`crowdfunding.options.${option.id}.title`, language)}
                </h3>
              </div>
              <p className="crowdfunding-card-description">
                {t(`crowdfunding.options.${option.id}.description`, language)}
              </p>
              <button
                className="crowdfunding-see-more-btn"
                onClick={() => handleSeeMore(option)}
              >
                {t('crowdfunding.seeMore', language)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 상세 설명 모달 */}
      {selectedCrowdfunding && (
        <div className="staking-detail-overlay" onClick={handleCloseDetail}>
          <div className="staking-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staking-detail-header">
              <h2 className="staking-detail-title">
                {getCrowdfundingDetail(selectedCrowdfunding.id).title}
              </h2>
              <button className="staking-detail-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>
            
            <div className="staking-detail-content">
              {/* 상단 히어로 섹션 */}
              <div className="staking-hero-section">
                <h4 className="staking-hero-title">
                  {t(`crowdfunding.options.${selectedCrowdfunding.id}.title`, language)}
                </h4>
                <p className="staking-hero-description">
                  {t(`crowdfunding.options.${selectedCrowdfunding.id}.description`, language)}
                </p>
              </div>

              {/* 상품 핵심 요약 카드 */}
              <div className="staking-summary-card">
                <h4 className="staking-summary-title">
                  {getCrowdfundingDetail(selectedCrowdfunding.id).title}
                </h4>
                <p className="staking-summary-content">
                {getCrowdfundingDetail(selectedCrowdfunding.id).content}
              </p>
            </div>

              {/* 핵심 정보 영역 */}
              <div className="staking-key-info">
                <div className="staking-key-info-item">
                  <span className="staking-key-info-label">{t('crowdfunding.fundingType', language)}</span>
                  <span className="staking-key-info-value">
                    {t(`crowdfunding.options.${selectedCrowdfunding.id}.title`, language)}
                  </span>
                </div>
                <div className="staking-key-info-item">
                  <span className="staking-key-info-label">{t('crowdfunding.status', language)}</span>
                  <span className="staking-key-info-value">{t('crowdfunding.statusActive', language)}</span>
                </div>
              </div>

              {/* 내 펀딩 내역 (로그인 시) */}
              {isLoggedIn && (() => {
                // 투자형과 대출형은 투자내역과 대출내역을 모두 표시
                const investmentHistory = myFundingHistory['investment'] || []
                const loanHistory = myFundingHistory['loan'] || []
                const rewardHistory = myFundingHistory['reward'] || []
                
                // 투자형 모달: 투자내역만 표시
                if (selectedCrowdfunding.id === 'investment') {
                  const hasInvestment = investmentHistory.length > 0
                  
                  if (hasInvestment) {
                    return (
                      <div className="staking-info-box" style={{ marginBottom: '24px' }}>
                        <h3 className="staking-info-box-title">
                          {t('crowdfunding.myInvestmentHistory', language)}
                        </h3>
                        <div style={{ 
                          padding: '12px',
                          background: 'rgba(102, 126, 234, 0.1)',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                            {t('crowdfunding.myTotalInvestment', language)}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: '#667eea' }}>
                            {getMyTotalFunding('investment').toLocaleString()} {t('crowdfunding.currency', language)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                          {investmentHistory.slice(0, 3).map((record) => (
                            <div key={record.id} style={{
                              padding: '10px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                {record.projectName && (
                                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>
                                    {record.projectName}
                                  </span>
                                )}
                                {record.projectType && (
                                  <span style={{ fontSize: '12px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)' }}>
                                    {t('crowdfunding.projectType', language)}: {record.projectType}
                                  </span>
                                )}
                                {/* 완료된 투자의 경우 수익률 및 수익 표시 */}
                                {record.projectStatus === 'completed' && record.actualReturn && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '11px', color: '#4facfe' }}>
                                      {t('crowdfunding.actualReturnRate', language)}: {record.actualReturn}%
                                    </span>
                                    {record.profit && (
                                      <span style={{ fontSize: '11px', color: '#4caf50' }}>
                                        {t('crowdfunding.profit', language)}: +{record.profit.toLocaleString()} {t('crowdfunding.currency', language)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                  {record.date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                                  {record.amount.toLocaleString()} {t('crowdfunding.currency', language)}
                                </span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '8px',
                                    fontSize: '10px',
                                    fontWeight: '500',
                                    background: record.status === 'completed' || record.status === 'funding_completed'
                                      ? 'rgba(76, 175, 80, 0.2)' 
                                      : record.status === 'funding_failed'
                                      ? 'rgba(244, 67, 54, 0.2)'
                                      : 'rgba(255, 152, 0, 0.2)',
                                    color: record.status === 'completed' || record.status === 'funding_completed'
                                      ? '#4caf50' 
                                      : record.status === 'funding_failed'
                                      ? '#f44336'
                                      : '#ff9800'
                                  }}>
                                    {record.status === 'completed' || record.status === 'funding_completed'
                                      ? t('crowdfunding.fundingCompleted', language)
                                      : record.status === 'funding_failed'
                                      ? t('crowdfunding.fundingFailed', language)
                                      : t('crowdfunding.fundingInProgress', language)
                                    }
                                  </span>
                                  {record.projectStatus && (
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '8px',
                                      fontSize: '10px',
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
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {investmentHistory.length > 3 && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: 'rgba(255, 255, 255, 0.6)', 
                              textAlign: 'center',
                              padding: '8px'
                            }}>
                              {t('crowdfunding.moreHistory', language)} ({investmentHistory.length - 3})
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  return null
                }
                
                // 대출형 모달: 투자내역과 대출내역을 각각 별도 섹션으로 표시
                if (selectedCrowdfunding.id === 'loan') {
                  const hasInvestment = investmentHistory.length > 0
                  const hasLoan = loanHistory.length > 0
                  
                  if (hasInvestment || hasLoan) {
                    return (
                      <>
                        {/* 투자내역 섹션 */}
                        {hasInvestment && (
                          <div className="staking-info-box" style={{ marginBottom: '24px' }}>
                            <h3 className="staking-info-box-title">
                              {t('crowdfunding.myInvestmentHistory', language)}
                            </h3>
                            <div style={{ 
                              padding: '12px',
                              background: 'rgba(102, 126, 234, 0.1)',
                              borderRadius: '8px',
                              marginBottom: '12px',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                                {t('crowdfunding.myTotalInvestment', language)}
                              </div>
                              <div style={{ fontSize: '18px', fontWeight: '600', color: '#667eea' }}>
                                {getMyTotalFunding('investment').toLocaleString()} {t('crowdfunding.currency', language)}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                              {investmentHistory.slice(0, 3).map((record) => (
                                <div key={record.id} style={{
                                  padding: '10px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                    {record.projectName && (
                                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>
                                        {record.projectName}
                                      </span>
                                    )}
                                    {record.projectType && (
                                      <span style={{ fontSize: '12px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)' }}>
                                        {t('crowdfunding.projectType', language)}: {record.projectType}
                                      </span>
                                    )}
                                    {/* 완료된 투자의 경우 수익률 및 수익 표시 */}
                                    {record.projectStatus === 'completed' && record.actualReturn && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '11px', color: '#4facfe' }}>
                                          {t('crowdfunding.actualReturnRate', language)}: {record.actualReturn}%
                                        </span>
                                        {record.profit && (
                                          <span style={{ fontSize: '11px', color: '#4caf50' }}>
                                            {t('crowdfunding.profit', language)}: +{record.profit.toLocaleString()} {t('crowdfunding.currency', language)}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                      {record.date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                                      {record.amount.toLocaleString()} {t('crowdfunding.currency', language)}
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                      <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '8px',
                                        fontSize: '10px',
                                        fontWeight: '500',
                                        background: record.status === 'completed' || record.status === 'funding_completed'
                                          ? 'rgba(76, 175, 80, 0.2)' 
                                          : record.status === 'funding_failed'
                                          ? 'rgba(244, 67, 54, 0.2)'
                                          : 'rgba(255, 152, 0, 0.2)',
                                        color: record.status === 'completed' || record.status === 'funding_completed'
                                          ? '#4caf50' 
                                          : record.status === 'funding_failed'
                                          ? '#f44336'
                                          : '#ff9800'
                                      }}>
                                        {record.status === 'completed' || record.status === 'funding_completed'
                                          ? t('crowdfunding.fundingCompleted', language)
                                          : record.status === 'funding_failed'
                                          ? t('crowdfunding.fundingFailed', language)
                                          : t('crowdfunding.fundingInProgress', language)
                                        }
                                      </span>
                                      {record.projectStatus && (
                                        <span style={{
                                          padding: '2px 8px',
                                          borderRadius: '8px',
                                          fontSize: '10px',
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
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {investmentHistory.length > 3 && (
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: 'rgba(255, 255, 255, 0.6)', 
                                  textAlign: 'center',
                                  padding: '8px'
                                }}>
                                  {t('crowdfunding.moreHistory', language)} ({investmentHistory.length - 3})
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* 대출내역 섹션 */}
                        {hasLoan && (
                          <div className="staking-info-box" style={{ marginBottom: '24px' }}>
                            <h3 className="staking-info-box-title">
                              {t('crowdfunding.myLoanHistory', language)}
                            </h3>
                            <div style={{ 
                              padding: '12px',
                              background: 'rgba(102, 126, 234, 0.1)',
                              borderRadius: '8px',
                              marginBottom: '12px',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                                {t('crowdfunding.myTotalLoan', language)}
                              </div>
                              <div style={{ fontSize: '18px', fontWeight: '600', color: '#667eea' }}>
                                {getMyTotalFunding('loan').toLocaleString()} {t('crowdfunding.currency', language)}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                              {loanHistory.slice(0, 3).map((record) => (
                                <div key={record.id} style={{
                                  padding: '10px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                    {record.projectName && (
                                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>
                                        {record.projectName}
                                      </span>
                                    )}
                                    {record.interestRate && (
                                      <span style={{ fontSize: '12px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)' }}>
                                        {t('crowdfunding.interestRate', language)}: {record.interestRate}%
                                      </span>
                                    )}
                                    {/* 완료된 대출의 경우 실제 이자율 및 이자 표시 */}
                                    {record.projectStatus === 'completed' && record.actualInterestRate && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '11px', color: '#4facfe' }}>
                                          {t('crowdfunding.actualInterestRate', language)}: {record.actualInterestRate}%
                                        </span>
                                        {record.interestPaid && (
                                          <span style={{ fontSize: '11px', color: '#4caf50' }}>
                                            {t('crowdfunding.interest', language)}: +{record.interestPaid.toLocaleString()} {t('crowdfunding.currency', language)}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                      {record.date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                                      {record.amount.toLocaleString()} {t('crowdfunding.currency', language)}
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                      <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '8px',
                                        fontSize: '10px',
                                        fontWeight: '500',
                                        background: record.status === 'funding_completed' 
                                          ? 'rgba(76, 175, 80, 0.2)' 
                                          : record.status === 'funding_failed'
                                          ? 'rgba(244, 67, 54, 0.2)'
                                          : 'rgba(255, 152, 0, 0.2)',
                                        color: record.status === 'funding_completed' 
                                          ? '#4caf50' 
                                          : record.status === 'funding_failed'
                                          ? '#f44336'
                                          : '#ff9800'
                                      }}>
                                        {record.status === 'funding_completed' 
                                          ? t('crowdfunding.fundingCompleted', language)
                                          : record.status === 'funding_failed'
                                          ? t('crowdfunding.fundingFailed', language)
                                          : t('crowdfunding.fundingInProgress', language)
                                        }
                                      </span>
                                      {record.projectStatus && (
                                        <span style={{
                                          padding: '2px 8px',
                                          borderRadius: '8px',
                                          fontSize: '10px',
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
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {loanHistory.length > 3 && (
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: 'rgba(255, 255, 255, 0.6)', 
                                  textAlign: 'center',
                                  padding: '8px'
                                }}>
                                  {t('crowdfunding.moreHistory', language)} ({loanHistory.length - 3})
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  }
                  return null
                }
                
                // 보상형 모달: 펀딩 내역만 표시
                if (selectedCrowdfunding.id === 'reward') {
                const history = rewardHistory
                const totalAmount = getMyTotalFunding('reward')
                
                if (history.length > 0) {
                  return (
                    <div className="staking-info-box" style={{ marginBottom: '24px' }}>
                      <h3 className="staking-info-box-title">
                        {t('crowdfunding.myFundingHistory', language)}
                      </h3>
                      <div style={{ 
                        padding: '12px',
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                          {t('crowdfunding.myTotalFunding', language)}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#667eea' }}>
                          {totalAmount.toLocaleString()} {t('crowdfunding.currency', language)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                        {history.slice(0, 3).map((record) => (
                          <div key={record.id} style={{
                            padding: '10px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                              {record.projectName && (
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>
                                  {record.projectName}
                                </span>
                              )}
                              {record.reward && (
                                <span style={{ fontSize: '12px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)' }}>
                                  {t('crowdfunding.reward', language)}: {record.reward}
                                </span>
                              )}
                              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                {record.date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                                {record.amount.toLocaleString()} {t('crowdfunding.currency', language)}
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  fontWeight: '500',
                                  background: record.status === 'funding_completed' 
                                    ? 'rgba(76, 175, 80, 0.2)' 
                                    : record.status === 'funding_failed'
                                    ? 'rgba(244, 67, 54, 0.2)'
                                    : 'rgba(255, 152, 0, 0.2)',
                                  color: record.status === 'funding_completed' 
                                    ? '#4caf50' 
                                    : record.status === 'funding_failed'
                                    ? '#f44336'
                                    : '#ff9800'
                                }}>
                                  {record.status === 'funding_completed' 
                                    ? t('crowdfunding.fundingCompleted', language)
                                    : record.status === 'funding_failed'
                                    ? t('crowdfunding.fundingFailed', language)
                                    : t('crowdfunding.fundingInProgress', language)
                                  }
                                </span>
                                {record.projectStatus && (
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '8px',
                                    fontSize: '10px',
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
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {history.length > 3 && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            textAlign: 'center',
                            padding: '8px'
                          }}>
                            {t('crowdfunding.moreHistory', language)} ({history.length - 3})
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
                return null
              }
              
              return null
              })()}

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
            </div>

            <div className="staking-detail-footer">
              <button 
                className="staking-back-button" 
                onClick={handleCloseDetail}
              >
                {t('crowdfunding.backToCrowdfunding', language)}
              </button>
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
                    // 로그인 상태면 상세 페이지로 이동
                    handleCloseDetail()
                    if (selectedCrowdfunding.id === 'reward' && onRewardCrowdfundingDetail) {
                      onRewardCrowdfundingDetail()
                    } else if (selectedCrowdfunding.id === 'investment' && onInvestmentCrowdfundingDetail) {
                      onInvestmentCrowdfundingDetail()
                    } else if (selectedCrowdfunding.id === 'loan' && onLoanCrowdfundingDetail) {
                      onLoanCrowdfundingDetail()
                    }
                  }
                }}
              >
                {t('crowdfunding.participate', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CrowdfundingPage

