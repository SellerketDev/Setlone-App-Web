import React, { useState, useEffect, useRef } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import { getToken, fetchWithAuth } from '../utils/auth'
import { getApiUrl } from '../config/api'
import './CrowdfundingPage.css'

const LoanCrowdfundingDetailPage = ({ onBack, language: propLanguage, project, onLoginRequired }) => {
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animationFrameRef = useRef(null)
  
  // 크라우드펀딩 상태
  const [balance, setBalance] = useState(0) // 대출 받은 후 사용 가능한 잔액
  const [loanAmount, setLoanAmount] = useState('')
  const [isBorrowing, setIsBorrowing] = useState(false)
  const [loanStatus, setLoanStatus] = useState(null)
  const [currentLoan, setCurrentLoan] = useState(0) // 대출 받은 금액 (마이너스로 표시)
  const [totalRaised, setTotalRaised] = useState(0)
  const [targetAmount, setTargetAmount] = useState(1000000)
  const [fundingProgress, setFundingProgress] = useState(0)
  const [borrowersCount, setBorrowersCount] = useState(0)
  const [daysLeft, setDaysLeft] = useState(30)
  const [isLoadingFundingData, setIsLoadingFundingData] = useState(false)
  const [loanHistory, setLoanHistory] = useState([])
  const [completedLoans, setCompletedLoans] = useState([]) // 완료된 대출 내역
  const [investmentHistory, setInvestmentHistory] = useState([]) // 대출 받은 돈으로 투자한 내역

  // 대출 정보
  const [interestRate, setInterestRate] = useState(8) // 이자율 (%)
  const [loanPeriod, setLoanPeriod] = useState(365) // 대출 기간 (일)
  const [minLoanAmount, setMinLoanAmount] = useState(200000) // 최소 대출 금액

  // 프로젝트 정보 (기본값)
  const projectInfo = project || {
    id: 'loan-1',
    name: t('crowdfunding.sampleLoanProject', language),
    description: t('crowdfunding.sampleLoanProjectDescription', language),
    creator: t('crowdfunding.projectCreator', language),
    category: t('crowdfunding.loan', language),
    interestRate: 8,
    loanPeriod: 365,
    minLoanAmount: 200000
  }

  // 펀딩 진행률 계산
  useEffect(() => {
    const progress = targetAmount > 0 ? ((totalRaised / targetAmount) * 100).toFixed(1) : 0
    setFundingProgress(Math.min(100, parseFloat(progress)))
  }, [totalRaised, targetAmount])

  // 대출 내역에서 현재 대출 금액 자동 계산
  useEffect(() => {
    const totalFromHistory = loanHistory.reduce((sum, record) => sum + record.amount, 0)
    setCurrentLoan(totalFromHistory)
  }, [loanHistory])

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
          { id: 1, date: new Date('2025-01-10'), amount: 500000, status: 'completed', projectStatus: 'completed', actualInterestRate: 8, interestPaid: 40000 },
          { id: 2, date: new Date('2025-01-18'), amount: 300000, status: 'completed', projectStatus: 'completed', actualInterestRate: 8, interestPaid: 24000 }
        ]
        // 대출 내역의 총합 계산
        const totalFromHistory = initialHistory.reduce((sum, record) => sum + record.amount, 0)
        
        // 완료된 대출만 필터링
        const completed = initialHistory.filter(record => record.projectStatus === 'completed')
        setCompletedLoans(completed)
        
        // 대출 받은 돈으로 투자한 내역 (샘플 데이터)
        const initialInvestmentHistory = [
          { id: 1, date: new Date('2025-01-12'), amount: 300000, projectName: t('crowdfunding.aiStartupInvestment', language), projectType: t('crowdfunding.technology', language), status: 'completed', projectStatus: 'completed', actualReturn: 18, profit: 54000 },
          { id: 2, date: new Date('2025-01-15'), amount: 200000, projectName: t('crowdfunding.blockchainProject', language), projectType: t('crowdfunding.fintech', language), status: 'completed', projectStatus: 'in_progress', actualReturn: null, profit: null }
        ]
        setInvestmentHistory(initialInvestmentHistory)
        
        // 대출 받은 금액만큼 잔액 증가 (대출 받은 돈)
        setBalance(totalFromHistory) // 대출 받은 돈으로 사용 가능
        // currentLoan은 내역에서 자동 계산되므로 설정하지 않음
        setTotalRaised(800000)
        setTargetAmount(1000000)
        setBorrowersCount(8)
        setDaysLeft(20)
        setInterestRate(projectInfo.interestRate || 8)
        setLoanPeriod(projectInfo.loanPeriod || 365)
        setMinLoanAmount(projectInfo.minLoanAmount || 200000)
        setLoanHistory(initialHistory)
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
      setLoanAmount(value)
    }
  }

  // MAX 버튼 클릭 (대출 가능한 최대 금액)
  const handleMaxClick = () => {
    // 대출 가능한 최대 금액 = 목표 금액 - 현재 모금액
    const maxLoan = targetAmount - totalRaised
    setLoanAmount(maxLoan > 0 ? maxLoan.toString() : '0')
  }

  // 예상 이자 계산 (상환해야 할 이자)
  const calculateExpectedInterest = (amount) => {
    if (!amount || isNaN(parseFloat(amount))) return 0
    const numAmount = parseFloat(amount)
    const interest = (numAmount * interestRate / 100)
    return interest.toFixed(0)
  }

  // 대출 실행 (대출 받기)
  const handleBorrowNow = async () => {
    if (!isLoggedIn) {
      if (onLoginRequired) {
        onLoginRequired()
      }
      return
    }

    const amount = parseFloat(loanAmount)
    if (isNaN(amount) || amount <= 0) {
      alert(t('crowdfunding.invalidAmount', language))
      return
    }

    if (amount < minLoanAmount) {
      alert(t('crowdfunding.minLoanAmountError', language, { min: minLoanAmount }))
      return
    }

    if (totalRaised + amount > targetAmount) {
      alert(t('crowdfunding.exceedsTargetAmount', language))
      return
    }

    setIsBorrowing(true)
    setLoanStatus(null)

    try {
      // TODO: 실제 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 상태 업데이트 - 정확한 금액으로 업데이트
      const newBalance = balance + amount // 대출 받은 돈 추가
      const newTotalRaised = totalRaised + amount
      const newBorrowersCount = borrowersCount + 1
      
      setBalance(newBalance)
      setTotalRaised(newTotalRaised)
      setBorrowersCount(newBorrowersCount)
      
      // 대출 내역에 추가 (currentLoan은 내역에서 자동 계산됨)
      const newLoanRecord = {
        id: Date.now(),
        date: new Date(),
        amount: amount,
        status: 'completed',
        projectStatus: 'in_progress',
        actualInterestRate: null,
        interestPaid: null
      }
      setLoanHistory(prev => [newLoanRecord, ...prev])
      
      // 완료된 대출 목록 업데이트
      setCompletedLoans(prev => prev.filter(record => record.projectStatus === 'completed'))
      
      setLoanAmount('')
      setLoanStatus('success')
      
      setTimeout(() => {
        setLoanStatus(null)
      }, 3000)
    } catch (error) {
      // console.error('Loan failed:', error)
      setLoanStatus('failed')
      setTimeout(() => {
        setLoanStatus(null)
      }, 3000)
    } finally {
      setIsBorrowing(false)
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
          {t('crowdfunding.details.loan.title', language)}
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
              <span className="staking-header-label">{t('crowdfunding.interestRate', language)}</span>
              <span className="staking-header-value apy-highlight">{interestRate}%</span>
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
              <span>{borrowersCount}{t('crowdfunding.people', language)} {t('crowdfunding.borrowers', language)}</span>
            </div>
          </div>

          {/* 대출 정보 */}
          {isLoggedIn ? (
            <div className="staking-info-grid">
              <div className="staking-info-card">
                <span className="staking-info-label">{t('crowdfunding.availableBalance', language)}</span>
                <span className="staking-info-value" style={{ color: '#4caf50' }}>
                  {isLoadingFundingData ? '...' : `+${balance.toLocaleString()} ${t('crowdfunding.currency', language)}`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('crowdfunding.myLoan', language)}</span>
                <span className="staking-info-value" style={{ color: '#f44336' }}>
                  {isLoadingFundingData ? '...' : `-${currentLoan.toLocaleString()} ${t('crowdfunding.currency', language)}`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('crowdfunding.totalRaised', language)}</span>
                <span className="staking-info-value rewards-value">
                  {isLoadingFundingData ? '...' : `${totalRaised.toLocaleString()} ${t('crowdfunding.currency', language)}`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('crowdfunding.borrowers', language)}</span>
                <span className="staking-info-value">
                  {isLoadingFundingData ? '...' : `${borrowersCount}${t('crowdfunding.people', language)}`}
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

          {/* 대출 정보 섹션 */}
          <div className="staking-info-box" style={{ marginBottom: '24px' }}>
            <h3 className="staking-info-box-title">{t('crowdfunding.loanInfo', language)}</h3>
            <div className="staking-info-box-content">
              <div className="staking-info-box-item">
                <span className="staking-info-box-label">{t('crowdfunding.interestRate', language)}</span>
                <span className="staking-info-box-value" style={{ color: '#4facfe', fontWeight: '600' }}>
                  {interestRate}%
                </span>
              </div>
              <div className="staking-info-box-item">
                <span className="staking-info-box-label">{t('crowdfunding.loanPeriod', language)}</span>
                <span className="staking-info-box-value">
                  {loanPeriod} {t('crowdfunding.days', language)}
                </span>
              </div>
              <div className="staking-info-box-item">
                <span className="staking-info-box-label">{t('crowdfunding.minLoanAmount', language)}</span>
                <span className="staking-info-box-value">
                  {minLoanAmount.toLocaleString()} {t('crowdfunding.currency', language)}
                </span>
              </div>
              <div className="staking-info-box-item">
                <span className="staking-info-box-label">{t('crowdfunding.repaymentMethod', language)}</span>
                <span className="staking-info-box-value">
                  {t('crowdfunding.repaymentMethodDescription', language)}
                </span>
              </div>
            </div>
          </div>

          {/* 대출 입력 섹션 */}
          {isLoggedIn && (
            <div className="staking-action-section">
              <div className="staking-input-container">
                <div className="staking-input-header">
                  <label className="staking-input-label">
                    {t('crowdfunding.loanAmount', language)}
                  </label>
                  <span className="staking-input-hint">
                    {t('crowdfunding.minLoanAmount', language)}: {minLoanAmount.toLocaleString()} {t('crowdfunding.currency', language)}
                  </span>
                </div>
                <div className="staking-input-wrapper">
                  <input
                    type="text"
                    className="staking-amount-input"
                    placeholder={t('crowdfunding.enterAmount', language)}
                    value={loanAmount}
                    onChange={handleAmountChange}
                    disabled={isBorrowing}
                  />
                  <button
                    className="staking-max-button"
                    onClick={handleMaxClick}
                    disabled={isBorrowing || (targetAmount - totalRaised) <= 0}
                  >
                    {t('staking.max', language)}
                  </button>
                </div>
                {loanAmount && parseFloat(loanAmount) > 0 && (
                  <div className="staking-estimated-rewards">
                    <div className="staking-estimated-item">
                      <span className="staking-estimated-label">{t('crowdfunding.loanAmount', language)}</span>
                      <span className="staking-estimated-value" style={{ color: '#4caf50', fontWeight: '600' }}>
                        +{parseFloat(loanAmount).toLocaleString()} {t('crowdfunding.currency', language)}
                      </span>
                    </div>
                    <div className="staking-estimated-item">
                      <span className="staking-estimated-label">{t('crowdfunding.expectedInterest', language)}</span>
                      <span className="staking-estimated-value" style={{ color: '#4facfe', fontWeight: '600' }}>
                        +{calculateExpectedInterest(loanAmount).toLocaleString()} {t('crowdfunding.currency', language)}
                      </span>
                    </div>
                    <div className="staking-estimated-item">
                      <span className="staking-estimated-label">{t('crowdfunding.totalRepayment', language)}</span>
                      <span className="staking-estimated-value" style={{ color: '#f44336', fontWeight: '600' }}>
                        {(parseFloat(loanAmount) + parseFloat(calculateExpectedInterest(loanAmount))).toLocaleString()} {t('crowdfunding.currency', language)}
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
              <li>{t('crowdfunding.loanRisk1', language)}</li>
              <li>{t('crowdfunding.loanRisk2', language)}</li>
            </ul>
            <div className="staking-risk-notice">
              <p className="staking-risk-notice-text">{t('crowdfunding.loanRiskNotice', language)}</p>
            </div>
          </div>

          {/* 대출 실행 버튼 */}
          {isLoggedIn && (
            <div className="staking-action-section">
              <button 
                className="staking-stake-button-primary" 
                onClick={handleBorrowNow}
                disabled={
                  isBorrowing || 
                  !loanAmount || 
                  parseFloat(loanAmount) <= 0 ||
                  parseFloat(loanAmount) < minLoanAmount ||
                  (totalRaised + parseFloat(loanAmount)) > targetAmount
                }
              >
                {isBorrowing ? t('crowdfunding.borrowing', language) : t('crowdfunding.borrowNow', language)}
              </button>
            </div>
          )}

          {/* 상태 메시지 */}
          {loanStatus && (
            <div className={`staking-status-message ${loanStatus === 'success' ? 'staking-success' : 'staking-error'}`}>
              {loanStatus === 'success' 
                ? t('crowdfunding.loanSuccess', language)
                : t('crowdfunding.loanFailed', language)
              }
            </div>
          )}

          {/* 내 투자 내역 (대출 받은 돈으로 투자한 내역) */}
          {isLoggedIn && investmentHistory.length > 0 && (() => {
            const totalInvestmentAmount = investmentHistory.reduce((sum, record) => sum + record.amount, 0)
            const totalProfit = investmentHistory.reduce((sum, record) => {
              return sum + (record.profit || 0)
            }, 0)
            const totalReturn = totalInvestmentAmount + totalProfit
            const completedInvestments = investmentHistory.filter(record => record.projectStatus === 'completed')
            const averageReturn = completedInvestments.length > 0
              ? completedInvestments.reduce((sum, record) => sum + (record.actualReturn || 0), 0) / completedInvestments.length
              : 0
            
            return (
              <div className="staking-info-box" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(56, 142, 60, 0.15) 100%)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                <h3 className="staking-info-box-title" style={{ color: '#4caf50', marginBottom: '16px' }}>
                  {t('crowdfunding.myInvestmentHistory', language)}
                </h3>
                <div className="staking-info-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div className="staking-info-card" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <span className="staking-info-label">{t('crowdfunding.completedProjects', language)}</span>
                    <span className="staking-info-value" style={{ color: '#4caf50', fontWeight: '600' }}>
                      {completedInvestments.length}{t('crowdfunding.projects', language)}
                    </span>
                  </div>
                  <div className="staking-info-card" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <span className="staking-info-label">{t('crowdfunding.totalCompletedInvestment', language)}</span>
                    <span className="staking-info-value" style={{ color: '#ffffff', fontWeight: '600' }}>
                      {totalInvestmentAmount.toLocaleString()} {t('crowdfunding.currency', language)}
                    </span>
                  </div>
                  <div className="staking-info-card" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <span className="staking-info-label">{t('crowdfunding.totalProfit', language)}</span>
                    <span className="staking-info-value" style={{ color: '#4facfe', fontWeight: '600' }}>
                      +{totalProfit.toLocaleString()} {t('crowdfunding.currency', language)}
                    </span>
                  </div>
                  <div className="staking-info-card" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <span className="staking-info-label">{t('crowdfunding.totalReturn', language)}</span>
                    <span className="staking-info-value" style={{ color: '#4caf50', fontWeight: '600' }}>
                      {totalReturn.toLocaleString()} {t('crowdfunding.currency', language)}
                    </span>
                  </div>
                </div>
                {averageReturn > 0 && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span className="staking-info-label">{t('crowdfunding.averageReturnRate', language)}</span>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#4facfe' }}>
                      {averageReturn.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )
          })()}

          {/* 내 투자 내역 상세 */}
          {isLoggedIn && investmentHistory.length > 0 && (
            <div className="staking-history-section">
              <div className="staking-history-header">
                <h3 className="staking-history-title">{t('crowdfunding.myInvestmentHistory', language)}</h3>
                {(() => {
                  const totalFromHistory = investmentHistory.reduce((sum, record) => sum + record.amount, 0)
                  return totalFromHistory > 0 && (
                    <div className="total-profit-badge">
                      {t('crowdfunding.myTotalInvestment', language)}: <span className="profit-highlight">{totalFromHistory.toLocaleString()} {t('crowdfunding.currency', language)}</span>
                    </div>
                  )
                })()}
              </div>
              
              <div className="staking-transaction-history" style={{ marginTop: '24px' }}>
                <div className="staking-transaction-list">
                  {investmentHistory.map((record) => {
                    const isProjectCompleted = record.projectStatus === 'completed'
                    const actualReturn = record.actualReturn || 0
                    const profit = isProjectCompleted ? (record.profit || 0) : 0
                    const totalReturn = isProjectCompleted ? (record.amount + profit) : record.amount
                    
                    return (
                      <div key={record.id} className="staking-transaction-item">
                        <div className="staking-transaction-info">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                            <span className="staking-transaction-type">{record.projectName}</span>
                            {record.projectType && (
                              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                                {t('crowdfunding.projectType', language)}: {record.projectType}
                              </span>
                            )}
                            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                              {record.date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            {isProjectCompleted && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                <span style={{ fontSize: '11px', color: '#4facfe' }}>
                                  {t('crowdfunding.actualReturnRate', language)}: {actualReturn}%
                                </span>
                                <span style={{ fontSize: '11px', color: '#4caf50' }}>
                                  {t('crowdfunding.profit', language)}: +{profit.toLocaleString()} {t('crowdfunding.currency', language)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span className="staking-transaction-amount">
                              {record.amount.toLocaleString()} {t('crowdfunding.currency', language)}
                            </span>
                            {isProjectCompleted && (
                              <span style={{ fontSize: '14px', fontWeight: '600', color: '#4caf50' }}>
                                = {totalReturn.toLocaleString()} {t('crowdfunding.currency', language)}
                              </span>
                            )}
                          </div>
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

          {/* 대출 내역 */}
          {isLoggedIn && loanHistory.length > 0 && (
            <div className="staking-history-section">
              <div className="staking-history-header">
                <h3 className="staking-history-title">{t('crowdfunding.loanHistory', language)}</h3>
                {(() => {
                  // 대출 내역의 총합 계산
                  const totalFromHistory = loanHistory.reduce((sum, record) => sum + record.amount, 0)
                  return totalFromHistory > 0 && (
                    <div className="total-profit-badge">
                      {t('crowdfunding.myTotalLoan', language)}: <span className="profit-highlight" style={{ color: '#f44336' }}>-{totalFromHistory.toLocaleString()} {t('crowdfunding.currency', language)}</span>
                    </div>
                  )
                })()}
              </div>
              
              <div className="staking-transaction-history" style={{ marginTop: '24px' }}>
                <div className="staking-transaction-list">
                  {loanHistory.map((record) => {
                    const isProjectCompleted = record.projectStatus === 'completed'
                    const actualInterestRate = record.actualInterestRate || interestRate
                    const interest = isProjectCompleted ? (record.interestPaid || 0) : 0
                    const totalRepayment = isProjectCompleted ? (record.amount + interest) : record.amount
                    
                    return (
                      <div key={record.id} className="staking-transaction-item">
                        <div className="staking-transaction-info">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                            <span className="staking-transaction-type">{t('crowdfunding.loan', language)}</span>
                            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                              {record.date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            {isProjectCompleted && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                <span style={{ fontSize: '11px', color: '#4facfe' }}>
                                  {t('crowdfunding.actualInterestRate', language)}: {actualInterestRate}%
                                </span>
                                <span style={{ fontSize: '11px', color: '#4facfe' }}>
                                  {t('crowdfunding.interest', language)}: +{interest.toLocaleString()} {t('crowdfunding.currency', language)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span className="staking-transaction-amount" style={{ color: '#4caf50' }}>
                              +{record.amount.toLocaleString()} {t('crowdfunding.currency', language)}
                            </span>
                            {isProjectCompleted && (
                              <span style={{ fontSize: '14px', fontWeight: '600', color: '#f44336' }}>
                                = {totalRepayment.toLocaleString()} {t('crowdfunding.currency', language)}
                              </span>
                            )}
                          </div>
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

export default LoanCrowdfundingDetailPage
