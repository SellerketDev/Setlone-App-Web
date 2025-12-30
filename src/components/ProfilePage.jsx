import React, { useState, useEffect } from 'react'
import { getCurrentLanguage } from '../utils/i18n'
import { getApiUrl } from '../config/api'
import { fetchWithAuth } from '../utils/auth'
import './ProfilePage.css'

const ProfilePage = ({ userId, onBack }) => {
  const [language] = useState(getCurrentLanguage())
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState('')
  const [editingImage, setEditingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUserProfile()
    loadUserPosts()
  }, [userId])

  const loadUserProfile = async () => {
    try {
      // Try to load from localStorage first
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setBioText(userData.bio || '')
        setImagePreview(userData.profile_image || null)
        setLoading(false)
        return
      }

      // If userId is provided, try to load from API
      if (userId) {
        try {
          const response = await fetchWithAuth(getApiUrl(`/api/v1/users/${userId}`))
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data) {
              const userData = data.data
              setUser(userData)
              setBioText(userData.bio || '')
              setImagePreview(userData.profile_image || null)
              localStorage.setItem('currentUser', JSON.stringify(userData))
              setLoading(false)
              return
            }
          } else {
            console.error('API Error loading user:', response.status, response.statusText)
          }
        } catch (apiError) {
          console.error('API Error loading user:', apiError)
          // API 호출 실패 시에도 로딩 상태 해제
          setLoading(false)
          // localStorage에 사용자 정보가 있으면 그것을 사용
          const savedUser = localStorage.getItem('currentUser')
          if (savedUser) {
            try {
              const userData = JSON.parse(savedUser)
              if (userData.id === userId) {
                setUser(userData)
                setBioText(userData.bio || '')
                setImagePreview(userData.profile_image || null)
                return
              }
            } catch (e) {
              console.error('Error parsing saved user:', e)
            }
          }
        }
      }

      // Fallback to mock data for development
      const mockUser = {
        id: 1,
        username: 'testuser',
        uid: '2222134',
        profile_image: 'https://i.pravatar.cc/150?img=1',
        bio: '안녕하세요! 환영합니다 👋'
      }
      setUser(mockUser)
      setBioText(mockUser.bio)
      setImagePreview(mockUser.profile_image)
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserPosts = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`https://localhost:3000/api/v1/users/${userId}/posts`)
      // const data = await response.json()
      // setPosts(data.data || [])

      // Mock posts for development
      const mockPosts = [
        {
          id: 1,
          user_id: userId || 1,
          content: '오늘 날씨가 정말 좋네요! 🌞',
          image_url: 'https://picsum.photos/600/600?random=1',
          created_at: new Date(Date.now() - 2 * 3600000).toISOString()
        },
        {
          id: 2,
          user_id: userId || 1,
          content: '새로운 프로젝트를 시작했습니다!',
          image_url: 'https://picsum.photos/600/600?random=2',
          created_at: new Date(Date.now() - 5 * 3600000).toISOString()
        },
        {
          id: 3,
          user_id: userId || 1,
          content: '맛있는 커피 한 잔 ☕',
          image_url: 'https://picsum.photos/600/600?random=3',
          created_at: new Date(Date.now() - 24 * 3600000).toISOString()
        }
      ]
      setPosts(mockPosts)
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  const handleImageClick = () => {
    if (!user || !user.id) {
      console.error('User ID not found:', user)
      alert(language === 'ko' ? '사용자 정보를 찾을 수 없습니다.' : 'User information not found.')
      return
    }
    setEditingImage(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageSave = async () => {
    if (!imagePreview) return
    if (!user || !user.id) {
      alert(language === 'ko' ? '사용자 정보를 찾을 수 없습니다.' : 'User information not found.')
      return
    }
    
    setSaving(true)
    try {
      // Base64로 이미지 업로드
      const response = await fetchWithAuth(getApiUrl(`/api/v1/users/${user.id}/profile`), {
        method: 'PUT',
        body: JSON.stringify({
          profile_image: imagePreview // Base64 string
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('API Error:', errorData)
        alert(language === 'ko' 
          ? `이미지 저장에 실패했습니다: ${errorData.message || 'Unknown error'}` 
          : `Failed to save image: ${errorData.message || 'Unknown error'}`)
        return
      }

      const data = await response.json()
      console.log('Profile update response:', data)

      if (data.success) {
        const updatedUser = {
          ...user,
          profile_image: data.data?.profile_image || imagePreview
        }
        localStorage.setItem('currentUser', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setEditingImage(false)
        alert(language === 'ko' ? '프로필 사진이 저장되었습니다.' : 'Profile image saved successfully.')
      } else {
        alert(language === 'ko' ? '이미지 저장에 실패했습니다.' : 'Failed to save image.')
      }
    } catch (error) {
      console.error('Error saving image:', error)
      alert(language === 'ko' 
        ? `서버 오류가 발생했습니다: ${error.message}` 
        : `Server error occurred: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleBioEdit = () => {
    setEditingBio(true)
  }

  const handleBioSave = async () => {
    if (!user || !user.id) {
      alert(language === 'ko' ? '사용자 정보를 찾을 수 없습니다.' : 'User information not found.')
      return
    }

    setSaving(true)
    try {
      const response = await fetchWithAuth(getApiUrl(`/api/v1/users/${user.id}/profile`), {
        method: 'PUT',
        body: JSON.stringify({
          bio: bioText
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('API Error:', errorData)
        alert(language === 'ko' 
          ? `상태 메시지 저장에 실패했습니다: ${errorData.message || 'Unknown error'}` 
          : `Failed to save status message: ${errorData.message || 'Unknown error'}`)
        return
      }

      const data = await response.json()
      console.log('Bio update response:', data)

      if (data.success) {
        const updatedUser = {
          ...user,
          bio: data.data.bio
        }
        localStorage.setItem('currentUser', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setEditingBio(false)
      } else {
        alert(language === 'ko' ? '상태 메시지 저장에 실패했습니다.' : 'Failed to save status message.')
      }
    } catch (error) {
      console.error('Error saving bio:', error)
      alert(language === 'ko' 
        ? `서버 오류가 발생했습니다: ${error.message}` 
        : `Server error occurred: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleBioCancel = () => {
    setBioText(user?.bio || '')
    setEditingBio(false)
  }

  const formatTime = (timestamp) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diff = now - postTime
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return language === 'ko' ? '방금 전' : 'Just now'
    if (minutes < 60) return `${minutes}${language === 'ko' ? '분 전' : 'm ago'}`
    if (hours < 24) return `${hours}${language === 'ko' ? '시간 전' : 'h ago'}`
    if (days < 7) return `${days}${language === 'ko' ? '일 전' : 'd ago'}`
    return postTime.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US')
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          {language === 'ko' ? '로딩 중...' : 'Loading...'}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          {language === 'ko' ? '사용자를 찾을 수 없습니다' : 'User not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* 헤더 */}
        <div className="profile-header">
          <button className="profile-back-btn" onClick={onBack}>
            ←
          </button>
          <h2 className="profile-header-title">
            {language === 'ko' ? '프로필' : 'Profile'}
          </h2>
        </div>

        {/* 프로필 정보 */}
        <div className="profile-info-section">
          <div className="profile-image-container">
            {editingImage ? (
              <div className="profile-image-edit">
                <img 
                  src={imagePreview || user.profile_image || 'https://i.pravatar.cc/150?img=1'} 
                  alt="profile" 
                  className="profile-image"
                />
                <div className="profile-image-edit-controls">
                  <label className="profile-image-upload-btn">
                    {language === 'ko' ? '사진 선택' : 'Choose Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button 
                    className="profile-image-save-btn"
                    onClick={handleImageSave}
                    disabled={saving}
                  >
                    {saving ? (language === 'ko' ? '저장 중...' : 'Saving...') : (language === 'ko' ? '저장' : 'Save')}
                  </button>
                  <button 
                    className="profile-image-cancel-btn"
                    onClick={() => {
                      setEditingImage(false)
                      setImagePreview(user.profile_image)
                    }}
                  >
                    {language === 'ko' ? '취소' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <img 
                src={user.profile_image || 'https://i.pravatar.cc/150?img=1'} 
                alt="profile" 
                className="profile-image clickable"
                onClick={handleImageClick}
              />
            )}
          </div>

          <div className="profile-details">
            <div className="profile-username">{user.username}</div>
            <div className="profile-uid">UID: {user.uid}</div>
            
            <div className="profile-bio-section">
              {editingBio ? (
                <div className="profile-bio-edit">
                  <textarea
                    className="profile-bio-input"
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder={language === 'ko' ? '상태 메시지를 입력하세요' : 'Enter status message'}
                    rows="3"
                  />
                  <div className="profile-bio-edit-controls">
                    <button 
                      className="profile-bio-save-btn"
                      onClick={handleBioSave}
                      disabled={saving}
                    >
                      {saving ? (language === 'ko' ? '저장 중...' : 'Saving...') : (language === 'ko' ? '저장' : 'Save')}
                    </button>
                    <button 
                      className="profile-bio-cancel-btn"
                      onClick={handleBioCancel}
                    >
                      {language === 'ko' ? '취소' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="profile-bio-display">
                  <p className="profile-bio-text">
                    {user.bio || (language === 'ko' ? '상태 메시지가 없습니다' : 'No status message')}
                  </p>
                  <button 
                    className="profile-bio-edit-btn"
                    onClick={handleBioEdit}
                    title={language === 'ko' ? '수정' : 'Edit'}
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 게시물 그리드 */}
        <div className="profile-posts-section">
          <h3 className="profile-posts-title">
            {language === 'ko' ? '게시물' : 'Posts'} ({posts.length})
          </h3>
          {posts.length > 0 ? (
            <div className="profile-posts-grid">
              {posts.map((post) => (
                <div key={post.id} className="profile-post-item">
                  <img 
                    src={post.image_url} 
                    alt="post" 
                    className="profile-post-image"
                  />
                  <div className="profile-post-overlay">
                    <div className="profile-post-stats">
                      <span>❤️ {Math.floor(Math.random() * 100)}</span>
                      <span>💬 {Math.floor(Math.random() * 50)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-no-posts">
              {language === 'ko' ? '게시물이 없습니다' : 'No posts yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

