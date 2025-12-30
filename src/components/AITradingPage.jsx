import React, { useState, useEffect } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import './AITradingPage.css'
import TradingPage from './TradingPage'

const AITradingPage = ({ onBack, language: propLanguage }) => {
  // prop으로 받은 language가 있으면 사용, 없으면 localStorage에서 가져오기
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showTradingPage, setShowTradingPage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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
      id: 'crypto',
      items: [
        { id: 'BTC', symbol: 'BTC', name: 'Bitcoin' },
        { id: 'ETH', symbol: 'ETH', name: 'Ethereum' },
        { id: 'XRP', symbol: 'XRP', name: 'Ripple' },
        { id: 'BNB', symbol: 'BNB', name: 'Binance Coin' },
        { id: 'SOL', symbol: 'SOL', name: 'Solana' },
        { id: 'ADA', symbol: 'ADA', name: 'Cardano' },
        { id: 'DOGE', symbol: 'DOGE', name: 'Dogecoin' },
        { id: 'DOT', symbol: 'DOT', name: 'Polkadot' }
      ]
    },
    {
      id: 'stocks',
      items: [
        { id: 'AAPL', symbol: 'AAPL', name: 'Apple Inc.' },
        { id: 'MSFT', symbol: 'MSFT', name: 'Microsoft Corporation' },
        { id: 'GOOGL', symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { id: 'AMZN', symbol: 'AMZN', name: 'Amazon.com Inc.' },
        { id: 'TSLA', symbol: 'TSLA', name: 'Tesla Inc.' },
        { id: 'META', symbol: 'META', name: 'Meta Platforms Inc.' },
        { id: 'NVDA', symbol: 'NVDA', name: 'NVIDIA Corporation' },
        { id: 'JPM', symbol: 'JPM', name: 'JPMorgan Chase & Co.' }
      ]
    },
    {
      id: 'futures',
      items: [
        { id: 'BTC', symbol: 'BTC', name: 'Bitcoin Futures' },
        { id: 'ETH', symbol: 'ETH', name: 'Ethereum Futures' },
        { id: 'XRP', symbol: 'XRP', name: 'Ripple Futures' },
        { id: 'BNB', symbol: 'BNB', name: 'Binance Coin Futures' },
        { id: 'SOL', symbol: 'SOL', name: 'Solana Futures' },
        { id: 'ADA', symbol: 'ADA', name: 'Cardano Futures' },
        { id: 'DOGE', symbol: 'DOGE', name: 'Dogecoin Futures' },
        { id: 'DOT', symbol: 'DOT', name: 'Polkadot Futures' }
      ]
    },
    {
      id: 'commodities',
      items: [
        { id: 'GOLD', symbol: 'GOLD', name: 'Gold' },
        { id: 'SILVER', symbol: 'SILVER', name: 'Silver' },
        { id: 'OIL', symbol: 'OIL', name: 'Crude Oil' },
        { id: 'COPPER', symbol: 'COPPER', name: 'Copper' },
        { id: 'WHEAT', symbol: 'WHEAT', name: 'Wheat' },
        { id: 'CORN', symbol: 'CORN', name: 'Corn' }
      ]
    },
    {
      id: 'etf',
      items: [
        { id: 'SPY', symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
        { id: 'QQQ', symbol: 'QQQ', name: 'Invesco QQQ Trust' },
        { id: 'VTI', symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
        { id: 'IWM', symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
        { id: 'EFA', symbol: 'EFA', name: 'iShares MSCI EAFE ETF' },
        { id: 'EEM', symbol: 'EEM', name: 'iShares MSCI Emerging Markets ETF' }
      ]
    },
    {
      id: 'bonds',
      items: [
        { id: 'US10Y', symbol: 'US10Y', name: 'US 10-Year Treasury' },
        { id: 'US30Y', symbol: 'US30Y', name: 'US 30-Year Treasury' },
        { id: 'TIPS', symbol: 'TIPS', name: 'TIPS ETF' },
        { id: 'LQD', symbol: 'LQD', name: 'iShares iBoxx $ Investment Grade Corporate Bond ETF' }
      ]
    },
    {
      id: 'currency',
      items: [
        { id: 'EURUSD', symbol: 'EURUSD', name: 'Euro / US Dollar' },
        { id: 'GBPUSD', symbol: 'GBPUSD', name: 'British Pound / US Dollar' },
        { id: 'USDJPY', symbol: 'USDJPY', name: 'US Dollar / Japanese Yen' },
        { id: 'USDKRW', symbol: 'USDKRW', name: 'US Dollar / Korean Won' },
        { id: 'USDCNY', symbol: 'USDCNY', name: 'US Dollar / Chinese Yuan' },
        { id: 'AUDUSD', symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar' }
      ]
    }
  ]

  const handleCategoryClick = (category) => {
    setSelectedCategory(category)
  }

  const handleItemClick = (item) => {
    setSelectedItem({ ...item, category: selectedCategory.id })
  }

  const handleCloseDetail = () => {
    setSelectedItem(null)
  }

  const handleBackToCategory = () => {
    setSelectedItem(null)
  }

  const handleStartTrading = () => {
    setShowTradingPage(true)
  }

  const handleBackFromTrading = () => {
    setShowTradingPage(false)
    setSelectedItem(null)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleCategoryBack = () => {
    setSelectedCategory(null)
    setSearchQuery('')
  }

  const getItemDetail = (item) => {
    // 환율 항목은 번역 적용
    const itemName = selectedCategory?.id === 'currency' 
      ? t(`aiTrading.details.currency.items.${item.id}`, language) || item.name
      : item.name
    
    return {
      title: itemName,
      symbol: item.symbol,
      category: selectedCategory ? t(`aiTrading.options.${selectedCategory.id}.title`, language) : ''
    }
  }

  // 검색어로 항목 필터링
  const getFilteredItems = (items) => {
    if (!searchQuery.trim()) {
      return items
    }
    const query = searchQuery.toLowerCase().trim()
    return items.filter(item => 
      item.symbol.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query)
    )
  }

  // 트레이딩 페이지가 열려있으면 TradingPage 표시
  if (showTradingPage && selectedItem) {
    return (
      <TradingPage
        item={selectedItem}
        language={language}
        onBack={handleBackFromTrading}
      />
    )
  }

  // 카테고리 선택 시 해당 카테고리의 항목 리스트 표시
  if (selectedCategory && !selectedItem) {
    const filteredItems = getFilteredItems(selectedCategory.items)
    
    return (
      <div className="ai-trading-page">
        <div className="ai-trading-header">
          <button className="back-button" onClick={handleCategoryBack}>
            ← {t('aiTrading.back', language)}
          </button>
          <h1 className="ai-trading-title">
            {t(`aiTrading.options.${selectedCategory.id}.title`, language)}
          </h1>
        </div>

        <div className="ai-trading-content">
          {/* 검색창 */}
          <div className="ai-trading-search-container">
            <div className="ai-trading-search-box">
              <span className="ai-trading-search-icon">🔍</span>
              <input
                type="text"
                className="ai-trading-search-input"
                placeholder={t('aiTrading.searchPlaceholder', language)}
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button
                  className="ai-trading-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="ai-trading-search-results">
                {language === 'ko' 
                  ? `${filteredItems.length}개의 결과`
                  : `${filteredItems.length} results`}
              </div>
            )}
          </div>

          {/* 항목 리스트 */}
          {filteredItems.length > 0 ? (
            <div className="ai-trading-items-list">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="ai-trading-item-card"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="ai-trading-item-info">
                    <h3 className="ai-trading-item-symbol">{item.symbol}</h3>
                    <p className="ai-trading-item-name">
                      {selectedCategory?.id === 'currency' 
                        ? t(`aiTrading.details.currency.items.${item.id}`, language) || item.name
                        : item.name}
                    </p>
                  </div>
                  <button className="ai-trading-see-more-btn">
                    {t('aiTrading.seeMore', language)}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="ai-trading-no-results">
              <p>{t('aiTrading.noResults', language)}</p>
            </div>
          )}
        </div>
      </div>
    )
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
                onClick={() => handleCategoryClick(option)}
              >
                {t('aiTrading.seeMore', language)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 항목 상세 설명 플로팅 화면 */}
      {selectedItem && (
        <div className="ai-trading-detail-overlay" onClick={handleCloseDetail}>
          <div className="ai-trading-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-trading-detail-header">
              <h2 className="ai-trading-detail-title">
                {getItemDetail(selectedItem).title}
              </h2>
              <button className="ai-trading-detail-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>
            
            <div className="ai-trading-detail-content">
              <div className="ai-trading-item-symbol-large">
                {getItemDetail(selectedItem).symbol}
              </div>
              <p className="ai-trading-detail-text">
                {getItemDetail(selectedItem).category} - {getItemDetail(selectedItem).title}
              </p>
              <p className="ai-trading-detail-description">
                {t('aiTrading.itemDescription', language)}
              </p>
            </div>

            <div className="ai-trading-detail-footer">
              <button 
                className="ai-trading-start-button" 
                onClick={handleStartTrading}
              >
                {t('aiTrading.startTrading', language)}
              </button>
              <button 
                className="ai-trading-back-button" 
                onClick={handleBackToCategory}
              >
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

