#!/usr/bin/env tsx

/**
 * MCNC RAG Assistant - 청킹 처리 실행 스크립트
 * 파싱된 문서들을 청크로 변환하여 저장
 */

import fs from 'fs';
import path from 'path';
import { BatchChunker, DocumentChunker } from './rag/chunker.js';
import {
  loadParsedDocument,
  scanParsedFiles,
  saveChunks,
  generateOutputPath,
  measureExecutionTime,
  chunkArray
} from './rag/utils.js';
import { validateConfig } from './config/rag-config.js';
import { PATHS } from './config/paths.js';
import {
  ParsedDocument,
  ChunkingOptions,
  ChunkingResult,
  ChunkData,
  FileProcessingStatus,
  ChunkingStats
} from './rag/types.js';

/**
 * 청킹 처리 메인 클래스
 */
class ChunkProcessor {
  private batchChunker: BatchChunker;
  private documentChunker: DocumentChunker;

  constructor() {
    this.batchChunker = new BatchChunker();
    this.documentChunker = new DocumentChunker();
  }

  /**
   * 메인 처리 함수
   */
  public async processChunks(options: ChunkingOptions = {}): Promise<ChunkingResult> {
    try {
      console.log('='.repeat(60));
      console.log('MCNC RAG Assistant - 청킹 처리 시작');
      console.log('='.repeat(60));

      // 설정 검증
      const configValidation = validateConfig();
      if (!configValidation.isValid) {
        return {
          success: false,
          error: `Configuration validation failed: ${configValidation.errors.join(', ')}`
        };
      }

      // 입력 파일 스캔
      const inputDir = PATHS.PROCESSED.PARSED.path;
      const outputDir = options.output_dir || PATHS.PROCESSED.CHUNKS.path;

      console.log(`Input directory: ${inputDir}`);
      console.log(`Output directory: ${outputDir}`);

      const parsedFiles = await scanParsedFiles(inputDir);

      if (parsedFiles.length === 0) {
        console.log(`No parsed documents found in ${inputDir}`);
        console.log('Available directories:');
        try {
          const dirs = await fs.promises.readdir(inputDir, { withFileTypes: true });
          dirs.forEach(dir => {
            if (dir.isDirectory()) {
              console.log(`  - ${dir.name}/`);
            }
          });
        } catch (error) {
          console.log(`Could not read directory ${inputDir}:`, error);
        }

        return {
          success: false,
          error: `No parsed documents found in ${inputDir}. Run document parsing first.`
        };
      }

      console.log(`Found ${parsedFiles.length} parsed documents to process`);
      console.log(`Output directory: ${outputDir}`);

      // 출력 디렉터리 생성
      await fs.promises.mkdir(outputDir, { recursive: true });

      // 문서 로드
      const { result: documents, duration: loadDuration } = await measureExecutionTime(
        () => this.loadDocuments(parsedFiles),
        'document loading'
      );

      if (documents.length === 0) {
        return {
          success: false,
          error: 'No valid documents loaded'
        };
      }

      // 청킹 처리
      let processingResult;
      if (options.parallel_processing && documents.length > 1) {
        processingResult = await measureExecutionTime(
          () => this.processInParallel(documents, outputDir, options),
          'parallel chunking'
        );
      } else {
        processingResult = await measureExecutionTime(
          () => this.processSequentially(documents, outputDir, options),
          'sequential chunking'
        );
      }

      const { allChunks, stats, fileStatuses } = processingResult.result;

      // 통계 출력
      this.printStatistics(stats, loadDuration + processingResult.duration);

      // 품질 검사 (옵션)
      if (options.quality_check) {
        console.log('\nPerforming quality assessment...');
        const qualityResults = this.documentChunker.assessChunksQuality(allChunks);
        const validChunks = qualityResults.filter(r => r.is_valid).length;
        console.log(`Quality check: ${validChunks}/${allChunks.length} chunks passed validation`);
      }

      return {
        success: true,
        chunks: allChunks,
        stats,
        file_statuses: fileStatuses
      };

    } catch (error) {
      console.error('Chunking process failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 문서 로드
   */
  private async loadDocuments(filePaths: string[]): Promise<ParsedDocument[]> {
    console.log(`Loading ${filePaths.length} documents...`);
    const documents: ParsedDocument[] = [];
    let loadedCount = 0;
    let failedCount = 0;

    for (const filePath of filePaths) {
      try {
        const document = await loadParsedDocument(filePath);
        documents.push(document);
        loadedCount++;

        if (loadedCount % 10 === 0) {
          console.log(`Loaded ${loadedCount}/${filePaths.length} documents...`);
        }
      } catch (error) {
        console.error(`Failed to load ${filePath}:`, error);
        failedCount++;
      }
    }

    console.log(`Document loading complete: ${loadedCount} loaded, ${failedCount} failed`);
    return documents;
  }

  /**
   * 순차 처리
   */
  private async processSequentially(
    documents: ParsedDocument[],
    outputDir: string,
    options: ChunkingOptions
  ) {
    const result = await this.batchChunker.processDocuments(documents);

    // 전체 청크를 하나의 파일로 저장
    const outputPath = path.join(outputDir, 'all-chunks.json');
    await saveChunks(result.allChunks, outputPath);

    return result;
  }

  /**
   * 병렬 처리
   */
  private async processInParallel(
    documents: ParsedDocument[],
    outputDir: string,
    options: ChunkingOptions
  ) {
    const maxParallel = options.max_parallel || 3;
    const documentBatches = chunkArray(documents, maxParallel);

    console.log(`Processing ${documents.length} documents in ${documentBatches.length} batches (max ${maxParallel} parallel)`);

    let allChunks: ChunkData[] = [];
    let allFileStatuses: FileProcessingStatus[] = [];

    // 통계 초기화 - 필요한 필드 추가
    let combinedStats: ChunkingStats = {
      total_files: 0,
      total_chunks: 0,
      total_tokens: 0,
      avg_chunk_size: 0,
      min_chunk_size: Number.MAX_VALUE,
      max_chunk_size: 0,
      avg_tokens_per_chunk: 0,
      strategies_used: {},
      processing_time_ms: 0
    };

    for (let i = 0; i < documentBatches.length; i++) {
      const batch = documentBatches[i];
      console.log(`Processing batch ${i + 1}/${documentBatches.length} (${batch.length} documents)...`);

      // processInParallel 메서드 내부 수정
      const batchPromises = batch.map(async (document, docIndex) => {
        const result = await this.documentChunker.chunkDocument(document);

        // 파일명 생성 (폴더 구조 없이)
        const fileName = `${path.parse(document.file_name).name}.chunks.json`;
        const outputPath = path.join(outputDir, fileName);

        console.log(`Saving chunks for ${document.file_name} to: ${outputPath}`);
        await saveChunks(result.chunks, outputPath);

        return {
          chunks: result.chunks,
          stats: result.stats,
          filePath: document.file_path,
          fileName: document.file_name
        };
      });

      const batchResults = await Promise.allSettled(batchPromises);

      // 배치 결과 처리
      batchResults.forEach((result, docIndex) => {
        const document = batch[docIndex];

        if (result.status === 'fulfilled') {
          const { chunks, stats } = result.value;
          allChunks.push(...chunks);

          // 청크별 통계 수집
          chunks.forEach(chunk => {
            combinedStats.min_chunk_size = Math.min(combinedStats.min_chunk_size, chunk.char_count);
            combinedStats.max_chunk_size = Math.max(combinedStats.max_chunk_size, chunk.char_count);
          });

          allFileStatuses.push({
            file_path: document.file_path,
            status: 'completed',
            chunks_created: chunks.length,
            strategy_used: stats.strategy_used
          });

          // 통계 집계
          combinedStats.total_files++;
          combinedStats.total_chunks += stats.chunk_count;
          combinedStats.total_tokens += stats.total_tokens;

          const strategy = stats.strategy_used;
          if (!combinedStats.strategies_used[strategy]) {
            combinedStats.strategies_used[strategy] = {
              file_count: 0,
              chunk_count: 0,
              avg_size: 0,
              total_tokens: 0  // 추가
            };
          }
          combinedStats.strategies_used[strategy].file_count++;
          combinedStats.strategies_used[strategy].chunk_count += stats.chunk_count;
          combinedStats.strategies_used[strategy].total_tokens += stats.total_tokens;  // 추가

        } else {
          console.error(`Failed to process ${document.file_name}:`, result.reason);
          allFileStatuses.push({
            file_path: document.file_path,
            status: 'failed',
            chunks_created: 0,
            error_message: result.reason?.message || String(result.reason)
          });
        }
      });
    }

    // 최종 평균 계산
    if (allChunks.length > 0) {
      const totalChars = allChunks.reduce((sum, chunk) => sum + chunk.char_count, 0);
      combinedStats.avg_chunk_size = Math.round(totalChars / allChunks.length);
      combinedStats.avg_tokens_per_chunk = Math.round(combinedStats.total_tokens / allChunks.length);

      // min_chunk_size가 초기값인 경우 0으로 설정
      if (combinedStats.min_chunk_size === Number.MAX_VALUE) {
        combinedStats.min_chunk_size = 0;
      }
    }

    // 전략별 평균 크기 계산
    Object.values(combinedStats.strategies_used).forEach((strategyStats: any) => {
      if (strategyStats.chunk_count > 0) {
        strategyStats.avg_size = Math.round(strategyStats.total_tokens / strategyStats.chunk_count);
      }
    });

    return {
      allChunks,
      stats: combinedStats,
      fileStatuses: allFileStatuses
    };
  }

  /**
   * 통계 출력
   */
  private printStatistics(stats: any, totalDuration: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('청킹 처리 완료 - 통계 요약');
    console.log('='.repeat(60));

    console.log(`총 처리 시간: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}초)`);
    console.log(`처리된 파일: ${stats.total_files}개`);
    console.log(`생성된 청크: ${stats.total_chunks}개`);
    console.log(`총 토큰 수: ${stats.total_tokens.toLocaleString()}개`);

    if (stats.total_chunks > 0) {
      console.log(`평균 청크 크기: ${stats.avg_chunk_size}자`);
      console.log(`평균 토큰/청크: ${stats.avg_tokens_per_chunk}개`);
      console.log(`최소/최대 청크: ${stats.min_chunk_size} - ${stats.max_chunk_size}자`);
    }

    console.log('\n전략별 통계:');
    Object.entries(stats.strategies_used).forEach(([strategy, strategyStats]: [string, any]) => {
      console.log(`  ${strategy}:`);
      console.log(`    파일: ${strategyStats.file_count}개`);
      console.log(`    청크: ${strategyStats.chunk_count}개`);
      console.log(`    평균 크기: ${strategyStats.avg_size}토큰`);
    });

    console.log('='.repeat(60));
  }
}

/**
 * CLI 인터페이스
 */
async function main() {
  console.log('MCNC RAG Assistant - 청킹 처리 시작...');
  console.log('Process arguments:', process.argv.slice(2));

  const args = process.argv.slice(2);
  const options: ChunkingOptions = {
    force_reprocess: args.includes('--force'),
    parallel_processing: args.includes('--parallel'),
    quality_check: args.includes('--quality-check'),
    max_parallel: 3
  };

  // 사용법 출력
  if (args.includes('--help') || args.includes('-h')) {
    console.log('MCNC RAG Assistant - 청킹 처리');
    console.log('');
    console.log('사용법:');
    console.log('  tsx scripts/chunk-processor.ts [옵션]');
    console.log('');
    console.log('옵션:');
    console.log('  --force         기존 청크 파일이 있어도 강제 재처리');
    console.log('  --parallel      병렬 처리 활성화 (기본: 순차 처리)');
    console.log('  --quality-check 청크 품질 검사 수행');
    console.log('  --help, -h      이 도움말 표시');
    console.log('');
    console.log('예시:');
    console.log('  tsx scripts/chunk-processor.ts --parallel --quality-check');
    return;
  }

  const processor = new ChunkProcessor();
  const result = await processor.processChunks(options);

  if (result.success) {
    console.log('\n청킹 처리가 성공적으로 완료되었습니다!');
    console.log(`다음 단계: tsx scripts/embedding-processor.ts`);
    process.exit(0);
  } else {
    console.error('\n청킹 처리 실패:', result.error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시 main 함수 호출
// 항상 실행 (ES module에서 안전한 방법)
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});