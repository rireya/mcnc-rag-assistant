# MCNC RAG Assistant 프로젝트 - 컨텍스트 요약

## 📋 프로젝트 개요

- **회사**: 모빌씨앤씨 (MCNC)
- **SDK**: bizMOB
- **프로젝트**: MCNC-RAG-Assistant
- **목적**: bizMOB SDK 지식 관리 및 RAG 기반 MCP 서버 구축
- **현재 단계**: 청킹 시스템 구현 준비 완료

## 🎯 확정된 기술 스택

### 임베딩 모델
- **선택**: text-embedding-3-small
- **이유**: text-embedding-3-large 대비 85% 저렴 ($0.00002/1K vs $0.00013/1K)
- **성능**: 1536 차원, 충분한 검색 품질, 빠른 처리 속도

### 청킹 시스템
- **라이브러리**: LangChain의 SemanticChunker
- **접근 방식**: 의미적 경계 기반 분할
- **문서별 전략**: 10가지 문서 타입별 맞춤 설정

### 벡터 저장소
- **선택**: ChromaDB
- **로컬 개발**: Docker (`docker run -p 8000:8000 chromadb/chroma`)
- **배포**: Render 예정

## 🏗️ 프로젝트 구조

### 기본 구조 (기존 완료)
```
scripts/
├── config/
│   ├── paths.ts              # 경로 중앙 관리 (완료)
│   ├── rag-config.ts         # RAG 최적화 설정 (완료)
│   └── database-config.ts    # ChromaDB 설정 (완료)
├── parsers/                  # Python 파싱 (완료)
├── batch_parser.py          # 문서 파싱 실행 (완료)
└── verify-data-setup.ts     # 데이터 검증 (완료)
```

### RAG 구조 (구현 예정)
```
scripts/rag/
├── chunker.ts               # 청킹 로직 (다음 구현)
├── embedder.ts              # 임베딩 로직
├── utils.ts                 # 기본 유틸리티
└── types.ts                 # 타입 정의

scripts/ (루트)
├── chunk-processor.ts       # 청킹 실행 파일
└── embedding-processor.ts   # 임베딩 실행 파일
```

## 🔄 단계별 처리 파이프라인

### 1단계: 문서 파싱 (완료)
```bash
python scripts/batch_parser.py --all
```
**결과**: `data/processed/parsed/` 에 JSON 파일들 생성

### 2단계: 청킹 처리 (다음 구현)
```bash
tsx scripts/chunk-processor.ts
```
**결과**: `data/processed/chunks/` 에 청크 JSON 파일들 생성

### 3단계: 임베딩 처리 (향후 구현)
```bash
tsx scripts/embedding-processor.ts
```
**결과**: ChromaDB에 벡터 저장

## ⚙️ 설정 파일 구조

### rag-config.ts (완료)
- **크기**: ~80줄 (매우 미니멀)
- **함수**: 2개만 (`getChunkingStrategy`, `validateConfig`)
- **설정**: 임베딩, 청킹 전략, 성능 최적화, 검색 설정
- **특징**: 캐싱, 복잡한 로깅, 비용 제한 모두 제거

### database-config.ts (완료)
- **역할**: ChromaDB 인프라 설정만
- **포함**: URL, 컬렉션명, 연결 설정, 배치 처리
- **분리 이유**: 알고리즘 최적화와 인프라 분리

## 📊 문서별 청킹 전략

| 문서 타입 | 청크 크기 | 오버랩 | 특징 |
|-----------|-----------|--------|------|
| documents/corporate | 1200 | 150 | 회사 관련 문서 - 문맥 보존 |
| documents/specifications | 800 | 120 | 기술명세서 - 정확성 확보 |
| code/bizmob-sdk | 600 | 80 | SDK 코드 - 빠른 검색 |
| guides/api-docs | 500 | 0 | API 문서 - 메서드별 독립 |
| [... 총 10가지 전략] | | | |

## 🚫 제거된 복잡성들

### 캐싱 시스템
- **결정**: 완전 제거 (추후 필요시 추가)
- **이유**: 초기 개발 단순화, 비용 최적화는 나중에 고려
- **영향**: cache-manager.ts 파일 불필요, generateCacheKey() 함수 제거

### 복잡한 로깅/모니터링
- **제거**: MONITORING, ALERTS, 상세 진행상황 표시
- **유지**: 기본적인 console.log만

### 금액 제한/비용 추적
- **제거**: COST_LIMIT, estimateCost() 함수 등
- **이유**: 개발 단계에서는 불필요한 복잡성

### 동적 최적화
- **제거**: getOptimizedConfig(), getOptimizedSearchParams()
- **이유**: 각 전략이 이미 충분히 튜닝됨

## 📁 데이터 구조

### 현재 파싱된 데이터
```
data/processed/parsed/
├── documents/corporate/2025_회사소개서.json (~20,000토큰)
├── code/bizmob-sdk/core/bizMOB-core-web.json (~6,000토큰)
└── guides/api-docs/bizMOB-Device.json (~3,000토큰)
```

### 예상 처리 비용
- **현재 총 토큰**: ~29,000토큰
- **text-embedding-3-small 비용**: ~$0.58 (1회 처리)
- **개발 중 반복**: 캐싱 없어도 몇 달러 수준

## 🎯 다음 구현 단계

### 즉시 구현할 것
1. **scripts/rag/types.ts** - 기본 타입 정의
2. **scripts/rag/utils.ts** - 파일 처리 유틸리티
3. **scripts/rag/chunker.ts** - 청킹 로직 (SemanticChunker 활용)
4. **scripts/chunk-processor.ts** - 청킹 실행 파일

### 구현 방향
- **단순함 우선**: 복잡한 기능 없이 기본 청킹부터
- **단계별 검증**: 청킹 완료 → 결과 확인 → 임베딩 진행
- **점진적 확장**: 필요에 따라 캐싱, 최적화 기능 추가

## 🔧 환경 설정

### 필수 환경변수
```bash
OPENAI_API_KEY=your_api_key_here
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=mcnc_documents
```

### 개발 명령어 (예정)
```bash
# 청킹 처리
npm run chunk

# 임베딩 처리
npm run embed

# 전체 파이프라인
npm run rag:full
```

## 💡 핵심 설계 원칙

1. **미니멀한 설계**: 꼭 필요한 기능만
2. **단계별 처리**: 청킹 → 임베딩 분리
3. **설정 중심**: rag-config.ts 하나로 모든 최적화 관리
4. **타입 안전**: TypeScript로 런타임 오류 방지
5. **확장 가능**: 필요시 기능 추가 용이

## 🚀 현재 상태

- ✅ **프로젝트 구조 설계 완료**
- ✅ **설정 파일 구현 완료** (rag-config.ts, database-config.ts)
- ✅ **문서 파싱 시스템 완료** (Python)
- ✅ **기술 스택 최종 확정**
- 🔄 **청킹 시스템 구현 시작 준비 완료**

**다음 대화에서 할 일**: scripts/rag/chunker.ts 구현부터 시작