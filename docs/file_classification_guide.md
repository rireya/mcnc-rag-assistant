# MCNC RAG Assistant - 파일 분류 가이드

## 📁 폴더 구조 및 분류 기준

### 1. DOCUMENTS (./data/source/documents/)

**목적**: 공식 문서, 정책, 발표자료 등 비개발자도 참조할 수 있는 문서들

#### 1.1 MANUALS (사용자 매뉴얼)

- **대상**: 일반 사용자, 관리자, 운영자
- **내용**: 제품 사용법, 설치 가이드, 운영 매뉴얼
- **특징**: 단계별 사용법, 스크린샷, 비기술적 설명 중심
- **파일 예시**:
  - `사용자매뉴얼.pdf`
  - `관리자가이드.docx`
  - `설치가이드.pdf`
  - `운영매뉴얼.pptx`

#### 1.2 SPECIFICATIONS (기술 명세서)

- **대상**: 개발자, 기술팀, 아키텍트
- **내용**: 기술 스펙, 시스템 요구사항, 아키텍처 문서
- **특징**: 정형화된 스펙, 기술적 세부사항, 요구사항 정의
- **파일 예시**:
  - `API-명세서.pdf`
  - `시스템-요구사항.docx`
  - `데이터베이스-스키마.pdf`
  - `아키텍처-설계서.pptx`

#### 1.3 POLICIES (정책 문서)

- **대상**: 전 직원, 관리자, 컴플라이언스 담당자
- **내용**: 회사 정책, 보안 정책, 가이드라인, 규정
- **특징**: 규칙, 절차, 준수사항, 정책 설명
- **파일 예시**:
  - `보안정책.pdf`
  - `개발가이드라인.docx`
  - `코딩컨벤션.pdf`
  - `품질관리정책.pptx`

#### 1.4 PRESENTATIONS (발표 자료)

- **대상**: 임직원, 고객, 파트너사
- **내용**: 제품 소개, 기술 발표, 교육 자료
- **특징**: 시각적 자료, 요약된 내용, 발표용 구성
- **파일 예시**:
  - `제품소개서.pptx`
  - `기술세미나.pdf`
  - `교육자료.pptx`
  - `고객발표자료.pdf`

#### 1.5 CORPORATE (회사 관련 문서)

- **대상**: 고객, 투자자, 파트너사, 구직자
- **내용**: 회사 소개, 연혁, 사업영역, 실적
- **특징**: 대외적 홍보 목적, 회사 브랜딩
- **파일 예시**:
  - `회사소개서.pdf`
  - `사업계획서.pptx`
  - `투자제안서.pdf`
  - `회사연혁.docx`

### 2. CODE (./data/source/code/)

**목적**: 소스 코드, 스크립트, 컴포넌트 등 실행 가능한 코드 파일들

#### 2.1 BIZMOB_SDK

**bizMOB SDK 관련 모든 코드 파일들**

##### 2.1.1 ROOT (bizMOB SDK 루트)

- **내용**: SDK 전체 설명, 메인 진입점, 설정 파일
- **파일 예시**: `index.js`, `config.json`, `README.md`

##### 2.1.2 CORE (JavaScript 파일들)

- **내용**: 핵심 JavaScript 구현체, 기본 기능
- **파일 예시**: `bizMOB-core.js`, `device.js`, `network.js`

##### 2.1.3 TYPESCRIPT (TypeScript 래퍼들)

- **내용**: JavaScript 함수를 래핑한 TypeScript 정의
- **파일 예시**: `bizMOB.d.ts`, `device.d.ts`, `types.ts`

#### 2.2 COMPONENTS (일반 컴포넌트)

- **내용**: 재사용 가능한 Vue/React 컴포넌트
- **파일 예시**: `Button.vue`, `Modal.jsx`, `Table.ts`

#### 2.3 COMPOSABLES (일반 Composables)

- **내용**: Vue Composition API 기반 로직
- **파일 예시**: `useApi.js`, `useAuth.ts`, `useUtils.js`

### 3. GUIDES (./data/source/guides/)

**목적**: 개발자를 위한 학습 자료, 예제, 참조 문서

#### 3.1 TUTORIALS (튜토리얼)

- **대상**: 개발자, 신규 팀원
- **내용**: 단계별 학습 가이드, 실습형 문서
- **특징**: 따라하기 형식, 예제 중심, 학습 목적
- **파일 예시**:
  - `developer-guide.pdf`
  - `getting-started.md`
  - `step-by-step-guide.pdf`
  - `beginner-tutorial.docx`

