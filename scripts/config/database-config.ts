/**
 * MCNC RAG Assistant - 데이터베이스 설정 파일
 * ChromaDB 인프라 관련 설정만 관리
 */

export const DATABASE_CONFIG = {
  // ==================== ChromaDB 연결 설정 ====================
  CHROMADB: {
    // 연결 정보
    URL: process.env.CHROMA_URL || 'http://localhost:8000',

    // 컬렉션 설정
    COLLECTION_NAME: process.env.CHROMA_COLLECTION_NAME || 'mcnc_documents',

    // 컬렉션 메타데이터
    COLLECTION_METADATA: {
      description: 'MCNC bizMOB SDK Knowledge Base',
      created_by: 'rag-processor',
      created_at: new Date().toISOString(),
      version: '1.0.0'
    },

    // 연결 설정
    CONNECTION: {
      TIMEOUT_MS: 30000,              // 30초 타임아웃
      MAX_RETRIES: 3,                 // 연결 재시도 횟수
      RETRY_DELAY_MS: 1000           // 재시도 대기 시간
    },

    // 배치 처리 설정
    BATCH: {
      INSERT_BATCH_SIZE: 100,         // 삽입 배치 크기
      UPDATE_BATCH_SIZE: 50,          // 업데이트 배치 크기
      MAX_CONCURRENT_REQUESTS: 5      // 최대 동시 요청 수
    }
  }
} as const;

// ==================== 유틸리티 함수 ====================

/**
 * ChromaDB 연결 상태 확인
 */
export async function checkChromaConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${DATABASE_CONFIG.CHROMADB.URL}/api/v1/heartbeat`);
    return response.ok;
  } catch (error) {
    console.error('ChromaDB 연결 실패:', error);
    return false;
  }
}

/**
 * 컬렉션 존재 여부 확인
 */
export async function checkCollectionExists(): Promise<boolean> {
  try {
    const response = await fetch(
      `${DATABASE_CONFIG.CHROMADB.URL}/api/v1/collections/${DATABASE_CONFIG.CHROMADB.COLLECTION_NAME}`
    );
    return response.ok;
  } catch (error) {
    console.error('컬렉션 확인 실패:', error);
    return false;
  }
}

/**
 * 데이터베이스 설정 검증
 */
export function validateDatabaseConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // ChromaDB URL 검증
  if (!DATABASE_CONFIG.CHROMADB.URL) {
    errors.push('ChromaDB URL이 설정되지 않았습니다.');
  }

  // 컬렉션명 검증
  if (!DATABASE_CONFIG.CHROMADB.COLLECTION_NAME) {
    errors.push('ChromaDB 컬렉션명이 설정되지 않았습니다.');
  }

  // URL 형식 검증
  try {
    new URL(DATABASE_CONFIG.CHROMADB.URL);
  } catch (error) {
    errors.push('ChromaDB URL 형식이 올바르지 않습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}