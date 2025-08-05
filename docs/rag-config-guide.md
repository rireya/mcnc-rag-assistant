# RAG 설정 파일 가이드

## 📋 개요

`rag-config.ts`는 MCNC RAG Assistant의 **청킹, 임베딩, 검색 최적화 설정**을 중앙 관리하는 파일입니다. 복잡한 캐싱, 로깅, 비용 제한 기능은 제거하고 **핵심 최적화 파라미터만** 포함한 미니멀한 설계입니다.

## 🎯 설계 원칙

- **단순함 우선**: 100줄 이내, 2개 함수만으로 구성
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

| 문서 타입 | 청크 크기 | 오버랩 | 문자/토큰 | 전처리 | 전략 목적 |
|-----------|-----------|--------|-----------|---------|-----------|
| **documents/corporate** | 1200 | 150 | 2.5 | weakenPage | 회사 문서 - 연속성 유지 |
| **documents/specifications** | 800 | 120 | 3.0 | none | 기술명세서 - 독립적 섹션 |
| **documents/manuals** | 900 | 100 | 2.8 | none | 매뉴얼 - 단계별 구조 |
| **documents/policies** | 700 | 80 | 2.7 | none | 정책 - 명확한 구분 |
| **documents/presentations** | 600 | 60 | 2.5 | weakenPage | 발표자료 - 연속성 유지 |
| **code/bizmob-sdk** | 600 | 80 | 3.5 | none | SDK 코드 - 함수 단위 |
| **code/components** | 500 | 50 | 3.5 | none | 컴포넌트 - 모듈 독립 |
| **guides/tutorials** | 800 | 100 | 3.0 | weakenPage | 튜토리얼 - 학습 흐름 |
| **guides/api-docs** | 500 | 0 | 3.2 | none | API 문서 - 메서드 독립 |
| **guides/examples** | 400 | 40 | 3.3 | none | 예제 - 코드 단위 |

#### 전처리 전략 (preprocessor)

- **none**: 전처리 없음 (기본값)
  - 사용: 코드, API 문서, 정책 등 독립적 단위가 중요한 문서
  - 효과: 원본 구조 완전 보존

- **weakenPage**: 페이지 구분자 약화
  - 사용: 회사소개서, 발표자료, 튜토리얼 등 연속성이 중요한 문서
  - 동작: `--- 페이지 X ---` → `<<PAGE_BOUNDARY_X>>` → 청킹 → 복원
  - 효과: 페이지 정보 보존 + 오버랩 적용

- **removePage**: 페이지 구분자 제거
  - 사용: 페이지 정보가 불필요한 경우
  - 동작: `--- 페이지 X ---` → 완전 제거
  - 효과: 하나의 연속된 텍스트로 처리

#### 문자/토큰 비율 (avgCharsPerToken) 설정 가이드

- **한글 중심 문서**: 2.5 (회사소개서, 발표자료)
- **한글 위주 문서**: 2.7-2.8 (매뉴얼, 정책)
- **한글/영문 혼합**: 3.0 (튜토리얼, 기술명세)
- **영문 위주 문서**: 3.2 (API 문서)
- **코드 파일**: 3.5 (SDK, 컴포넌트)

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
const strategy = getChunkingStrategy('data/source/documents/corporate/회사소개서.pdf');
// 결과: {
//   chunkSize: 1200,
//   overlap: 150,
//   separators: [...],
//   avgCharsPerToken: 2.5,
//   preprocessor: 'weakenPage'
// }

const strategy = getChunkingStrategy('data/source/code/bizmob-sdk/core.js');
// 결과: {
//   chunkSize: 600,
//   overlap: 80,
//   separators: [...],
//   avgCharsPerToken: 3.5,
//   preprocessor: 'none'
// }
```

**매칭 로직**: 파일 경로에 포함된 패턴으로 전략 결정
- `documents/corporate` 포함 → 회사 관련 문서 전략
- `code/bizmob-sdk` 포함 → SDK 코드 전략
- 매칭 안 됨 → DEFAULT_STRATEGY

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
- `OPENAI_API_KEY` 환경변수 존재 여부 (경고만)
- 청크 크기 최소값 검증
- 오버랩이 청크 크기를 초과하지 않는지 검증
- 문자/토큰 비율이 정상 범위(1-5) 내인지 검증

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
const chunker = new TextChunker(strategy, strategyName);

// strategy에는 이제 avgCharsPerToken과 preprocessor가 포함됨
console.log(`Using ${strategy.avgCharsPerToken} chars per token`);
console.log(`Preprocessor: ${strategy.preprocessor || 'none'}`);
```

