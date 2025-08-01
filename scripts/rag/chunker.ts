/**
 * MCNC RAG Assistant - 개선된 청킹 로직
 * 테이블/이미지 정보 보존 및 임베딩 최적화
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import path from 'path';
import {
  ChunkData,
  ChunkMetadata,
  ChunkingStrategy,
  ChunkEnrichments,
  ParsedDocument,
  FileProcessingStatus,
  ChunkingStats,
  ChunkQualityMetrics
} from './types.js';
import {
  normalizeText,
  estimateTokenCount,
  isEmptyChunk,
  isDuplicateChunk,
  generateChunkId,
  assessChunkQuality,
  getStrategyNameFromPath,
  truncateToTokenLimit,
  extractPageNumbers,
  getChunkPageRange,
  generateTableSummary,
  prepareEmbeddingText
} from './utils.js';
import { getChunkingStrategy, RAG_CONFIG } from '../config/rag-config.js';

/**
 * RecursiveCharacterTextSplitter 래퍼 클래스
 */
export class TextChunker {
  private splitter: RecursiveCharacterTextSplitter;
  private strategy: ChunkingStrategy;
  private strategyName: string;

  constructor(strategy: ChunkingStrategy, strategyName: string) {
    this.strategy = strategy;
    this.strategyName = strategyName;

    const avgCharsPerToken = strategy.avgCharsPerToken;
    const chunkSizeInChars = Math.floor(strategy.chunkSize * avgCharsPerToken);
    const overlapInChars = Math.floor(strategy.overlap * avgCharsPerToken);

    console.log(`Strategy: ${strategyName}`);
    console.log(`  - Token to char ratio: ${avgCharsPerToken}`);
    console.log(`  - Chunk size: ${strategy.chunkSize} tokens → ${chunkSizeInChars} chars`);
    console.log(`  - Overlap: ${strategy.overlap} tokens → ${overlapInChars} chars`);
    console.log(`  - Preprocessor: ${strategy.preprocessor || 'none'}`);

    // RecursiveCharacterTextSplitter 인스턴스 생성
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: chunkSizeInChars,
      chunkOverlap: overlapInChars,
      separators: [...strategy.separators]
    });
  }

  /**
   * 텍스트를 청크로 분할
   */
  public async chunkText(text: string): Promise<string[]> {
    if (!text || text.trim().length === 0) {
      console.log('Empty text provided, returning empty chunks');
      return [];
    }

    // 전처리 적용
    const preprocessedText = this.preprocessText(text);
    const normalizedText = normalizeText(preprocessedText);

    console.log(`Chunking text: ${normalizedText.length} characters`);

    try {
      // LangChain Document 생성
      const documents = [new Document({
        pageContent: normalizedText
      })];

      // RecursiveCharacterTextSplitter로 분할
      const startTime = Date.now();
      const chunks = await this.splitter.splitDocuments(documents);
      const processingTime = Date.now() - startTime;

      // 텍스트 추출 및 필터링
      let textChunks = chunks
        .map(doc => doc.pageContent)
        .filter(chunk => !isEmptyChunk(chunk))
        .filter(chunk => estimateTokenCount(chunk) >= RAG_CONFIG.CHUNKING.QUALITY.MIN_CHUNK_SIZE);

      // 토큰 한도 초과 청크 자르기
      const maxTokens = RAG_CONFIG.CHUNKING.QUALITY.MAX_CHUNK_SIZE;
      textChunks = textChunks.map(chunk => {
        const tokens = estimateTokenCount(chunk);
        if (tokens > maxTokens) {
          console.log(`Chunk exceeds token limit (${tokens} > ${maxTokens}), truncating...`);
          return truncateToTokenLimit(chunk, maxTokens);
        }
        return chunk;
      });

      // 후처리: 페이지 경계 마커 복원
      if (this.strategy.preprocessor === 'weakenPage') {
        textChunks = this.postprocessChunks(textChunks);
      }

      // 중복 제거
      const deduplicatedChunks = this.removeDuplicates(textChunks);

      console.log(`Chunking complete for ${this.strategyName}: ${chunks.length} → ${textChunks.length} → ${deduplicatedChunks.length} chunks (${processingTime}ms)`);

      return deduplicatedChunks;

    } catch (error) {
      console.error(`Chunking failed for ${this.strategyName}:`, error);
      throw error;
    }
  }

  /**
   * 전처리: 문서 타입에 따른 텍스트 전처리
   */
  private preprocessText(text: string): string {
    if (!this.strategy.preprocessor || this.strategy.preprocessor === 'none') {
      return text;
    }

    let processedText = text;

    switch (this.strategy.preprocessor) {
      case 'removePage':
        // 페이지 구분자 완전 제거
        processedText = text.replace(/\n--- 페이지 \d+ ---\n/g, '\n\n');
        console.log('Preprocessor: Removed page separators');
        break;

      case 'weakenPage':
        // 페이지 구분자를 약한 마커로 변경
        processedText = text.replace(/\n--- 페이지 (\d+) ---\n/g, '\n\n<<PAGE_BOUNDARY_$1>>\n\n');
        console.log('Preprocessor: Weakened page separators');
        break;
    }

    return processedText;
  }

  /**
   * 후처리: 페이지 경계 마커 복원
   */
  private postprocessChunks(chunks: string[]): string[] {
    return chunks.map(chunk => {
      // 페이지 경계 마커를 원래 형태로 복원
      return chunk.replace(/<<PAGE_BOUNDARY_(\d+)>>/g, '--- 페이지 $1 ---');
    });
  }

  /**
   * 중복 청크 제거
   */
  private removeDuplicates(chunks: string[]): string[] {
    const uniqueChunks: string[] = [];
    const threshold = RAG_CONFIG.CHUNKING.QUALITY.DUPLICATE_THRESHOLD;

    for (const chunk of chunks) {
      const isDuplicate = uniqueChunks.some(existingChunk =>
        isDuplicateChunk(chunk, existingChunk, threshold)
      );

      if (!isDuplicate) {
        uniqueChunks.push(chunk);
      } else {
        console.log(`Removed duplicate chunk: ${chunk.substring(0, 50)}...`);
      }
    }

    return uniqueChunks;
  }
}

