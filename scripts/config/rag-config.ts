/**
 * MCNC RAG Assistant - 통합 설정 파일
 * 청킹, 임베딩, 캐싱, 성능 최적화 등 모든 RAG 관련 설정을 중앙 관리
 */

export const RAG_CONFIG = {
  // ==================== 임베딩 모델 설정 ====================
  EMBEDDING: {
    MODEL: 'text-embedding-3-small',
    DIMENSIONS: 1536,
    MAX_TOKENS_PER_REQUEST: 8191,
    BATCH_SIZE: 100,                    // API 효율성을 위한 배치 크기

    // Rate Limiting (text-embedding-3-small 기준)
    RATE_LIMIT: {
      REQUESTS_PER_MINUTE: 3000,
      TOKENS_PER_MINUTE: 1000000,
      BACKOFF_MS: 1000,                 // 실패 시 대기 시간
      MAX_RETRIES: 3
    },

    // 비용 설정 ($0.00002 / 1K tokens)
    COST_PER_1K_TOKENS: 0.00002,
    COST_ALERT_THRESHOLD: 5.0           // $5 이상 시 알림
  },

  // ==================== 청킹 전략별 설정 ====================
  CHUNKING: {
    STRATEGIES: {
      'documents/corporate': {
        chunkSize: 1200,                // 회사소개서: 큰 청크로 문맥 보존
        overlap: 150,
        separators: ['\n\n', '\n', '. ', ', ', ' '],
        priority: 'context'             // 문맥 보존 우선
      },
      'documents/specifications': {
        chunkSize: 800,                 // 기술명세서: 중간 크기로 정확성 확보
        overlap: 120,
        separators: ['\n## ', '\n### ', '\n\n', '\n', '. '],
        priority: 'accuracy'            // 정확성 우선
      },
      'documents/manuals': {
        chunkSize: 900,                 // 매뉴얼: 단계별 내용 보존
        overlap: 100,
        separators: ['\n# ', '\n## ', '\n\n', '\n'],
        priority: 'structure'           // 구조 보존 우선
      },
      'documents/policies': {
        chunkSize: 700,                 // 정책: 명확한 구분
        overlap: 80,
        separators: ['\n## ', '\n\n', '. ', '\n'],
        priority: 'clarity'             // 명확성 우선
      },
      'documents/presentations': {
        chunkSize: 600,                 // 발표자료: 슬라이드별 구분
        overlap: 60,
        separators: ['\n--- 슬라이드', '\n\n', '\n'],
        priority: 'independence'        // 독립성 우선
      },
      'code/bizmob-sdk': {
        chunkSize: 600,                 // SDK 코드: 작은 청크로 빠른 검색
        overlap: 80,
        separators: ['\nfunction ', '\nclass ', '\nexport ', '\n\n', '\n'],
        priority: 'speed'               // 검색 속도 우선
      },
      'code/components': {
        chunkSize: 500,                 // 컴포넌트: 컴포넌트별 독립
        overlap: 50,
        separators: ['\nexport default', '\nconst ', '\nfunction ', '\n\n'],
        priority: 'modularity'          // 모듈성 우선
      },
      'guides/tutorials': {
        chunkSize: 800,                 // 튜토리얼: 단계별 완성도
        overlap: 100,
        separators: ['\n## ', '\n### ', '\n\n', '\n'],
        priority: 'completeness'        // 완성도 우선
      },
      'guides/api-docs': {
        chunkSize: 500,                 // API 문서: 메서드별 독립 청크
        overlap: 0,                     // 독립적 문서 특성
        separators: ['<method>', '\n## ', '\n### ', '\n\n'],
        priority: 'independence'        // 독립성 우선
      },
      'guides/examples': {
        chunkSize: 400,                 // 예제: 작고 명확한 단위
        overlap: 40,
        separators: ['\n```', '\n## ', '\n\n', '\n'],
        priority: 'clarity'             // 명확성 우선
      }
    },

    // 기본 전략 (매칭되지 않는 경우)
    DEFAULT_STRATEGY: {
      chunkSize: 800,
      overlap: 100,
      separators: ['\n\n', '\n', '. ', ', '],
      priority: 'balanced'              // 균형잡힌 접근
    },

    // 청킹 품질 관리
    QUALITY: {
      MIN_CHUNK_SIZE: 50,               // 최소 청크 크기 (토큰)
      MAX_CHUNK_SIZE: 1500,             // 최대 청크 크기 (토큰)
      MIN_OVERLAP_RATIO: 0.05,          // 최소 오버랩 비율 (5%)
      MAX_OVERLAP_RATIO: 0.25,          // 최대 오버랩 비율 (25%)
      EMPTY_CHUNK_FILTER: true,         // 빈 청크 제거
      DUPLICATE_THRESHOLD: 0.95         // 중복 청크 감지 임계값
    }
  },

  // ==================== 캐싱 설정 ====================
  CACHING: {
    ENABLED: true,

    // 청킹 캐시 (Git 포함 - 팀 공유)
    CHUNK_CACHE: {
      PATH: './data/cache/chunks',
      SHARED: true,                     // 팀 공유용 캐시
      TTL_HOURS: 24 * 7,                // 1주일 캐시 유지
      MAX_SIZE_MB: 50,                  // 최대 캐시 크기
      COMPRESSION: true,                // gzip 압축 사용
      GIT_TRACKED: true                 // Git에 포함
    },

    // 임베딩 메타데이터 캐시 (Git 포함 - 팀 공유)
    EMBEDDING_CACHE: {
      ENABLED: true,                    // 메타데이터만 캐시
      METADATA_PATH: './data/cache/embeddings',
      SHARED: true,                     // 팀 공유용
      GIT_TRACKED: true                 // Git에 포함
    },

    // 임시 캐시 (Git 제외 - 개인용)
    TEMP_CACHE: {
      PATH: './data/cache/temp',
      SHARED: false,                    // 개인용 캐시
      TTL_HOURS: 24,                    // 1일 유지
      MAX_SIZE_MB: 20,                  // 작은 크기 제한
      GIT_TRACKED: false                // Git에서 제외
    },

    // 로그 캐시 (Git 제외 - 개발용)
    LOG_CACHE: {
      PATH: './data/cache/logs',
      SHARED: false,                    // 개인용
      TTL_HOURS: 48,                    // 2일 유지
      GIT_TRACKED: false                // Git에서 제외
    },

    // 캐시 정리 설정
    CLEANUP: {
      AUTO_CLEANUP: true,
      CLEANUP_INTERVAL_HOURS: 24,       // 24시간마다 정리
      MAX_CACHE_AGE_DAYS: 30,          // 30일 이상 된 캐시 삭제
      CLEANUP_TEMP_ONLY: true          // 임시 캐시만 자동 정리
    }
  },

  // ==================== 성능 최적화 설정 ====================
  PERFORMANCE: {
    // 동시 처리 설정
    PARALLEL_PROCESSING: {
      CHUNK_PARALLEL: 3,                // 동시 청킹 파일 수
      EMBED_PARALLEL: 2,                // 동시 임베딩 배치 수 (rate limit 고려)
      MAX_MEMORY_MB: 512               // 최대 메모리 사용량
    },

    // 배치 처리 설정
    BATCH_PROCESSING: {
      CHUNK_BATCH_SIZE: 10,             // 청킹 배치 크기
      EMBED_BATCH_SIZE: 100,            // 임베딩 배치 크기
      PROGRESS_REPORT_INTERVAL: 10      // N개 파일마다 진행상황 보고
    },

    // 토큰 관리
    TOKEN_MANAGEMENT: {
      BUFFER_TOKENS: 100,               // 안전 마진 토큰
      AUTO_ADJUST_SIZE: true,           // 토큰 수에 따른 자동 크기 조정
      TOKEN_COUNT_VALIDATION: true      // 청크 토큰 수 검증
    }
  },

  // ==================== ChromaDB 설정 ====================
  CHROMADB: {
    URL: process.env.CHROMA_URL || 'http://localhost:8000',
    COLLECTION_NAME: process.env.CHROMA_COLLECTION_NAME || 'mcnc_documents',

    // 컬렉션 설정
    COLLECTION_METADATA: {
      description: 'MCNC bizMOB SDK Knowledge Base',
      created_by: 'rag-processor'
    },

    // 검색 설정
    SEARCH: {
      DEFAULT_K: 10,                    // 기본 검색 결과 수
      SIMILARITY_THRESHOLD: 0.7,        // 유사도 임계값
      MAX_DISTANCE: 0.5                 // 최대 거리 (1 - similarity)
    }
  },

  // ==================== 로깅 및 모니터링 설정 ====================
  MONITORING: {
    LOG_LEVEL: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',

    // 메트릭 수집
    METRICS: {
      COLLECT_TIMING: true,             // 처리 시간 수집
      COLLECT_COSTS: true,              // 비용 정보 수집
      COLLECT_QUALITY: true,            // 품질 메트릭 수집
      COLLECT_CACHE_STATS: true         // 캐시 통계 수집
    },

    // 진행상황 표시
    PROGRESS: {
      SHOW_PROGRESS_BAR: true,          // 진행 막대 표시
      SHOW_DETAILED_LOG: false,         // 상세 로그 (개발용)
      SHOW_COST_ESTIMATE: true          // 예상 비용 표시
    },

    // 알림 설정
    ALERTS: {
      HIGH_COST_THRESHOLD: 10.0,        // 높은 비용 알림 ($10)
      LOW_CACHE_HIT_RATE: 0.5,          // 낮은 캐시 히트율 알림 (50%)
      PROCESSING_TIME_THRESHOLD: 3600   // 긴 처리 시간 알림 (1시간)
    }
  },

  // ==================== 환경별 설정 ====================
  ENVIRONMENT: {
    // 개발 환경
    DEVELOPMENT: {
      ENABLE_DEBUG_LOGS: true,
      COST_LIMIT: 1.0,                  // $1 제한
      PARALLEL_PROCESSING: false,       // 디버깅 용이성
      CACHE_AGGRESSIVE: true            // 공격적 캐싱
    },

    // 운영 환경
    PRODUCTION: {
      ENABLE_DEBUG_LOGS: false,
      COST_LIMIT: 50.0,                 // $50 제한
      PARALLEL_PROCESSING: true,
      CACHE_AGGRESSIVE: false           // 안정성 우선
    }
  }
} as const;

