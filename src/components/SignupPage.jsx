import React, { useState } from 'react'
import { getCurrentLanguage } from '../utils/i18n'
import { getApiUrl } from '../config/api'
import './SignupPage.css'

const SignupPage = ({ onSignup, onBack }) => {
  const [language] = useState(getCurrentLanguage())
  const [step, setStep] = useState(1) // 1: 회원가입 폼, 2: 이메일 인증
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    name: '',
    birthDate: '',
    countryCode: '+82', // 기본값: 한국
    phoneNumber: ''
  })
  const [verificationCode, setVerificationCode] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = language === 'ko' ? '이메일을 입력해주세요' : 'Please enter your email'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = language === 'ko' ? '올바른 이메일 형식이 아닙니다' : 'Invalid email format'
    }

    // Nickname validation
    if (!formData.nickname.trim()) {
      newErrors.nickname = language === 'ko' ? '닉네임을 입력해주세요' : 'Please enter your nickname'
    } else if (formData.nickname.length < 3) {
      newErrors.nickname = language === 'ko' ? '닉네임은 최소 3자 이상이어야 합니다' : 'Nickname must be at least 3 characters'
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = language === 'ko' ? '비밀번호를 입력해주세요' : 'Please enter your password'
    } else if (formData.password.length < 6) {
      newErrors.password = language === 'ko' ? '비밀번호는 최소 6자 이상이어야 합니다' : 'Password must be at least 6 characters'
    }

    // Confirm password validation
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = language === 'ko' ? '비밀번호 확인을 입력해주세요' : 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = language === 'ko' ? '비밀번호가 일치하지 않습니다' : 'Passwords do not match'
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = language === 'ko' ? '이름을 입력해주세요' : 'Please enter your name'
    }

    // Birth date validation
    if (!formData.birthDate.trim()) {
      newErrors.birthDate = language === 'ko' ? '생년월일을 입력해주세요' : 'Please enter your birth date'
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.birthDate)) {
        newErrors.birthDate = language === 'ko' ? '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)' : 'Invalid date format (YYYY-MM-DD)'
      }
    }

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = language === 'ko' ? '핸드폰번호를 입력해주세요' : 'Please enter your phone number'
    } else {
      // 숫자와 하이픈만 허용
      const phoneRegex = /^[0-9-]+$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = language === 'ko' ? '올바른 전화번호 형식이 아닙니다' : 'Invalid phone number format'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const requestBody = {
        email: formData.email,
        username: formData.nickname, // API는 username 필드 사용
        password: formData.password,
        realName: formData.name, // API는 realName 필드 사용
        birthDate: formData.birthDate,
        phoneNumber: `${formData.countryCode}${formData.phoneNumber}` // 국가번호 포함
      }
      console.log('Sending signup request:', { ...requestBody, password: '***' })

      // Call signup API
      const response = await fetch(getApiUrl('/api/v1/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      let data
      try {
        data = await response.json()
      } catch (error) {
        console.error('Failed to parse response:', error)
        data = { message: response.statusText || 'Unknown error' }
      }

      if (response.ok) {
        // Move to verification step
        setStep(2)
      } else {
        // Show error with detailed message
        console.error('Signup API error:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        })
        const errorMessage = data?.message || data?.error || response.statusText || (language === 'ko' ? '회원가입에 실패했습니다' : 'Signup failed')
        setErrors({
          submit: errorMessage
        })
      }
    } catch (error) {
      console.error('Signup error:', error)
      setErrors({
        submit: language === 'ko' ? '서버 오류가 발생했습니다' : 'Server error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async (e) => {
    e.preventDefault()

    if (!verificationCode.trim()) {
      setErrors({
        verificationCode: language === 'ko' ? '인증 코드를 입력해주세요' : 'Please enter verification code'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(getApiUrl('/api/v1/auth/verify-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode
        })
      })

      let data
      try {
        data = await response.json()
      } catch (error) {
        console.error('Failed to parse verification response:', error)
        data = { message: response.statusText || 'Unknown error' }
      }

      if (response.ok) {
        // Signup successful - get user info from API
        try {
          const userResponse = await fetch(getApiUrl(`/api/v1/users/email/${encodeURIComponent(formData.email)}`))
          if (userResponse.ok) {
            const userData = await userResponse.json()
            if (userData.success && userData.data) {
              if (onSignup) {
                onSignup(userData.data)
              }
              return
            }
          }
        } catch (error) {
          console.error('Error loading user after signup:', error)
        }

        // Fallback
        if (onSignup) {
          onSignup({
            email: formData.email,
            nickname: formData.nickname
          })
        }
      } else {
        setErrors({
          verificationCode: data.message || (language === 'ko' ? '인증 코드가 올바르지 않습니다' : 'Invalid verification code')
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      setErrors({
        verificationCode: language === 'ko' ? '서버 오류가 발생했습니다' : 'Server error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    try {
      const response = await fetch(getApiUrl('/api/v1/auth/send-verification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email
        })
      })

      if (response.ok) {
        alert(language === 'ko' ? '인증 코드가 재발송되었습니다' : 'Verification code resent')
      }
    } catch (error) {
      console.error('Resend code error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* 헤더 */}
        <div className="signup-header">
          <button className="signup-back-btn" onClick={onBack}>
            ←
          </button>
          <img
            src="/images/SETLONE_Left_logo.png"
            alt="SETLONE"
            className="signup-logo"
          />
        </div>

        {step === 1 ? (
          /* 회원가입 폼 */
          <div className="signup-content">
            <h2 className="signup-title">
              {language === 'ko' ? '회원가입' : 'Sign Up'}
            </h2>

            <form className="signup-form" onSubmit={handleSubmit}>
              {/* 이메일 */}
              <div className="signup-input-group">
                <label className="signup-label">
                  {language === 'ko' ? '이메일' : 'Email'} *
                </label>
                <input
                  type="email"
                  name="email"
                  className={`signup-input ${errors.email ? 'error' : ''}`}
                  placeholder={language === 'ko' ? '이메일을 입력하세요' : 'Enter your email'}
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <span className="signup-error">{errors.email}</span>
                )}
              </div>

              {/* 닉네임 */}
              <div className="signup-input-group">
                <label className="signup-label">
                  {language === 'ko' ? '닉네임' : 'Nickname'} *
                </label>
                <input
                  type="text"
                  name="nickname"
                  className={`signup-input ${errors.nickname ? 'error' : ''}`}
                  placeholder={language === 'ko' ? '닉네임을 입력하세요 (최소 3자)' : 'Enter nickname (min 3 chars)'}
                  value={formData.nickname}
                  onChange={handleChange}
                />
                {errors.nickname && (
                  <span className="signup-error">{errors.nickname}</span>
                )}
              </div>

              {/* 비밀번호 */}
              <div className="signup-input-group">
                <label className="signup-label">
                  {language === 'ko' ? '비밀번호' : 'Password'} *
                </label>
                <input
                  type="password"
                  name="password"
                  className={`signup-input ${errors.password ? 'error' : ''}`}
                  placeholder={language === 'ko' ? '비밀번호를 입력하세요 (최소 6자)' : 'Enter password (min 6 chars)'}
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <span className="signup-error">{errors.password}</span>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div className="signup-input-group">
                <label className="signup-label">
                  {language === 'ko' ? '비밀번호 확인' : 'Confirm Password'} *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className={`signup-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder={language === 'ko' ? '비밀번호를 다시 입력하세요' : 'Re-enter your password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && (
                  <span className="signup-error">{errors.confirmPassword}</span>
                )}
              </div>

              {/* 이름 */}
              <div className="signup-input-group">
                <label className="signup-label">
                  {language === 'ko' ? '이름' : 'Name'} *
                </label>
                <input
                  type="text"
                  name="name"
                  className={`signup-input ${errors.name ? 'error' : ''}`}
                  placeholder={language === 'ko' ? '이름을 입력하세요' : 'Enter your name'}
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <span className="signup-error">{errors.name}</span>
                )}
              </div>

              {/* 생년월일 */}
              <div className="signup-input-group">
                <label className="signup-label">
                  {language === 'ko' ? '생년월일' : 'Birth Date'} *
                </label>
                <input
                  type="date"
                  name="birthDate"
                  className={`signup-input ${errors.birthDate ? 'error' : ''}`}
                  value={formData.birthDate}
                  onChange={handleChange}
                />
                {errors.birthDate && (
                  <span className="signup-error">{errors.birthDate}</span>
                )}
              </div>

              {/* 핸드폰번호 */}
              <div className="signup-input-group">
                <label className="signup-label">
                  {language === 'ko' ? '핸드폰번호' : 'Phone Number'} *
                </label>
                <div className="phone-input-container">
                  <select
                    name="countryCode"
                    className="phone-country-select"
                    value={formData.countryCode}
                    onChange={handleChange}
                  >
                    <option value="+82">🇰🇷 +82 (KR)</option>
                    <option value="+1">🇺🇸 +1 (US)</option>
                    <option value="+81">🇯🇵 +81 (JP)</option>
                    <option value="+86">🇨🇳 +86 (CN)</option>
                    <option value="+44">🇬🇧 +44 (GB)</option>
                    <option value="+33">🇫🇷 +33 (FR)</option>
                    <option value="+49">🇩🇪 +49 (DE)</option>
                    <option value="+39">🇮🇹 +39 (IT)</option>
                    <option value="+34">🇪🇸 +34 (ES)</option>
                    <option value="+7">🇷🇺 +7 (RU)</option>
                    <option value="+91">🇮🇳 +91 (IN)</option>
                    <option value="+61">🇦🇺 +61 (AU)</option>
                    <option value="+55">🇧🇷 +55 (BR)</option>
                    <option value="+52">🇲🇽 +52 (MX)</option>
                    <option value="+65">🇸🇬 +65 (SG)</option>
                    <option value="+852">🇭🇰 +852 (HK)</option>
                    <option value="+886">🇹🇼 +886 (TW)</option>
                    <option value="+971">🇦🇪 +971 (AE)</option>
                    <option value="+966">🇸🇦 +966 (SA)</option>
                    <option value="+20">🇪🇬 +20 (EG)</option>
                    <option value="+27">🇿🇦 +27 (ZA)</option>
                  </select>
                  <input
                    type="tel"
                    name="phoneNumber"
                    className={`signup-input phone-number-input ${errors.phoneNumber ? 'error' : ''}`}
                    placeholder={language === 'ko' ? '010-1234-5678' : '010-1234-5678'}
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>
                {errors.phoneNumber && (
                  <span className="signup-error">{errors.phoneNumber}</span>
                )}
              </div>

              {errors.submit && (
                <div className="signup-error-message">{errors.submit}</div>
              )}

              <button
                type="submit"
                className="signup-submit-btn"
                disabled={loading}
              >
                {loading
                  ? (language === 'ko' ? '처리 중...' : 'Processing...')
                  : (language === 'ko' ? '회원가입' : 'Sign Up')
                }
              </button>
            </form>
          </div>
        ) : (
          /* 이메일 인증 */
          <div className="signup-content">
            <h2 className="signup-title">
              {language === 'ko' ? '이메일 인증' : 'Email Verification'}
            </h2>
            <p className="signup-verification-text">
              {language === 'ko'
                ? `${formData.email}로 인증 코드를 발송했습니다.`
                : `Verification code has been sent to ${formData.email}.`
              }
            </p>
            <p className="signup-verification-hint">
              {language === 'ko'
                ? '인증 코드: 123456'
                : 'Verification code: 123456'
              }
            </p>

            <form className="signup-form" onSubmit={handleVerifyEmail}>
              <div className="signup-input-group">
                <label className="signup-label">
                  {language === 'ko' ? '인증 코드' : 'Verification Code'} *
                </label>
                <input
                  type="text"
                  name="verificationCode"
                  className={`signup-input ${errors.verificationCode ? 'error' : ''}`}
                  placeholder={language === 'ko' ? '인증 코드를 입력하세요' : 'Enter verification code'}
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value)
                    if (errors.verificationCode) {
                      setErrors(prev => ({
                        ...prev,
                        verificationCode: ''
                      }))
                    }
                  }}
                  maxLength="6"
                />
                {errors.verificationCode && (
                  <span className="signup-error">{errors.verificationCode}</span>
                )}
              </div>

              <button
                type="submit"
                className="signup-submit-btn"
                disabled={loading}
              >
                {loading
                  ? (language === 'ko' ? '인증 중...' : 'Verifying...')
                  : (language === 'ko' ? '인증하기' : 'Verify')
                }
              </button>

              <button
                type="button"
                className="signup-resend-btn"
                onClick={handleResendCode}
                disabled={loading}
              >
                {language === 'ko' ? '인증 코드 재발송' : 'Resend Code'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default SignupPage