#### 3.2 EXAMPLES (예제 코드)

- **내용**: 실제 구현 예제, 샘플 코드
- **특징**: 바로 실행 가능한 코드, 데모 목적
- **파일 예시**:
  - `login-example.js`
  - `api-usage-sample.ts`
  - `component-demo.vue`

#### 3.3 API_DOCS (API 문서)

- **내용**: API 레퍼런스, 메서드 설명
- **특징**: 구조화된 API 정보, 개발자 참조용
- **파일 예시**:
  - `bizMOB-Device.mdx`
  - `bizMOB-Network.mdx`
  - `API-reference.md`

## 🤖 AI 분류 판단 기준

### 1차 판단: 파일 확장자

```
.pdf, .docx, .pptx, .xlsx → DOCUMENTS 폴더 고려
.js, .ts, .vue, .jsx → CODE 폴더 고려
.md, .mdx → GUIDES 폴더 고려
```

### 2차 판단: 내용 키워드

#### DOCUMENTS 키워드

- **MANUALS**: "사용법", "설치", "운영", "매뉴얼", "가이드", "사용자"
- **SPECIFICATIONS**: "명세", "스펙", "요구사항", "아키텍처", "설계", "시스템"
- **POLICIES**: "정책", "규정", "가이드라인", "보안", "컨벤션", "절차"
- **PRESENTATIONS**: "발표", "소개", "교육", "세미나", "프리젠테이션"
- **CORPORATE**: "회사", "소개", "사업", "연혁", "투자", "브랜딩"

#### CODE 키워드

- **BIZMOB_SDK**: "bizMOB", "SDK", "xross", "Device", "Network"
- **COMPONENTS**: "컴포넌트", "UI", "재사용", "Vue", "React"
- **COMPOSABLES**: "composable", "useXXX", "Composition API"

#### GUIDES 키워드

- **TUTORIALS**: "튜토리얼", "따라하기", "단계별", "실습", "학습"
- **EXAMPLES**: "예제", "샘플", "데모", "example", "sample"
- **API_DOCS**: "API", "메서드", "함수", "레퍼런스", "문서화"

### 3차 판단: 대상 독자

```
일반 사용자 → DOCUMENTS/MANUALS
기술팀/개발자 → DOCUMENTS/SPECIFICATIONS 또는 GUIDES
전 직원 → DOCUMENTS/POLICIES
외부 고객 → DOCUMENTS/PRESENTATIONS 또는 CORPORATE
개발자 학습 → GUIDES/TUTORIALS
개발자 참조 → GUIDES/API_DOCS
```

## 📋 분류 결정 템플릿

파일 분류 시 다음 순서로 판단:

### 1. 파일 정보 분석

- **파일명**: `[파일명 확인]`
- **확장자**: `[확장자 확인]`
- **크기**: `[파일 크기]`

### 2. 내용 분석 (가능한 경우)

- **주요 키워드**: `[핵심 키워드 3-5개]`
- **대상 독자**: `[예상 독자층]`
- **문서 목적**: `[사용 목적]`

### 3. 분류 결정

- **추천 폴더**: `[SECTION/SUBSECTION]`
- **판단 근거**: `[선택 이유]`
- **대안 위치**: `[다른 가능한 위치]`

### 4. 출력 형식

```json
{
  "recommendedPath": "./data/source/[section]/[subsection]/",
  "pathKey": "PATHS.[SECTION].[SUBSECTION]",
  "confidence": "high|medium|low",
  "reasoning": "판단 근거 설명",
  "alternatives": ["대안1", "대안2"]
}
```

## ⚠️ 특수한 경우 처리

### 1. 복합 성격 문서

여러 성격을 가진 문서는 **주된 목적**을 기준으로 분류

### 2. 애매한 경우

- **TUTORIALS vs API_DOCS**: 학습용이면 TUTORIALS, 참조용이면 API_DOCS
- **MANUALS vs SPECIFICATIONS**: 사용법이면 MANUALS, 기술스펙이면 SPECIFICATIONS
- **PRESENTATIONS vs CORPORATE**: 내부용이면 PRESENTATIONS, 대외용이면 CORPORATE

### 3. 신규 하위 폴더 필요 시

기존 구조에 맞지 않으면 가장 유사한 폴더를 추천하고 하위 폴더 생성 제안

## 📅 최종 업데이트

2025-01-31 - 파일 분류 가이드 초기 버전 작성
