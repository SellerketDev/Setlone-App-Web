import React, { useState, useEffect } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import './AITradingPage.css'

const AITradingPage = ({ onBack, language: propLanguage }) => {
  // prop으로 받은 language가 있으면 사용, 없으면 localStorage에서 가져오기
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [selectedTrading, setSelectedTrading] = useState(null)

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

  const tradingOptions = [
    {
      id: 'crypto'
    },
    {
      id: 'stocks'
    },
    {
      id: 'futures'
    },
    {
      id: 'commodities'
    },
    {
      id: 'etf'
    },
    {
      id: 'bonds'
    }
  ]

  const handleSeeMore = (trading) => {
    setSelectedTrading(trading)
  }

  const handleCloseDetail = () => {
    setSelectedTrading(null)
  }

  const getTradingDetail = (id) => {
    return {
      title: t(`aiTrading.details.${id}.title`, language),
      content: t(`aiTrading.details.${id}.content`, language)
    }
  }

  return (
    <div className="ai-trading-page">
      <div className="ai-trading-header">
        <button className="back-button" onClick={onBack}>
          ← {t('aiTrading.back', language)}
        </button>
        <h1 className="ai-trading-title">
          {t('aiTrading.title', language)}
        </h1>
      </div>

      <div className="ai-trading-content">
        <div className="ai-trading-grid">
          {tradingOptions.map((option) => (
            <div key={option.id} className="ai-trading-card">
              <div className="ai-trading-card-header">
                <h3 className="ai-trading-card-title">
                  {t(`aiTrading.options.${option.id}.title`, language)}
                </h3>
              </div>
              <p className="ai-trading-card-description">
                {t(`aiTrading.options.${option.id}.description`, language)}
              </p>
              <button
                className="ai-trading-see-more-btn"
                onClick={() => handleSeeMore(option)}
              >
                {t('aiTrading.seeMore', language)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 상세 설명 플로팅 화면 */}
      {selectedTrading && (
        <div className="ai-trading-detail-overlay" onClick={handleCloseDetail}>
          <div className="ai-trading-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-trading-detail-header">
              <h2 className="ai-trading-detail-title">
                {getTradingDetail(selectedTrading.id).title}
              </h2>
              <button className="ai-trading-detail-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>
            
            <div className="ai-trading-detail-content">
              <div className="ai-trading-status-message">
                {t('aiTrading.comingSoon', language)}
              </div>
              <p className="ai-trading-detail-text">
                {getTradingDetail(selectedTrading.id).content}
              </p>
            </div>

            <div className="ai-trading-detail-footer">
              <button className="ai-trading-back-button" onClick={handleCloseDetail}>
                {t('aiTrading.backToTrading', language)}
              </button>
              <button className="ai-trading-back-button" onClick={handleCloseDetail}>
                {t('aiTrading.backToTrading', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AITradingPage

