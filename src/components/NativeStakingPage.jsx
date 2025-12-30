import React, { useState, useEffect, useMemo } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import { getToken, fetchWithAuth } from '../utils/auth'
import { getApiUrl } from '../config/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import './StakingPage.css'

const NativeStakingPage = ({ onBack, language: propLanguage, onLoginRequired }) => {
  // prop으로 받은 language가 있으면 사용, 없으면 localStorage에서 가져오기
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  
  // 인증 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
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
  
  // 다음 보상 지급 정보
  const [nextRewardDate, setNextRewardDate] = useState(null)
  const rewardPaymentCycle = 'daily' // 'daily' or 'weekly'
  
  // 다음 보상 지급 날짜 계산
  useEffect(() => {
    if (isLoggedIn && currentStaking > 0) {
      const today = new Date()
      const nextDate = new Date(today)
      if (rewardPaymentCycle === 'daily') {
        nextDate.setDate(today.getDate() + 1)
      } else {
        // 주 1회인 경우 다음 주 같은 요일
        const daysUntilNextWeek = 7 - today.getDay() + 1
        nextDate.setDate(today.getDate() + daysUntilNextWeek)
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
  const minStakingAmount = 100
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

  // 스테이킹 데이터 로드
  const loadStakingData = async () => {
    setIsLoadingStakingData(true)
    try {
      // TODO: 실제 API 엔드포인트로 변경
      // const response = await fetchWithAuth(getApiUrl('/api/v1/staking/status'))
      // const data = await response.json()
      
      // 시뮬레이션 데이터 (실제로는 API에서 가져옴)
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
      // const response = await fetchWithAuth(getApiUrl('/api/v1/staking/native'), {
      //   method: 'POST',
      //   body: JSON.stringify({ amount: parseFloat(stakingAmount) })
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
      
      // 스테이킹 금액은 점진적으로 증가 (과거부터 현재까지)
      const progress = (29 - i) / 29 // 0 (과거) ~ 1 (현재)
      const baseStaking = currentStaking * 0.3
      const stakingVariation = Math.sin(i / 10) * (currentStaking * 0.05)
      const stakingValue = baseStaking + (currentStaking * 0.7 * progress) + stakingVariation
      
      // 누적 수익도 점진적으로 증가 (과거부터 현재까지)
      const baseRewards = totalRewards * 0.2
      const rewardsVariation = Math.cos(i / 7) * (totalRewards * 0.05)
      const rewardsValue = baseRewards + (totalRewards * 0.8 * progress) + rewardsVariation
      
      // 수익률 계산 (보상 / 스테이킹 금액)
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

  return (
    <div className="staking-page">
      <div className="staking-header">
        <button className="back-button" onClick={onBack}>
          ← {t('staking.backToStaking', language)}
        </button>
        <h1 className="staking-title">{t('staking.options.native.title', language)}</h1>
      </div>

      <div className="staking-content">
        <div className="native-staking-form">
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
              <div className="staking-input-container">
                <div className="staking-input-header">
                  <label className="staking-input-label">
                    {t('staking.stakingAmount', language)}
                  </label>
                  <span className="staking-input-hint">
                    {t('staking.minStakingReason', language)}
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
                      <linearGradient id="colorStaking" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="#00f2fe" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRewards" x1="0" y1="0" x2="0" y2="1">
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
                        if (value >= 1000) {
                          return `${(value / 1000).toFixed(1)}K`
                        }
                        return value.toString()
                      }}
                      width={50}
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
                        
                        if (name === t('staking.chartStakingAmount', language)) {
                          return [`${parseFloat(value).toLocaleString(locale)} SET`, name]
                        } else if (name === t('staking.chartTotalRewards', language)) {
                          // 누적 수익은 스테이킹 금액 + 보상 금액의 합계가 아니라 보상 금액만 표시
                          const stakingAmount = data?.staking || 0
                          const rewardsAmount = parseFloat(value) || 0
                          const profitRate = stakingAmount > 0 ? ((rewardsAmount / stakingAmount) * 100).toFixed(2) : 0
                          return [
                            `${rewardsAmount.toLocaleString(locale)} SET (+${profitRate}%)`, 
                            name
                          ]
                        }
                        return [`${parseFloat(value).toLocaleString(locale)} SET`, name]
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
                      fill="url(#colorStaking)"
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
                      fill="url(#colorRewards)"
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
                      {rewardPaymentCycle === 'daily' ? t('staking.daily', language) : t('staking.weekly', language)}
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
                        {t('staking.unstakingWarningMessage', language)}
                      </div>
                    </div>
                  </div>
                )}
                
                {unstakingStatus === 'active' && currentStaking > 0 && (
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

export default NativeStakingPage