/**
 * 문서 청킹 처리 클래스 (개선됨)
 */
export class DocumentChunker {
  /**
   * 단일 문서를 청킹 (테이블/이미지 정보 포함)
   */
  public async chunkDocument(document: ParsedDocument): Promise<{
    chunks: ChunkData[];
    stats: { chunk_count: number; total_tokens: number; strategy_used: string };
  }> {
    const startTime = Date.now();

    // 청킹 전략 결정
    const strategyName = getStrategyNameFromPath(document.file_path);
    const strategy = getChunkingStrategy(document.file_path);

    console.log(`Processing ${document.file_name} with strategy: ${strategyName}`);
    console.log(`  - Tables: ${document.tables?.length || 0}`);
    console.log(`  - Images: ${document.images?.length || 0}`);

    // 텍스트 청킹
    const chunker = new TextChunker(strategy, strategyName);
    const textChunks = await chunker.chunkText(document.content);

    // 청크 데이터 생성 (개선됨)
    const chunks: ChunkData[] = [];
    let totalTokens = 0;

    for (let i = 0; i < textChunks.length; i++) {
      const content = textChunks[i];
      const tokens = estimateTokenCount(content);
      totalTokens += tokens;

      // 청크가 포함하는 페이지 범위 계산
      const pageRange = getChunkPageRange(content);

      // 해당 페이지의 테이블/이미지 찾기
      const enrichments = this.findRelatedAssets(
        content,
        pageRange,
        document.tables || [],
        document.images || []
      );

      // 임베딩용 텍스트 준비
      const chunkDataTemp: ChunkData = {
        id: generateChunkId(document.file_path, i),
        content: content,
        metadata: this.createChunkMetadata(document, i, textChunks.length, strategyName, strategy),
        tokens: tokens,
        char_count: content.length,
        created_at: new Date().toISOString(),
        enrichments: enrichments
      };

      // 임베딩용 통합 텍스트 생성
      if (enrichments && (enrichments.tables?.length || enrichments.images?.length)) {
        enrichments.embedded_text = prepareEmbeddingText(chunkDataTemp);
      }

      chunks.push(chunkDataTemp);
    }

    const processingTime = Date.now() - startTime;
    const avgTokens = chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0;

    console.log(`Chunking complete for ${document.file_name}:`);
    console.log(`  - Chunks created: ${chunks.length}`);
    console.log(`  - Total tokens: ${totalTokens.toLocaleString()}`);
    console.log(`  - Average tokens/chunk: ${avgTokens}`);
    console.log(`  - Chunks with tables: ${chunks.filter(c => c.enrichments?.tables?.length).length}`);
    console.log(`  - Chunks with images: ${chunks.filter(c => c.enrichments?.images?.length).length}`);
    console.log(`  - Processing time: ${processingTime}ms`);

    return {
      chunks,
      stats: {
        chunk_count: chunks.length,
        total_tokens: totalTokens,
        strategy_used: strategyName
      }
    };
  }

