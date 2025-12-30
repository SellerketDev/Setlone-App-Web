# Setlone 메인페이지

원형 이미지를 중심으로 여러 사이트로 접속할 수 있는 버튼이 배치된 React 메인페이지입니다.

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`로 접속하세요.

### 빌드

```bash
npm run build
```

## 사용 방법

- 중앙의 원형 이미지를 클릭하거나 호버할 수 있습니다
- 주변의 원형 버튼들을 클릭하면 해당 사이트가 새 탭에서 열립니다
- `src/components/MainPage.jsx` 파일에서 사이트 링크를 수정할 수 있습니다

## 커스터마이징

`src/components/MainPage.jsx` 파일의 `sites` 배열을 수정하여 원하는 사이트를 추가하거나 변경할 수 있습니다.
