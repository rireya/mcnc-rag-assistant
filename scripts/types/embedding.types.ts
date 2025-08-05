/**
 * MCNC RAG Assistant - 임베딩 관련 타입 정의
 */

// 청크 데이터 타입 (chunks.json 파일 구조)
export interface ChunkData {
  id: string;
  content: string;
  metadata: {
    source_file: string;
    file_name: string;
    file_type: string;
    chunk_index: number;
    total_chunks: number;
    chunk_strategy: string;
    chunk_size: number;
    overlap: number;
    original_metadata?: any;
    position: {
      start_char: number;
      end_char: number;
      pages?: number[];
    };
  };
  tokens: number;
  char_count: number;
  created_at: string;
  enrichments?: {
    images?: any[];
    tables?: any[];
    embedded_text?: string;
  };
}

// 임베딩 결과 타입
export interface EmbeddingData {
  chunk_id: string;          // 청크 ID
  embedding: number[];       // 1536차원 벡터
  model: string;            // 사용된 모델명
  created_at: string;       // 생성 시간
}

// 처리 통계
export interface ProcessingStats {
  totalFiles: number;
  processedFiles: number;
  totalChunks: number;
  processedChunks: number;
  failedChunks: number;
  totalTokens: number;      // 추가: 총 토큰 사용량
  totalCost: number;        // 추가: 총 비용 (USD)
  startTime: number;
  endTime?: number;
}