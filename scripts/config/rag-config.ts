/**
 * MCNC RAG Assistant - 단순화된 설정 파일
 * 핵심 최적화와 튜닝에 집중
 */

export const RAG_CONFIG = {
  // ==================== 임베딩 모델 설정 ====================
  EMBEDDING: {
    MODEL: 'text-embedding-3-small',
    DIMENSIONS: 1536,
    BATCH_SIZE: 100,                    // API 효율성을 위한 배치 크기
    MAX_RETRIES: 3                      // 실패 시 재시도 횟수
  },

  // ==================== 청킹 전략별 설정 ====================
  CHUNKING: {
    STRATEGIES: {
      'documents/corporate': {
        chunkSize: 1200,
        overlap: 150,
        separators: ['\n\n', '\n', '. ', ', ', ' ']
      },
      'documents/specifications': {
        chunkSize: 800,
        overlap: 120,
        separators: ['\n## ', '\n### ', '\n\n', '\n', '. ']
      },
      'documents/manuals': {
        chunkSize: 900,
        overlap: 100,
        separators: ['\n# ', '\n## ', '\n\n', '\n']
      },
      'documents/policies': {
        chunkSize: 700,
        overlap: 80,
        separators: ['\n## ', '\n\n', '. ', '\n']
      },
      'documents/presentations': {
        chunkSize: 600,
        overlap: 60,
        separators: ['\n--- 슬라이드', '\n\n', '\n']
      },
      'code/bizmob-sdk': {
        chunkSize: 600,
        overlap: 80,
        separators: ['\nfunction ', '\nclass ', '\nexport ', '\n\n', '\n']
      },
      'code/components': {
        chunkSize: 500,
        overlap: 50,
        separators: ['\nexport default', '\nconst ', '\nfunction ', '\n\n']
      },
      'guides/tutorials': {
        chunkSize: 800,
        overlap: 100,
        separators: ['\n## ', '\n### ', '\n\n', '\n']
      },
      'guides/api-docs': {
        chunkSize: 500,
        overlap: 0,
        separators: ['<method>', '\n## ', '\n### ', '\n\n']
      },
      'guides/examples': {
        chunkSize: 400,
        overlap: 40,
        separators: ['\n```', '\n## ', '\n\n', '\n']
      }
    },

    // 기본 전략 (매칭되지 않는 경우)
    DEFAULT_STRATEGY: {
      chunkSize: 800,
      overlap: 100,
      separators: ['\n\n', '\n', '. ', ', ']
    },

    // 청킹 품질 관리 (최적화/튜닝 파라미터)
    QUALITY: {
      MIN_CHUNK_SIZE: 50,               // 최소 청크 크기 (토큰)
      MAX_CHUNK_SIZE: 1500,             // 최대 청크 크기 (토큰)
      EMPTY_CHUNK_FILTER: true,         // 빈 청크 제거
      DUPLICATE_THRESHOLD: 0.95         // 중복 청크 감지 임계값
    }
  },

  // ==================== 성능 최적화 설정 ====================
  PERFORMANCE: {
    PARALLEL_CHUNKS: 3,                 // 동시 청킹 파일 수
    BATCH_SIZE: 10,                     // 배치 처리 크기
    TOKEN_BUFFER: 100,                  // 안전 마진 토큰
    AUTO_ADJUST_SIZE: true              // 토큰 수에 따른 자동 크기 조정
  },

  // ==================== 검색 최적화 설정 ====================
  SEARCH: {
    DEFAULT_K: 10,                      // 기본 검색 결과 수
    SIMILARITY_THRESHOLD: 0.7,          // 유사도 임계값 (0.7 이상만 반환)
    MAX_DISTANCE: 0.5,                  // 최대 거리 (1 - similarity)
    RERANK: false,                      // 재순위 기능 (향후 확장용)
    INCLUDE_METADATA: true              // 메타데이터 포함 여부
  }
} as const;

// ==================== 타입 정의 ====================
export interface ChunkingStrategy {
  chunkSize: number;
  overlap: number;
  separators: readonly string[];
}

// ==================== 핵심 유틸리티 함수 ====================

/**
 * 파일 경로에 따른 청킹 전략 선택
 */
export function getChunkingStrategy(filePath: string): ChunkingStrategy {
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();

  for (const [pathPattern, strategy] of Object.entries(RAG_CONFIG.CHUNKING.STRATEGIES)) {
    if (normalizedPath.includes(pathPattern.toLowerCase())) {
      return strategy;
    }
  }

  return RAG_CONFIG.CHUNKING.DEFAULT_STRATEGY;
}

/**
 * 설정 검증 (필수 환경변수만)
 */
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}