// ==================== 타입 정의 ====================
export type ChunkingPriority = 'context' | 'accuracy' | 'speed' | 'independence' |
  'structure' | 'clarity' | 'modularity' | 'completeness' | 'balanced';

export interface ChunkingStrategy {
  chunkSize: number;
  overlap: number;
  separators: readonly string[];  // readonly로 변경
  priority: ChunkingPriority;
}

export interface ProcessingMetrics {
  totalFiles: number;
  processedFiles: number;
  totalChunks: number;
  totalTokens: number;
  estimatedCost: number;
  processingTime: number;
  cacheHitRate: number;
}

// ==================== 유틸리티 함수 ====================

/**
 * 파일 경로에 따른 청킹 전략 선택
 */
export function getChunkingStrategy(filePath: string): ChunkingStrategy {
  // 파일 경로를 정규화하고 전략 매칭
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();

  for (const [pathPattern, strategy] of Object.entries(RAG_CONFIG.CHUNKING.STRATEGIES)) {
    if (normalizedPath.includes(pathPattern.toLowerCase())) {
      return strategy;
    }
  }

  // 매칭되지 않으면 기본 전략 반환
  return RAG_CONFIG.CHUNKING.DEFAULT_STRATEGY;
}

/**
 * 파일 크기에 따른 동적 최적화
 */
