import React, { useState, useEffect } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import './GamePage.css'

const GamePage = ({ onBack, language: propLanguage }) => {
  // prop으로 받은 language가 있으면 사용, 없으면 localStorage에서 가져오기
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [selectedGame, setSelectedGame] = useState(null)

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

  const gameOptions = [
    {
      id: 'casino'
    },
    {
      id: 'investment'
    }
  ]

  const handleSeeMore = (game) => {
    setSelectedGame(game)
  }

  const handleCloseDetail = () => {
    setSelectedGame(null)
  }

  const getGameDetail = (id) => {
    return {
      title: t(`game.details.${id}.title`, language),
      content: t(`game.details.${id}.content`, language)
    }
  }

  return (
    <div className="game-page">
      <div className="game-header">
        <button className="back-button" onClick={onBack}>
          ← {t('game.back', language)}
        </button>
        <h1 className="game-title">
          {t('game.title', language)}
        </h1>
      </div>

      <div className="game-content">
        <div className="game-grid">
          {gameOptions.map((option) => (
            <div key={option.id} className="game-card">
              <div className="game-card-header">
                <h3 className="game-card-title">
                  {t(`game.options.${option.id}.title`, language)}
                </h3>
              </div>
              <p className="game-card-description">
                {t(`game.options.${option.id}.description`, language)}
              </p>
              <button
                className="game-see-more-btn"
                onClick={() => handleSeeMore(option)}
              >
                {t('game.seeMore', language)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 상세 설명 플로팅 화면 */}
      {selectedGame && (
        <div className="game-detail-overlay" onClick={handleCloseDetail}>
          <div className="game-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="game-detail-header">
              <h2 className="game-detail-title">
                {getGameDetail(selectedGame.id).title}
              </h2>
              <button className="game-detail-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>
            
            <div className="game-detail-content">
              <div className="game-status-message">
                {t('game.comingSoon', language)}
              </div>
              <p className="game-detail-text">
                {getGameDetail(selectedGame.id).content}
              </p>
            </div>

            <div className="game-detail-footer">
              <button className="game-back-button" onClick={handleCloseDetail}>
                {t('game.backToGame', language)}
              </button>
              <button className="game-back-button" onClick={handleCloseDetail}>
                {t('game.backToGame', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GamePage

