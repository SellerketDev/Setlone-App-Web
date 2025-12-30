import React, { useState, useEffect, useMemo } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import { getToken, fetchWithAuth } from '../utils/auth'
import { getApiUrl } from '../config/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import './StakingPage.css'

const RestakingDetailPage = ({ onBack, language: propLanguage, product, onLoginRequired }) => {
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // 리스테이킹 상태
  const [balance, setBalance] = useState(0)
  const [restakingInputAmount, setRestakingInputAmount] = useState('')
  const [isRestaking, setIsRestaking] = useState(false)
  const [stakingStatus, setStakingStatus] = useState(null)
  const [basicStaking, setBasicStaking] = useState(0) // 기본 스테이킹 자산
  const [restakingAmount, setRestakingAmount] = useState(0) // 리스테이킹 참여 자산
  const [participatingAVS, setParticipatingAVS] = useState([]) // 참여 중인 AVS
  const [basicRewards, setBasicRewards] = useState(0) // 누적 기본 보상
  const [additionalRewards, setAdditionalRewards] = useState(0) // 누적 추가 보상
  const [riskStatus, setRiskStatus] = useState('normal') // 리스크 상태
  const [isLoadingStakingData, setIsLoadingStakingData] = useState(false)
  const [selectedAVS, setSelectedAVS] = useState(null)

  // 스테이킹 설정
  const minRestakingAmount = 100
  const maxRestakingAmount = basicStaking

  // 예상 추가 보상 계산 (변동)
  const calculateExpectedAdditionalReward = (amount) => {
    if (!amount || isNaN(parseFloat(amount))) return 0
    const numAmount = parseFloat(amount)
    // 변동 보상이므로 예상치만 표시
    const estimatedDaily = (numAmount * 0.02) / 365 // 예상 2% APY
    return estimatedDaily.toFixed(4)
  }

  // 인증 상태 체크 및 스테이킹 데이터 로드
  useEffect(() => {
    const token = getToken()
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(!!(token && loggedIn))
    
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
      setTimeout(() => {
        setBalance(10000)
        setBasicStaking(5000)
        setRestakingAmount(2000)
        setParticipatingAVS([
          { id: 'avs1', name: 'EigenLayer', role: 'Data Availability', rewardType: 'Variable', slashingCondition: 'Misbehavior' }
        ])
        setBasicRewards(150)
        setAdditionalRewards(50)
        setRiskStatus('normal')
        setIsLoadingStakingData(false)
      }, 500)
    } catch (error) {
      console.error('Failed to load staking data:', error)
      setIsLoadingStakingData(false)
    }
  }

  // 금액 입력 핸들러
  const handleAmountChange = (e) => {
    const value = e.target.value
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setRestakingInputAmount(value)
    }
  }

  // MAX 버튼 클릭
  const handleMaxClick = () => {
    setRestakingInputAmount(basicStaking.toString())
  }

  // 금액 검증
  const validateAmount = (amount) => {
    if (!amount || amount.trim() === '') {
      return { valid: false, message: t('staking.invalidAmount', language) }
    }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return { valid: false, message: t('staking.invalidAmount', language) }
    }
    if (numAmount < minRestakingAmount) {
      return { valid: false, message: t('staking.minAmountError', language, { min: minRestakingAmount }) }
    }
    if (numAmount > basicStaking) {
      return { valid: false, message: t('staking.insufficientBasicStaking', language) }
    }
    return { valid: true }
  }

  // 리스테이킹 실행
  const handleRestakeNow = async () => {
    if (!isLoggedIn) {
      if (onLoginRequired) {
        onLoginRequired()
      }
      return
    }

    const validation = validateAmount(restakingInputAmount)
    if (!validation.valid) {
      alert(validation.message)
      return
    }

    setIsRestaking(true)
    setStakingStatus(null)

    try {
      // TODO: 실제 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setStakingStatus('success')
      setRestakingAmount(prev => prev + parseFloat(restakingInputAmount))
      setRestakingInputAmount('')
      
      setTimeout(() => {
        setStakingStatus(null)
      }, 3000)
      
      await loadStakingData()
    } catch (error) {
      console.error('Restaking failed:', error)
      setStakingStatus('failed')
    } finally {
      setIsRestaking(false)
    }
  }

  // 차트 데이터 생성
  const chartData = useMemo(() => {
    const data = []
    const today = new Date()
    const locale = language === 'ko' ? 'ko-KR' : 'en-US'
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const baseBasic = basicStaking * 0.7
      const basicVariation = Math.sin(i / 5) * (basicStaking * 0.1)
      const basicValue = baseBasic + basicVariation + (29 - i) * (basicStaking * 0.01)
      
      const baseRestaking = restakingAmount * 0.7
      const restakingVariation = Math.cos(i / 6) * (restakingAmount * 0.1)
      const restakingValue = baseRestaking + restakingVariation + (29 - i) * (restakingAmount * 0.01)
      
      const baseBasicRewards = basicRewards * 0.7
      const basicRewardsVariation = Math.sin(i / 7) * (basicRewards * 0.1)
      const basicRewardsValue = baseBasicRewards + basicRewardsVariation + (29 - i) * (basicRewards * 0.01)
      
      const baseAdditionalRewards = additionalRewards * 0.7
      const additionalRewardsVariation = Math.cos(i / 8) * (additionalRewards * 0.1)
      const additionalRewardsValue = baseAdditionalRewards + additionalRewardsVariation + (29 - i) * (additionalRewards * 0.01)
      
      data.push({
        date: date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
        dateFull: date.toLocaleDateString(locale),
        basicStaking: Math.max(0, Math.round(basicValue)),
        restaking: Math.max(0, Math.round(restakingValue)),
        basicRewards: Math.max(0, Math.round(basicRewardsValue * 10) / 10),
        additionalRewards: Math.max(0, Math.round(additionalRewardsValue * 10) / 10)
      })
    }
    return data
  }, [basicStaking, restakingAmount, basicRewards, additionalRewards, language])

  return (
    <div className="staking-page">
      <div className="staking-header">
        <button className="back-button" onClick={onBack}>
          ← {t('staking.back', language)}
        </button>
        <h1 className="staking-title">
          {t('staking.restaking', language)} ({product?.name || 'ETH'})
        </h1>
      </div>

      <div className="staking-content">
        <div className="native-staking-form">

          {/* 상단 요약 카드 */}
          <div className="staking-header-info">
            <div className="staking-header-balance">
              <span className="staking-header-label">{t('staking.basicStaking', language)}</span>
              <span className="staking-header-value">
                {isLoadingStakingData ? '...' : `${basicStaking.toLocaleString()} ${product?.name || 'ETH'}`}
              </span>
            </div>
            <div className="staking-header-apy">
              <span className="staking-header-label">{t('staking.restakingStatus', language)}</span>
              <span className="staking-header-value apy-highlight">
                {isLoadingStakingData ? '...' : restakingAmount > 0 ? t('staking.participating', language) : t('staking.notParticipating', language)}
              </span>
            </div>
          </div>

          {/* 리스크 요약 박스 */}
          <div className="staking-warning-box staking-risk-box" style={{ marginBottom: '24px' }}>
            <div className="staking-warning-header">
              <span className="staking-warning-title">{t('staking.restakingMainRisk', language)}</span>
            </div>
            <ul className="staking-risk-list">
              <li>{t('staking.restakingMainRisk1', language)}</li>
              <li>{t('staking.restakingMainRisk2', language)}</li>
              <li>{t('staking.restakingMainRisk3', language)}</li>
              <li>{t('staking.restakingMainRisk4', language)}</li>
            </ul>
          </div>

          {/* 잔액 및 스테이킹 정보 */}
          {isLoggedIn ? (
            <div className="staking-info-grid">
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.basicStakingAsset', language)}</span>
                <span className="staking-info-value">
                  {isLoadingStakingData ? '...' : `${basicStaking.toLocaleString()} ${product?.name || 'ETH'}`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.restakingParticipatingAsset', language)}</span>
                <span className="staking-info-value">
                  {isLoadingStakingData ? '...' : `${restakingAmount.toLocaleString()} ${product?.name || 'ETH'}`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.participatingAVS', language)}</span>
                <span className="staking-info-value">
                  {isLoadingStakingData ? '...' : participatingAVS.length > 0 ? participatingAVS.map(avs => avs.name).join(', ') : t('staking.none', language)}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.accumulatedBasicReward', language)}</span>
                <span className="staking-info-value rewards-value">
                  {isLoadingStakingData ? '...' : `+${basicRewards.toLocaleString()} ${product?.name || 'ETH'}`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.accumulatedAdditionalReward', language)}</span>
                <span className="staking-info-value rewards-value">
                  {isLoadingStakingData ? '...' : `+${additionalRewards.toLocaleString()} ${product?.name || 'ETH'}`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.currentRiskStatus', language)}</span>
                <span className="staking-info-value" style={{ color: riskStatus === 'normal' ? '#4facfe' : '#ff5722' }}>
                  {isLoadingStakingData ? '...' : t(`staking.riskStatus.${riskStatus}`, language)}
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

          {/* 참여 입력 영역 */}
          {isLoggedIn && (
            <div className="staking-action-section">
              <div className="staking-input-container">
                <div className="staking-input-header">
                  <label className="staking-input-label">
                    {t('staking.restakingParticipatingAmount', language)}
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
                    value={restakingInputAmount}
                    onChange={handleAmountChange}
                    disabled={isRestaking}
                  />
                  <button
                    className="staking-max-button"
                    onClick={handleMaxClick}
                    disabled={isRestaking || basicStaking === 0}
                  >
                    {t('staking.max', language)}
                  </button>
                </div>
                {restakingInputAmount && parseFloat(restakingInputAmount) > 0 && (
                  <div className="staking-estimated-rewards">
                    <div className="staking-estimated-item">
                      <span className="staking-estimated-label">{t('staking.expectedAdditionalReward', language)}</span>
                      <span className="staking-estimated-value">
                        {t('staking.variable', language)} (+{calculateExpectedAdditionalReward(restakingInputAmount)} {product?.name || 'ETH'}/일)
                      </span>
                    </div>
                    <div className="staking-estimated-item">
                      <span className="staking-estimated-label">{t('staking.participatingServiceAVS', language)}</span>
                      <span className="staking-estimated-value">
                        {t('staking.select', language)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                className="staking-stake-button-primary" 
                onClick={handleRestakeNow}
                disabled={isRestaking || !restakingInputAmount || parseFloat(restakingInputAmount) <= 0}
              >
                {isRestaking ? t('staking.restaking', language) : t('staking.startRestaking', language)}
              </button>
            </div>
          )}

          {/* 참여 AVS 정보 */}
          {isLoggedIn && participatingAVS.length > 0 && (
            <div className="staking-recommendation-section">
              <h4 className="staking-recommendation-title">{t('staking.participatingSecurityService', language)}</h4>
              {participatingAVS.map((avs) => (
                <div key={avs.id} className="staking-recommendation-item" style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="staking-recommendation-text" style={{ fontWeight: '600' }}>{avs.name}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    <div>{t('staking.role', language)}: {avs.role}</div>
                    <div>{t('staking.rewardType', language)}: {avs.rewardType}</div>
                    <div>{t('staking.slashingCondition', language)}: {avs.slashingCondition}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 스테이킹 내역 및 차트 */}
          {isLoggedIn && (basicStaking > 0 || restakingAmount > 0) && (
            <div className="staking-history-section">
              <div className="staking-history-header">
                <h3 className="staking-history-title">{t('staking.restakingStatus', language)}</h3>
              </div>
              
              {/* 차트 */}
              <div className="staking-chart-container">
                <div className="staking-chart-header">
                  <div className="staking-chart-return-info">
                    <span className="staking-chart-return-label">{t('staking.totalReturn', language)}</span>
                    <span className="staking-chart-return-value positive">
                      +{((basicRewards + additionalRewards) / (basicStaking + restakingAmount) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                    <defs>
                      <linearGradient id="colorBasicStaking" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="#60a5fa" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRestaking" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="#a78bfa" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBasicRewards" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="#34d399" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAdditionalRewards" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
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
                      formatter={(value, name) => {
                        const locale = language === 'ko' ? 'ko-KR' : 'en-US'
                        if (name === 'basicStaking') {
                          return [`${value.toLocaleString(locale)} ${product?.name || 'ETH'}`, t('staking.basicStakingAsset', language)]
                        } else if (name === 'restaking') {
                          return [`${value.toLocaleString(locale)} ${product?.name || 'ETH'}`, t('staking.restakingParticipatingAsset', language)]
                        } else if (name === 'basicRewards') {
                          return [`${value.toLocaleString(locale)} ${product?.name || 'ETH'}`, t('staking.accumulatedBasicReward', language)]
                        } else if (name === 'additionalRewards') {
                          return [`${value.toLocaleString(locale)} ${product?.name || 'ETH'}`, t('staking.accumulatedAdditionalReward', language)]
                        }
                        return [value, name]
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="basicStaking" 
                      stroke="#60a5fa" 
                      fill="url(#colorBasicStaking)"
                      name={t('staking.basicStakingAsset', language)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="restaking" 
                      stroke="#a78bfa" 
                      fill="url(#colorRestaking)"
                      name={t('staking.restakingParticipatingAsset', language)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="basicRewards" 
                      stroke="#34d399" 
                      fill="url(#colorBasicRewards)"
                      name={t('staking.accumulatedBasicReward', language)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="additionalRewards" 
                      stroke="#fbbf24" 
                      fill="url(#colorAdditionalRewards)"
                      name={t('staking.accumulatedAdditionalReward', language)}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 상태 메시지 */}
          {stakingStatus && (
            <div className={`staking-status-message ${stakingStatus === 'success' ? 'staking-success' : 'staking-error'}`}>
              {stakingStatus === 'success' 
                ? t('staking.restakingSuccess', language)
                : t('staking.restakingFailed', language)
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RestakingDetailPage



