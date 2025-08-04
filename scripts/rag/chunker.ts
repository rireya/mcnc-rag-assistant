/**
 * MCNC RAG Assistant - 청킹 로직
 * RecursiveCharacterTextSplitter 기반 청킹 구현
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import path from 'path';
import {
  ChunkData,
  ChunkMetadata,
  ChunkingStrategy,
  ParsedDocument,
  FileProcessingStatus,
  ChunkingStats,
  ChunkQualityMetrics,
  EnhancedChunkData,
  ChunkEnrichments,
  EnhancedImageMetadata,
  EnhancedTableMetadata
} from '../types/chunk.types.js';
import {
  normalizeText,
  estimateTokenCount,
  isEmptyChunk,
  isDuplicateChunk,
  generateChunkId,
  assessChunkQuality,
  getStrategyNameFromPath,
  truncateToTokenLimit
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
      return [];
    }

    // 전처리 적용
    const preprocessedText = this.preprocessText(text);
    const normalizedText = normalizeText(preprocessedText);

    try {
      // LangChain Document 생성
      const documents = [new Document({
        pageContent: normalizedText
      })];

      // RecursiveCharacterTextSplitter로 분할
      const chunks = await this.splitter.splitDocuments(documents);

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
        break;

      case 'weakenPage':
        // 페이지 구분자를 약한 마커로 변경
        processedText = text.replace(/\n--- 페이지 (\d+) ---\n/g, '\n\n<<PAGE_BOUNDARY_$1>>\n\n');
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
      }
    }

    return uniqueChunks;
  }
}

/**
 * 문서 청킹 처리 클래스
 */
export class DocumentChunker {
  /**
   * 단일 문서를 청킹
   */
  public async chunkDocument(document: ParsedDocument): Promise<{
    chunks: EnhancedChunkData[];
    stats: { chunk_count: number; total_tokens: number; strategy_used: string };
  }> {
    const startTime = Date.now();

    // 청킹 전략 결정
    const strategyName = getStrategyNameFromPath(document.file_path);
    const strategy = getChunkingStrategy(document.file_path);

    console.log(`Processing: ${document.file_name} [${strategyName}]`);

    // 텍스트 청킹
    const chunker = new TextChunker(strategy, strategyName);
    const textChunks = await chunker.chunkText(document.content);

    // 청크 데이터 생성
    const chunks: EnhancedChunkData[] = [];
    let totalTokens = 0;

    // 문자 위치 추적을 위한 변수
    let currentPosition = 0;

    for (let i = 0; i < textChunks.length; i++) {
      const content = textChunks[i];
      const tokens = estimateTokenCount(content);
      totalTokens += tokens;

      // 청크의 시작/끝 위치 계산
      const startChar = document.content.indexOf(content, currentPosition);
      const endChar = startChar + content.length;
      currentPosition = endChar;

      // 청크가 포함하는 페이지 번호들 계산 - 모든 페이지 마커 포함
      const pagesInChunk = this.getPagesFromChunkContent(content);

      const chunkData: EnhancedChunkData = {
        id: generateChunkId(document.file_path, i),
        content: content,
        metadata: this.createChunkMetadata(
          document,
          i,
          textChunks.length,
          strategyName,
          strategy,
          startChar,
          endChar,
          pagesInChunk
        ),
        tokens: tokens,
        char_count: content.length,
        created_at: new Date().toISOString(),
        enrichments: {}  // 초기화
      };

      // 메타데이터 보강 (실제 내용이 있는 페이지의 데이터만)
      this.enrichChunkWithMetadata(chunkData, document, startChar, endChar, pagesInChunk);

      chunks.push(chunkData);
    }

    // 누락된 구조화 데이터 검증 및 복구
    this.validateAndRecoverStructuredData(document, chunks);

    const processingTime = Date.now() - startTime;

    console.log(`✓ ${document.file_name}: ${chunks.length} chunks, ${totalTokens.toLocaleString()} tokens (${processingTime}ms)`);

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
   * 페이지 경계 정보 추출
   */
  private extractPageBoundaries(content: string): Array<{ page: number; startPos: number; endPos: number }> {
    const boundaries: Array<{ page: number; startPos: number; endPos: number }> = [];
    const pagePattern = /\n--- (페이지|슬라이드) (\d+) ---\n/g;

    const matches: Array<{ pageNum: number; index: number; length: number }> = [];
    let match;

    // 모든 페이지 마커 수집
    while ((match = pagePattern.exec(content)) !== null) {
      matches.push({
        pageNum: parseInt(match[2]),
        index: match.index,
        length: match[0].length
      });
    }

    // 페이지 번호 순서대로 정렬
    matches.sort((a, b) => a.pageNum - b.pageNum);

    // 페이지 경계 생성
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const next = matches[i + 1];

      // 현재 페이지의 시작 위치 (마커 다음)
      const pageStart = current.index + current.length;

      // 현재 페이지의 끝 위치 (다음 마커 전 또는 문서 끝)
      const pageEnd = next ? next.index : content.length;

      boundaries.push({
        page: current.pageNum,
        startPos: pageStart,
        endPos: pageEnd
      });

      // 누락된 페이지 번호 확인 (예: 5 다음에 7이 오면 6이 누락)
      if (next && next.pageNum > current.pageNum + 1) {
        // 중간에 마커가 없는 페이지들 추가
        for (let missingPage = current.pageNum + 1; missingPage < next.pageNum; missingPage++) {
          // 페이지 내용을 균등하게 분할
          const totalPages = next.pageNum - current.pageNum;
          const contentLength = next.index - pageStart;
          const pageLength = Math.floor(contentLength / totalPages);
          const offset = (missingPage - current.pageNum) * pageLength;

          boundaries.push({
            page: missingPage,
            startPos: pageStart + offset,
            endPos: pageStart + offset + pageLength
          });
        }
      }
    }

    // 첫 페이지가 마커 없이 시작하는 경우
    if (matches.length === 0 || matches[0].pageNum > 1) {
      const firstMarkerPos = matches.length > 0 ? matches[0].index : content.length;

      // 1페이지부터 첫 마커 페이지 전까지 추가
      const firstPageNum = matches.length > 0 ? matches[0].pageNum : 1;
      for (let page = 1; page < firstPageNum; page++) {
        boundaries.push({
          page: page,
          startPos: page === 1 ? 0 : Math.floor(firstMarkerPos * (page - 1) / (firstPageNum - 1)),
          endPos: Math.floor(firstMarkerPos * page / (firstPageNum - 1))
        });
      }
    }

    // 페이지 번호순 정렬
    boundaries.sort((a, b) => a.page - b.page);

    return boundaries;
  }