  /**
   * 청크와 관련된 테이블/이미지 찾기
   */
  private findRelatedAssets(
    chunkContent: string,
    pageRange: { start: number; end: number } | null,
    tables: any[],
    images: any[]
  ): ChunkEnrichments | undefined {
    if (!pageRange && !tables.length && !images.length) {
      return undefined;
    }

    const enrichments: ChunkEnrichments = {};

    // 페이지 기반 매핑 (우선)
    if (pageRange) {
      // 해당 페이지 범위의 테이블 찾기
      const relatedTables = tables.filter(table => {
        const tablePage = table.page || table.slide || 0;
        return tablePage >= pageRange.start && tablePage <= pageRange.end;
      });

      if (relatedTables.length > 0) {
        enrichments.tables = relatedTables.map((table, idx) => ({
          table_id: `t_${table.page || table.slide}_${table.table_index || idx}`,
          page: table.page || table.slide || 0,
          position: 'within' as const,
          summary: generateTableSummary(table),
          headers: table.data?.[0]?.filter((cell: any) => cell) || [],
          row_count: table.row_count,
          col_count: table.col_count,
          data: table.data // 원본 데이터 보존 (선택적)
        }));
      }

      // 해당 페이지 범위의 이미지 찾기
      const relatedImages = images.filter(image => {
        const imagePage = image.page || image.slide || 0;
        return imagePage >= pageRange.start && imagePage <= pageRange.end;
      });

      if (relatedImages.length > 0) {
        enrichments.images = relatedImages.map((image, idx) => ({
          image_id: `i_${image.page || image.slide}_${image.image_index || idx}`,
          page: image.page || image.slide || 0,
          position: 'within' as const,
          context: `페이지 ${image.page || image.slide}의 이미지`,
          bbox: image.bbox,
          type: image.type
        }));
      }
    }

    // 텍스트 기반 매핑 (보조)
    // 청크 내용에 "표", "그림", "도표" 등의 참조가 있는지 확인
    const tableReferences = chunkContent.match(/(?:표|테이블|Table)\s*\d+/gi);
    const imageReferences = chunkContent.match(/(?:그림|이미지|Figure|Image)\s*\d+/gi);

    if (tableReferences || imageReferences) {
      console.log(`Found references in chunk: Tables=${tableReferences?.length || 0}, Images=${imageReferences?.length || 0}`);
    }

    return (enrichments.tables?.length || enrichments.images?.length) ? enrichments : undefined;
  }

  /**
   * 청크 메타데이터 생성
   */
  private createChunkMetadata(
    document: ParsedDocument,
    chunkIndex: number,
    totalChunks: number,
    strategyName: string,
    strategy: ChunkingStrategy
  ): ChunkMetadata {
    return {
      source_file: document.file_path,
      file_name: document.file_name,
      file_type: path.extname(document.file_name).substring(1).toLowerCase() || 'unknown',
      chunk_index: chunkIndex,
      total_chunks: totalChunks,
      chunk_strategy: strategyName,
      chunk_size: strategy.chunkSize,
      overlap: strategy.overlap,

      original_metadata: {
        title: document.metadata.title,
        author: document.metadata.author,
        pages: document.metadata.pages,
        word_count: document.metadata.word_count,
        parsed_at: document.parsed_at
      },

      position: {
        // 추후 구현: 원본 텍스트에서의 정확한 위치 계산
        start_char: undefined,
        end_char: undefined,
        page: undefined,
        slide: undefined
      }
    };
  }

  /**
   * 청크 품질 검사 수행
   */
  public assessChunksQuality(chunks: ChunkData[]): ChunkQualityMetrics[] {
    console.log(`Assessing quality of ${chunks.length} chunks...`);

    const qualityResults = chunks.map(chunk => assessChunkQuality(chunk));

    const validChunks = qualityResults.filter(result => result.is_valid).length;
    const invalidChunks = qualityResults.length - validChunks;

    console.log(`Quality assessment complete: ${validChunks} valid, ${invalidChunks} invalid chunks`);

    if (invalidChunks > 0) {
      console.log('Quality issues found:');
      qualityResults
        .filter(result => !result.is_valid)
        .forEach(result => {
          console.log(`  - ${result.chunk_id}: ${result.issues.join(', ')}`);
        });
    }

    return qualityResults;
  }
}

