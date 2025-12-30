import React, { useEffect, useRef, useState, useMemo } from 'react'
import './MainPage.css'
import { getCurrentLanguage, setLanguage, t, getLanguageName } from '../utils/i18n'
import { getApiUrl } from '../config/api'
import { saveToken, removeToken, fetchWithAuth, getToken } from '../utils/auth'
import LoginPage from './LoginPage'
import SignupPage from './SignupPage'
import ProfilePage from './ProfilePage'
import StakingPage from './StakingPage'
import NativeStakingPage from './NativeStakingPage'
import LockupStakingPage from './LockupStakingPage'
import LiquidStakingDetailPage from './LiquidStakingDetailPage'
import RestakingDetailPage from './RestakingDetailPage'
import CefiStakingDetailPage from './CefiStakingDetailPage'
import DefiStakingDetailPage from './DefiStakingDetailPage'
import MiningPage from './MiningPage'
import GamePage from './GamePage'
import CrowdfundingPage from './CrowdfundingPage'
import RewardCrowdfundingDetailPage from './RewardCrowdfundingDetailPage'
import InvestmentCrowdfundingDetailPage from './InvestmentCrowdfundingDetailPage'
import LoanCrowdfundingDetailPage from './LoanCrowdfundingDetailPage'
import CommercePage from './CommercePage'
import AITradingPage from './AITradingPage'

