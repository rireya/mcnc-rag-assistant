/**
 * MCNC RAG Assistant - 단순화된 설정 파일
 * text-embedding-3-small 모델에 최적화된 청킹 전략
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
  // text-embedding-3-small은 짧은-중간 길이에 최적화되어 있으므로
  // 청크 크기를 400-600 토큰으로 설정
  CHUNKING: {
    STRATEGIES: {
      'documents/corporate': {
        chunkSize: 600,                 // 회사 문서는 문맥 중요, 최대 크기
        overlap: 80,                    // 13% 오버랩
        separators: ['\n\n', '\n', '. ', ', ', ' '],
        avgCharsPerToken: 2.5,
        preprocessor: 'weakenPage'      // 페이지 경계 약화로 연속성 유지
      },
      'documents/specifications': {
        chunkSize: 500,                 // 기술 명세는 중간 크기
        overlap: 60,                    // 12% 오버랩
        separators: ['\n## ', '\n### ', '\n\n', '\n', '. '],
        avgCharsPerToken: 3.0,
        preprocessor: 'none'            // 섹션 구조 유지
      },
      'documents/manuals': {
        chunkSize: 550,                 // 매뉴얼은 단계별 설명
        overlap: 70,                    // 13% 오버랩
        separators: ['\n# ', '\n## ', '\n\n', '\n'],
        avgCharsPerToken: 2.8,
        preprocessor: 'none'
      },
      'documents/policies': {
        chunkSize: 450,                 // 정책은 조항별 독립성
        overlap: 50,                    // 11% 오버랩
        separators: ['\n## ', '\n\n', '. ', '\n'],
        avgCharsPerToken: 2.7,
        preprocessor: 'none'            // 정책 구조 보존
      },
      'documents/presentations': {
        chunkSize: 400,                 // 슬라이드는 짧고 명확
        overlap: 40,                    // 10% 오버랩
        separators: ['\n\n', '\n'],
        avgCharsPerToken: 2.5,
        preprocessor: 'weakenPage'      // 슬라이드 간 연속성
      },
      'code/bizmob-sdk': {
        chunkSize: 400,                 // 코드는 함수/클래스 단위
        overlap: 50,                    // 12.5% 오버랩
        separators: ['\nfunction ', '\nclass ', '\nexport ', '\n\n', '\n'],
        avgCharsPerToken: 3.5,
        preprocessor: 'none'            // 코드 구조 보존
      },
      'code/components': {
        chunkSize: 350,                 // 컴포넌트는 더 작게
        overlap: 40,                    // 11% 오버랩
        separators: ['\nexport default', '\nconst ', '\nfunction ', '\n\n'],
        avgCharsPerToken: 3.5,
        preprocessor: 'none'
      },
      'guides/tutorials': {
        chunkSize: 500,                 // 튜토리얼은 학습 단위
        overlap: 60,                    // 12% 오버랩
        separators: ['\n## ', '\n### ', '\n\n', '\n'],
        avgCharsPerToken: 3.0,
        preprocessor: 'weakenPage'      // 학습 흐름 유지
      },
      'guides/api-docs': {
        chunkSize: 300,                 // API는 메서드별 최소 단위
        overlap: 0,                     // 메서드는 독립적
        separators: ['<method>', '\n## ', '\n### ', '\n\n'],
        avgCharsPerToken: 3.2,
        preprocessor: 'none'            // API 구조 엄격 유지
      },
      'guides/examples': {
        chunkSize: 250,                 // 예제는 가장 작게
        overlap: 25,                    // 10% 오버랩
        separators: ['\n```', '\n## ', '\n\n', '\n'],
        avgCharsPerToken: 3.3,
        preprocessor: 'none'
      }
    },

    // 기본 전략 (매칭되지 않는 경우)
    DEFAULT_STRATEGY: {
      chunkSize: 500,                   // text-embedding-3-small 최적 크기
      overlap: 60,                      // 12% 오버랩
      separators: ['\n\n', '\n', '. ', ', '],
      avgCharsPerToken: 3.0,
      preprocessor: 'none'
    },

    // 청킹 품질 관리 (최적화/튜닝 파라미터)
    QUALITY: {
      MIN_CHUNK_SIZE: 50,               // 최소 청크 크기 (토큰)
      MAX_CHUNK_SIZE: 800,              // 최대 청크 크기 (1500 → 800)
      EMPTY_CHUNK_FILTER: true,         // 빈 청크 제거
      DUPLICATE_THRESHOLD: 0.95,        // 중복 청크 감지 임계값

      // text-embedding-3-small 최적화 파라미터
      OPTIMAL_SIZE_RANGE: {
        min: 200,                       // 최적 범위 하한
        max: 600,                       // 최적 범위 상한
        sweet_spot: 400                 // 이상적인 크기
      }
    }
  },

  // ==================== 성능 최적화 설정 ====================
  PERFORMANCE: {
    PARALLEL_CHUNKS: 5,                 // 작은 청크로 병렬성 증가 가능
    BATCH_SIZE: 20,                     // 배치 크기도 증가 가능
    TOKEN_BUFFER: 50,                   // 안전 마진 축소 (100 → 50)
    AUTO_ADJUST_SIZE: true              // 토큰 수에 따른 자동 크기 조정
  },

  // ==================== 검색 최적화 설정 ====================
  SEARCH: {
    DEFAULT_K: 15,                      // 작은 청크로 인해 K 증가 (10 → 15)
    SIMILARITY_THRESHOLD: 0.75,         // 임계값 상향 (0.7 → 0.75)
    MAX_DISTANCE: 0.4,                  // 거리 축소 (0.5 → 0.4)
    RERANK: true,                       // 재순위 권장 (작은 청크 보완)
    INCLUDE_METADATA: true,             // 메타데이터 포함 여부

    // text-embedding-3-small 특화 설정
    CONTEXT_WINDOW: 3,                  // 인접 청크 포함 개수
    AGGREGATE_STRATEGY: 'weighted'      // 가중치 기반 통합
  }
} as const;

// ==================== 타입 정의 ====================
export interface ChunkingStrategy {
  chunkSize: number;
  overlap: number;
  separators: readonly string[];
  avgCharsPerToken: number;
  preprocessor?: 'removePage' | 'weakenPage' | 'none';
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
 * 청크 크기 최적화 검증
 * text-embedding-3-small에 최적화된 크기인지 확인
 */