export function getOptimizedConfig(fileSize: number, tokenCount?: number): Partial<ChunkingStrategy> {
  const sizeMB = fileSize / (1024 * 1024);

  // 대용량 파일 처리 최적화
  if (sizeMB > 10) {
    return {
      chunkSize: Math.min(1200, Math.floor(tokenCount! * 0.1)), // 전체의 10%
      overlap: 50  // 오버랩 줄여서 청크 수 감소
    };
  }

  // 소용량 파일 처리 최적화
  if (sizeMB < 0.1) {
    return {
      chunkSize: Math.max(200, Math.floor(tokenCount! * 0.5)), // 전체의 50%
      overlap: 20  // 작은 파일은 작은 오버랩
    };
  }

  return {}; // 기본 전략 사용
}

/**
 * 예상 비용 계산
 */
export function estimateCost(tokenCount: number): number {
  const cost = (tokenCount / 1000) * RAG_CONFIG.EMBEDDING.COST_PER_1K_TOKENS;
  return Math.round(cost * 10000) / 10000; // 소수점 4자리 반올림
}

/**
 * 환경별 설정 가져오기
 */
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production'
    ? RAG_CONFIG.ENVIRONMENT.PRODUCTION
    : RAG_CONFIG.ENVIRONMENT.DEVELOPMENT;
}