### 3. 전처리 활용

```typescript
// chunker.ts의 preprocessText 메서드
private preprocessText(text: string): string {
  switch (this.strategy.preprocessor) {
    case 'removePage':
      // 페이지 구분자 완전 제거
      return text.replace(/\n--- 페이지 \d+ ---\n/g, '\n\n');

    case 'weakenPage':
      // 페이지 구분자를 약한 마커로 변경
      return text.replace(/\n--- 페이지 (\d+) ---\n/g, '\n\n<<PAGE_BOUNDARY_$1>>\n\n');

    default:
      return text;
  }
}
```

## 🔄 설정 커스터마이징

### 청킹 전략 조정

특정 문서 타입의 성능을 개선하려면:

```typescript
// rag-config.ts에서 수정
'documents/corporate': {
  chunkSize: 1500,          // 더 큰 청크로 문맥 보존 강화
  overlap: 200,             // 더 많은 오버랩으로 연결성 개선
  separators: ['\n\n', '\n', '. '],  // 구분자 단순화
  avgCharsPerToken: 2.3,    // 실제 측정값으로 미세 조정
  preprocessor: 'removePage' // 페이지 구분 완전 제거
}
```

### 새로운 전처리 전략 추가

필요한 경우 새로운 전처리 방식 추가:

```typescript
// types.ts에서
preprocessor?: 'removePage' | 'weakenPage' | 'removeHeaders' | 'none';

// chunker.ts에서
case 'removeHeaders':
  // 섹션 헤더 제거
  return text.replace(/^#+\s+.+$/gm, '');
```

### 문서별 오버랩 강제 적용

특정 문서에서 오버랩을 확실히 보장하려면:

```typescript
'documents/critical': {
  chunkSize: 1000,
  overlap: 200,
  separators: ['\n\n'],     // 단순한 구분자만 사용
  avgCharsPerToken: 3.0,
  preprocessor: 'weakenPage',
  forceOverlap: true        // 향후 구현 가능
}
```

## ⚠️ 주의사항

### 1. 전처리 전략 선택

- **연속성 중요**: 회사소개서, 발표자료, 튜토리얼 → `weakenPage`
- **독립성 중요**: API 문서, 정책, 코드 → `none`
- **과도한 전처리 주의**: 원본 구조를 너무 많이 변경하면 검색 품질 저하

### 2. 청크 크기 설정

- **너무 작으면**: 문맥 손실, 검색 품질 저하
- **너무 크면**: 토큰 한도 초과, 처리 속도 저하
- **권장**: 400-1200 토큰 범위

### 3. 오버랩 설정

- **너무 적으면**: 문장/단락 경계에서 정보 손실
- **너무 많으면**: 중복 정보로 저장 공간 낭비
- **권장**: 청크 크기의 10-20%

### 4. 문자/토큰 비율

- **정확한 측정**: 실제 데이터로 검증 후 조정
- **문서 타입별**: 언어와 내용에 따라 큰 차이
- **주기적 검토**: 데이터 변화 시 재조정 필요

### 5. 병렬 처리

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

### 2. 고급 전처리 옵션

더 정교한 전처리가 필요한 경우:

```typescript
preprocessor: {
  type: 'custom',
  rules: [
    { pattern: /regex/, replacement: 'text' },
    { pattern: /regex2/, action: 'remove' }
  ]
}
```

### 3. 품질 메트릭

청킹 품질 모니터링이 필요하면 추가:

```typescript
MONITORING: {
  COLLECT_QUALITY_METRICS: true,
  CHUNK_SIZE_DISTRIBUTION: true,
  SEMANTIC_COHERENCE_CHECK: true,
  OVERLAP_EFFECTIVENESS: true
}
```

## 🎯 결론

현재 `rag-config.ts`는 **필요한 기능은 모두 포함하면서도 최대한 단순한** 설계입니다. 특히:

1. **avgCharsPerToken**: 문서 타입별 정확한 토큰 변환
2. **preprocessor**: 문서 특성에 맞는 전처리 전략
3. **유연한 구분자**: 문서 구조에 최적화된 분할

이를 통해 각 문서 타입에 최적화된 청킹이 가능합니다.

**핵심 철학**: "지금 필요한 것만, 완벽하게"

## 📅 최종 업데이트

- 2025-01-31: avgCharsPerToken 필드 추가
- 2025-01-31: preprocessor 전략 추가 및 문서별 권장사항 적용
