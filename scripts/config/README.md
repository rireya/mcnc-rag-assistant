# MCNC RAG Assistant - Config 폴더

## 📁 폴더 목적

프로젝트 전체에서 사용되는 설정 파일들을 중앙에서 관리합니다. 모든 스크립트에서 공통으로 사용되는 경로, 패턴, 설정값들이 여기에 위치합니다.

## 📄 파일 구조

### `paths.ts`

프로젝트 전체 경로 설정 및 관리

#### 주요 구성 요소

- **PATHS**: 모든 디렉터리 경로와 표시명 통합 관리
- **EXCLUDE_PATTERNS**: 처리에서 제외할 파일 패턴 정의
- **PATH_GROUPS**: 처리 단계별 경로 그룹핑
- **유틸리티 함수들**: 경로 처리를 위한 헬퍼 함수들

#### 경로 구조 (최대 2단계 depth)

```typescript
SECTION: {
  ROOT: { path: 'string', displayName: 'string' },
  SUBSECTION: { path: 'string', displayName: 'string' }
}
```

## 🔧 사용 방법

### 1. 새 경로 추가

```typescript
// paths.ts에 추가
DOCUMENTS: {
  // 기존 경로들...
  NEW_FOLDER: {
    path: './data/source/documents/new-folder',
    displayName: '새 폴더 설명'
  }
}
```

### 2. 하위 폴더가 있는 경우

```typescript
GUIDES: {
  TUTORIALS: {
    ROOT: {
      path: './data/source/guides/tutorials',
      displayName: '튜토리얼 루트'
    },
    BASIC: {
      path: './data/source/guides/tutorials/basic',
      displayName: '기초 튜토리얼'
    },
    ADVANCED: {
      path: './data/source/guides/tutorials/advanced',
      displayName: '고급 튜토리얼'
    }
  }
}
```

### 3. 스크립트에서 사용

```typescript
import { PATHS, traversePaths, shouldProcessFile } from './config/paths.js';

// 경로 순회
traversePaths(PATHS.DOCUMENTS, (path, displayName, key) => {
  console.log(`${displayName}: ${path}`);
});

// 파일 처리 여부 확인
if (shouldProcessFile(filePath)) {
  // 파일 처리 로직
}
```

## 🚫 제외 패턴

### 메모 파일

- `_README.md`: 폴더 설명 메모
- `_NOTES.md`: 기타 메모

### 시스템 파일

- `.gitkeep`: Git 빈 폴더 유지용
- `.DS_Store`: macOS 시스템 파일
- `Thumbs.db`: Windows 썸네일 캐시

### 패턴 매칭

- `/^_.*\.md$/i`: 언더스코어로 시작하는 MD 파일
- `/^\./`: 숨김 파일 (점으로 시작)

## 📊 PATH_GROUPS 활용

### 처리 단계별 그룹

```typescript
PATH_GROUPS.SOURCE     // 원본 데이터 경로들
PATH_GROUPS.PROCESSING // 처리 중인 데이터 경로들
PATH_GROUPS.STORAGE    // 벡터 저장소 경로들
PATH_GROUPS.TEMPORARY  // 임시/캐시 경로들
PATH_GROUPS.RESULTS    // 결과물 경로들
```

### 일괄 처리 예시

```typescript
// 모든 소스 경로에서 파일 스캔
for (const sourcePath of PATH_GROUPS.SOURCE) {
  scanDirectory(sourcePath);
}
```

## 🔄 향후 스크립트 개발 가이드

### 문서 처리 스크립트

```typescript
// document-processor.ts 구조 예시
import { PATH_GROUPS, shouldProcessFile } from './config/paths.js';

function processDocuments() {
  for (const docPath of PATH_GROUPS.SOURCE) {
    const files = getFilesInDirectory(docPath);
    for (const file of files) {
      if (shouldProcessFile(file)) {
        // 문서 처리 로직
      }
    }
  }
}
```

### 청킹 스크립트

```typescript
// chunking-processor.ts 구조 예시
import { PATHS } from './config/paths.js';

function processChunks() {
  const inputPath = PATHS.PROCESSED.DOCUMENTS.path;
  const outputPath = PATHS.PROCESSED.CHUNKS.path;

  // 청킹 로직
}
```

### 임베딩 스크립트

```typescript
// embedding-processor.ts 구조 예시
import { PATHS, PATH_GROUPS } from './config/paths.js';

function generateEmbeddings() {
  const chunksPath = PATHS.PROCESSED.CHUNKS.path;
  const embeddingsPath = PATHS.PROCESSED.EMBEDDINGS.path;
  const cachePath = PATHS.CACHE.EMBEDDINGS.path;

  // 임베딩 생성 로직
}
```

## ⚠️ 주의사항

### 1. 경로 구조 제한

- 최대 2단계 depth까지만 지원
- ROOT가 있는 경우 하위 항목들과 분리하여 관리

### 2. 타입 안전성

- `as const` 사용으로 타입 추론 최적화
- 타입 assertion 필요 시 명시적으로 지정

### 3. 일관성 유지

- 모든 경로는 `./data`로 시작
- displayName은 한글로 통일
- 경로 추가 시 주석 포함

### 4. 메모 파일 관리

- 각 폴더에 `_README.md` 추가 권장
- 처리 로직에서 자동 제외됨
- 폴더 목적과 관리 규칙 명시

## 📅 최종 업데이트

2025-01-31 - 초기 경로 설정 및 유틸리티 함수 구현
