## MCNC RAG Assistant 청킹 시스템 구현 대화 요약

### 🎯 프로젝트 상황
- **프로젝트명**: MCNC RAG Assistant (bizMOB SDK Knowledge Management System)
- **현재 단계**: 청킹 시스템 구현 완료 후 검증 중
- **기술 스택**: TypeScript, RecursiveCharacterTextSplitter (LangChain)

### 🔧 주요 해결 내용

#### 1. **청크 파일 경로 문제 해결**
- **문제**: `--parallel` 옵션 사용 시 청크 파일이 `data/processed/chunks/` 대신 `data/source/` 경로에 생성됨
- **원인**: `document.file_path`가 원본 소스 파일 경로를 가리킴
- **해결**: 모든 청크 파일을 `data/processed/chunks/` 폴더에 평면적으로 저장하도록 수정

#### 2. **Overlap 미적용 문제 해결**
- **문제**: 설정된 overlap이 적용되지 않음
- **원인**: RAG 설정은 토큰 단위인데 RecursiveCharacterTextSplitter는 문자 단위로 작동
- **해결**: 토큰을 문자로 변환하는 로직 추가 (평균 3문자/토큰)

### 📊 청킹 검증 결과

#### 검증된 파일들:
1. `2025_회사소개서.chunks.json` (documents/corporate)
2. `bizMOB-core-web.chunks.json` (code/bizmob-sdk)
3. `bizMOB-Device.chunks.json` (guides/api-docs)

#### 발견사항:
- ✅ **Overlap 정상 작동**: 연속된 청크 간 중복 텍스트 확인
- ⚠️ **청크 크기 초과**: 설정 토큰보다 실제 토큰이 더 많음
  - 회사소개서: 1200 설정 → 381~1410 실제
  - bizMOB-core: 600 설정 → 223~502 실제

### 🛠️ 추가 개선사항

#### 1. **동적 변환 비율 적용** (constructor 수정)
```typescript
// 문서 타입별 다른 변환 비율
- 한글 문서: 2.5 문자/토큰
- 코드: 3.5 문자/토큰
- 가이드: 3 문자/토큰
```

#### 2. **청크 크기 조정** (chunkText 메서드에 추가)
```typescript
// MAX_CHUNK_SIZE(1500 토큰) 초과 시 자르기
const sizedChunks = textChunks.map(chunk => {
  const tokens = estimateTokenCount(chunk);
  if (tokens > maxTokens) {
    return truncateToTokenLimit(chunk, maxTokens);
  }
  return chunk;
});
```

### 📋 현재 상태
- 청킹 시스템은 전반적으로 잘 작동
- 토큰 변환 비율 조정으로 더 정확한 청킹 가능
- 다음 단계: 임베딩 시스템 구현 예정

### 💡 주요 파일 위치
- 청킹 로직: `scripts/rag/chunker.ts`
- 설정 파일: `scripts/config/rag-config.ts`
- 유틸리티: `scripts/rag/utils.ts`
- 실행 스크립트: `scripts/chunk-processor.ts`