const MainPage = () => {
  const [language, setLanguageState] = useState(getCurrentLanguage())
  
  // SetlOne 서비스 카테고리 (setlone.net 기반) - 언어에 따라 동적으로 생성
  const getServices = () => [
    { 
      name: t('services.yieldCard.name', language), 
      description: t('services.yieldCard.description', language),
      url: 'https://sutmembers.com', 
      icon: '💎',
      category: 'investment'
    },
    { 
      name: t('services.commerce.name', language), 
      description: t('services.commerce.description', language),
      url: 'https://sellerket.com', 
      icon: '🛒',
      category: 'commerce'
    },
    { 
      name: t('services.staking.name', language), 
      description: t('services.staking.description', language),
      url: '', 
      icon: '📈',
      category: 'staking'
    },
    { 
      name: t('services.payment.name', language), 
      description: t('services.payment.description', language),
      url: 'https://www.sutmembers.net', 
      icon: '💳',
      category: 'payment'
    },
    { 
      name: t('services.rewards.name', language), 
      description: t('services.rewards.description', language),
      url: '', 
      icon: '🎁',
      category: 'rewards'
    },
    { 
      name: t('services.ai.name', language), 
      description: t('services.ai.description', language),
      url: '', 
      icon: '🤖',
      category: 'ai-trading'
    },
    { 
      name: t('services.demo.name', language), 
      description: t('services.demo.description', language),
      url: '', 
      icon: '🎮',
      category: 'game'
    },
    { 
      name: t('services.mining.name', language), 
      description: t('services.mining.description', language),
      url: '', 
      icon: '⛏️',
      category: 'mining'
    },
    { 
      name: t('services.crowdfunding.name', language), 
      description: t('services.crowdfunding.description', language),
      url: '', 
      icon: '💼',
      category: 'crowdfunding'
    },
  ]
  
  const services = useMemo(() => getServices(), [language])

  const [isLoaded, setIsLoaded] = useState(false)
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState({ text: '', image: null, imagePreview: null })
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showLanguagePicker, setShowLanguagePicker] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [onboardingPage, setOnboardingPage] = useState(1)
  const [tempLanguage, setTempLanguage] = useState(getCurrentLanguage())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchPlaceholder, setSearchPlaceholder] = useState('')
  const observerTarget = useRef(null)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const particlesRef = useRef([])
  const languagePickerRef = useRef(null)
  const categoriesScrollRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginPage, setShowLoginPage] = useState(false)
  const [showSignupPage, setShowSignupPage] = useState(false)
  const [showProfilePage, setShowProfilePage] = useState(false)
  const [showStakingPage, setShowStakingPage] = useState(false)
  const [showNativeStakingPage, setShowNativeStakingPage] = useState(false)
  const [showLockupStakingPage, setShowLockupStakingPage] = useState(false)
  const [lockupStakingInitialType, setLockupStakingInitialType] = useState('lockup')
  const [showLiquidStakingDetailPage, setShowLiquidStakingDetailPage] = useState(false)
  const [selectedLiquidProduct, setSelectedLiquidProduct] = useState(null)
  const [showRestakingDetailPage, setShowRestakingDetailPage] = useState(false)
  const [selectedRestakingProduct, setSelectedRestakingProduct] = useState(null)
  const [showCefiStakingDetailPage, setShowCefiStakingDetailPage] = useState(false)
  const [selectedCefiProduct, setSelectedCefiProduct] = useState(null)
  const [showDefiStakingDetailPage, setShowDefiStakingDetailPage] = useState(false)
  const [selectedDefiProduct, setSelectedDefiProduct] = useState(null)
  const [showMiningPage, setShowMiningPage] = useState(false)
  const [showGamePage, setShowGamePage] = useState(false)
  const [showCrowdfundingPage, setShowCrowdfundingPage] = useState(false)
  const [showRewardCrowdfundingDetailPage, setShowRewardCrowdfundingDetailPage] = useState(false)
  const [showInvestmentCrowdfundingDetailPage, setShowInvestmentCrowdfundingDetailPage] = useState(false)
  const [showLoanCrowdfundingDetailPage, setShowLoanCrowdfundingDetailPage] = useState(false)
  const [showCommercePage, setShowCommercePage] = useState(false)
  const [showAITradingPage, setShowAITradingPage] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  // 현재 페이지 상태를 localStorage에 저장하는 함수
  const saveCurrentPage = (pageName) => {
    localStorage.setItem('currentPage', pageName)
  }

  // 첫 접속 확인 및 온보딩 표시 및 페이지 상태 복원
  useEffect(() => {
    // 언어 설정 복원 (가장 먼저 실행)
    const savedLanguage = getCurrentLanguage()
    setLanguageState(savedLanguage)
    setTempLanguage(savedLanguage)
    
    const hasVisited = localStorage.getItem('hasVisited')
    if (!hasVisited) {
      // 스플래시 표시 후 온보딩
      setTimeout(() => {
        setShowSplash(false)
        setShowOnboarding(true)
      }, 2000) // 2초 스플래시
    } else {
      setShowSplash(false)
      
      // 저장된 페이지 상태 복원
      const savedPage = localStorage.getItem('currentPage')
      if (savedPage) {
        // 모든 페이지 상태 초기화
        setShowStakingPage(false)
        setShowNativeStakingPage(false)
        setShowLockupStakingPage(false)
        setShowMiningPage(false)
        setShowGamePage(false)
        setShowCrowdfundingPage(false)
        setShowCommercePage(false)
        setShowAITradingPage(false)
        setShowLiquidStakingDetailPage(false)
        setShowRestakingDetailPage(false)
        setShowCefiStakingDetailPage(false)
        setShowDefiStakingDetailPage(false)
        setShowLoginPage(false)
        setShowSignupPage(false)
        setShowProfilePage(false)
        
        // 저장된 페이지 복원
        switch(savedPage) {
          case 'staking':
            setShowStakingPage(true)
            break
          case 'native-staking':
            setShowNativeStakingPage(true)
            break
          case 'lockup-staking':
            setShowLockupStakingPage(true)
            const savedType = localStorage.getItem('lockupStakingType')
            if (savedType) {
              setLockupStakingInitialType(savedType)
            }
            break
          case 'mining':
            setShowMiningPage(true)
            break
          case 'game':
            setShowGamePage(true)
            break
          case 'crowdfunding':
            setShowCrowdfundingPage(true)
            break
          case 'commerce':
            setShowCommercePage(true)
            break
          case 'ai-trading':
            setShowAITradingPage(true)
            break
          case 'liquid-staking-detail':
            setShowLiquidStakingDetailPage(true)
            const savedProduct = localStorage.getItem('liquidStakingProduct')
            if (savedProduct) {
              setSelectedLiquidProduct(JSON.parse(savedProduct))
            }
            break
          case 'restaking-detail':
            setShowRestakingDetailPage(true)
            const savedRestakingProduct = localStorage.getItem('restakingProduct')
            if (savedRestakingProduct) {
              setSelectedRestakingProduct(JSON.parse(savedRestakingProduct))
            }
            break
          case 'cefi-staking-detail':
            setShowCefiStakingDetailPage(true)
            const savedCefiProduct = localStorage.getItem('cefiStakingProduct')
            if (savedCefiProduct) {
              setSelectedCefiProduct(JSON.parse(savedCefiProduct))
            }
            break
          case 'defi-staking-detail':
            setShowDefiStakingDetailPage(true)
            const savedDefiProduct = localStorage.getItem('defiStakingProduct')
            if (savedDefiProduct) {
              setSelectedDefiProduct(JSON.parse(savedDefiProduct))
            }
            break
          case 'login':
            setShowLoginPage(true)
            break
          case 'signup':
            setShowSignupPage(true)
            break
          case 'profile':
            setShowProfilePage(true)
            break
          default:
            // 메인 페이지 유지
            break
        }
      }
    }
  }, [])

  // 검색창 플레이스홀더 변경 (AI 추천 스타일)
  useEffect(() => {
    const placeholders = [
      t('search.placeholder1', language),
      t('search.placeholder2', language),
      t('search.placeholder3', language)
    ]
    
    let currentIndex = 0
    setSearchPlaceholder(placeholders[currentIndex])
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % placeholders.length
      setSearchPlaceholder(placeholders[currentIndex])
    }, 3000) // 3초마다 변경
    
    return () => clearInterval(interval)
  }, [language])

  // localStorage에서 게시글 로드 및 로그인 상태 확인
  useEffect(() => {
    const savedPosts = localStorage.getItem('feedPosts')
    if (savedPosts) {
      const parsedPosts = JSON.parse(savedPosts)
      // 지정된 포스트가 있는지 확인 (car1.webp 이미지를 가진 포스트)
      const hasCustomPost = parsedPosts.some(post => post.image && post.image.includes('car1.webp'))
      if (!hasCustomPost) {
        // 지정된 포스트가 없으면 첫 번째에 추가
        const customPost = {
          id: Date.now(),
          username: 'mining_user',
          avatar: 'https://i.pravatar.cc/150?img=1',
          image: '/images/car1.webp',
          text: '제 차량에 채굴기를 설치했어요 앞으로의 수익이 기대됩니다.',
          likes: Math.floor(Math.random() * 1000) + 100,
          liked: false,
          comments: Math.floor(Math.random() * 50) + 10,
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString()
        }
        setPosts([customPost, ...parsedPosts])
        localStorage.setItem('feedPosts', JSON.stringify([customPost, ...parsedPosts]))
      } else {
        setPosts(parsedPosts)
      }
    } else {
      // 초기 더미 데이터 생성
      const initialPosts = generateDummyPosts(10)
      setPosts(initialPosts)
      localStorage.setItem('feedPosts', JSON.stringify(initialPosts))
    }
    
    // 로그인 상태 확인
    const savedLoginState = localStorage.getItem('isLoggedIn')
    if (savedLoginState === 'true') {
      setIsLoggedIn(true)
    }
    
    setIsLoaded(true)
  }, [])

  // 우주 배경 효과 초기화
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 파티클 생성
    const particleCount = 80
    const particles = []
    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.opacity = Math.random() * 0.5 + 0.3
        this.glow = Math.random() > 0.7 // 일부 파티클만 더 밝게
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = this.glow 
          ? `rgba(100, 150, 255, ${this.opacity})` 
          : `rgba(255, 255, 255, ${this.opacity})`
        ctx.fill()
        
        if (this.glow) {
          ctx.shadowBlur = 10
          ctx.shadowColor = 'rgba(100, 150, 255, 0.8)'
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }
    }

    // 파티클 초기화
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }
    particlesRef.current = particles

    // 연결선 그리기
    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(100, 150, 255, ${0.2 * (1 - distance / 150)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    // 애니메이션 루프
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      drawConnections()

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  // 무한 스크롤 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePosts()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore, loading])

  // 더미 게시글 생성 함수
  const generateDummyPosts = (count) => {
    const dummyTexts = [
      '오늘 날씨가 정말 좋네요! 🌞',
      '새로운 프로젝트를 시작했습니다!',
      '맛있는 커피 한 잔 ☕',
      '코딩하는 하루가 즐겁습니다 💻',
      '주말에는 푹 쉬어야겠어요 😴',
      '좋은 하루 보내세요!',
      '새로운 아이디어가 떠올랐어요 💡',
      '운동을 시작했습니다! 🏃',
      '책을 읽고 있어요 📚',
      '음악을 들으며 작업 중 🎵'
    ]

    // 첫 번째 포스트는 지정된 내용으로 생성
    const customPost = {
      id: Date.now(),
      username: 'mining_user',
      avatar: 'https://i.pravatar.cc/150?img=1',
      image: '/images/car1.webp',
      text: '제 차량에 채굴기를 설치했어요 앞으로의 수익이 기대됩니다.',
      likes: Math.floor(Math.random() * 1000) + 100, // 더 많은 좋아요
      liked: false,
      comments: Math.floor(Math.random() * 50) + 10,
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString() // 2시간 전
    }

    // 나머지 포스트는 랜덤으로 생성
    const randomPosts = Array.from({ length: count - 1 }, (_, index) => ({
      id: Date.now() + index + 1,
      username: `user${Math.floor(Math.random() * 1000)}`,
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
      image: `https://picsum.photos/600/600?random=${index + 1}`,
      text: dummyTexts[index % dummyTexts.length],
      likes: Math.floor(Math.random() * 1000),
      liked: false,
      comments: Math.floor(Math.random() * 50),
      timestamp: new Date(Date.now() - (index + 1) * 3600000).toISOString()
    }))

    return [customPost, ...randomPosts]
  }

  // 더 많은 게시글 로드
  const loadMorePosts = () => {
    if (loading) return
    
    setLoading(true)
    setTimeout(() => {
      const morePosts = generateDummyPosts(5)
      const updatedPosts = [...posts, ...morePosts]
      setPosts(updatedPosts)
      localStorage.setItem('feedPosts', JSON.stringify(updatedPosts))
      setLoading(false)
      
      // 더미 데이터이므로 항상 더 로드 가능하다고 가정
      // 실제로는 서버에서 더 이상 데이터가 없으면 setHasMore(false)
    }, 1000)
  }

  // 이미지 선택 핸들러
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewPost({
          ...newPost,
          image: file,
          imagePreview: reader.result
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // 게시글 작성
  const handlePostSubmit = (e) => {
    e.preventDefault()
    
    // 로그인 체크
    if (!isLoggedIn) {
      setShowLoginPage(true)
      saveCurrentPage('login')
      return
    }
    
    if (!newPost.text.trim() && !newPost.image) return

    // 현재 사용자 정보 가져오기
    const savedUser = localStorage.getItem('currentUser')
    const userData = savedUser ? JSON.parse(savedUser) : null
    
    const post = {
      id: Date.now(),
      username: userData?.username || 'current_user',
      avatar: userData?.profile_image || 'https://i.pravatar.cc/150?img=1',
      image: newPost.imagePreview || null,
      text: newPost.text,
      likes: 0,
      liked: false,
      comments: 0,
      timestamp: new Date().toISOString()
    }

    const updatedPosts = [post, ...posts]
    setPosts(updatedPosts)
    localStorage.setItem('feedPosts', JSON.stringify(updatedPosts))
    
    setNewPost({ text: '', image: null, imagePreview: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 좋아요 토글
  const toggleLike = (postId) => {
    const updatedPosts = posts.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    )
    setPosts(updatedPosts)
    localStorage.setItem('feedPosts', JSON.stringify(updatedPosts))
  }

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diff = now - postTime
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t('feed.justNow', language)
    if (minutes < 60) return `${minutes}${t('feed.minutesAgo', language)}`
    if (hours < 24) return `${hours}${t('feed.hoursAgo', language)}`
    if (days < 7) return `${days}${t('feed.daysAgo', language)}`
    return postTime.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US')
  }

  const handleSiteClick = (url) => {
    // 공란인 경우 클릭 반응 없음
    if (!url || url.trim() === '') {
      return
    }
    window.location.href = url
  }

  // Settings 열기
  const handleSettingsOpen = () => {
    setShowSettings(true)
  }

  // Settings 닫기
  const handleSettingsClose = () => {
    setShowSettings(false)
  }

  // 언어 선택 핸들러 (Settings 내부에서)
  const handleLanguageSelect = () => {
    setShowLanguagePicker(true)
    setTempLanguage(language)
  }

  // 언어 선택 완료
  const handleLanguageDone = () => {
    const langCode = tempLanguage === 'ko' ? 'ko' : 'en'
    setLanguageState(langCode)
    setShowLanguagePicker(false)
    // 언어 변경 시 localStorage에 저장
    setLanguage(langCode)
  }

  // 언어 선택 취소
  const handleLanguageCancel = () => {
    setShowLanguagePicker(false)
    setTempLanguage(language)
  }

  // 온보딩 다시 보기
  const handleResetOnboarding = () => {
    localStorage.removeItem('hasVisited')
    setShowSettings(false)
    setShowSplash(true)
    setOnboardingPage(1)
    setTimeout(() => {
      setShowSplash(false)
      setShowOnboarding(true)
    }, 2000)
  }

  // 언어 초기화는 첫 접속 확인 useEffect에서 처리

  // 로그인 핸들러
  const handleLogout = async () => {
    try {
      // API 서버에 로그아웃 요청 (body가 없으므로 Content-Type 헤더 제거)
      const token = getToken()
      const response = await fetch(getApiUrl('/api/v1/auth/logout'), {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })

      if (response.ok) {
        // 로컬 스토리지 정리
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('currentUser')
        removeToken() // 토큰 제거
        
        // 상태 초기화
        setIsLoggedIn(false)
        setCurrentUserId(null)
        setCurrentUser(null)
        setShowSettings(false)
        
        // 프로필 페이지가 열려있으면 닫기
        if (showProfilePage) {
          setShowProfilePage(false)
        }
      }
    } catch (error) {
      console.error('Logout error:', error)
      // 에러가 발생해도 로컬에서 로그아웃 처리
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('currentUser')
      removeToken() // 토큰 제거
      setIsLoggedIn(false)
      setCurrentUserId(null)
      setCurrentUser(null)
      setShowSettings(false)
      if (showProfilePage) {
        setShowProfilePage(false)
      }
    }
  }

  const handleLogin = async (loginData) => {
    try {
      const response = await fetch(getApiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginData.username, // LoginPage에서 username 필드에 email 입력
          password: loginData.password
        })
      })

      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`)
      }

      console.log('Login response:', { status: response.status, data })

      if (response.ok && data.success) {
        // 로그인 성공
        setIsLoggedIn(true)
        setCurrentUserId(data.data.id)
        setCurrentUser(data.data)
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('currentUser', JSON.stringify(data.data))
        
        // JWT 토큰 저장
        if (data.token) {
          saveToken(data.token)
        }
        
        setShowLoginPage(false)
      } else {
        // 로그인 실패
        alert(language === 'ko' 
          ? `로그인 실패: ${data.message || '이메일 또는 비밀번호가 올바르지 않습니다.'}` 
          : `Login failed: ${data.message || 'Invalid email or password.'}`)
      }
    } catch (error) {
      console.error('Login error:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      // 더 자세한 에러 메시지 표시
      let errorMessage = language === 'ko' 
        ? '로그인 중 오류가 발생했습니다.' 
        : 'An error occurred during login.'
      
      if (error.message) {
        errorMessage += `\n${error.message}`
      }
      
      alert(errorMessage)
    }
  }

  // 회원가입 핸들러
  const handleSignup = () => {
    setShowLoginPage(false)
    setShowSignupPage(true)
    saveCurrentPage('signup')
  }

  // 회원가입 완료 핸들러
  const handleSignupComplete = async (userData) => {
    console.log('Signup completed:', userData)
    setShowSignupPage(false)
    setIsLoggedIn(true)
    localStorage.setItem('isLoggedIn', 'true')
    
    // userData가 이미 완전한 사용자 정보인 경우 (SignupPage에서 가져온 경우)
    if (userData.id) {
      localStorage.setItem('currentUser', JSON.stringify(userData))
      setCurrentUserId(userData.id)
      setCurrentUser(userData)
      return
    }
    
    // userData에 email만 있는 경우 API에서 가져오기
    if (userData.email) {
      try {
        const response = await fetch(getApiUrl(`/api/v1/users/email/${encodeURIComponent(userData.email)}`))
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            localStorage.setItem('currentUser', JSON.stringify(data.data))
            setCurrentUserId(data.data.id)
            setCurrentUser(data.data)
            return
          }
        }
      } catch (error) {
        console.error('Error loading user after signup:', error)
      }
    }
    
    // Fallback: 임시로 mock 데이터 저장
    const mockUser = {
      id: Date.now(),
      username: userData.nickname || 'user',
      uid: String(Math.floor(Math.random() * 9000000) + 1000000),
      profile_image: null,
      bio: ''
    }
    localStorage.setItem('currentUser', JSON.stringify(mockUser))
    setCurrentUserId(mockUser.id)
    setCurrentUser(mockUser)
  }

  // 회원가입 페이지 닫기
  const handleSignupPageBack = () => {
    setShowSignupPage(false)
    setShowLoginPage(true)
    saveCurrentPage('login')
  }

  // 비밀번호 분실 핸들러
  const handleForgotPassword = () => {
    // TODO: 비밀번호 재설정 페이지로 이동
    console.log('Forgot password clicked')
    alert(language === 'ko' ? '비밀번호 재설정 기능은 준비 중입니다.' : 'Password reset feature is coming soon.')
  }

  // 로그인 페이지 열기
  const handleProfileClick = () => {
    if (isLoggedIn) {
      // 프로필 페이지로 이동
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setCurrentUserId(userData.id)
      } else {
        setCurrentUserId(1) // Mock user ID
      }
      setShowProfilePage(true)
      saveCurrentPage('profile')
    } else {
      setShowLoginPage(true)
      saveCurrentPage('login')
    }
  }

  // 프로필 페이지 닫기
  const handleProfilePageBack = () => {
    setShowProfilePage(false)
    saveCurrentPage('')
  }

  // 로그인 페이지 닫기
  const handleLoginPageBack = () => {
    setShowLoginPage(false)
    saveCurrentPage('')
  }

  return (
    <>
      {/* 스플래시 화면 */}
      {showSplash && (
        <div className="splash-screen">
          <img 
            src="/images/SETLONE_Left_logo.png" 
            alt="SETLONE" 
            className="splash-logo"
          />
        </div>
      )}

      {/* 온보딩 화면 */}
      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="onboarding-container">
            {/* 언어 선택 버튼 (상단 우측) */}
            <div className="onboarding-header">
              <button 
                className="onboarding-language-btn"
                onClick={() => {
                  const newLang = language === 'ko' ? 'en' : 'ko'
                  setLanguageState(newLang)
                  setLanguage(newLang)
                }}
              >
                {language === 'ko' ? '한글' : 'English'}
              </button>
            </div>
            <div className="onboarding-content">
              <h2 className="onboarding-title">
                {t(`onboarding.page${onboardingPage}.title`, language)}
              </h2>
              {(() => {
                const description = t(`onboarding.page${onboardingPage}.description`, language)
                return description && description.trim() !== '' && description !== `onboarding.page${onboardingPage}.description` ? (
                  <p className="onboarding-description">
                    {description}
                  </p>
                ) : null
              })()}
            </div>
            <div className="onboarding-indicators">
              {[1, 2, 3, 4, 5].map((page) => (
                <div
                  key={page}
                  className={`onboarding-dot ${onboardingPage === page ? 'active' : ''}`}
                />
              ))}
            </div>
            <div className="onboarding-actions">
              {onboardingPage < 5 ? (
                <button
                  className="onboarding-next-btn"
                  onClick={() => setOnboardingPage(onboardingPage + 1)}
                >
                  {t('common.next', language)}
                </button>
              ) : (
                <button
                  className="onboarding-next-btn"
                  onClick={() => {
                    setShowOnboarding(false)
                    localStorage.setItem('hasVisited', 'true')
                  }}
                >
                  {t('common.done', language)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`main-page ${isLoaded ? 'loaded' : ''} ${showOnboarding || showSplash ? 'hidden' : ''}`}>
      {/* 우주 배경 효과 */}
      <canvas 
        ref={canvasRef} 
        className="space-background"
      />
      
      {/* 상단 로고 */}
      <div className="header-section">
        <img 
          src="/images/SETLONE_Left_logo.png" 
          alt="SETLONE" 
          className="main-logo"
          onClick={() => window.location.reload()}
        />
      </div>

      {/* 검색창 */}
      <div className="search-section">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={searchPlaceholder || (language === 'ko' ? '검색...' : 'Search...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 서비스 카테고리 스크롤 (원형 버튼) */}
      <div 
        className="categories-scroll-container"
        ref={categoriesScrollRef}
        onMouseDown={(e) => {
          // 버튼 클릭인 경우 드래그 시작하지 않음
          if (e.target.closest('button.category-card-circle')) {
            return
          }
          setIsDragging(true)
          setStartX(e.pageX - categoriesScrollRef.current.offsetLeft)
          setScrollLeft(categoriesScrollRef.current.scrollLeft)
        }}
        onMouseLeave={() => setIsDragging(false)}
        onMouseUp={() => setIsDragging(false)}
        onMouseMove={(e) => {
          if (!isDragging) return
          // 버튼 위에서는 드래그하지 않음
          if (e.target.closest('button.category-card-circle')) {
            setIsDragging(false)
            return
          }
          e.preventDefault()
          const x = e.pageX - categoriesScrollRef.current.offsetLeft
          const walk = (x - startX) * 2
          categoriesScrollRef.current.scrollLeft = scrollLeft - walk
        }}
        onTouchStart={(e) => {
          setIsDragging(true)
          setStartX(e.touches[0].pageX - categoriesScrollRef.current.offsetLeft)
          setScrollLeft(categoriesScrollRef.current.scrollLeft)
        }}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={(e) => {
          if (!isDragging) return
          const x = e.touches[0].pageX - categoriesScrollRef.current.offsetLeft
          const walk = (x - startX) * 2
          categoriesScrollRef.current.scrollLeft = scrollLeft - walk
        }}
      >
        <div className="categories-scroll">
          {services.map((service, index) => (
            <button
              key={index}
              className={`category-card-circle ${(!service.url || service.url.trim() === '') && !['staking', 'mining', 'game', 'crowdfunding', 'commerce', 'ai-trading'].includes(service.category) ? 'disabled' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Service clicked:', service.name, 'Category:', service.category, 'URL:', service.url)
                if (service.category === 'staking') {
                  console.log('Opening Staking Page')
                  setShowStakingPage(true)
                } else if (service.category === 'mining') {
                  console.log('Opening Mining Page')
                  setShowMiningPage(true)
                  saveCurrentPage('mining')
                } else if (service.category === 'game') {
                  console.log('Opening Game Page')
                  setShowGamePage(true)
                  saveCurrentPage('game')
                } else if (service.category === 'crowdfunding') {
                  console.log('Opening Crowdfunding Page')
                  setShowCrowdfundingPage(true)
                  saveCurrentPage('crowdfunding')
                } else if (service.category === 'commerce') {
                  console.log('Opening Commerce Page')
                  setShowCommercePage(true)
                  saveCurrentPage('commerce')
                } else if (service.category === 'ai-trading') {
                  console.log('Opening AI Trading Page')
                  setShowAITradingPage(true)
                  saveCurrentPage('ai-trading')
                } else if (service.url && service.url.trim() !== '') {
                  handleSiteClick(service.url)
                }
              }}
              style={{ '--delay': `${index * 0.1}s` }}
            >
              <div className="category-icon-circle">{service.icon}</div>
              <div className="category-name-circle">{service.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 피드 섹션 */}
      <div className="feed-section">
        <h2 className="feed-title">{t('feed.title', language)}</h2>
        
        {/* 게시글 작성 폼 */}
        <div className="post-form-container">
          <form className="post-form" onSubmit={handlePostSubmit}>
            <div className="post-form-header">
              <div className="post-form-avatar">
                {isLoggedIn && currentUser?.profile_image ? (
                  <img src={currentUser.profile_image} alt="avatar" />
                ) : (
                  <div className="post-form-avatar-placeholder">?</div>
                )}
              </div>
              <textarea
                className="post-form-textarea"
                placeholder={t('feed.whatAreYouThinking', language)}
                value={newPost.text}
                onChange={(e) => setNewPost({ ...newPost, text: e.target.value })}
                rows="3"
              />
            </div>
            {newPost.imagePreview && (
              <div className="post-form-image-preview">
                <img src={newPost.imagePreview} alt="preview" />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => setNewPost({ ...newPost, image: null, imagePreview: null })}
                >
                  ✕
                </button>
              </div>
            )}
            <div className="post-form-actions">
              <label className="image-upload-btn">
                📷 {t('feed.addPhoto', language)}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </label>
              <button 
                type="submit" 
                className="post-submit-btn"
                disabled={!newPost.text.trim() && !newPost.image}
              >
                {t('feed.post', language)}
              </button>
            </div>
          </form>
        </div>

        {/* 게시글 피드 */}
        <div className="posts-container">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-user-info">
                  <img src={post.avatar} alt={post.username} className="post-avatar" />
                  <div>
                    <div className="post-username">{post.username}</div>
                    <div className="post-time">{formatTime(post.timestamp)}</div>
                  </div>
                </div>
              </div>
              {post.image && (
                <div className="post-image-container">
                  <img src={post.image} alt="post" className="post-image" />
                </div>
              )}
              <div className="post-content">
                <div className="post-text">{post.text}</div>
                <div className="post-actions">
                  <button 
                    className={`like-btn ${post.liked ? 'liked' : ''}`}
                    onClick={() => toggleLike(post.id)}
                  >
                    {post.liked ? '❤️' : '🤍'} {post.likes}
                  </button>
                  <button className="comment-btn">
                    💬 {post.comments}
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* 무한 스크롤 감지 요소 */}
          <div ref={observerTarget} className="scroll-observer">
            {loading && <div className="loading-spinner">{t('feed.loading', language)}</div>}
          </div>
        </div>
      </div>

      {/* 하단 푸터 메뉴바 */}
      <footer className="mobile-footer">
        <button className="footer-btn">
          <span className="footer-icon">🏠</span>
          <span className="footer-label">{t('common.home', language)}</span>
        </button>
        <button className="footer-btn">
          <span className="footer-icon">🔍</span>
          <span className="footer-label">{t('common.search', language)}</span>
        </button>
        <button className="footer-btn">
          <span className="footer-icon">➕</span>
          <span className="footer-label">{t('common.add', language)}</span>
        </button>
        <button className="footer-btn" onClick={handleProfileClick}>
          <span className="footer-icon">{isLoggedIn ? '👤' : '🔐'}</span>
          <span className="footer-label">
            {isLoggedIn ? t('common.profile', language) : (language === 'ko' ? '로그인' : 'Login')}
          </span>
        </button>
        <button className="footer-btn settings-btn" onClick={handleSettingsOpen}>
          <span className="footer-icon">⚙️</span>
          <span className="footer-label">{t('common.settings', language)}</span>
        </button>
      </footer>

      {/* Settings 화면 */}
      {showSettings && (
        <div className="settings-overlay" onClick={handleSettingsClose}>
          <div className="settings-container" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2 className="settings-title">{t('common.settings', language)}</h2>
              <button className="settings-close-btn" onClick={handleSettingsClose}>✕</button>
            </div>
            <div className="settings-content">
              <div className="settings-section">
                <h3 className="settings-section-title">{t('common.selectLanguage', language)}</h3>
                <div className="settings-language-options">
                  <button
                    className={`settings-language-btn ${language === 'ko' ? 'active' : ''}`}
                    onClick={() => {
                      setLanguageState('ko')
                      setLanguage('ko')
                    }}
                  >
                    한글
                  </button>
                  <button
                    className={`settings-language-btn ${language === 'en' ? 'active' : ''}`}
                    onClick={() => {
                      setLanguageState('en')
                      setLanguage('en')
                    }}
                  >
                    English
                  </button>
                </div>
              </div>
              <div className="settings-section">
                <button
                  className="settings-language-btn"
                  onClick={handleResetOnboarding}
                >
                  {t('common.resetOnboarding', language)}
                </button>
              </div>
              {isLoggedIn && (
                <div className="settings-section">
                  <button
                    className="settings-logout-btn"
                    onClick={handleLogout}
                  >
                    {language === 'ko' ? '로그아웃' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 언어 선택 모달 (Settings 내부에서 사용 - 숨김 처리) */}
      {showLanguagePicker && (
        <div className="language-picker-overlay" onClick={handleLanguageCancel}>
          <div className="language-picker-container" onClick={(e) => e.stopPropagation()}>
            <div className="language-picker-header">
              <button className="language-picker-cancel" onClick={handleLanguageCancel}>{t('common.cancel', language)}</button>
              <h3 className="language-picker-title">{t('common.selectLanguage', language)}</h3>
              <button className="language-picker-done" onClick={handleLanguageDone}>{t('common.done', language)}</button>
            </div>
            <div className="language-picker-wheel" ref={languagePickerRef}>
              <div 
                className={`language-option ${tempLanguage === 'ko' ? 'selected' : ''}`}
                onClick={() => setTempLanguage('ko')}
              >
                한글
              </div>
              <div 
                className={`language-option ${tempLanguage === 'en' ? 'selected' : ''}`}
                onClick={() => setTempLanguage('en')}
              >
                English
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 페이지 */}
      {showLoginPage && !showSignupPage && (
        <LoginPage
          onLogin={handleLogin}
          onSignup={handleSignup}
          onForgotPassword={handleForgotPassword}
          onBack={handleLoginPageBack}
        />
      )}

      {/* 회원가입 페이지 */}
      {showSignupPage && (
        <SignupPage
          onSignup={handleSignupComplete}
          onBack={handleSignupPageBack}
        />
      )}

      {/* 스테이킹 페이지 */}
      {showStakingPage && (
        <StakingPage
          language={language}
          onBack={() => {
            console.log('Closing Staking Page')
            setShowStakingPage(false)
            saveCurrentPage('')
          }}
          onNativeStaking={() => {
            console.log('Opening Native Staking Page')
            setShowStakingPage(false)
            setShowNativeStakingPage(true)
            saveCurrentPage('native-staking')
          }}
          onLockupStaking={(initialType) => {
            console.log('Opening Lockup Staking Page', initialType)
            setLockupStakingInitialType(initialType || 'lockup')
            setShowStakingPage(false)
            setShowLockupStakingPage(true)
            saveCurrentPage('lockup-staking')
            if (initialType) {
              localStorage.setItem('lockupStakingType', initialType)
            }
          }}
          onLiquidStakingDetail={(product) => {
            console.log('Opening Liquid Staking Detail Page', product)
            setSelectedLiquidProduct(product)
            setShowStakingPage(false)
            setShowLiquidStakingDetailPage(true)
            saveCurrentPage('liquid-staking-detail')
            localStorage.setItem('liquidStakingProduct', JSON.stringify(product))
          }}
          onRestakingDetail={(product) => {
            console.log('Opening Restaking Detail Page', product)
            setSelectedRestakingProduct(product)
            setShowStakingPage(false)
            setShowRestakingDetailPage(true)
            saveCurrentPage('restaking-detail')
            localStorage.setItem('restakingProduct', JSON.stringify(product))
          }}
          onCefiStakingDetail={(product) => {
            console.log('Opening CeFi Staking Detail Page', product)
            setSelectedCefiProduct(product)
            setShowStakingPage(false)
            setShowCefiStakingDetailPage(true)
            saveCurrentPage('cefi-staking-detail')
            localStorage.setItem('cefiStakingProduct', JSON.stringify(product))
          }}
          onDefiStakingDetail={(product) => {
            console.log('Opening DeFi Staking Detail Page', product)
            setSelectedDefiProduct(product)
            setShowStakingPage(false)
            setShowDefiStakingDetailPage(true)
            saveCurrentPage('defi-staking-detail')
            localStorage.setItem('defiStakingProduct', JSON.stringify(product))
          }}
          onLoginRequired={() => {
            console.log('Login required for staking')
            setShowStakingPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {/* 네이티브 스테이킹 페이지 */}
      {showNativeStakingPage && (
        <NativeStakingPage
          language={language}
          onBack={() => {
            console.log('Closing Native Staking Page')
            setShowNativeStakingPage(false)
            setShowStakingPage(true)
            saveCurrentPage('staking')
          }}
          onLoginRequired={() => {
            console.log('Login required for native staking')
            setShowNativeStakingPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {/* 락업 스테이킹 페이지 */}
      {showLockupStakingPage && (
        <LockupStakingPage
          language={language}
          initialStakingType={lockupStakingInitialType}
          onBack={() => {
            console.log('Closing Lockup Staking Page')
            setShowLockupStakingPage(false)
            setShowStakingPage(true)
            saveCurrentPage('staking')
          }}
          onLoginRequired={() => {
            console.log('Login required for lockup staking')
            setShowLockupStakingPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {/* 리퀴드 스테이킹 페이지 */}
      {/* 리퀴드 스테이킹 상세 페이지 */}
      {showLiquidStakingDetailPage && selectedLiquidProduct && (
        <LiquidStakingDetailPage
          language={language}
          product={selectedLiquidProduct}
          onBack={() => {
            console.log('Closing Liquid Staking Detail Page')
            setShowLiquidStakingDetailPage(false)
            setShowStakingPage(true)
            saveCurrentPage('staking')
          }}
          onLoginRequired={() => {
            console.log('Login required for liquid staking detail')
            setShowLiquidStakingDetailPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {showRestakingDetailPage && selectedRestakingProduct && (
        <RestakingDetailPage
          language={language}
          product={selectedRestakingProduct}
          onBack={() => {
            console.log('Closing Restaking Detail Page')
            setShowRestakingDetailPage(false)
            setShowStakingPage(true)
            saveCurrentPage('staking')
          }}
          onLoginRequired={() => {
            console.log('Login required for restaking detail')
            setShowRestakingDetailPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {showCefiStakingDetailPage && selectedCefiProduct && (
        <CefiStakingDetailPage
          language={language}
          product={selectedCefiProduct}
          onBack={() => {
            console.log('Closing CeFi Staking Detail Page')
            setShowCefiStakingDetailPage(false)
            setShowStakingPage(true)
            saveCurrentPage('staking')
          }}
          onLoginRequired={() => {
            console.log('Login required for cefi staking detail')
            setShowCefiStakingDetailPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {showDefiStakingDetailPage && selectedDefiProduct && (
        <DefiStakingDetailPage
          language={language}
          product={selectedDefiProduct}
          onBack={() => {
            console.log('Closing DeFi Staking Detail Page')
            setShowDefiStakingDetailPage(false)
            setShowStakingPage(true)
            saveCurrentPage('staking')
          }}
          onLoginRequired={() => {
            console.log('Login required for defi staking detail')
            setShowDefiStakingDetailPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {/* 채굴 페이지 */}
      {showMiningPage && (
        <MiningPage
          language={language}
          onBack={() => {
            console.log('Closing Mining Page')
            setShowMiningPage(false)
            saveCurrentPage('')
          }}
        />
      )}

      {/* 게임 페이지 */}
      {showGamePage && (
        <GamePage
          language={language}
          onBack={() => {
            console.log('Closing Game Page')
            setShowGamePage(false)
            saveCurrentPage('')
          }}
        />
      )}

      {/* 로그인 페이지 */}
      {showLoginPage && !showSignupPage && (
        <LoginPage
          onLogin={handleLogin}
          onSignup={handleSignup}
          onForgotPassword={handleForgotPassword}
          onBack={handleLoginPageBack}
        />
      )}

      {/* 회원가입 페이지 */}
      {showSignupPage && (
        <SignupPage
          onSignup={handleSignupComplete}
          onBack={handleSignupPageBack}
        />
      )}

      {/* 스테이킹 페이지 */}
      {showStakingPage && (
        <StakingPage
          language={language}
          onBack={() => {
            console.log('Closing Staking Page')
            setShowStakingPage(false)
            saveCurrentPage('')
          }}
          onNativeStaking={() => {
            console.log('Opening Native Staking Page')
            setShowStakingPage(false)
            setShowNativeStakingPage(true)
            saveCurrentPage('native-staking')
          }}
          onLockupStaking={(initialType) => {
            console.log('Opening Lockup Staking Page', initialType)
            setLockupStakingInitialType(initialType || 'lockup')
            setShowStakingPage(false)
            setShowLockupStakingPage(true)
            saveCurrentPage('lockup-staking')
            if (initialType) {
              localStorage.setItem('lockupStakingType', initialType)
            }
          }}
          onLiquidStakingDetail={(product) => {
            console.log('Opening Liquid Staking Detail Page', product)
            setSelectedLiquidProduct(product)
            setShowStakingPage(false)
            setShowLiquidStakingDetailPage(true)
            saveCurrentPage('liquid-staking-detail')
            localStorage.setItem('liquidStakingProduct', JSON.stringify(product))
          }}
          onRestakingDetail={(product) => {
            console.log('Opening Restaking Detail Page', product)
            setSelectedRestakingProduct(product)
            setShowStakingPage(false)
            setShowRestakingDetailPage(true)
            saveCurrentPage('restaking-detail')
            localStorage.setItem('restakingProduct', JSON.stringify(product))
          }}
          onCefiStakingDetail={(product) => {
            console.log('Opening CeFi Staking Detail Page', product)
            setSelectedCefiProduct(product)
            setShowStakingPage(false)
            setShowCefiStakingDetailPage(true)
            saveCurrentPage('cefi-staking-detail')
            localStorage.setItem('cefiStakingProduct', JSON.stringify(product))
          }}
          onDefiStakingDetail={(product) => {
            console.log('Opening DeFi Staking Detail Page', product)
            setSelectedDefiProduct(product)
            setShowStakingPage(false)
            setShowDefiStakingDetailPage(true)
            saveCurrentPage('defi-staking-detail')
            localStorage.setItem('defiStakingProduct', JSON.stringify(product))
          }}
          onLoginRequired={() => {
            console.log('Login required for staking')
            setShowStakingPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {/* 네이티브 스테이킹 페이지 */}
      {showNativeStakingPage && (
        <NativeStakingPage
          language={language}
          onBack={() => {
            console.log('Closing Native Staking Page')
            setShowNativeStakingPage(false)
            setShowStakingPage(true)
            saveCurrentPage('staking')
          }}
          onLoginRequired={() => {
            console.log('Login required for native staking')
            setShowNativeStakingPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {/* 락업 스테이킹 페이지 */}
      {showLockupStakingPage && (
        <LockupStakingPage
          language={language}
          initialStakingType={lockupStakingInitialType}
          onBack={() => {
            console.log('Closing Lockup Staking Page')
            setShowLockupStakingPage(false)
            setShowStakingPage(true)
            saveCurrentPage('staking')
          }}
          onLoginRequired={() => {
            console.log('Login required for lockup staking')
            setShowLockupStakingPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {/* 리퀴드 스테이킹 페이지 */}
      {/* 리퀴드 스테이킹 상세 페이지 */}
      {showLiquidStakingDetailPage && selectedLiquidProduct && (
        <LiquidStakingDetailPage
          language={language}
          product={selectedLiquidProduct}
          onBack={() => {
            console.log('Closing Liquid Staking Detail Page')
            setShowLiquidStakingDetailPage(false)
            setShowStakingPage(true)
            saveCurrentPage('staking')
          }}
          onLoginRequired={() => {
            console.log('Login required for liquid staking detail')
            setShowLiquidStakingDetailPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {showRestakingDetailPage && selectedRestakingProduct && (
        <RestakingDetailPage
          language={language}
          product={selectedRestakingProduct}
          onBack={() => {
            console.log('Closing Restaking Detail Page')
            setShowRestakingDetailPage(false)
            setShowStakingPage(true)
            saveCurrentPage('staking')
          }}
          onLoginRequired={() => {
            console.log('Login required for restaking detail')
            setShowRestakingDetailPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {showCefiStakingDetailPage && selectedCefiProduct && (
        <CefiStakingDetailPage
          language={language}
          product={selectedCefiProduct}
          onBack={() => {
            console.log('Closing CeFi Staking Detail Page')
            setShowCefiStakingDetailPage(false)
            setShowStakingPage(true)
            saveCurrentPage('staking')
          }}
          onLoginRequired={() => {
            console.log('Login required for cefi staking detail')
            setShowCefiStakingDetailPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {showDefiStakingDetailPage && selectedDefiProduct && (
        <DefiStakingDetailPage
          language={language}
          product={selectedDefiProduct}
          onBack={() => {
            console.log('Closing DeFi Staking Detail Page')
            setShowDefiStakingDetailPage(false)
            setShowStakingPage(true)
            saveCurrentPage('staking')
          }}
          onLoginRequired={() => {
            console.log('Login required for defi staking detail')
            setShowDefiStakingDetailPage(false)
            setShowLoginPage(true)
            saveCurrentPage('login')
          }}
        />
      )}

      {/* 채굴 페이지 */}
      {showMiningPage && (
        <MiningPage
          language={language}
          onBack={() => {
            console.log('Closing Mining Page')
            setShowMiningPage(false)
            saveCurrentPage('')
          }}
        />
      )}

      {/* 게임 페이지 */}
      {showGamePage && (
        <GamePage
          language={language}
          onBack={() => {
            console.log('Closing Game Page')
            setShowGamePage(false)
            saveCurrentPage('')
          }}
        />
      )}

      {/* 크라우드펀딩 페이지 */}
      {showCrowdfundingPage && (
        <CrowdfundingPage
          language={language}
          onBack={() => {
            console.log('Closing Crowdfunding Page')
            setShowCrowdfundingPage(false)
            saveCurrentPage('')
          }}
          onRewardCrowdfundingDetail={() => {
            setShowCrowdfundingPage(false)
            setShowRewardCrowdfundingDetailPage(true)
            saveCurrentPage('crowdfunding-reward')
          }}
          onInvestmentCrowdfundingDetail={() => {
            setShowCrowdfundingPage(false)
            setShowInvestmentCrowdfundingDetailPage(true)
            saveCurrentPage('crowdfunding-investment')
          }}
          onLoanCrowdfundingDetail={() => {
            setShowCrowdfundingPage(false)
            setShowLoanCrowdfundingDetailPage(true)
            saveCurrentPage('crowdfunding-loan')
          }}
          onLoginRequired={() => {
            setShowLoginPage(true)
          }}
        />
      )}

      {/* 보상형 크라우드펀딩 상세 페이지 */}
      {showRewardCrowdfundingDetailPage && (
        <RewardCrowdfundingDetailPage
          language={language}
          onBack={() => {
            setShowRewardCrowdfundingDetailPage(false)
            setShowCrowdfundingPage(true)
            saveCurrentPage('crowdfunding')
          }}
          onLoginRequired={() => {
            setShowLoginPage(true)
          }}
        />
      )}

      {/* 투자형 크라우드펀딩 상세 페이지 */}
      {showInvestmentCrowdfundingDetailPage && (
        <InvestmentCrowdfundingDetailPage
          language={language}
          onBack={() => {
            setShowInvestmentCrowdfundingDetailPage(false)
            setShowCrowdfundingPage(true)
            saveCurrentPage('crowdfunding')
          }}
          onLoginRequired={() => {
            setShowLoginPage(true)
          }}
        />
      )}

      {/* 대출형 크라우드펀딩 상세 페이지 */}
      {showLoanCrowdfundingDetailPage && (
        <LoanCrowdfundingDetailPage
          onBack={() => {
            setShowLoanCrowdfundingDetailPage(false)
            setShowCrowdfundingPage(true)
            saveCurrentPage('crowdfunding')
          }}
          language={language}
          onLoginRequired={() => {
            setShowLoanCrowdfundingDetailPage(false)
            setShowLoginPage(true)
          }}
        />
      )}

      {/* 커머스 페이지 */}
      {showCommercePage && (
        <CommercePage
          language={language}
          onBack={() => {
            console.log('Closing Commerce Page')
            setShowCommercePage(false)
            saveCurrentPage('')
          }}
        />
      )}

      {/* AI 트레이딩 페이지 */}
      {showAITradingPage && (
        <AITradingPage
          language={language}
          onBack={() => {
            console.log('Closing AI Trading Page')
            setShowAITradingPage(false)
            saveCurrentPage('')
          }}
        />
      )}

      {/* 프로필 페이지 */}
      {showProfilePage && (
        <ProfilePage
          userId={currentUserId}
          onBack={handleProfilePageBack}
        />
      )}
      </div>
    </>
  )
}

export default MainPage
