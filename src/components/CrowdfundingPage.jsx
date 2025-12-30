import React, { useState, useEffect } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import './CrowdfundingPage.css'

const CrowdfundingPage = ({ onBack, language: propLanguage }) => {
  // prop으로 받은 language가 있으면 사용, 없으면 localStorage에서 가져오기
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [selectedCrowdfunding, setSelectedCrowdfunding] = useState(null)

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

      {/* 상세 설명 플로팅 화면 */}
      {selectedCrowdfunding && (
        <div className="crowdfunding-detail-overlay" onClick={handleCloseDetail}>
          <div className="crowdfunding-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crowdfunding-detail-header">
              <h2 className="crowdfunding-detail-title">
                {getCrowdfundingDetail(selectedCrowdfunding.id).title}
              </h2>
              <button className="crowdfunding-detail-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>
            
            <div className="crowdfunding-detail-content">
              <div className="crowdfunding-status-message">
                {t('crowdfunding.comingSoon', language)}
              </div>
              <p className="crowdfunding-detail-text">
                {getCrowdfundingDetail(selectedCrowdfunding.id).content}
              </p>
            </div>

            <div className="crowdfunding-detail-footer">
              <button className="crowdfunding-back-button" onClick={handleCloseDetail}>
                {t('crowdfunding.backToCrowdfunding', language)}
              </button>
              <button className="crowdfunding-back-button" onClick={handleCloseDetail}>
                {t('crowdfunding.backToCrowdfunding', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CrowdfundingPage

