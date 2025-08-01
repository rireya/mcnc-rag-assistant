## MCNC RAG Assistant 프로젝트 대화 요약

### 📋 프로젝트 현황
- **프로젝트명**: MCNC RAG Assistant (bizMOB SDK Knowledge Management System)
- **현재 단계**: 청킹 시스템 구현 완료, 임베딩 시스템 구현 예정
- **기술 스택**: TypeScript, Python, LangChain, ChromaDB, OpenAI

### 🔧 주요 작업 내용

#### 1. **청킹 전략 개선**
- 동적 변환 비율(avgCharsPerToken)을 rag-config.ts에서 설정 가능하도록 수정
- 문서 타입별 다른 비율 적용 (한글: 2.5, 코드: 3.5 등)

#### 2. **오버랩 문제 해결**
- RecursiveCharacterTextSplitter가 페이지 구분자에서 오버랩을 무시하는 문제 발견
- 전처리 전략(preprocessor) 추가:
  - `weakenPage`: 페이지 구분자 약화 (회사문서, 발표자료)
  - `none`: 전처리 없음 (API문서, 코드)

#### 3. **text-embedding-3-small 최적화**
- 기존 청크 크기(400-1200) → 최적화(250-600)로 축소
- 임베딩 모델 특성에 맞춘 전략 재설정
- 검색 성능 향상을 위한 파라미터 조정

#### 4. **검증 스크립트 작성**
- `validate-chunking-strategy.ts` 작성
- 전략 적용, 크기 분포, 오버랩 검증
- npm 스크립트로 통합 (`npm run validate:chunks`)
- 이모지 제거, 한글 라벨 유지로 가독성 확보

### 📁 주요 파일 변경
- `rag-config.ts`: avgCharsPerToken, preprocessor 필드 추가
- `chunker.ts`: 전처리 로직 구현
- `types.ts`: ChunkingStrategy 타입 확장
- `rag-config-guide.md`: 문서 갱신
- `package.json`: npm 스크립트 추가

### ✅ 검증 결과
- 회사소개서 청킹: 평균 555토큰 (목표 600)
- 최적 범위(200-600) 내 비율: 88.9%
- 오버랩: weakenPage 전략으로 해결

### 🎯 다음 단계
임베딩 시스템 구현 예정