# MCNC RAG Assistant 청킹 시스템 구현 - 대화 요약

## 📋 대화 개요

**날짜**: 2025년 2월 2일
**주제**: MCNC RAG Assistant 프로젝트의 청킹 시스템 구현
**결과**: RecursiveCharacterTextSplitter 기반 청킹 시스템 완성

---

## 🎯 주요 결정사항

### 1. SemanticChunker vs RecursiveCharacterTextSplitter 선택

#### **초기 계획**: SemanticChunker 사용
- LangChain의 SemanticChunker를 사용하여 의미적 경계 기반 청킹
- 더 정확한 의미 단위 분할 기대

#### **문제 발견**: JavaScript에서 SemanticChunker 미지원
- `langchain-experimental` 패키지가 JavaScript/TypeScript에 존재하지 않음
- SemanticChunker는 Python 전용

#### **대안 발견**: JavaScript SemanticChunker 라이브러리들
- `semantic-chunking` (jparkerweb) - ONNX 모델 사용, 로컬 처리 가능
- `@elpassion/semantic-chunking` - OpenAI/로컬 모델 지원
- `tsensei/Semantic-Chunking-Typescript` - GitHub 오픈소스

#### **최종 선택**: RecursiveCharacterTextSplitter
**선택 이유**:
- ✅ **사내 유지보수 안정성**: LangChain 공식 지원으로 장기 유지보수 보장
- ✅ **팀 협업 효율성**: 다른 개발자들이 이해하기 쉬운 검증된 기술
- ✅ **빠른 프로젝트 완성**: 복잡한 실험 없이 안정적 구현
- ✅ **향후 확장성**: 언제든 SemanticChunker로 교체 가능한 구조

---

## 🏗️ 구현된 시스템 구조

### 파일 구조
```
scripts/
├── config/
│   ├── rag-config.ts              # 청킹 전략 설정
│   ├── database-config.ts         # ChromaDB 설정
│   └── paths.ts                   # 경로 중앙 관리
├── rag/
│   ├── types.ts                   # 타입 정의
│   ├── utils.ts                   # 공통 유틸리티
│   └── chunker.ts                 # 청킹 로직
└── chunk-processor.ts             # 청킹 실행 스크립트
```

### 핵심 컴포넌트

#### **1. rag-config.ts**
- **역할**: 문서별 청킹 전략 정의
- **전략 수**: 10가지 문서 타입별 맞춤 설정
- **주요 설정**:
  - `documents/corporate`: 1200토큰, 150오버랩 (문맥 보존)
  - `code/bizmob-sdk`: 600토큰, 80오버랩 (함수 단위)
  - `guides/api-docs`: 500토큰, 0오버랩 (메서드별 독립)

#### **2. chunker.ts**
- **TextChunker**: RecursiveCharacterTextSplitter 래퍼
- **DocumentChunker**: 단일 문서 처리
- **BatchChunker**: 배치 처리 및 통계 생성

#### **3. chunk-processor.ts**
- **실행 스크립트**: CLI 인터페이스 제공
- **처리 모드**: 순차/병렬 처리 지원
- **품질 검사**: 선택적 품질 평가 기능

---

## 🛠️ 구현 과정 중 해결된 문제들

### 1. 함수 Import 오류
**문제**: `getStrategyNameFromPath is not a function`
**원인**: ES module import/export 문제
**해결**:
- path 모듈 올바른 import
- 함수 중복 구현 제거
- ES module 호환성 개선

### 2. 파싱된 문서 구조 검증
**문제**: 일부 JSON 파일에 `content` 필드 누락
**해결**:
- 더 관대한 문서 검증 로직
- 누락된 필드 기본값 자동 설정
- 상세한 오류 메시지 제공

### 3. 병렬 처리 시 파일 경로 문제
**문제**: 청크 파일이 잘못된 경로에 생성
**해결**:
- `generateOutputPath` 함수 개선
- 상대 경로 계산 로직 수정
- 명확한 출력 경로 매핑

