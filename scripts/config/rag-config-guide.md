# RAG 설정 파일 가이드

## 📋 개요

`rag-config.ts`는 MCNC RAG Assistant의 **청킹, 임베딩, 검색 최적화 설정**을 중앙 관리하는 파일입니다. 복잡한 캐싱, 로깅, 비용 제한 기능은 제거하고 **핵심 최적화 파라미터만** 포함한 미니멀한 설계입니다.

## 🎯 설계 원칙

- **단순함 우선**: 80줄, 2개 함수만으로 구성
- **실용성 중심**: 실제 성능에 영향을 주는 파라미터만 포함
- **확장 가능**: 필요 시 캐싱, 로깅 기능 추가 가능
- **타입 안전**: TypeScript로 설정 오류 방지

## 📊 주요 설정 섹션

### 1. 임베딩 모델 설정

```typescript
EMBEDDING: {
  MODEL: 'text-embedding-3-small',    // 비용 효율적인 모델
  DIMENSIONS: 1536,                   // 벡터 차원
  BATCH_SIZE: 100,                    // API 배치 크기
  MAX_RETRIES: 3                      // 실패 시 재시도
}
```

**선택 이유**: text-embedding-3-small은 text-embedding-3-large 대비 85% 저렴하면서도 충분한 성능 제공

### 2. 청킹 전략 설정

#### 문서별 맞춤 전략

| 문서 타입 | 청크 크기 | 오버랩 | 전략 목적 |
|-----------|-----------|--------|-----------|
| **documents/corporate** | 1200 | 150 | 회사 관련 문서 - 문맥 보존 |
| **documents/specifications** | 800 | 120 | 기술명세서 - 정확성 확보 |
| **documents/manuals** | 900 | 100 | 매뉴얼 - 단계별 구조 |
| **documents/policies** | 700 | 80 | 정책 - 명확한 구분 |
| **documents/presentations** | 600 | 60 | 발표자료 - 슬라이드별 분할 |
| **code/bizmob-sdk** | 600 | 80 | SDK 코드 - 빠른 검색 |
| **code/components** | 500 | 50 | 컴포넌트 - 모듈별 독립 |
| **guides/tutorials** | 800 | 100 | 튜토리얼 - 단계별 완성도 |
| **guides/api-docs** | 500 | 0 | API 문서 - 메서드별 독립 |
| **guides/examples** | 400 | 40 | 예제 - 작고 명확한 단위 |

#### 구분자(Separators) 전략

- **문서**: `['\n\n', '\n', '. ', ', ', ' ']` - 단락, 문장 단위
- **코드**: `['\nfunction ', '\nclass ', '\nexport ', '\n\n', '\n']` - 함수/클래스 단위
- **API 문서**: `['<method>', '\n## ', '\n### ', '\n\n']` - 메서드 태그 우선

### 3. 품질 관리 설정

```typescript
QUALITY: {
  MIN_CHUNK_SIZE: 50,               // 너무 작은 청크 필터링
  MAX_CHUNK_SIZE: 1500,             // 너무 큰 청크 분할
  EMPTY_CHUNK_FILTER: true,         // 빈 청크 제거
  DUPLICATE_THRESHOLD: 0.95         // 중복 청크 감지 (95% 유사 시 제거)
}
```

### 4. 성능 최적화 설정

```typescript
PERFORMANCE: {
  PARALLEL_CHUNKS: 3,               // 동시 청킹 파일 수
  BATCH_SIZE: 10,                   // 배치 처리 크기
  TOKEN_BUFFER: 100,                // 안전 마진 토큰
  AUTO_ADJUST_SIZE: true            // 토큰 수에 따른 자동 크기 조정
}
```

### 5. 검색 최적화 설정 (MCP 서버용)

```typescript
SEARCH: {
  DEFAULT_K: 10,                    // 기본 검색 결과 수
  SIMILARITY_THRESHOLD: 0.7,        // 유사도 임계값
  MAX_DISTANCE: 0.5,                // 최대 거리 (1 - similarity)
  RERANK: false,                    // 재순위 기능 (향후 확장)
  INCLUDE_METADATA: true            // 메타데이터 포함 여부
}
```

## 🔧 주요 함수

### 1. getChunkingStrategy()

**용도**: 파일 경로에 따라 적절한 청킹 전략 자동 선택

```typescript
// 사용 예시
const strategy = getChunkingStrategy('data/source/code/bizmob-sdk/core.js');
// 결과: { chunkSize: 600, overlap: 80, separators: [...] }

const strategy = getChunkingStrategy('data/source/documents/corporate/회사소개서.json');
// 결과: { chunkSize: 1200, overlap: 150, separators: [...] }
```

