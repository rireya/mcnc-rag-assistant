# MCNC RAG Assistant 개발 진행 요약

## 📅 작업 일자: 2025-01-31 ~ 2025-02-08

## 🎯 프로젝트 개요

**MCNC RAG Assistant**: 문서 파싱 → 청킹 → 임베딩 → 벡터 DB 저장의 RAG 파이프라인 구축

### 주요 특징
- text-embedding-3-small 모델에 최적화된 청킹 전략
- 문서 타입별 맞춤 설정 (회사문서, 기술명세, 코드, 튜토리얼 등)
- 페이지별 메타데이터(테이블, 이미지) 정확한 매핑
- weakenPage 전처리로 페이지 경계 오버랩 처리

## 🔧 주요 이슈 및 해결

### 1. 페이지 번호 처리 문제

#### 발견된 문제
- 청크에 페이지 3이 누락되는 현상 발견
- 원인: 페이지 내용이 50자 미만인 경우 제외되는 로직

#### 해결 방안
1. **페이지 번호는 모두 포함**: 내용 길이와 무관하게 모든 페이지 번호 보존
2. **메타데이터만 필터링**: 테이블/이미지는 50자 이상 내용이 있는 페이지만 포함

### 2. 오버랩으로 인한 페이지 중복

#### 문제
```
청크 끝부분: "--- 페이지 5 ---" (내용 없음)
```

#### 해결
- 마지막 페이지 마커 이후 30자 미만의 내용만 있으면 오버랩으로 간주하여 제외
- `getPagesFromChunkContent` 메서드에 마지막 마커 특별 처리 로직 추가

### 3. 로그 출력 간소화

#### 변경 전
- 청크별 상세 내용 출력
- 페이지 경계 추출 상세 로그
- 중복 제거 상세 로그

#### 변경 후
```
Processing: 2025_회사소개서.pdf [documents/corporate]
✓ 2025_회사소개서.pdf: 20 chunks, 4,567 tokens (234ms)
```

## 📝 코드 수정 내역

### chunker.ts 주요 변경사항

1. **getPagesFromChunkContent 메서드 개선**
   ```typescript
   // 마지막 마커 특별 처리
   const contentAfterLastMarker = content.substring(lastMarker.position + 20).trim();
   const MIN_TRAILING_CONTENT = 30;

   if (isLastMarker && contentAfterLastMarker.length < MIN_TRAILING_CONTENT) {
     return; // 오버랩으로 간주하여 제외
   }
   ```

2. **enrichChunkWithMetadata 메서드 수정**
   ```typescript
   // 실제 내용이 있는 페이지만 필터링
   const pagesWithContent = pagesInChunk.filter(pageNum => {
     const contentLength = this.getPageContentLength(chunk.content, pageNum);
     return contentLength >= MIN_PAGE_CONTENT;
   });
   ```

3. **로그 간소화**
   - TextChunker 생성자의 상세 로그 제거
   - chunkDocument 메서드의 진행 로그 단순화
   - 개별 청크 생성 로그 제거

## 🚀 다음 단계: 임베딩 처리

### 1. 환경 설정
```bash
# .env.example (최종)
# OpenAI API 설정 (임베딩 생성용)
OPENAI_API_KEY=your_openai_api_key_here

# ChromaDB 설정 (향후 벡터 저장소 구축 시 사용)
# CHROMA_URL=http://localhost:8000
# CHROMA_COLLECTION_NAME=mcnc_documents
```

### 2. 필요한 패키지
```bash
npm install openai @langchain/openai
```

### 3. 구현 계획
1. 임베딩 타입 정의
2. OpenAI API 연동
3. 배치 처리 (100개씩)
4. 결과 저장 (`data/processed/embeddings/`)

## 🔐 보안 고려사항

### API 키 관리 (Public Repository)
1. `.env` 파일은 `.gitignore`에 추가 (필수)
2. `.env.example`만 커밋
3. 로컬에서만 실제 키 관리
4. GitHub Actions 사용 시 Secrets 활용

## 📊 현재 프로젝트 상태

- ✅ 문서 파싱 시스템 구축 완료
- ✅ 청킹 시스템 구현 및 최적화 완료
- ✅ 페이지 매핑 정확도 개선
- ⏳ 임베딩 생성 시스템 구현 예정
- ⏳ ChromaDB 연동 예정
- ⏳ MCP 서버 구축 예정

## 💡 주요 학습 사항

1. **페이지 정보의 중요성**: 단순히 내용 길이로 페이지를 제외하면 안됨
2. **오버랩 처리**: 청크 경계의 페이지 마커는 특별히 처리 필요
3. **로그 가독성**: 개발 중에는 간결한 로그가 더 효율적
4. **설정 관리**: 하드코딩보다 중앙 집중식 설정이 유지보수에 유리

## 📌 참고 사항

- 프로젝트 구조는 `scripts/config/paths.ts`에서 중앙 관리
- 청킹 전략은 `scripts/config/rag-config.ts`에서 관리
- text-embedding-3-small 모델 사용 (비용 효율적)