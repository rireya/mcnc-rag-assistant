/**
 * MCNC RAG Assistant - 타입 정의
 * 청킹, 임베딩, 검색에 사용되는 모든 타입들
 */

// ==================== 기본 타입 ====================

/**
 * 파싱된 원본 문서 구조
 */
export interface ParsedDocument {
  content: string;
  tables: Array<{
    page?: number;
    slide?: number;
    sheet_name?: string;
    table_index?: number;
    data: string[][];
    row_count: number;
    col_count: number;
  }>;
  images: Array<{
    page?: number;
    slide?: number;
    image_index?: number;
    xref?: number;
    bbox?: number[];
    relationship_id?: string;
    target?: string;
    shape_id?: number;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  }>;
  slides?: Array<{
    slide_number: number;
    content: string;
    table_count: number;
    image_count: number;
  }>;
  metadata: {
    [key: string]: any;
    pages?: number;
    title?: string;
    author?: string;
    subject?: string;
    word_count?: number;
    char_count?: number;
    file_type?: string;
  };
  file_path: string;
  file_name: string;
  parsing_method: string;
  parsed_at: string;
  file_hash: string;
  error?: string;
  status?: string;
}

/**
 * 청크 데이터 구조
 */
export interface ChunkData {
  id: string;                    // 고유 식별자 (파일경로 + 청크번호)
  content: string;               // 청크 내용
  metadata: ChunkMetadata;       // 메타데이터
  tokens: number;                // 토큰 수
  char_count: number;            // 문자 수
  created_at: string;            // 생성 시간
}

/**
 * 청크 메타데이터
 */
export interface ChunkMetadata {
  source_file: string;           // 원본 파일 경로
  file_name: string;             // 파일명
  file_type: string;             // 파일 타입 (pdf, docx, etc.)
  chunk_index: number;           // 청크 순서
  total_chunks: number;          // 해당 파일의 총 청크 수
  chunk_strategy: string;        // 사용된 청킹 전략명
  chunk_size: number;            // 청크 크기 설정값
  overlap: number;               // 오버랩 설정값

  // 원본 문서 메타데이터
  original_metadata: {
    title?: string;
    author?: string;
    pages?: number;
    word_count?: number;
    parsed_at?: string;
  };

  // 청크 위치 정보
  position: {
    start_char?: number;         // 원본에서의 시작 문자 위치
    end_char?: number;           // 원본에서의 끝 문자 위치
    pages?: number[];            // 청크가 포함하는 페이지 번호들
    page?: number;               // 페이지 번호 (단일 페이지인 경우)
    slide?: number;              // 슬라이드 번호 (해당되는 경우)
  };
}

/**
 * 향상된 이미지 메타데이터
 */
export interface EnhancedImageMetadata {
  image_id: string;              // 고유 식별자
  page?: number;                 // 페이지 번호
  slide?: number;                // 슬라이드 번호
  image_index?: number;          // 이미지 인덱스
  xref?: number;                 // PDF 참조 번호
  position: 'before' | 'within' | 'after';  // 청크 내 위치
  context?: string;              // 이미지 설명/컨텍스트
  bbox?: number[];               // 바운딩 박스 좌표
  relationship_id?: string;      // DOCX 관계 ID
  target?: string;               // 타겟 정보
  shape_id?: number;             // PPTX shape ID
  original_metadata?: any;       // 원본 메타데이터 보존
}

/**
 * 향상된 테이블 메타데이터
 */
export interface EnhancedTableMetadata {
  table_id: string;              // 고유 식별자
  page?: number;                 // 페이지 번호
  slide?: number;                // 슬라이드 번호
  sheet_name?: string;           // 엑셀 시트명
  table_index?: number;          // 테이블 인덱스
  position: 'before' | 'within' | 'after';  // 청크 내 위치
  summary?: string;              // 테이블 요약
  headers?: string[];            // 테이블 헤더
  row_count: number;             // 행 수
  col_count: number;             // 열 수
  data?: any[][];                // 테이블 데이터 (선택적)
  truncated?: boolean;           // 잘림 여부
  original_metadata?: any;       // 원본 메타데이터 보존
}

/**
 * 청크 보강 정보 (Enrichments)
 */
export interface ChunkEnrichments {
  tables?: EnhancedTableMetadata[];    // 테이블 정보
  images?: EnhancedImageMetadata[];    // 이미지 정보
  embedded_text?: string;               // 임베딩용 텍스트
}