### 4. 스크립트 실행 조건 문제
**문제**: npm run chunk 실행 시 무반응
**해결**:
- ES module 실행 조건 수정
- package.json 스크립트 추가
- 디버깅 로그 추가

---

## 📊 최종 구현 결과

### 지원하는 청킹 모드
```bash
npm run chunk              # 기본 순차 처리
npm run chunk:parallel     # 병렬 처리
npm run chunk:quality      # 품질 검사 포함
npm run chunk:full         # 병렬 + 품질 검사
npm run chunk:force        # 강제 재처리
```

### 출력 파일 구조

#### **순차 처리**
```
data/processed/chunks/
└── all-chunks.json        # 모든 청크 통합 파일
```

#### **병렬 처리**
```
data/processed/chunks/
├── all-chunks.json                              # 통합 파일
├── documents/corporate/2025_회사소개서.chunks.json
├── guides/api-docs/bizMOB-Device.chunks.json
└── code/bizmob-sdk/core/bizMOB-core.chunks.json
```

### 성능 특성
- **처리 속도**: 매우 빠름 (로컬 처리)
- **비용**: 무료 (API 호출 없음)
- **안정성**: 높음 (검증된 라이브러리)
- **확장성**: 용이함 (인터페이스 기반 설계)

---

## 🔄 향후 확장 계획

### 단계적 접근법
1. **1단계 (현재)**: RecursiveCharacterTextSplitter로 시스템 완성 ✅
2. **2단계**: 실사용 데이터로 성능 검증
3. **3단계**: semantic-chunking 라이브러리 실험 및 비교
4. **4단계**: 필요시 업그레이드 또는 현상 유지

### 개인 프로젝트 분리 대비
- **인터페이스 추상화**: 청킹 구현체 교체 용이
- **설정 계층화**: 회사용/개인용 설정 분리 가능
- **패키지화 가능**: 향후 npm 패키지 추출 가능

---

## 💡 주요 학습 내용

### 1. 기술 선택의 실용적 접근
- **이상적 선택** vs **실용적 선택**의 균형
- 사내 유지보수와 안정성의 중요성
- 점진적 개선의 가치

### 2. JavaScript 생태계의 한계와 대안
- Python 중심의 AI 라이브러리 vs JavaScript 대안
- ONNX 모델을 활용한 로컬 처리 가능성
- 오픈소스 대안 라이브러리들의 존재

### 3. 청킹 전략의 다양성
- 문서 타입별 맞춤 전략의 중요성
- 구분자 기반 vs 의미적 기반 청킹의 차이
- 실용성과 품질의 균형점

### 4. 시스템 설계 원칙
- **모듈화**: 설정, 로직, 실행의 분리
- **확장성**: 향후 업그레이드 가능한 구조
- **디버깅**: 상세한 로그와 오류 처리

---

## 📋 다음 단계

### 즉시 진행 가능
- [x] 청킹 시스템 완성
- [ ] 임베딩 시스템 구현 (`embedding-processor.ts`)
- [ ] ChromaDB 연동 및 벡터 저장
- [ ] MCP 서버 구현

### 검증 및 최적화
- [ ] 실제 데이터로 청킹 품질 평가
- [ ] 검색 성능 테스트
- [ ] 전략별 성능 비교 분석
- [ ] 필요시 SemanticChunker 재검토

---

## 🎯 결론

**MCNC RAG Assistant의 청킹 시스템이 성공적으로 구현되었습니다.**

이상적인 SemanticChunker 대신 RecursiveCharacterTextSplitter를 선택함으로써:
- ✅ **안정적이고 유지보수 가능한** 시스템 구축
- ✅ **빠른 프로젝트 완성**으로 다음 단계 진행 가능
- ✅ **향후 업그레이드 여지** 보존
- ✅ **팀 협업에 최적화**된 기술 스택 구성

**핵심 교훈**: 완벽한 기술보다는 **현실적이고 지속 가능한 해결책**이 프로젝트 성공에 더 중요하다.