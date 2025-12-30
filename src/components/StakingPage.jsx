import React, { useState, useEffect } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import './StakingPage.css'

const StakingPage = ({ onBack, language: propLanguage }) => {
  // prop으로 받은 language가 있으면 사용, 없으면 localStorage에서 가져오기
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [selectedStaking, setSelectedStaking] = useState(null)

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
    setSelectedStaking(staking)
  }

  const handleCloseDetail = () => {
    setSelectedStaking(null)
  }

  const getStakingDetail = (id) => {
    return {
      title: t(`staking.details.${id}.title`, language),
      content: t(`staking.details.${id}.content`, language)
    }
  }

  return (
    <div className="staking-page">
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
              <div className="staking-status-message">
                {t('staking.comingSoon', language)}
              </div>
              <p className="staking-detail-text">
                {getStakingDetail(selectedStaking.id).content}
              </p>
            </div>

            <div className="staking-detail-footer">
              <button className="staking-back-button" onClick={handleCloseDetail}>
                {t('staking.backToStaking', language)}
              </button>
              <button className="staking-back-button" onClick={handleCloseDetail}>
                {t('staking.backToStaking', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StakingPage