/**
 * 배치 청킹 처리 클래스
 */
export class BatchChunker {
  private documentChunker: DocumentChunker;

  constructor() {
    this.documentChunker = new DocumentChunker();
  }

  /**
   * 여러 문서를 배치로 청킹
   */
  public async processDocuments(documents: ParsedDocument[]): Promise<{
    allChunks: ChunkData[];
    stats: ChunkingStats;
    fileStatuses: FileProcessingStatus[];
  }> {
    const startTime = Date.now();
    const allChunks: ChunkData[] = [];
    const fileStatuses: FileProcessingStatus[] = [];
    const strategyStats: { [strategy: string]: { file_count: number; chunk_count: number; total_tokens: number } } = {};

    console.log(`Starting batch processing of ${documents.length} documents...`);

    // 통계 정보 추가
    let totalTablesIncluded = 0;
    let totalImagesIncluded = 0;

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      const fileStartTime = Date.now();

      try {
        console.log(`[${i + 1}/${documents.length}] Processing ${document.file_name}...`);

        const result = await this.documentChunker.chunkDocument(document);
        allChunks.push(...result.chunks);

        // 테이블/이미지 통계 업데이트
        result.chunks.forEach(chunk => {
          if (chunk.enrichments?.tables) {
            totalTablesIncluded += chunk.enrichments.tables.length;
          }
          if (chunk.enrichments?.images) {
            totalImagesIncluded += chunk.enrichments.images.length;
          }
        });

        // 전략별 통계 업데이트
        const strategy = result.stats.strategy_used;
        if (!strategyStats[strategy]) {
          strategyStats[strategy] = { file_count: 0, chunk_count: 0, total_tokens: 0 };
        }
        strategyStats[strategy].file_count++;
        strategyStats[strategy].chunk_count += result.stats.chunk_count;
        strategyStats[strategy].total_tokens += result.stats.total_tokens;

        const processingTime = Date.now() - fileStartTime;
        fileStatuses.push({
          file_path: document.file_path,
          status: 'completed',
          chunks_created: result.chunks.length,
          processing_time_ms: processingTime,
          strategy_used: strategy
        });

      } catch (error) {
        const processingTime = Date.now() - fileStartTime;
        console.error(`Failed to process ${document.file_name}:`, error);

        fileStatuses.push({
          file_path: document.file_path,
          status: 'failed',
          chunks_created: 0,
          processing_time_ms: processingTime,
          error_message: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // 최종 통계 계산
    const totalProcessingTime = Date.now() - startTime;
    const stats = this.calculateStats(allChunks, fileStatuses, strategyStats, totalProcessingTime);

    console.log(`Batch processing completed in ${totalProcessingTime}ms`);
    console.log(`Total chunks created: ${allChunks.length}`);
    console.log(`Total tables included: ${totalTablesIncluded}`);
    console.log(`Total images included: ${totalImagesIncluded}`);
    console.log(`Successful files: ${fileStatuses.filter(s => s.status === 'completed').length}/${documents.length}`);

    return { allChunks, stats, fileStatuses };
  }

  /**
   * 통계 계산
   */
  private calculateStats(
    chunks: ChunkData[],
    fileStatuses: FileProcessingStatus[],
    strategyStats: any,
    processingTime: number
  ): ChunkingStats {
    const tokenCounts = chunks.map(chunk => chunk.tokens);
    const chunkSizes = chunks.map(chunk => chunk.char_count);

    return {
      total_files: fileStatuses.length,
      total_chunks: chunks.length,
      avg_chunk_size: chunkSizes.length > 0 ? Math.round(chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length) : 0,
      min_chunk_size: chunkSizes.length > 0 ? Math.min(...chunkSizes) : 0,
      max_chunk_size: chunkSizes.length > 0 ? Math.max(...chunkSizes) : 0,
      avg_tokens_per_chunk: tokenCounts.length > 0 ? Math.round(tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length) : 0,
      total_tokens: tokenCounts.reduce((a, b) => a + b, 0),
      strategies_used: Object.fromEntries(
        Object.entries(strategyStats).map(([strategy, stats]: [string, any]) => [
          strategy,
          {
            file_count: stats.file_count,
            chunk_count: stats.chunk_count,
            avg_size: stats.chunk_count > 0 ? Math.round(stats.total_tokens / stats.chunk_count) : 0
          }
        ])
      ),
      processing_time_ms: processingTime
    };
  }
}