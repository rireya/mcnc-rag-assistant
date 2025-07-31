/**
 * MCNC RAG Assistant 프로젝트 전체 경로 설정
 * 모든 스크립트에서 공통으로 사용되는 경로를 중앙 관리
 */

export const PATHS = {
  // ==================== 기본 경로 ====================
  DATA_ROOT: {
    path: './data',
    displayName: '전체 데이터 저장소'
  },
  SOURCE_ROOT: {
    path: './data/source',
    displayName: '원본 소스 파일들'
  },

  // ==================== 소스 데이터 경로 ====================
  DOCUMENTS: {
    ROOT: {
      path: './data/source/documents',
      displayName: '문서 루트'
    },
    MANUALS: {
      path: './data/source/documents/manuals',
      displayName: '사용자 매뉴얼'
    },
    SPECIFICATIONS: {
      path: './data/source/documents/specifications',
      displayName: '기술 명세서'
    },
    POLICIES: {
      path: './data/source/documents/policies',
      displayName: '정책 문서'
    },
    PRESENTATIONS: {
      path: './data/source/documents/presentations',
      displayName: '발표 자료'
    },
    CORPORATE: {
      ROOT: {
        path: './data/source/documents/corporate',
        displayName: '회사소개서'
      }
    }
  },

  CODE: {
    ROOT: {
      path: './data/source/code',
      displayName: '코드 루트'
    },
    BIZMOB_SDK: {
      ROOT: {
        path: './data/source/code/bizmob-sdk',
        displayName: 'bizMOB SDK 루트'
      },
      CORE: {
        path: './data/source/code/bizmob-sdk/core',
        displayName: 'JavaScript 파일들'
      },
      TYPESCRIPT: {
        path: './data/source/code/bizmob-sdk/typescript',
        displayName: 'TypeScript 래퍼들'
      }
    },
    COMPONENTS: {
      path: './data/source/code/components',
      displayName: '일반 컴포넌트'
    },
    COMPOSABLES: {
      path: './data/source/code/composables',
      displayName: '일반 Composables'
    }
  },

  GUIDES: {
    ROOT: {
      path: './data/source/guides',
      displayName: '가이드 루트'
    },
    TUTORIALS: {
      path: './data/source/guides/tutorials',
      displayName: '튜토리얼'
    },
    EXAMPLES: {
      path: './data/source/guides/examples',
      displayName: '예제 코드'
    },
    API_DOCS: {
      path: './data/source/guides/api-docs',
      displayName: 'API 문서'
    }
  },

  // ==================== 처리된 데이터 경로 ====================
  PROCESSED: {
    ROOT: {
      path: './data/processed',
      displayName: '처리된 데이터 루트'
    },
    CHUNKS: {
      path: './data/processed/chunks',
      displayName: '청크 데이터'
    },
    METADATA: {
      path: './data/processed/metadata',
      displayName: '메타데이터'
    },
    EMBEDDINGS: {
      path: './data/processed/embeddings',
      displayName: '임베딩 결과'
    },
    DOCUMENTS: {
      path: './data/processed/documents',
      displayName: '처리된 문서'
    }
  },

  // ==================== 벡터 저장소 경로 ====================
  VECTOR: {
    ROOT: {
      path: './data/vector',
      displayName: '벡터 데이터 루트'
    },
    CHROMA: {
      path: './data/vector/chroma',
      displayName: 'ChromaDB 저장소'
    },
    INDEX: {
      path: './data/vector/index',
      displayName: '인덱스 파일'
    },
    BACKUP: {
      path: './data/vector/backup',
      displayName: '벡터 백업'
    }
  },

  // ==================== 캐시 및 임시 파일 ====================
  CACHE: {
    ROOT: {
      path: './data/cache',
      displayName: '캐시 루트'
    },
    EMBEDDINGS: {
      path: './data/cache/embeddings',
      displayName: '임베딩 캐시'
    },
    TEMP: {
      path: './data/cache/temp',
      displayName: '임시 파일'
    },
    LOGS: {
      path: './data/cache/logs',
      displayName: '처리 로그'
    }
  },

  // ==================== 출력 및 결과물 경로 ====================
  OUTPUT: {
    ROOT: {
      path: './data/output',
      displayName: '출력 루트'
    },
    REPORTS: {
      path: './data/output/reports',
      displayName: '처리 보고서'
    },
    EXPORTS: {
      path: './data/output/exports',
      displayName: '내보내기 파일'
    }
  }
} as const;