/**
 * 캐시 타입에 따른 경로 반환
 */
export function getCachePath(cacheType: 'chunk' | 'embedding' | 'temp' | 'log'): string {
  switch (cacheType) {
    case 'chunk':
      return RAG_CONFIG.CACHING.CHUNK_CACHE.PATH;
    case 'embedding':
      return RAG_CONFIG.CACHING.EMBEDDING_CACHE.METADATA_PATH;
    case 'temp':
      return RAG_CONFIG.CACHING.TEMP_CACHE.PATH;
    case 'log':
      return RAG_CONFIG.CACHING.LOG_CACHE.PATH;
    default:
      throw new Error(`Unknown cache type: ${cacheType}`);
  }
}

/**
 * Git 추적 여부 확인
 */
export function isCacheGitTracked(cacheType: 'chunk' | 'embedding' | 'temp' | 'log'): boolean {
  switch (cacheType) {
    case 'chunk':
      return RAG_CONFIG.CACHING.CHUNK_CACHE.GIT_TRACKED;
    case 'embedding':
      return RAG_CONFIG.CACHING.EMBEDDING_CACHE.GIT_TRACKED;
    case 'temp':
      return RAG_CONFIG.CACHING.TEMP_CACHE.GIT_TRACKED;
    case 'log':
      return RAG_CONFIG.CACHING.LOG_CACHE.GIT_TRACKED;
    default:
      return false;
  }
}

/**
 * 캐시 키 생성 (파일 해시 + 설정 해시)
 */
export function generateCacheKey(filePath: string, fileHash: string): string {
  const strategy = getChunkingStrategy(filePath);
  const configHash = JSON.stringify({
    model: RAG_CONFIG.EMBEDDING.MODEL,
    dimensions: RAG_CONFIG.EMBEDDING.DIMENSIONS,
    chunkSize: strategy.chunkSize,
    overlap: strategy.overlap,
    separators: strategy.separators,
    priority: strategy.priority
  }).split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0);

  return `${fileHash}_${Math.abs(configHash).toString(16)}`;
}

/**
 * 팀 공유 캐시 여부 확인
 */
export function isSharedCache(cacheType: 'chunk' | 'embedding' | 'temp' | 'log'): boolean {
  switch (cacheType) {
    case 'chunk':
      return RAG_CONFIG.CACHING.CHUNK_CACHE.SHARED;
    case 'embedding':
      return RAG_CONFIG.CACHING.EMBEDDING_CACHE.SHARED;
    case 'temp':
    case 'log':
      return false; // 항상 개인용
    default:
      return false;
  }
}

// ==================== 설정 검증 ====================
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // OpenAI API 키 확인
  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  // ChromaDB URL 확인
  if (!RAG_CONFIG.CHROMADB.URL) {
    errors.push('ChromaDB URL이 설정되지 않았습니다.');
  }

  // 청킹 설정 검증
  for (const [path, strategy] of Object.entries(RAG_CONFIG.CHUNKING.STRATEGIES)) {
    if (strategy.chunkSize <= 0 || strategy.chunkSize > 2000) {
      errors.push(`${path}: chunkSize가 유효하지 않습니다 (${strategy.chunkSize})`);
    }
    if (strategy.overlap < 0 || strategy.overlap >= strategy.chunkSize) {
      errors.push(`${path}: overlap이 유효하지 않습니다 (${strategy.overlap})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}