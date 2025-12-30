import React, { useState } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import './EventPage.css'

const EventPage = ({ onBack, language: propLanguage }) => {
  const [language, setLanguage] = useState(propLanguage || getCurrentLanguage())
  const [selectedTab, setSelectedTab] = useState('upcoming')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)

  // 현재 날짜를 주기적으로 업데이트 (1분마다)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000) // 1분마다 업데이트

    return () => clearInterval(interval)
  }, [])

  const eventTabs = [
    { id: 'upcoming', name: t('event.tabs.upcoming', language) },
    { id: 'ongoing', name: t('event.tabs.ongoing', language) },
    { id: 'ended', name: t('event.tabs.ended', language) },
    { id: 'winners', name: t('event.tabs.winners', language) }
  ]

  // 모든 이벤트 데이터 (단일 소스)
  const allEvents = [
    // 예정된 이벤트들
    {
      id: 1,
      title: '2026 신년 이벤트',
      author: 'Setlone',
      startDate: '2026-01-01',
      endDate: '2026-01-15',
      announceDate: '2026-01-20'
    },
    {
      id: 2,
      title: '설날 특별 프로모션',
      author: 'Setlone',
      startDate: '2026-01-28',
      endDate: '2026-02-05',
      announceDate: '2026-02-10'
    },
    {
      id: 3,
      title: '신규 서비스 런칭 기념',
      author: 'Setlone',
      startDate: '2026-01-10',
      endDate: '2026-01-31',
      announceDate: '2026-02-05'
    },
    {
      id: 4,
      title: 'VIP 회원 전용 이벤트',
      author: 'Setlone',
      startDate: '2026-01-05',
      endDate: '2026-01-20',
      announceDate: '2026-01-25'
    },
    {
      id: 5,
      title: '스테이킹 연말 정산 보너스',
      author: 'Setlone',
      startDate: '2026-01-08',
      endDate: '2026-01-25',
      announceDate: '2026-01-30'
    },
    {
      id: 6,
      title: '블록체인 게임 시즌2 오픈',
      author: 'Setlone',
      startDate: '2026-01-15',
      endDate: '2026-02-10',
      announceDate: '2026-02-15'
    },
    {
      id: 7,
      title: 'AI 트레이딩 신규 전략 출시',
      author: 'Setlone',
      startDate: '2026-01-12',
      endDate: '2026-01-28',
      announceDate: '2026-02-02'
    },
    {
      id: 8,
      title: '크라우드펀딩 프로젝트 런칭',
      author: 'Setlone',
      startDate: '2026-01-20',
      endDate: '2026-02-15',
      announceDate: '2026-02-20'
    },
    {
      id: 9,
      title: '쇼핑몰 신상품 출시 이벤트',
      author: 'Setlone',
      startDate: '2026-01-18',
      endDate: '2026-02-05',
      announceDate: '2026-02-10'
    },
    {
      id: 10,
      title: '가상화폐 채굴 보상 증액',
      author: 'Setlone',
      startDate: '2026-01-25',
      endDate: '2026-02-20',
      announceDate: '2026-02-25'
    },
    // 진행중인 이벤트들 (현재 날짜 기준으로 자동 분류됨)
    {
      id: 11,
      title: '신규 가입 이벤트',
      author: 'Setlone',
      startDate: '2025-12-23',
      endDate: '2025-12-31',
      announceDate: '2026-01-05'
    },
    {
      id: 12,
      title: '첫 거래 시 리워드 지급',
      author: 'Setlone',
      startDate: '2025-12-20',
      endDate: '2025-12-30',
      announceDate: '2026-01-05'
    },
    {
      id: 13,
      title: '스테이킹 보너스 이벤트',
      author: 'Setlone',
      startDate: '2025-12-25',
      endDate: '2026-01-05',
      announceDate: '2026-01-10'
    },
    {
      id: 14,
      title: '연말 특별 할인 프로모션',
      author: 'Setlone',
      startDate: '2025-12-22',
      endDate: '2025-12-31',
      announceDate: '2026-01-05'
    },
    {
      id: 15,
      title: '채굴 보상 2배 이벤트',
      author: 'Setlone',
      startDate: '2025-12-24',
      endDate: '2026-01-03',
      announceDate: '2026-01-08'
    },
    {
      id: 16,
      title: '친구 초대 이벤트',
      author: 'Setlone',
      startDate: '2025-12-21',
      endDate: '2026-01-10',
      announceDate: '2026-01-15'
    },
    {
      id: 17,
      title: 'AI 트레이딩 수수료 면제',
      author: 'Setlone',
      startDate: '2025-12-23',
      endDate: '2026-01-07',
      announceDate: '2026-01-12'
    },
    {
      id: 18,
      title: '크라우드펀딩 참여 혜택',
      author: 'Setlone',
      startDate: '2025-12-26',
      endDate: '2026-01-15',
      announceDate: '2026-01-20'
    },
    {
      id: 19,
      title: '쇼핑몰 구매 리워드',
      author: 'Setlone',
      startDate: '2025-12-20',
      endDate: '2025-12-31',
      announceDate: '2026-01-05'
    },
    {
      id: 20,
      title: '블록체인 게임 대회',
      author: 'Setlone',
      startDate: '2025-12-25',
      endDate: '2026-01-08',
      announceDate: '2026-01-13'
    },
    // 종료된 이벤트들
    {
      id: 21,
      title: '블랙프라이데이 특가 이벤트',
      author: 'Setlone',
      startDate: '2025-11-20',
      endDate: '2025-11-30',
      announceDate: '2025-12-05'
    },
    {
      id: 22,
      title: '가을맞이 스테이킹 프로모션',
      author: 'Setlone',
      startDate: '2025-10-15',
      endDate: '2025-11-15',
      announceDate: '2025-11-20'
    },
    {
      id: 23,
      title: '첫 거래 100% 리워드',
      author: 'Setlone',
      startDate: '2025-11-01',
      endDate: '2025-11-20',
      announceDate: '2025-11-25'
    },
    {
      id: 24,
      title: '채굴 보상 3배 이벤트',
      author: 'Setlone',
      startDate: '2025-10-20',
      endDate: '2025-11-10',
      announceDate: '2025-11-15'
    },
    {
      id: 25,
      title: 'AI 트레이딩 수수료 무료',
      author: 'Setlone',
      startDate: '2025-10-10',
      endDate: '2025-10-31',
      announceDate: '2025-11-05'
    },
    {
      id: 26,
      title: '크라우드펀딩 초기 참여 혜택',
      author: 'Setlone',
      startDate: '2025-09-15',
      endDate: '2025-10-15',
      announceDate: '2025-10-20'
    },
    {
      id: 27,
      title: '쇼핑몰 할인 쿠폰 이벤트',
      author: 'Setlone',
      startDate: '2025-11-05',
      endDate: '2025-11-25',
      announceDate: '2025-12-01'
    },
    {
      id: 28,
      title: '블록체인 게임 시즌1 종료',
      author: 'Setlone',
      startDate: '2025-09-01',
      endDate: '2025-10-30',
      announceDate: '2025-11-05'
    },
    {
      id: 29,
      title: '신규 가입 환영 이벤트',
      author: 'Setlone',
      startDate: '2025-10-01',
      endDate: '2025-10-31',
      announceDate: '2025-11-05'
    },
    {
      id: 30,
      title: '연말 정산 보너스 지급',
      author: 'Setlone',
      startDate: '2025-11-10',
      endDate: '2025-12-10',
      announceDate: '2025-12-15'
    }
  ]

  // 날짜 문자열을 Date 객체로 변환 (00:00:00 기준)
  const parseDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day, 0, 0, 0, 0)
  }

  // 현재 날짜를 YYYY-MM-DD 형식으로 변환
  const getCurrentDateString = () => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const currentDateString = getCurrentDateString()
  const currentDateObj = parseDate(currentDateString)

  // 종료된 이벤트 (고정 데이터)
  const endedEvents = [
    {
      id: 21,
      title: '블랙프라이데이 특가 이벤트',
      author: 'Setlone',
      startDate: '2025-11-20',
      endDate: '2025-11-30',
      announceDate: '2025-12-05'
    },
    {
      id: 22,
      title: '가을맞이 스테이킹 프로모션',
      author: 'Setlone',
      startDate: '2025-10-15',
      endDate: '2025-11-15',
      announceDate: '2025-11-20'
    },
    {
      id: 23,
      title: '첫 거래 100% 리워드',
      author: 'Setlone',
      startDate: '2025-11-01',
      endDate: '2025-11-20',
      announceDate: '2025-11-25'
    },
    {
      id: 24,
      title: '채굴 보상 3배 이벤트',
      author: 'Setlone',
      startDate: '2025-10-20',
      endDate: '2025-11-10',
      announceDate: '2025-11-15'
    },
    {
      id: 25,
      title: 'AI 트레이딩 수수료 무료',
      author: 'Setlone',
      startDate: '2025-10-10',
      endDate: '2025-10-31',
      announceDate: '2025-11-05'
    },
    {
      id: 26,
      title: '크라우드펀딩 초기 참여 혜택',
      author: 'Setlone',
      startDate: '2025-09-15',
      endDate: '2025-10-15',
      announceDate: '2025-10-20'
    },
    {
      id: 27,
      title: '쇼핑몰 할인 쿠폰 이벤트',
      author: 'Setlone',
      startDate: '2025-11-05',
      endDate: '2025-11-25',
      announceDate: '2025-12-01'
    },
    {
      id: 28,
      title: '블록체인 게임 시즌1 종료',
      author: 'Setlone',
      startDate: '2025-09-01',
      endDate: '2025-10-30',
      announceDate: '2025-11-05'
    },
    {
      id: 29,
      title: '신규 가입 환영 이벤트',
      author: 'Setlone',
      startDate: '2025-10-01',
      endDate: '2025-10-31',
      announceDate: '2025-11-05'
    },
    {
      id: 30,
      title: '연말 정산 보너스 지급',
      author: 'Setlone',
      startDate: '2025-11-10',
      endDate: '2025-12-10',
      announceDate: '2025-12-15'
    }
  ]

  // 당첨자 발표 (고정 데이터)
  const winnersEvents = [
    {
      id: 1,
      title: '블랙프라이데이 특가 이벤트',
      author: 'Setlone',
      startDate: '2025-11-20',
      endDate: '2025-11-30',
      announceDate: '2025-12-05'
    },
    {
      id: 2,
      title: '가을맞이 스테이킹 프로모션',
      author: 'Setlone',
      startDate: '2025-10-15',
      endDate: '2025-11-15',
      announceDate: '2025-11-20'
    },
    {
      id: 3,
      title: '첫 거래 100% 리워드',
      author: 'Setlone',
      startDate: '2025-11-01',
      endDate: '2025-11-20',
      announceDate: '2025-11-25'
    },
    {
      id: 4,
      title: '채굴 보상 3배 이벤트',
      author: 'Setlone',
      startDate: '2025-10-20',
      endDate: '2025-11-10',
      announceDate: '2025-11-15'
    },
    {
      id: 5,
      title: 'AI 트레이딩 수수료 무료',
      author: 'Setlone',
      startDate: '2025-10-10',
      endDate: '2025-10-31',
      announceDate: '2025-11-05'
    },
    {
      id: 6,
      title: '크라우드펀딩 초기 참여 혜택',
      author: 'Setlone',
      startDate: '2025-09-15',
      endDate: '2025-10-15',
      announceDate: '2025-10-20'
    },
    {
      id: 7,
      title: '쇼핑몰 할인 쿠폰 이벤트',
      author: 'Setlone',
      startDate: '2025-11-05',
      endDate: '2025-11-25',
      announceDate: '2025-12-01'
    },
    {
      id: 8,
      title: '블록체인 게임 시즌1 종료',
      author: 'Setlone',
      startDate: '2025-09-01',
      endDate: '2025-10-30',
      announceDate: '2025-11-05'
    },
    {
      id: 9,
      title: '신규 가입 환영 이벤트',
      author: 'Setlone',
      startDate: '2025-10-01',
      endDate: '2025-10-31',
      announceDate: '2025-11-05'
    },
    {
      id: 10,
      title: '연말 정산 보너스 지급',
      author: 'Setlone',
      startDate: '2025-11-10',
      endDate: '2025-12-10',
      announceDate: '2025-12-15'
    }
  ]

  // 예정된 이벤트와 진행중인 이벤트만 날짜 기준으로 분류
  const categorizeEvents = () => {
    const upcoming = []
    const ongoing = []

    allEvents.forEach(event => {
      const startDate = parseDate(event.startDate)
      const endDate = parseDate(event.endDate)
      // 종료일 다음날 00시를 기준으로 종료된 것으로 간주
      const endDateNextDay = new Date(endDate)
      endDateNextDay.setDate(endDateNextDay.getDate() + 1)

      // 진행중인 이벤트: 시작일이 현재보다 과거이고, 종료일 다음날이 현재보다 미래
      if (startDate <= currentDateObj && endDateNextDay > currentDateObj) {
        ongoing.push(event)
      }
      // 예정된 이벤트: 시작일이 현재보다 미래
      else if (startDate > currentDateObj) {
        upcoming.push(event)
      }
    })

    return { upcoming, ongoing }
  }

  const getEvents = () => {
    const { upcoming, ongoing } = categorizeEvents()
    
    switch (selectedTab) {
      case 'upcoming':
        return upcoming
      case 'ongoing':
        return ongoing
      case 'ended':
        return endedEvents
      case 'winners':
        return winnersEvents
      default:
        return []
    }
  }

  const events = getEvents()

  return (
    <div className="event-page">
      <div className="event-header">
        <button className="back-button" onClick={onBack}>
          ← {t('event.back', language)}
        </button>
        <h1 className="event-title">{t('event.title', language)}</h1>
      </div>

      <div className="event-content">
        <div className="event-tabs">
          {eventTabs.map((tab) => (
            <button
              key={tab.id}
              className={`event-tab ${selectedTab === tab.id ? 'active' : ''}`}
              onClick={() => setSelectedTab(tab.id)}
            >
              <span className="event-tab-name">{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="event-list">
          {events.length > 0 ? (
            events.map((event) => (
              <div 
                key={event.id} 
                className="event-toast"
                onClick={() => {
                  if (selectedTab === 'ongoing') {
                    setSelectedEvent(event)
                    setShowEventModal(true)
                  }
                }}
                style={{ cursor: selectedTab === 'ongoing' ? 'pointer' : 'default' }}
              >
                <div className="event-toast-image">
                  <span className="event-image-placeholder">
                    {t('event.imageNotRegistered', language)}
                  </span>
                </div>
                <div className="event-toast-content">
                  <h3 className="event-toast-title">{event.title}</h3>
                  <div className="event-toast-footer">
                    <span className="event-toast-author">{event.author}</span>
                    {selectedTab === 'winners' ? (
                      <span className="event-announce-date">
                        {t('event.announceDate', language)}: {event.announceDate}
                      </span>
                    ) : (
                      <span className="event-toast-period">
                        {event.startDate} ~ {event.endDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="event-empty">
              <p className="event-empty-text">
                {t(`event.empty.${selectedTab}`, language)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 이벤트 상세 모달 */}
      {showEventModal && selectedEvent && (
        <div 
          className="event-modal-overlay"
          onClick={() => {
            setShowEventModal(false)
            setSelectedEvent(null)
          }}
        >
          <div 
            className="event-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="event-modal-header">
              <h2 className="event-modal-title">{selectedEvent.title}</h2>
              <button 
                className="event-modal-close"
                onClick={() => {
                  setShowEventModal(false)
                  setSelectedEvent(null)
                }}
              >
                ×
              </button>
            </div>
            
            <div className="event-modal-content">
              <div className="event-modal-image">
                <span className="event-image-placeholder">
                  {t('event.imageNotRegistered', language)}
                </span>
              </div>
              
              <div className="event-modal-info">
                <div className="event-modal-info-item">
                  <span className="event-modal-label">{t('event.author', language)}</span>
                  <span className="event-modal-value">{selectedEvent.author}</span>
                </div>
                <div className="event-modal-info-item">
                  <span className="event-modal-label">{t('event.startDate', language)}</span>
                  <span className="event-modal-value">{selectedEvent.startDate}</span>
                </div>
                <div className="event-modal-info-item">
                  <span className="event-modal-label">{t('event.endDate', language)}</span>
                  <span className="event-modal-value">{selectedEvent.endDate}</span>
                </div>
              </div>

              <div className="event-modal-description">
                <h3 className="event-modal-section-title">{t('event.description', language)}</h3>
                <p className="event-modal-description-text">
                  {t('event.descriptionPlaceholder', language)}
                </p>
              </div>
            </div>

            <div className="event-modal-footer">
              <button 
                className="event-modal-close-btn"
                onClick={() => {
                  setShowEventModal(false)
                  setSelectedEvent(null)
                }}
              >
                {t('event.close', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventPage

