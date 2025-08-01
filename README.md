# MCNC RAG Assistant - 청킹 및 임베딩 시스템 설계 요약

## 📋 프로젝트 현황

### 완료된 작업 (95%)
- ✅ **파싱 시스템**: GitHub Actions + Python으로 JSON 파싱 완료
- ✅ **폴더 구조**: documents/, code/, guides/ 체계 구축
- ✅ **경로 관리**: paths.ts 중앙 관리 시스템
- ✅ **데이터 검증**: 파일 구조 및 처리 검증 시스템

### 현재 파싱된 샘플 데이터
```
data/processed/parsed/
├── documents/corporate/2025_회사소개서.json (53페이지, ~20,000토큰)
├── code/bizmob-sdk/core/bizMOB-core-web.json (4,296단어, ~6,000토큰)
└── guides/api-docs/bizMOB-Device.json, bizMOB-Network.json (~3,000토큰)
```

## 🎯 확정된 기술 스택

### 청킹 시스템
- **라이브러리**: LangChain의 `SemanticChunker`
- **임베딩 모델**: OpenAI `text-embedding-3-large`
- **접근 방식**: 시맨틱 청킹 (의미적 경계 기반 분할)
- **언어**: TypeScript/JavaScript

### 임베딩 및 저장
- **임베딩 모델**: OpenAI `text-embedding-3-large`
- **벡터 저장소**: ChromaDB
- **배포 환경**: Docker → Render

## 🏗️ 문서 타입별 청킹 전략

### 1. DOCUMENTS 폴더
#### CORPORATE (회사소개서)
- **전략**: 페이지 + 섹션 기반 분할
- **청크 크기**: 1500 토큰
- **오버랩**: 200 토큰
- **특징**: 마케팅 문서, 큰 청크로 문맥 보존

#### SPECIFICATIONS (기술명세서)
- **전략**: 기술 섹션 기반 분할
- **청크 크기**: 1000 토큰
- **오버랩**: 150 토큰

### 2. CODE 폴더
#### BIZMOB_SDK/CORE
- **전략**: 클래스 및 메서드 기반 분할
- **청크 크기**: 800 토큰
- **오버랩**: 100 토큰
- **특징**: 함수/클래스 완결성 보장

### 3. GUIDES 폴더
#### API_DOCS
- **전략**: 메서드별 완전 분할
- **청크 크기**: 600 토큰
- **오버랩**: 0 토큰 (독립적 문서)
- **특징**: `<method>` 태그 기반 구조화

## 💰 비용 분석

### 예상 처리 비용 (text-embedding-3-large 기준)
```
현재 샘플 파일들:
- 청킹 비용: ~$4 (최초 1회)
- 임베딩 비용: ~$77 (청크 개수에 비례)
- 총 비용: ~$81

전체 프로젝트 예상:
- 개발 단계: $100-200 (캐싱 없이)
- 운영 단계: 월 $20-40
```

### 캐싱을 통한 비용 절약
- **개발 단계**: 90% 절약 가능 ($100-200 → $10-20)
- **운영 단계**: 75% 절약 가능 (부분 업데이트)

## 🏛️ 최종 시스템 아키텍처

### 데이터 플로우
```
원본 파일 → 파싱 (JSON) → 청킹 → 임베딩 → ChromaDB 저장
    ↓           ↓            ↓        ↓
GitHub Actions  완료      캐싱 적용   중복 체크
```

### 캐싱 전략 (단순화된 구조)
```typescript
interface CachingSystem {
  // Level 1: 청킹 캐시 (파일 시스템)
  chunking_cache: {
    location: "./data/cache/chunks/",
    format: "JSON 파일",
    key: "file_hash + chunking_config"
  },

  // Level 2: ChromaDB (임베딩 영구 저장소)
  embedding_storage: {
    location: "ChromaDB",
    duplicate_check: "내장 기능 활용",
    metadata: "chunk_hash, file_path, created_at"
  }
}
```

## 📊 처리 플로우

### 1. 청킹 단계
```
1. 파일 해시 생성
2. 청킹 캐시 확인
3. [HIT] 캐시된 청크 반환 | [MISS] SemanticChunker 실행
4. 새 결과 캐시 저장
```

### 2. 임베딩 단계
```
1. 각 청크를 ChromaDB에서 중복 체크
2. [존재] 스킵 | [없음] OpenAI 임베딩 생성
3. 새 임베딩을 ChromaDB에 저장
4. 메타데이터와 함께 인덱싱
```

## 🎯 구현 우선순위

### Phase 1: 청킹 시스템 구현
- [ ] SemanticChunker 설정 및 초기화
- [ ] 문서 타입별 청킹 전략 구현
- [ ] 청킹 캐시 시스템 구현
- [ ] 배치 처리 스크립트 작성

### Phase 2: 임베딩 시스템 구현
- [ ] OpenAI 임베딩 API 연동
- [ ] ChromaDB 연결 및 설정
- [ ] 중복 체크 로직 구현
- [ ] 배치 임베딩 처리

### Phase 3: 통합 및 최적화
- [ ] 전체 파이프라인 통합
- [ ] 에러 처리 및 로깅
- [ ] 성능 최적화
- [ ] 모니터링 시스템

## 🚀 다음 개발 단계

### 즉시 구현할 항목
1. **청킹 스크립트 구조 설계**
   ```
   scripts/chunking/
   ├── chunker.ts (메인 로직)
   ├── strategies/ (문서별 전략)
   └── cache/ (캐싱 시스템)
   ```

2. **SemanticChunker 설정**
   ```typescript
   const textSplitter = new SemanticChunker({
     embeddings: new OpenAIEmbeddings({
       modelName: "text-embedding-3-large"
     })
   });
   ```

3. **캐시 시스템 구현**
   - 파일 기반 청킹 캐시
   - ChromaDB 중복 체크

## 💡 핵심 설계 결정사항

### ✅ 확정된 사항
- **시맨틱 청킹 채택**: 품질 우선, 비용은 캐싱으로 해결
- **OpenAI 임베딩 사용**: text-embedding-3-large 모델
- **ChromaDB 활용**: 벡터 저장 + 중복 방지
- **단순한 캐싱**: Redis 없이 파일 기반 캐싱
- **TypeScript 구현**: 기존 프로젝트와 일관성

### ⚠️ 주의사항
- **API 비용 관리**: 캐싱 전략으로 90% 절약 목표
- **결과 일관성**: 캐싱으로 동일한 청킹 결과 보장
- **확장성 고려**: 문서 증가에 대비한 배치 처리

## 📅 마일스톤

- **Week 1**: 청킹 시스템 구현 완료
- **Week 2**: 임베딩 시스템 구현 완료
- **Week 3**: 통합 테스트 및 최적화
- **Week 4**: 배포 준비 및 문서화

---

**다음 대화 주제**: SemanticChunker 구현 및 청킹 캐시 시스템 개발