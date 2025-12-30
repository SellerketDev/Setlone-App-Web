import React, { useState, useEffect } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import './MiningPage.css'

const MiningPage = ({ onBack, language: propLanguage }) => {
  // prop으로 받은 language가 있으면 사용, 없으면 localStorage에서 가져오기
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [selectedMining, setSelectedMining] = useState(null)

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

  const miningOptions = [
    {
      id: 'bitcoin'
    },
    {
      id: 'ethereum'
    },
    {
      id: 'coins'
    }
  ]

  const handleSeeMore = (mining) => {
    setSelectedMining(mining)
  }

  const handleCloseDetail = () => {
    setSelectedMining(null)
  }

  const getMiningDetail = (id) => {
    return {
      title: t(`mining.details.${id}.title`, language),
      content: t(`mining.details.${id}.content`, language)
    }
  }

  return (
    <div className="mining-page">
      <div className="mining-header">
        <button className="back-button" onClick={onBack}>
          ← {t('mining.back', language)}
        </button>
        <h1 className="mining-title">
          {t('mining.title', language)}
        </h1>
      </div>

      <div className="mining-content">
        <div className="mining-grid">
          {miningOptions.map((option) => (
            <div key={option.id} className="mining-card">
              <div className="mining-card-header">
                <h3 className="mining-card-title">
                  {t(`mining.options.${option.id}.title`, language)}
                </h3>
              </div>
              <p className="mining-card-description">
                {t(`mining.options.${option.id}.description`, language)}
              </p>
              <button
                className="mining-see-more-btn"
                onClick={() => handleSeeMore(option)}
              >
                {t('mining.seeMore', language)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 상세 설명 플로팅 화면 */}
      {selectedMining && (
        <div className="mining-detail-overlay" onClick={handleCloseDetail}>
          <div className="mining-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mining-detail-header">
              <h2 className="mining-detail-title">
                {getMiningDetail(selectedMining.id).title}
              </h2>
              <button className="mining-detail-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>
            
            <div className="mining-detail-content">
              <div className="mining-status-message">
                {t('mining.comingSoon', language)}
              </div>
              <p className="mining-detail-text">
                {getMiningDetail(selectedMining.id).content}
              </p>
            </div>

            <div className="mining-detail-footer">
              <button className="mining-back-button" onClick={handleCloseDetail}>
                {t('mining.backToMining', language)}
              </button>
              <button className="mining-back-button" onClick={handleCloseDetail}>
                {t('mining.backToMining', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MiningPage