  /**
   * 청크 텍스트를 분석하여 포함된 페이지 번호 추출
   * 마지막 페이지 마커는 오버랩으로 간주하여 제외
   */
  private getPagesFromChunkContent(content: string): number[] {
    const pages = new Set<number>();
    const pagePattern = /--- (페이지|슬라이드) (\d+) ---/g;

    // 청크 내의 모든 페이지 마커 찾기
    const markers: Array<{ page: number; position: number }> = [];
    let match;
    while ((match = pagePattern.exec(content)) !== null) {
      markers.push({
        page: parseInt(match[2]),
        position: match.index
      });
    }

    if (markers.length === 0) {
      // 페이지 마커가 없는 경우, 페이지 1로 가정
      return [1];
    }

    // 마지막 마커 처리를 위한 청크 끝부분 확인
    const lastMarker = markers[markers.length - 1];
    const contentAfterLastMarker = content.substring(lastMarker.position + 20).trim(); // 마커 길이 약 20자
    const MIN_TRAILING_CONTENT = 30; // 마지막 페이지로 인정하기 위한 최소 내용

    // 각 마커 처리
    markers.forEach((marker, index) => {
      const isLastMarker = index === markers.length - 1;

      if (isLastMarker && contentAfterLastMarker.length < MIN_TRAILING_CONTENT) {
        // 마지막 마커이고 그 이후 내용이 충분하지 않으면 제외 (오버랩으로 간주)
        return;
      }

      pages.add(marker.page);

      // 다음 페이지 마커까지 거리가 멀면 중간 페이지도 포함
      const nextMarker = markers[index + 1];
      if (nextMarker && nextMarker.page > marker.page + 1) {
        // 예: 5페이지 다음이 7페이지면 6페이지도 포함
        for (let page = marker.page + 1; page < nextMarker.page; page++) {
          pages.add(page);
        }
      }
    });

    // 청크 시작 부분에 페이지 마커가 없는 경우
    if (markers.length > 0 && markers[0].position > 100) {
      // 첫 마커 이전에 충분한 내용이 있다면 이전 페이지도 포함
      const firstPage = markers[0].page;
      if (firstPage > 1) {
        pages.add(firstPage - 1);
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  }

  /**
   * 페이지의 실제 내용 길이 계산
   */
  private getPageContentLength(content: string, pageNum: number): number {
    const pagePattern = new RegExp(`--- (페이지|슬라이드) ${pageNum} ---([\\s\\S]*?)(?:--- (?:페이지|슬라이드) \\d+ ---|$)`);
    const match = content.match(pagePattern);

    if (match && match[2]) {
      // 페이지 마커 이후의 실제 내용 길이
      return match[2].trim().length;
    }

    return 0;
  }

  /**
   * 청크에 구조화 데이터 메타데이터 추가 (실제 내용이 있는 페이지만)
   */
  private enrichChunkWithMetadata(
    chunk: EnhancedChunkData,
    document: ParsedDocument,
    startChar: number,
    endChar: number,
    pagesInChunk: number[]
  ): void {
    const MIN_PAGE_CONTENT = 50; // 테이블/이미지를 포함하기 위한 최소 내용 길이

    // 실제 내용이 있는 페이지만 필터링
    const pagesWithContent = pagesInChunk.filter(pageNum => {
      const contentLength = this.getPageContentLength(chunk.content, pageNum);
      return contentLength >= MIN_PAGE_CONTENT;
    });

    // 실제 내용이 있는 페이지의 이미지만 추가
    const images = this.findImagesInPages(document, pagesWithContent);
    if (images.length > 0) {
      chunk.enrichments!.images = images;
    }

    // 실제 내용이 있는 페이지의 테이블만 추가
    const tables = this.findTablesInPages(document, pagesWithContent);
    if (tables.length > 0) {
      chunk.enrichments!.tables = tables;
    }

    // 임베딩 텍스트 생성
    chunk.enrichments!.embedded_text = this.prepareEmbeddingText(chunk);
  }

  /**
   * 특정 페이지들의 이미지 찾기
   */
  private findImagesInPages(
    document: ParsedDocument,
    pages: number[]
  ): EnhancedImageMetadata[] {
    if (!document.images || document.images.length === 0 || pages.length === 0) {
      return [];
    }

    const enhancedImages: EnhancedImageMetadata[] = [];

    for (const image of document.images) {
      const imagePage = image.page || image.slide;

      // 이미지가 청크의 페이지 범위에 포함되는지 확인
      if (imagePage && pages.includes(imagePage)) {
        enhancedImages.push({
          image_id: `i_${imagePage}_${image.image_index || enhancedImages.length + 1}`,
          page: image.page,
          slide: image.slide,
          image_index: image.image_index,
          xref: image.xref,
          position: 'within',
          context: this.generateImageContext(image, document),
          bbox: image.bbox,
          relationship_id: image.relationship_id,
          target: image.target,
          shape_id: image.shape_id,
          original_metadata: image
        });
      }
    }

    return enhancedImages;
  }

  /**
   * 특정 페이지들의 테이블 찾기
   */
  private findTablesInPages(
    document: ParsedDocument,
    pages: number[]
  ): EnhancedTableMetadata[] {
    if (!document.tables || document.tables.length === 0 || pages.length === 0) {
      return [];
    }

    const enhancedTables: EnhancedTableMetadata[] = [];

    for (const table of document.tables) {
      const tablePage = table.page || table.slide;

      // 테이블이 청크의 페이지 범위에 포함되는지 확인
      if (tablePage && pages.includes(tablePage)) {
        const headers = this.extractTableHeaders(table);

        enhancedTables.push({
          table_id: `t_${tablePage}_${table.table_index || enhancedTables.length + 1}`,
          page: table.page,
          slide: table.slide,
          sheet_name: table.sheet_name,
          table_index: table.table_index,
          position: 'within',
          summary: this.generateTableSummary(table, headers),
          headers: headers,
          row_count: table.row_count,
          col_count: table.col_count,
          data: table.data,
          truncated: false,
          original_metadata: table
        });
      }
    }

    return enhancedTables;
  }

  /**
   * 이미지 컨텍스트 생성
   */
  private generateImageContext(image: any, document: ParsedDocument): string {
    if (image.page) {
      return `페이지 ${image.page}의 이미지`;
    } else if (image.slide) {
      return `슬라이드 ${image.slide}의 이미지`;
    }
    return '문서의 이미지';
  }

  /**
   * 테이블 헤더 추출
   */
  private extractTableHeaders(table: any): string[] {
    if (table.data && table.data.length > 0) {
      // 첫 번째 행을 헤더로 간주
      return table.data[0].map((cell: any) => String(cell || '').trim());
    }
    return [];
  }

  /**
   * 테이블 요약 생성
   */
  private generateTableSummary(table: any, headers: string[]): string {
    if (headers.length > 0) {
      const validHeaders = headers.filter(h => h && h.length > 0);
      if (validHeaders.length > 0) {
        return validHeaders.join(', ');
      }
    }

    if (table.sheet_name) {
      return `${table.sheet_name} 시트의 테이블`;
    } else if (table.page) {
      return `페이지 ${table.page}의 테이블`;
    } else if (table.slide) {
      return `슬라이드 ${table.slide}의 테이블`;
    }

    return `${table.row_count}x${table.col_count} 테이블`;
  }

  /**
   * 임베딩 텍스트 준비
   */
  private prepareEmbeddingText(chunk: EnhancedChunkData): string {
    let embeddingText = chunk.content;

    // 테이블 정보 추가 (중복 제거)
    if (chunk.enrichments?.tables && chunk.enrichments.tables.length > 0) {
      const tableDescriptions = chunk.enrichments.tables
        .filter(table => table.summary && table.summary.length > 10)
        .map(table => `[테이블] ${table.summary}`)
        .slice(0, 3);

      if (tableDescriptions.length > 0) {
        embeddingText += '\n\n' + tableDescriptions.join('\n');
      }
    }

    // 이미지 정보 추가 (중복 제거)
    if (chunk.enrichments?.images && chunk.enrichments.images.length > 0) {
      const meaningfulImages = chunk.enrichments.images
        .filter(img => img.context && !img.context.match(/^(페이지|슬라이드) \d+의 이미지$/))
        .slice(0, 5);

      if (meaningfulImages.length > 0) {
        const imageDescriptions = meaningfulImages
          .map(img => `[이미지] ${img.context}`)
          .join('\n');
        embeddingText += '\n\n' + imageDescriptions;
      } else if (chunk.enrichments.images.length > 0) {
        embeddingText += `\n\n[${chunk.enrichments.images.length}개 이미지 포함]`;
      }
    }

    return embeddingText;
  }

  /**
   * 누락된 구조화 데이터 검증 및 복구
   */
  private validateAndRecoverStructuredData(
    document: ParsedDocument,
    chunks: EnhancedChunkData[]
  ): void {
    const originalTables = document.tables || [];
    const originalImages = document.images || [];

    // 청크에 포함된 테이블/이미지 수집
    const includedTableIds = new Set<string>();
    const includedImageIds = new Set<string>();

    chunks.forEach(chunk => {
      chunk.enrichments?.tables?.forEach(table => {
        includedTableIds.add(table.table_id);
      });
      chunk.enrichments?.images?.forEach(image => {
        includedImageIds.add(image.image_id);
      });
    });

    // 누락된 항목 찾기
    const missingTables: any[] = [];
    const missingImages: any[] = [];

    originalTables.forEach((table, index) => {
      const tableId = `t_${table.page || table.slide || 0}_${table.table_index || index + 1}`;
      if (!includedTableIds.has(tableId)) {
        missingTables.push(table);
      }
    });

    originalImages.forEach((image, index) => {
      const imageId = `i_${image.page || image.slide || 0}_${image.image_index || index + 1}`;
      if (!includedImageIds.has(imageId)) {
        missingImages.push(image);
      }
    });

    // 누락된 항목 재배치
    if (missingTables.length > 0 || missingImages.length > 0) {
      this.redistributeMissingStructuredData(chunks, missingTables, missingImages, document);
    }
  }

  /**
   * 누락된 구조화 데이터 재배치
   */
  private redistributeMissingStructuredData(
    chunks: EnhancedChunkData[],
    missingTables: any[],
    missingImages: any[],
    document: ParsedDocument
  ): void {
    // 각 청크가 포함하는 페이지 정보는 이미 메타데이터에 있음

    // 누락된 테이블 재배치
    for (const table of missingTables) {
      const tablePage = table.page || table.slide;
      if (!tablePage) continue;

      // 해당 페이지를 포함하는 청크 찾기
      const targetChunk = chunks.find(chunk => {
        const pages = chunk.metadata.position.pages || [];
        return pages.includes(tablePage);
      });

      if (targetChunk) {
        if (!targetChunk.enrichments!.tables) {
          targetChunk.enrichments!.tables = [];
        }

        const headers = this.extractTableHeaders(table);
        targetChunk.enrichments!.tables.push({
          table_id: `t_${tablePage}_${table.table_index || targetChunk.enrichments!.tables.length + 1}`,
          page: table.page,
          slide: table.slide,
          sheet_name: table.sheet_name,
          table_index: table.table_index,
          position: 'within',
          summary: this.generateTableSummary(table, headers),
          headers: headers,
          row_count: table.row_count,
          col_count: table.col_count,
          data: table.data,
          truncated: false,
          original_metadata: table
        });
      }
    }

    // 누락된 이미지 재배치
    for (const image of missingImages) {
      const imagePage = image.page || image.slide;
      if (!imagePage) continue;

      // 해당 페이지를 포함하는 청크 찾기
      const targetChunk = chunks.find(chunk => {
        const pages = chunk.metadata.position.pages || [];
        return pages.includes(imagePage);
      });

      if (targetChunk) {
        if (!targetChunk.enrichments!.images) {
          targetChunk.enrichments!.images = [];
        }

        targetChunk.enrichments!.images.push({
          image_id: `i_${imagePage}_${image.image_index || targetChunk.enrichments!.images.length + 1}`,
          page: image.page,
          slide: image.slide,
          image_index: image.image_index,
          xref: image.xref,
          position: 'within',
          context: this.generateImageContext(image, document),
          bbox: image.bbox,
          relationship_id: image.relationship_id,
          target: image.target,
          shape_id: image.shape_id,
          original_metadata: image
        });
      }
    }
  }

  /**
   * 구조화 데이터를 위한 최적 청크 찾기
   */
  private findBestChunkForStructuredData(
    chunks: EnhancedChunkData[],
    structuredData: any
  ): EnhancedChunkData | null {
    const pageNum = structuredData.page || structuredData.slide;

    if (pageNum) {
      // 해당 페이지/슬라이드를 포함하는 청크 찾기
      for (const chunk of chunks) {
        if (chunk.content.includes(`페이지 ${pageNum}`) ||
          chunk.content.includes(`슬라이드 ${pageNum}`)) {
          return chunk;
        }
      }
    }

    // 기본적으로 첫 번째 청크에 추가
    return chunks.length > 0 ? chunks[0] : null;
  }

  /**
   * 청크 메타데이터 생성
   */
  private createChunkMetadata(
    document: ParsedDocument,
    chunkIndex: number,
    totalChunks: number,
    strategyName: string,
    strategy: ChunkingStrategy,
    startChar?: number,
    endChar?: number,
    pagesInChunk?: number[]
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
        start_char: startChar,
        end_char: endChar,
        pages: pagesInChunk || [],
        page: pagesInChunk && pagesInChunk.length === 1 ? pagesInChunk[0] : undefined,
        slide: undefined  // 추후 개선 가능
      }
    };
  }