/**
 * 확장된 청크 데이터 구조
 */
export interface EnhancedChunkData extends ChunkData {
  enrichments?: ChunkEnrichments;       // 보강 정보
}

/**
 * 청킹 전략 설정
 */
export interface ChunkingStrategy {
  chunkSize: number;             // 청크 크기 (토큰)
  overlap: number;               // 오버랩 크기 (토큰)
  separators: readonly string[]; // 구분자 배열
  avgCharsPerToken: number;      // 문자/토큰 비율
  forceOverlap?: boolean;        // 강제 오버랩 적용 (선택적)
  preprocessor?: 'removePage' | 'weakenPage' | 'none'; // 전처리 방식 (선택적)
}

/**
 * 청킹 결과 통계
 */
export interface ChunkingStats {
  total_files: number;           // 처리된 파일 수
  total_chunks: number;          // 총 청크 수
  avg_chunk_size: number;        // 평균 청크 크기
  min_chunk_size: number;        // 최소 청크 크기
  max_chunk_size: number;        // 최대 청크 크기
  avg_tokens_per_chunk: number;  // 청크당 평균 토큰 수
  total_tokens: number;          // 총 토큰 수
  strategies_used: {             // 사용된 전략별 통계
    [strategy: string]: {
      file_count: number;
      chunk_count: number;
      avg_size: number;
      total_tokens?: number;     // 전략별 총 토큰 수 (선택적)
    };
  };
  processing_time_ms: number;    // 처리 시간 (밀리초)
}

/**
 * 청킹 처리 옵션
 */
export interface ChunkingOptions {
  force_reprocess?: boolean;     // 강제 재처리
  output_dir?: string;           // 출력 디렉터리
  include_tables?: boolean;      // 표 내용 포함 여부
  include_images?: boolean;      // 이미지 정보 포함 여부
  quality_check?: boolean;       // 품질 검사 수행 여부
  parallel_processing?: boolean; // 병렬 처리 여부
  max_parallel?: number;         // 최대 병렬 처리 수
}

/**
 * 파일 처리 상태
 */
export interface FileProcessingStatus {
  file_path: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  chunks_created: number;
  processing_time_ms?: number;
  error_message?: string;
  strategy_used?: string;
}

/**
 * 청킹 품질 지표
 */
export interface ChunkQualityMetrics {
  chunk_id: string;
  is_valid: boolean;             // 유효한 청크인지
  issues: string[];              // 발견된 문제점들
  size_score: number;            // 크기 적합성 점수 (0-1)
  content_score: number;         // 내용 품질 점수 (0-1)
  coherence_score?: number;      // 의미적 일관성 점수 (0-1, 향후 구현)
}

// ==================== 유틸리티 타입 ====================

/**
 * 청킹 처리 결과
 */
export type ChunkingResult = {
  success: true;
  chunks: EnhancedChunkData[];
  stats: ChunkingStats;
  file_statuses: FileProcessingStatus[];
} | {
  success: false;
  error: string;
  partial_results?: {
    chunks: EnhancedChunkData[];
    file_statuses: FileProcessingStatus[];
  };
};

/**
 * 지원하는 파일 확장자
 */
export type SupportedFileExtension = '.pdf' | '.docx' | '.pptx' | '.xlsx' | '.md' | '.mdx' | '.js' | '.ts';

/**
 * 청킹 전략 이름
 */
export type ChunkingStrategyName =
  | 'documents/corporate'
  | 'documents/specifications'
  | 'documents/manuals'
  | 'documents/policies'
  | 'documents/presentations'
  | 'code/bizmob-sdk'
  | 'code/components'
  | 'guides/tutorials'
  | 'guides/api-docs'
  | 'guides/examples'
  | 'default';

// ==================== 상수 ====================

/**
 * 지원하는 파일 확장자 목록
 */
export const SUPPORTED_EXTENSIONS: SupportedFileExtension[] = [
  '.pdf', '.docx', '.pptx', '.xlsx', '.md', '.mdx', '.js', '.ts'
];

/**
 * 품질 검사 임계값
 */
export const QUALITY_THRESHOLDS = {
  MIN_CHUNK_SIZE: 50,            // 최소 청크 크기 (토큰)
  MAX_CHUNK_SIZE: 1500,          // 최대 청크 크기 (토큰)
  MIN_CONTENT_SCORE: 0.3,        // 최소 내용 품질 점수
  MIN_SIZE_SCORE: 0.5,           // 최소 크기 적합성 점수
} as const;