export function isOptimalChunkSize(chunkSize: number): boolean {
  const { min, max } = RAG_CONFIG.CHUNKING.QUALITY.OPTIMAL_SIZE_RANGE;
  return chunkSize >= min && chunkSize <= max;
}

/**
 * 설정 검증 (OpenAI API 키는 선택적)
 */
export function validateConfig(): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // OpenAI API 키는 임베딩 단계에서만 필요하므로 경고만 출력
  if (!process.env.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY not set. This will be required for embedding generation.');
  }

  // 청킹 전략 기본 검증
  const strategies = Object.values(RAG_CONFIG.CHUNKING.STRATEGIES);
  for (const [name, strategy] of Object.entries(RAG_CONFIG.CHUNKING.STRATEGIES)) {
    // 크기 검증
    if (strategy.chunkSize < 50) {
      errors.push(`청크 크기가 너무 작습니다: ${name} - ${strategy.chunkSize} (최소 50 필요)`);
    }

    // 오버랩 검증
    if (strategy.overlap >= strategy.chunkSize) {
      errors.push(`오버랩이 청크 크기보다 크거나 같습니다: ${name} - overlap ${strategy.overlap} >= chunkSize ${strategy.chunkSize}`);
    }

    // 문자/토큰 비율 검증
    if (strategy.avgCharsPerToken < 1 || strategy.avgCharsPerToken > 5) {
      errors.push(`비정상적인 문자/토큰 비율: ${name} - ${strategy.avgCharsPerToken} (정상 범위: 1-5)`);
    }

    // text-embedding-3-small 최적화 경고
    if (!isOptimalChunkSize(strategy.chunkSize)) {
      warnings.push(`${name}: 청크 크기 ${strategy.chunkSize}가 text-embedding-3-small 최적 범위(200-600)를 벗어났습니다.`);
    }
  }

  // 경고 출력
  warnings.forEach(warning => console.warn(`Warning: ${warning}`));

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}