  /**
   * 청크 품질 검사 수행
   */
  public assessChunksQuality(chunks: EnhancedChunkData[]): ChunkQualityMetrics[] {
    const qualityResults = chunks.map(chunk => assessChunkQuality(chunk));

    const validChunks = qualityResults.filter(result => result.is_valid).length;
    const invalidChunks = qualityResults.length - validChunks;

    if (invalidChunks > 0) {
      console.log(`⚠️  Quality issues found in ${invalidChunks} chunks`);
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
    allChunks: EnhancedChunkData[];
    stats: ChunkingStats;
    fileStatuses: FileProcessingStatus[];
  }> {
    const startTime = Date.now();
    const allChunks: EnhancedChunkData[] = [];
    const fileStatuses: FileProcessingStatus[] = [];
    const strategyStats: { [strategy: string]: { file_count: number; chunk_count: number; total_tokens: number } } = {};

    console.log(`\nStarting batch processing of ${documents.length} documents...`);
    console.log('─'.repeat(60));

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      const fileStartTime = Date.now();

      try {
        console.log(`[${i + 1}/${documents.length}] `, { end: '' });

        const result = await this.documentChunker.chunkDocument(document);
        allChunks.push(...result.chunks);

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
        console.error(`✗ Failed to process ${document.file_name}:`, error);

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

    console.log('─'.repeat(60));
    console.log(`\nBatch processing completed in ${totalProcessingTime}ms`);
    console.log(`Total chunks created: ${allChunks.length}`);
    console.log(`Successful files: ${fileStatuses.filter(s => s.status === 'completed').length}/${documents.length}`);

    return { allChunks, stats, fileStatuses };
  }

  /**
   * 통계 계산
   */
  private calculateStats(
    chunks: EnhancedChunkData[],
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
            avg_size: stats.chunk_count > 0 ? Math.round(stats.total_tokens / stats.chunk_count) : 0,
            total_tokens: stats.total_tokens
          }
        ])
      ),
      processing_time_ms: processingTime
    };
  }
}