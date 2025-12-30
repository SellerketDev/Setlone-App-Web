import koTranslations from '../locales/ko.json'
import enTranslations from '../locales/en.json'

const translations = {
  ko: koTranslations,
  en: enTranslations
}

// 기본 언어는 영문
const defaultLanguage = 'en'

// 현재 언어 가져오기 (localStorage 또는 기본값)
export const getCurrentLanguage = () => {
  try {
    const saved = localStorage.getItem('language')
    if (!saved) return defaultLanguage
    // 저장된 값이 'ko' 또는 'en'인지 확인
    if (saved === 'ko' || saved === '한글') return 'ko'
    if (saved === 'en' || saved === 'English') return 'en'
    return defaultLanguage
  } catch (error) {
    console.error('Error reading language from localStorage:', error)
    return defaultLanguage
  }
}

// 언어 설정
export const setLanguage = (lang) => {
  try {
    // 'ko' 또는 'en' 형식으로 정규화
    const langCode = lang === '한글' || lang === 'ko' ? 'ko' : 'en'
    localStorage.setItem('language', langCode)
    return langCode
  } catch (error) {
    console.error('Error saving language to localStorage:', error)
    return lang === '한글' || lang === 'ko' ? 'ko' : 'en'
  }
}

// 번역 함수
export const t = (key, lang = null, params = {}) => {
  const currentLang = lang || getCurrentLanguage()
  const keys = key.split('.')
  let value = translations[currentLang]
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k]
    } else {
      // 번역이 없으면 기본 언어(영문)에서 찾기
      value = translations[defaultLanguage]
      for (const k2 of keys) {
        if (value && typeof value === 'object') {
          value = value[k2]
        } else {
          return key // 번역이 없으면 키 반환
        }
      }
      break
    }
  }
  
  // 문자열이 아니면 그대로 반환
  if (typeof value !== 'string') {
    return value || key
  }
  
  // 플레이스홀더 치환
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(paramKey => {
      const regex = new RegExp(`\\{${paramKey}\\}`, 'g')
      value = value.replace(regex, params[paramKey])
    })
  }
  
  // 빈 문자열도 유효한 값으로 처리
  if (value === undefined || value === null) {
    return key
  }
  return value
}

// 언어 이름 가져오기
export const getLanguageName = (langCode) => {
  return langCode === 'ko' ? '한글' : 'English'
}

export default {
  getCurrentLanguage,
  setLanguage,
  t,
  getLanguageName
}