// ==================== 제외 패턴 설정 ====================
export const EXCLUDE_PATTERNS = {
  // 메모/시스템 파일
  MEMO_FILES: ['_README.md', '_NOTES.md'] as string[],
  // 시스템 파일
  SYSTEM_FILES: ['.gitkeep', '.DS_Store', 'Thumbs.db'] as string[],
  // 패턴 매칭
  PATTERNS: [/^_.*\.md$/i, /^\./] as RegExp[]  // _로 시작하는 md 파일, 숨김 파일
} as const;

// ==================== 유틸리티 함수 ====================

/**
 * 경로 객체에서 실제 경로 문자열만 추출
 */
export function getPath(pathObj: any): string {
  if (typeof pathObj === 'object' && pathObj.path) {
    return pathObj.path;
  }
  throw new Error('Invalid path object');
}

/**
 * 경로 객체에서 표시명 추출
 */
export function getDisplayName(pathObj: any): string {
  if (typeof pathObj === 'object' && pathObj.displayName) {
    return pathObj.displayName;
  }
  throw new Error('Invalid path object');
}

/**
 * 2단계까지의 경로 객체를 순회하며 처리
 */
export function traversePaths(
  pathGroup: any,
  callback: (path: string, displayName: string, key: string) => void
) {
  for (const [key, value] of Object.entries(pathGroup)) {
    if (value && typeof value === 'object') {
      if ('path' in value && 'displayName' in value) {
        // 단일 경로 객체
        const pathObj = value as { path: string; displayName: string };
        callback(pathObj.path, pathObj.displayName, key);
      } else {
        // 중첩 객체 (최대 1단계만)
        for (const [subKey, subValue] of Object.entries(value)) {
          if (subValue && typeof subValue === 'object' && 'path' in subValue) {
            const pathObj = subValue as { path: string; displayName: string };
            callback(pathObj.path, pathObj.displayName, `${key}_${subKey}`);
          }
        }
      }
    }
  }
}

/**
 * 모든 경로를 평탄화하여 배열로 반환
 */
function flattenPaths(obj: any, result: string[] = []): string[] {
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      if ('path' in value) {
        const pathObj = value as { path: string };
        result.push(pathObj.path);
      } else {
        flattenPaths(value, result);
      }
    }
  }
  return result;
}

// 경로 유형별 그룹핑 (처리 단계별 사용 편의성)
export const PATH_GROUPS = {
  SOURCE: flattenPaths({
    documents: PATHS.DOCUMENTS,
    code: PATHS.CODE,
    guides: PATHS.GUIDES
  }),

  PROCESSING: flattenPaths(PATHS.PROCESSED),
  STORAGE: flattenPaths(PATHS.VECTOR),
  TEMPORARY: flattenPaths(PATHS.CACHE),
  RESULTS: flattenPaths(PATHS.OUTPUT)
} as const;

/**
 * 파일이 처리 대상인지 확인 (메모 파일 등 제외)
 */
export function shouldProcessFile(filePath: string): boolean {
  const fileName = require('path').basename(filePath);

  // 메모 파일 제외
  if (EXCLUDE_PATTERNS.MEMO_FILES.includes(fileName)) {
    return false;
  }

  // 패턴 매칭 제외
  if (EXCLUDE_PATTERNS.PATTERNS.some(pattern => pattern.test(fileName))) {
    return false;
  }

  return true;
}