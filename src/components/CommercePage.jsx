import React, { useState, useEffect } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import './CommercePage.css'

const CommercePage = ({ onBack, language: propLanguage }) => {
  // prop으로 받은 language가 있으면 사용, 없으면 localStorage에서 가져오기
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [selectedCommerce, setSelectedCommerce] = useState(null)

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

  const commerceOptions = [
    {
      id: 'sellerket',
      url: 'https://sellerket.com'
    },
    {
      id: 'web3shopping',
      url: 'https://setlone.com'
    }
  ]

  const handleSeeMore = (commerce) => {
    setSelectedCommerce(commerce)
  }

  const handleCloseDetail = () => {
    setSelectedCommerce(null)
  }

  const handleVisitSite = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const getCommerceDetail = (id) => {
    return {
      title: t(`commerce.details.${id}.title`, language),
      content: t(`commerce.details.${id}.content`, language)
    }
  }

  return (
    <div className="commerce-page">
      <div className="commerce-header">
        <button className="back-button" onClick={onBack}>
          ← {t('commerce.back', language)}
        </button>
        <h1 className="commerce-title">
          {t('commerce.title', language)}
        </h1>
      </div>

      <div className="commerce-content">
        <div className="commerce-grid">
          {commerceOptions.map((option) => (
            <div key={option.id} className="commerce-card">
              <div className="commerce-card-header">
                <h3 className="commerce-card-title">
                  {t(`commerce.options.${option.id}.title`, language)}
                </h3>
              </div>
              <p className="commerce-card-description">
                {t(`commerce.options.${option.id}.description`, language)}
              </p>
              <div className="commerce-card-actions">
                <button
                  className="commerce-see-more-btn"
                  onClick={() => handleSeeMore(option)}
                >
                  {t('commerce.seeMore', language)}
                </button>
                <button
                  className="commerce-visit-site-btn"
                  onClick={() => handleVisitSite(option.url)}
                >
                  {t('commerce.visitSite', language)}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 상세 설명 플로팅 화면 */}
      {selectedCommerce && (
        <div className="commerce-detail-overlay" onClick={handleCloseDetail}>
          <div className="commerce-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="commerce-detail-header">
              <h2 className="commerce-detail-title">
                {getCommerceDetail(selectedCommerce.id).title}
              </h2>
              <button className="commerce-detail-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>
            
            <div className="commerce-detail-content">
              <p className="commerce-detail-text">
                {getCommerceDetail(selectedCommerce.id).content}
              </p>
            </div>

            <div className="commerce-detail-footer">
              <button 
                className="commerce-visit-site-btn-large" 
                onClick={() => handleVisitSite(selectedCommerce.url)}
              >
                {t('commerce.visitSite', language)}
              </button>
              <button className="commerce-back-button" onClick={handleCloseDetail}>
                {t('commerce.backToCommerce', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommercePage

