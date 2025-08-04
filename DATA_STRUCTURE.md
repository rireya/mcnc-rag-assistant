# MCNC RAG Assistant - Data 폴더 구조 정보

## 📁 전체 구조 개요

프로젝트의 `data` 폴더는 RAG 시스템의 데이터 파이프라인을 나타내며, 다음과 같은 단계별 구조로 구성되어 있습니다:

```
data/
├── source/          # 원본 데이터 (입력)
├── processed/       # 처리된 데이터 (중간 단계)
└── [vector/]        # 벡터 저장소 (미래 구현 예정)
```

## 📂 Source 폴더 - 원본 데이터

### 구조
```
source/
├── documents/       # 문서 파일들
│   ├── corporate/   # 회사 소개서, 브랜딩 자료
│   ├── manuals/     # 사용자 매뉴얼, 가이드
│   ├── policies/    # 정책, 규정 문서
│   ├── presentations/ # 발표 자료
│   └── specifications/ # 기술 명세서
├── code/           # 소스 코드 파일들
│   ├── bizmob-sdk/ # bizMOB SDK 코어 파일들
│   ├── components/ # 재사용 가능한 컴포넌트
│   └── composables/ # Vue Composition API
└── guides/         # 개발 가이드, 튜토리얼
    ├── tutorials/  # 단계별 학습 자료
    ├── examples/   # 실행 가능한 예제
    └── api-docs/   # API 참조 문서
```

### 특징
- **documents**: PDF, DOCX, PPTX, XLSX 등의 비즈니스 문서
- **code**: JavaScript, TypeScript 등의 실행 가능한 코드
- **guides**: 개발자를 위한 학습 자료 및 참조 문서

## 📂 Processed 폴더 - 처리 결과

### 구조
```
processed/
├── processing_log.json  # 파싱 처리 로그
├── parsed/             # 파싱된 원본 데이터 (JSON)
│   ├── code/          # 코드 파일 파싱 결과
│   ├── documents/     # 문서 파일 파싱 결과
│   └── guides/        # 가이드 파일 파싱 결과
└── chunks/            # 청킹된 데이터 (JSON)
    ├── 2025_회사소개서.chunks.json
    ├── bizMOB-core-web.chunks.json
    ├── bizMOB-core.chunks.json
    ├── bizMOB-Device.chunks.json
    ├── bizMOB-locale.chunks.json
    ├── bizMOB-Network.chunks.json
    ├── bizMOB-xross4.chunks.json
    ├── bizMOB4(Vue) 개발자가이드 For Mobile.chunks.json
    └── sample.chunks.json
```

### 처리 단계
1. **Parsing**: 원본 파일 → JSON 형태로 구조화
2. **Chunking**: 파싱된 데이터 → 검색 최적화된 청크로 분할
3. **Logging**: 모든 처리 과정을 `processing_log.json`에 기록

## 📊 청크 데이터 구조

각 `.chunks.json` 파일은 다음 구조를 가집니다:

```typescript
interface ChunkData {
  id: string;                    // 고유 식별자
  content: string;               // 청크 내용
  metadata: {
    source_file: string;         // 원본 파일 경로
    file_name: string;           // 파일명
    file_type: string;           // 파일 확장자
    chunk_index: number;         // 청크 번호
    total_chunks: number;        // 전체 청크 수
    chunk_strategy: string;      // 청킹 전략
    chunk_size: number;          // 청크 크기
    overlap: number;             // 중복 길이
    position: {
      start_char: number;        // 시작 문자 위치
      end_char: number;          // 끝 문자 위치
      pages?: number[];          // 포함된 페이지 (문서인 경우)
    }
  };
  tokens: number;                // 토큰 수
  char_count: number;            // 문자 수
  created_at: string;            // 생성 시간
  enrichments?: {
    images?: Array<ImageData>;   // 이미지 정보
    tables?: Array<TableData>;   // 테이블 정보
    embedded_text?: string;      // 구조화된 텍스트
  }
}
```

## 🔄 데이터 플로우

```
1. 원본 파일 수집
   source/ → 분류된 폴더에 저장

2. 파싱 처리
   source/ → parsed/ (JSON 변환)

3. 청킹 처리
   parsed/ → chunks/ (검색 최적화)

4. 임베딩 생성 (예정)
   chunks/ → embeddings/ (벡터화)

5. 벡터 저장소 구축 (예정)
   embeddings/ → vector/ (ChromaDB)
```

## 📈 현재 상태

- ✅ **Source**: 원본 데이터 분류 완료
- ✅ **Parsed**: 파싱 시스템 구축 완료
- ✅ **Chunks**: 청킹 시스템 구축 완료
- 🔄 **Embeddings**: 구현 예정
- 🔄 **Vector Store**: 구현 예정

## 🎯 주요 특징

1. **구조화된 분류**: 파일 타입과 용도에 따른 체계적 분류
2. **메타데이터 보존**: 원본 정보를 상세히 기록
3. **단계별 처리**: 각 단계별로 독립적인 처리 가능
4. **추적 가능성**: 처리 로그를 통한 완전한 추적
5. **확장성**: 새로운 파일 타입과 처리 방식 쉽게 추가 가능