**매칭 로직**: 파일 경로에 포함된 패턴으로 전략 결정
- `documents/corporate` 포함 → 회사 관련 문서 전략
- `code/bizmob-sdk` 포함 → SDK 코드 전략
- 매칭 안 됨 → DEFAULT_STRATEGY (chunkSize: 800, overlap: 100)

### 2. validateConfig()

**용도**: 필수 환경변수 및 설정 검증

```typescript
// 사용 예시
const { isValid, errors } = validateConfig();

if (!isValid) {
  console.error('설정 오류:', errors);
  process.exit(1);
}
```

**검증 항목**:
- `OPENAI_API_KEY` 환경변수 존재 여부

## 🚀 사용 방법

### 1. 환경변수 설정

```bash
# .env 파일
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. 설정 import 및 사용

```typescript
// chunker.ts에서
import { RAG_CONFIG, getChunkingStrategy, validateConfig } from './config/rag-config.js';

// 설정 검증
const { isValid, errors } = validateConfig();
if (!isValid) throw new Error(errors.join(', '));

// 전략 선택
const strategy = getChunkingStrategy(filePath);
const chunker = new SemanticChunker({
  chunkSize: strategy.chunkSize,
  chunkOverlap: strategy.overlap,
  separators: strategy.separators
});
```

### 3. 임베딩 설정 사용

```typescript
// embedder.ts에서
import { RAG_CONFIG } from './config/rag-config.js';

const embeddings = new OpenAIEmbeddings({
  modelName: RAG_CONFIG.EMBEDDING.MODEL,
  dimensions: RAG_CONFIG.EMBEDDING.DIMENSIONS,
  batchSize: RAG_CONFIG.EMBEDDING.BATCH_SIZE
});
```

## 🔄 설정 커스터마이징

### 청킹 전략 조정

특정 문서 타입의 성능을 개선하려면:

```typescript
// rag-config.ts에서 수정
'documents/corporate': {
  chunkSize: 1500,    // 더 큰 청크로 문맥 보존 강화
  overlap: 200,       // 더 많은 오버랩으로 연결성 개선
  separators: ['\n\n', '\n', '. ']  // 구분자 단순화
}
```

### 성능 튜닝

처리 속도 개선:

```typescript
PERFORMANCE: {
  PARALLEL_CHUNKS: 5,     // 동시 처리 증가 (메모리 고려)
  BATCH_SIZE: 20,         // 배치 크기 증가
  AUTO_ADJUST_SIZE: false // 자동 조정 비활성화로 속도 우선
}
```

## ⚠️ 주의사항

### 1. 청크 크기 설정

- **너무 작으면**: 문맥 손실, 검색 품질 저하
- **너무 크면**: 토큰 한도 초과, 처리 속도 저하
- **권장**: 400-1200 토큰 범위

### 2. 오버랩 설정

- **너무 적으면**: 문장/단락 경계에서 정보 손실
- **너무 많으면**: 중복 정보로 저장 공간 낭비
- **권장**: 청크 크기의 10-20%

### 3. 병렬 처리

- **PARALLEL_CHUNKS**: 메모리 사용량 고려하여 조정
- **높은 값**: 속도 향상, 메모리 사용량 증가
- **낮은 값**: 안정성 향상, 속도 감소

## 📈 향후 확장 계획

### 1. 캐싱 시스템 (필요 시 추가)

비용 최적화가 필요하면 다음 기능 추가 예정:

```typescript
CACHING: {
  ENABLED: true,
  CHUNK_CACHE_PATH: './data/cache/chunks',
  TTL_HOURS: 168  // 1주일
}
```

### 2. 고급 검색 최적화

MCP 서버 구현 후 필요하면 추가:

```typescript
// 동적 검색 파라미터 조정 함수
export function getOptimizedSearchParams(queryType: 'precise' | 'broad' | 'fast')
```

### 3. 품질 메트릭

청킹 품질 모니터링이 필요하면 추가:

```typescript
MONITORING: {
  COLLECT_QUALITY_METRICS: true,
  CHUNK_SIZE_DISTRIBUTION: true,
  SEMANTIC_COHERENCE_CHECK: true
}
```

## 🎯 결론

현재 `rag-config.ts`는 **필요한 기능은 모두 포함하면서도 최대한 단순한** 설계입니다. 복잡한 기능들은 실제 필요성이 검증된 후 단계적으로 추가할 예정입니다.

**핵심 철학**: "지금 필요한 것만, 완벽하게"