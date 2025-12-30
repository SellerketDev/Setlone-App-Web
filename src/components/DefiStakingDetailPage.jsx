import React, { useState, useEffect, useMemo } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import { getToken, fetchWithAuth } from '../utils/auth'
import { getApiUrl } from '../config/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import './StakingPage.css'

const DefiStakingDetailPage = ({ onBack, language: propLanguage, product, onLoginRequired }) => {
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // DeFi 동의 상태
  const [defiAgreements, setDefiAgreements] = useState({
    understandDecentralized: false,
    understandSmartContract: false,
    understandNoGuarantee: false,
    understandIrreversible: false
  })
  
  // DeFi 스테이킹 상태
  const [walletAddress, setWalletAddress] = useState('')
  const [balance, setBalance] = useState(0)
  const [stakingAmount, setStakingAmount] = useState('')
  const [isStaking, setIsStaking] = useState(false)
  const [stakingStatus, setStakingStatus] = useState(null)
  const [currentStaking, setCurrentStaking] = useState(0)
  const [totalRewards, setTotalRewards] = useState(0)
  const [unclaimedRewards, setUnclaimedRewards] = useState(0)
  const [protocol, setProtocol] = useState(product?.protocol || 'Lido')
  const [network, setNetwork] = useState(product?.network || 'Ethereum')
  const [isLoadingStakingData, setIsLoadingStakingData] = useState(false)
  const [transactionHistory, setTransactionHistory] = useState([])
  const [protocolInfo, setProtocolInfo] = useState({
    website: 'https://lido.fi',
    audit: true,
    contractAddress: '0x...'
  })

  // 스테이킹 설정
  const minStakingAmount = 100
  const maxStakingAmount = balance
  const networkFee = 0.001 // 예상 네트워크 수수료

  // 예상 수익 계산 (변동)
  const calculateEstimatedRewards = (amount) => {
    if (!amount || isNaN(parseFloat(amount))) return 0
    // DeFi는 변동 보상이므로 예상치만 표시
    const numAmount = parseFloat(amount)
    const estimatedDailyReward = (numAmount * 0.05 / 100) / 365 // 예상 5% APY
    return estimatedDailyReward.toFixed(4)
  }

  // 총 수익률 계산
  const totalReturnRate = useMemo(() => {
    if (currentStaking === 0) return 0
    return ((totalRewards / currentStaking) * 100).toFixed(2)
  }, [currentStaking, totalRewards])

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
        setWalletAddress('0x1234...5678')
        setBalance(10000)
        setCurrentStaking(5000)
        setTotalRewards(300)
        setUnclaimedRewards(50)
        setTransactionHistory([
          { hash: '0xabc...', type: 'deposit', amount: 5000, date: new Date() },
          { hash: '0xdef...', type: 'reward', amount: 300, date: new Date() }
        ])
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
      setStakingAmount(value)
    }
  }

  // MAX 버튼 클릭
  const handleMaxClick = () => {
    setStakingAmount(balance.toString())
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
    if (numAmount < minStakingAmount) {
      return { valid: false, message: t('staking.minAmountError', language, { min: minStakingAmount }) }
    }
    if (numAmount > balance) {
      return { valid: false, message: t('staking.insufficientBalance', language) }
    }
    return { valid: true }
  }

  // 스테이킹 실행
  const handleStakeNow = async () => {
    if (!isLoggedIn) {
      if (onLoginRequired) {
        onLoginRequired()
      }
      return
    }

    const validation = validateAmount(stakingAmount)
    if (!validation.valid) {
      alert(validation.message)
      return
    }

    setIsStaking(true)
    setStakingStatus(null)

    try {
      // TODO: 실제 스마트컨트랙트 호출
      // 1. 지갑 연결 확인
      // 2. 토큰 승인
      // 3. 스마트컨트랙트 예치
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setStakingStatus('success')
      setCurrentStaking(prev => prev + parseFloat(stakingAmount))
      setStakingAmount('')
      
      setTimeout(() => {
        setStakingStatus(null)
      }, 3000)
      
      await loadStakingData()
    } catch (error) {
      console.error('Staking failed:', error)
      setStakingStatus('failed')
    } finally {
      setIsStaking(false)
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
      
      const progress = (29 - i) / 29
      const baseStaking = currentStaking * 0.7
      const variation = Math.sin(i / 5) * (currentStaking * 0.1)
      const stakingValue = baseStaking + variation + progress * (currentStaking * 0.3)
      
      const baseRewards = totalRewards * 0.7
      const rewardsVariation = Math.cos(i / 7) * (totalRewards * 0.1)
      const rewardsValue = baseRewards + rewardsVariation + progress * (totalRewards * 0.3)
      
      data.push({
        date: date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
        dateFull: date.toLocaleDateString(locale),
        staking: Math.max(0, Math.round(stakingValue)),
        rewards: Math.max(0, Math.round(rewardsValue * 10) / 10)
      })
    }
    return data
  }, [currentStaking, totalRewards, language])

  return (
    <div className="staking-page">
      <div className="staking-header">
        <button className="back-button" onClick={onBack}>
          ← {t('staking.back', language)}
        </button>
        <h1 className="staking-title">
          {t('staking.defiStaking', language)} ({product?.name || 'ETH'})
        </h1>
      </div>

      <div className="staking-content">
        <div className="native-staking-form">

          {/* 상단 요약 카드 */}
          <div className="staking-header-info">
            <div className="staking-header-balance">
              <span className="staking-header-label">{t('staking.protocol', language)}</span>
              <span className="staking-header-value">{protocol}</span>
            </div>
            <div className="staking-header-apy">
              <span className="staking-header-label">{t('staking.network', language)}</span>
              <span className="staking-header-value apy-highlight">{network}</span>
            </div>
          </div>

          {/* 작동 방식 설명 (DeFi 전용) */}
          <div className="staking-info-box" style={{ marginBottom: '24px' }}>
            <h3 className="staking-info-box-title">작동 방식</h3>
            <div className="staking-info-box-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255, 87, 34, 0.1)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🔗</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                      {t('staking.walletConnection', language)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                      {t('staking.walletConnectionDescription', language)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', fontSize: '20px' }}>↓</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255, 87, 34, 0.1)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                      {t('staking.tokenApproval', language)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                      {t('staking.tokenApprovalDescription', language)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', fontSize: '20px' }}>↓</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255, 87, 34, 0.1)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📤</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                      {t('staking.smartContractDeposit', language)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                      {t('staking.smartContractDepositDescription', language)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', fontSize: '20px' }}>↓</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255, 87, 34, 0.1)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '20px' }}>💰</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                      {t('staking.rewardGeneration', language)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                      {t('staking.rewardGenerationDescription', language)}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ 
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(255, 87, 34, 0.1)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center'
              }}>
                ⚠️ CeFi와 다르게 <strong>사용자가 직접</strong> 스마트컨트랙트와 상호작용합니다
              </div>
            </div>
          </div>

          {/* DeFi 전용 대시보드 */}
          {isLoggedIn ? (
            <div className="staking-info-grid">
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.walletAddress', language)}</span>
                <span className="staking-info-value" style={{ fontSize: '12px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {walletAddress || 'Not Connected'}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.participatingProtocol', language)}</span>
                <span className="staking-info-value">{protocol}</span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.depositedAssets', language)}</span>
                <span className="staking-info-value">
                  {isLoadingStakingData ? '...' : `${currentStaking.toLocaleString()} ${product?.name || 'ETH'}`}
                </span>
              </div>
              <div className="staking-info-card">
                <span className="staking-info-label">{t('staking.unclaimedRewards', language)}</span>
                <span className="staking-info-value rewards-value">
                  {isLoadingStakingData ? '...' : `+${unclaimedRewards.toLocaleString()} ${product?.name || 'ETH'}`}
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

          {/* 리스크 안내 박스 */}
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
                        {t('staking.variable', language)}: ~{calculateEstimatedRewards(stakingAmount)} {product?.name || 'ETH'}
                      </span>
                    </div>
                    <div className="staking-estimated-item">
                      <span className="staking-estimated-label">{t('staking.networkFee', language)}</span>
                      <span className="staking-estimated-value">
                        {networkFee} {network}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 프로토콜 정보 */}
          <div className="staking-info-box">
            <h3 className="staking-info-box-title">{t('staking.protocolInfo', language)}</h3>
            <div className="staking-info-box-content">
              <div className="staking-info-box-item">
                <span className="staking-info-box-label">{t('staking.officialWebsite', language)}</span>
                <a href={protocolInfo.website} target="_blank" rel="noopener noreferrer" className="staking-info-box-link">
                  {protocolInfo.website}
                </a>
              </div>
              <div className="staking-info-box-item">
                <span className="staking-info-box-label">{t('staking.auditStatus', language)}</span>
                <span className="staking-info-box-value">
                  {protocolInfo.audit ? t('staking.audited', language) : t('staking.notAudited', language)}
                </span>
              </div>
              <div className="staking-info-box-item">
                <span className="staking-info-box-label">{t('staking.contractAddress', language)}</span>
                <span className="staking-info-box-value" style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {protocolInfo.contractAddress}
                </span>
              </div>
            </div>
          </div>

          {/* 참여 전 동의 UI (DeFi 전용) */}
          {isLoggedIn && (
            <div className="staking-warning-box" style={{ marginBottom: '24px' }}>
              <div className="staking-warning-header">
                <span className="staking-warning-title">⚠️ 참여 전 필수 동의 (모두 체크 필요)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={defiAgreements?.understandDecentralized || false}
                    onChange={(e) => setDefiAgreements(prev => ({ ...prev, understandDecentralized: e.target.checked }))}
                    style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.9)' }}>
                    {t('staking.defiAgreement1', language)}
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={defiAgreements?.understandSmartContract || false}
                    onChange={(e) => setDefiAgreements(prev => ({ ...prev, understandSmartContract: e.target.checked }))}
                    style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.9)' }}>
                    {t('staking.defiAgreement2', language)}
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={defiAgreements?.understandNoGuarantee || false}
                    onChange={(e) => setDefiAgreements(prev => ({ ...prev, understandNoGuarantee: e.target.checked }))}
                    style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.9)' }}>
                    {t('staking.defiAgreement3', language)}
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={defiAgreements?.understandIrreversible || false}
                    onChange={(e) => setDefiAgreements(prev => ({ ...prev, understandIrreversible: e.target.checked }))}
                    style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.9)' }}>
                    {t('staking.defiAgreement4', language)}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 스테이킹 실행 버튼 */}
          {isLoggedIn && (
            <div className="staking-action-section">
              <button 
                className="staking-stake-button-primary" 
                onClick={handleStakeNow}
                disabled={
                  isStaking || 
                  !stakingAmount || 
                  parseFloat(stakingAmount) <= 0 ||
                  !(defiAgreements?.understandDecentralized && 
                    defiAgreements?.understandSmartContract && 
                    defiAgreements?.understandNoGuarantee && 
                    defiAgreements?.understandIrreversible)
                }
              >
                {isStaking ? t('staking.staking', language) : t('staking.connectAndStake', language)}
              </button>
              {!(defiAgreements?.understandDecentralized && 
                 defiAgreements?.understandSmartContract && 
                 defiAgreements?.understandNoGuarantee && 
                 defiAgreements?.understandIrreversible) && (
                <p style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#ff5722',
                  textAlign: 'center'
                }}>
                  {t('staking.pleaseAgreeAll', language) || '모든 동의 항목을 체크해주세요'}
                </p>
              )}
            </div>
          )}

          {/* 스테이킹 내역 및 차트 */}
          {isLoggedIn && currentStaking > 0 && (
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
                      <linearGradient id="colorStakingDefi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="#00f2fe" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRewardsDefi" x1="0" y1="0" x2="0" y2="1">
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
                      formatter={(value, name, props) => {
                        const data = props.payload
                        const locale = language === 'ko' ? 'ko-KR' : 'en-US'
                        
                        if (name === t('staking.chartStakingAmount', language)) {
                          return [`${parseFloat(value).toLocaleString(locale)} ${product?.name || 'ETH'}`, name]
                        } else if (name === t('staking.chartTotalRewards', language)) {
                          const stakingAmount = data?.staking || 0
                          const rewardsAmount = parseFloat(value) || 0
                          const profitRate = stakingAmount > 0 ? ((rewardsAmount / stakingAmount) * 100).toFixed(2) : 0
                          return [
                            `${rewardsAmount.toLocaleString(locale)} ${product?.name || 'ETH'} (+${profitRate}%)`, 
                            name
                          ]
                        }
                        return [`${parseFloat(value).toLocaleString(locale)} ${product?.name || 'ETH'}`, name]
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
                      fill="url(#colorStakingDefi)"
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
                      fill="url(#colorRewardsDefi)"
                      name={t('staking.chartTotalRewards', language)}
                      dot={false}
                      activeDot={{ r: 5, fill: '#4facfe', strokeWidth: 2, stroke: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 트랜잭션 기록 */}
              {transactionHistory.length > 0 && (
                <div className="staking-transaction-history" style={{ marginTop: '24px' }}>
                  <h4 className="staking-transaction-title">{t('staking.transactionHistory', language)}</h4>
                  <div className="staking-transaction-list">
                    {transactionHistory.map((tx, index) => (
                      <div key={index} className="staking-transaction-item">
                        <div className="staking-transaction-info">
                          <span className="staking-transaction-type">{tx.type}</span>
                          <span className="staking-transaction-amount">
                            {tx.amount.toLocaleString()} {product?.name || 'ETH'}
                          </span>
                        </div>
                        <a 
                          href={`https://etherscan.io/tx/${tx.hash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="staking-transaction-link"
                          style={{ color: '#4facfe' }}
                        >
                          {tx.hash.substring(0, 10)}... ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
    </div>
  )
}

export default DefiStakingDetailPage

