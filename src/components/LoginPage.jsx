import React, { useState } from 'react'
import { getCurrentLanguage, t } from '../utils/i18n'
import './LoginPage.css'

const LoginPage = ({ onLogin, onSignup, onForgotPassword, onBack }) => {
  const [language] = useState(getCurrentLanguage())
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [errors, setErrors] = useState({})

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

  const handleLogin = (e) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors = {}
    if (!formData.username.trim()) {
      newErrors.username = language === 'ko' ? '이메일을 입력해주세요' : 'Please enter your email'
    } else if (!/\S+@\S+\.\S+/.test(formData.username)) {
      newErrors.username = language === 'ko' ? '올바른 이메일 형식을 입력해주세요' : 'Please enter a valid email'
    }
    if (!formData.password.trim()) {
      newErrors.password = language === 'ko' ? '비밀번호를 입력해주세요' : 'Please enter your password'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Call login handler
    if (onLogin) {
      onLogin(formData)
    }
  }

  const handleSignup = () => {
    if (onSignup) {
      onSignup()
    }
  }

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword()
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* 헤더 - 로고 및 뒤로가기 */}
        <div className="login-header">
          <button className="login-back-btn" onClick={onBack}>
            ←
          </button>
          <img 
            src="/images/SETLONE_Left_logo.png" 
            alt="SETLONE" 
            className="login-logo"
          />
        </div>

        {/* 로그인 폼 */}
        <div className="login-content">
          <h2 className="login-title">
            {language === 'ko' ? '로그인' : 'Login'}
          </h2>

          <form className="login-form" onSubmit={handleLogin}>
            {/* 아이디 입력 */}
            <div className="login-input-group">
              <label className="login-label">
                {language === 'ko' ? '이메일' : 'Email'}
              </label>
              <input
                type="email"
                name="username"
                className={`login-input ${errors.username ? 'error' : ''}`}
                placeholder={language === 'ko' ? '이메일을 입력하세요' : 'Enter your email'}
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <span className="login-error">{errors.username}</span>
              )}
            </div>

            {/* 비밀번호 입력 */}
            <div className="login-input-group">
              <label className="login-label">
                {language === 'ko' ? '비밀번호' : 'Password'}
              </label>
              <input
                type="password"
                name="password"
                className={`login-input ${errors.password ? 'error' : ''}`}
                placeholder={language === 'ko' ? '비밀번호를 입력하세요' : 'Enter your password'}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <span className="login-error">{errors.password}</span>
              )}
            </div>

            {/* 비밀번호 분실 */}
            <div className="login-forgot-password">
              <button
                type="button"
                className="login-forgot-btn"
                onClick={handleForgotPassword}
              >
                {language === 'ko' ? '비밀번호를 잊으셨나요?' : 'Forgot Password?'}
              </button>
            </div>

            {/* 로그인 버튼 */}
            <button type="submit" className="login-submit-btn">
              {language === 'ko' ? '로그인' : 'Login'}
            </button>
          </form>

          {/* 회원가입 버튼 */}
          <div className="login-signup-section">
            <p className="login-signup-text">
              {language === 'ko' ? '계정이 없으신가요?' : "Don't have an account?"}
            </p>
            <button
              type="button"
              className="login-signup-btn"
              onClick={handleSignup}
            >
              {language === 'ko' ? '회원가입' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

