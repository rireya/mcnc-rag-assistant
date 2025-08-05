/**
 * MCNC RAG Assistant - 데이터베이스 설정 파일
 * ChromaDB 설정 (50명 규모 중소기업에 최적화)
 */

export const DATABASE_CONFIG = {
  // ==================== ChromaDB 설정 ====================
  CHROMADB: {
    // 컬렉션 설정
    COLLECTION_NAME: process.env.CHROMA_COLLECTION_NAME || 'mcnc_documents',

    // 컬렉션 메타데이터
    COLLECTION_METADATA: {
      description: 'MCNC bizMOB SDK Knowledge Base',
      created_by: 'rag-assistant',
      created_at: new Date().toISOString(),
      version: '1.0.0',
      embedding_model: 'text-embedding-3-small',
      vector_dimensions: 1536
    },

    // HNSW 인덱스 설정 (중소기업에 적합한 균형잡힌 설정)
    HNSW_CONFIG: {
      "hnsw:space": "cosine",         // text-embedding-3-small에 최적
      "hnsw:construction_ef": 200,     // 인덱스 구축 시 정확도 (기본값 유지)
      "hnsw:search_ef": 50,           // 검색 속도 우선 (10-500 범위)
      "hnsw:M": 16                    // 메모리와 성능의 균형 (기본값)
    },

    // 배치 처리 설정
    BATCH: {
      INSERT_SIZE: 100,               // 한 번에 삽입할 문서 수
      MAX_RETRIES: 3,                 // 실패 시 재시도 횟수
      RETRY_DELAY_MS: 1000           // 재시도 대기 시간
    },

    // 검색 설정
    SEARCH: {
      DEFAULT_K: 10,                  // 기본 검색 결과 수
      MAX_K: 50,                      // 최대 검색 결과 수
      SIMILARITY_THRESHOLD: 0.7       // 최소 유사도 (0-1)
    }
  }
} as const;

// ==================== 유틸리티 함수 ====================

/**
 * 유사도 기반 결과 필터링
 */
export function filterBySimilarity(
  results: any,
  threshold: number = DATABASE_CONFIG.CHROMADB.SEARCH.SIMILARITY_THRESHOLD
) {
  const distances = results.distances?.[0] || [];
  const documents = results.documents?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];

  const filtered = {
    documents: [[] as string[]],
    metadatas: [[] as any[]],
    distances: [[] as number[]]
  };

  for (let i = 0; i < distances.length; i++) {
    const similarity = 1 - distances[i];
    if (similarity >= threshold) {
      filtered.documents[0].push(documents[i]);
      filtered.metadatas[0].push(metadatas[i]);
      filtered.distances[0].push(distances[i]);
    }
  }

  return filtered;
}

/**
 * 재시도 로직이 포함된 작업 실행
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'operation'
): Promise<T> {
  const { MAX_RETRIES, RETRY_DELAY_MS } = DATABASE_CONFIG.CHROMADB.BATCH;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`[시도 ${attempt}/${MAX_RETRIES}] ${operationName} 실패:`, error);

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      } else {
        throw error;
      }
    }
  }

  throw new Error(`${operationName} 최대 재시도 횟수 초과`);
}