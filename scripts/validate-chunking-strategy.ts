// scripts/validate-chunking-strategy.ts

import fs from 'fs';
import path from 'path';
import { getChunkingStrategy, RAG_CONFIG, isOptimalChunkSize } from './config/rag-config.js';
import { PATHS } from './config/paths.js';
import { EnhancedChunkData } from './types/chunk.types.js';

interface ValidationResult {
  fileName: string;
  sourceFile: string;
  appliedStrategy: string;
  expectedStrategy: string;
  isStrategyCorrect: boolean;

  chunkStats: {
    totalChunks: number;
    avgTokens: number;
    minTokens: number;
    maxTokens: number;
    avgChars: number;
    tokensInOptimalRange: number;
    optimalRangePercentage: number;
  };

  configComparison: {
    expectedChunkSize: number;
    actualAvgTokens: number;
    sizeDeviation: number;
    expectedOverlap: number;
    overlapVerified: boolean;
  };

  structuredData: {
    totalTables: number;
    totalImages: number;
    chunksWithTables: number;
    chunksWithImages: number;
    avgTablesPerChunk: number;
    avgImagesPerChunk: number;
  };

  issues: string[];
  warnings: string[];
}

interface OverlapCheck {
  chunk1Index: number;
  chunk2Index: number;
  overlapLength: number;
}

class ChunkingValidator {
  private results: ValidationResult[] = [];

  /**
   * 메인 검증 함수
   */
  async validateAllChunks(): Promise<void> {
    console.log('\n[청킹 전략 검증 시작]\n');
    console.log('='.repeat(80));

    const chunksDir = PATHS.PROCESSED.CHUNKS.path;

    if (!fs.existsSync(chunksDir)) {
      console.error(`[오류] 청크 디렉터리가 없습니다: ${chunksDir}`);
      return;
    }

    const chunkFiles = fs.readdirSync(chunksDir)
      .filter(f => f.endsWith('.chunks.json'))
      .sort();

    console.log(`발견된 청크 파일: ${chunkFiles.length}개\n`);

    for (const chunkFile of chunkFiles) {
      await this.validateChunkFile(path.join(chunksDir, chunkFile));
    }

    this.printSummaryReport();
  }

  /**
   * 개별 청크 파일 검증
   */
  private async validateChunkFile(filePath: string): Promise<void> {
    try {
      const chunks: EnhancedChunkData[] = JSON.parse(
        await fs.promises.readFile(filePath, 'utf-8')
      );

      if (chunks.length === 0) {
        console.log(`[경고] 빈 청크 파일: ${path.basename(filePath)}`);
        return;
      }

      const fileName = path.basename(filePath);
      const firstChunk = chunks[0];
      const sourceFile = firstChunk.metadata.source_file;

      // 예상 전략 계산
      const expectedStrategy = getChunkingStrategy(sourceFile);
      const expectedStrategyName = this.getStrategyName(sourceFile);

      // 적용된 전략 정보
      const appliedStrategy = firstChunk.metadata.chunk_strategy;
      const appliedChunkSize = firstChunk.metadata.chunk_size;
      const appliedOverlap = firstChunk.metadata.overlap;

      // 청크 통계 계산
      const chunkStats = this.calculateChunkStats(chunks);

      // 구조화 데이터 통계 계산
      const structuredDataStats = this.calculateStructuredDataStats(chunks);

      // 오버랩 검증
      const overlapChecks = this.checkOverlaps(chunks);

      // 설정 비교
      const sizeDeviation = Math.abs(
        ((chunkStats.avgTokens - expectedStrategy.chunkSize) / expectedStrategy.chunkSize) * 100
      );

      // 이슈 및 경고 수집
      const issues: string[] = [];
      const warnings: string[] = [];

      // 전략 일치 여부
      const isStrategyCorrect =
        appliedChunkSize === expectedStrategy.chunkSize &&
        appliedOverlap === expectedStrategy.overlap;

      if (!isStrategyCorrect) {
        issues.push(
          `전략 불일치: 예상(${expectedStrategy.chunkSize}/${expectedStrategy.overlap}) != 실제(${appliedChunkSize}/${appliedOverlap})`
        );
      }

      // 크기 편차 검사
      if (sizeDeviation > 30) {
        issues.push(`평균 토큰 크기 편차가 큽니다: ${sizeDeviation.toFixed(1)}%`);
      } else if (sizeDeviation > 20) {
        warnings.push(`평균 토큰 크기 편차: ${sizeDeviation.toFixed(1)}%`);
      }

      // 최적 범위 검사
      if (chunkStats.optimalRangePercentage < 70) {
        warnings.push(
          `최적 범위(200-600토큰) 내 청크 비율이 낮습니다: ${chunkStats.optimalRangePercentage.toFixed(1)}%`
        );
      }

      // 오버랩 검사
      const hasOverlap = overlapChecks.length > 0;
      if (expectedStrategy.overlap > 0 && !hasOverlap) {
        issues.push('오버랩이 적용되지 않았습니다');
      }

      // 전처리 검증
      if (expectedStrategy.preprocessor === 'weakenPage') {
        const hasPageMarkers = chunks.some(chunk =>
          chunk.content.includes('--- 페이지')
        );
        if (!hasPageMarkers && sourceFile.includes('.pdf')) {
          warnings.push('페이지 마커가 없습니다 (전처리 확인 필요)');
        }
      }

      // 결과 저장
      const result: ValidationResult = {
        fileName,
        sourceFile,
        appliedStrategy,
        expectedStrategy: expectedStrategyName,
        isStrategyCorrect,
        chunkStats,
        configComparison: {
          expectedChunkSize: expectedStrategy.chunkSize,
          actualAvgTokens: chunkStats.avgTokens,
          sizeDeviation,
          expectedOverlap: expectedStrategy.overlap,
          overlapVerified: hasOverlap
        },
        structuredData: structuredDataStats,
        issues,
        warnings
      };

      this.results.push(result);
      this.printFileValidation(result);

    } catch (error) {
      console.error(`[오류] 파일 검증 실패: ${filePath}`, error);
    }
  }

  /**
   * 청크 통계 계산
   */
  private calculateChunkStats(chunks: EnhancedChunkData[]): ValidationResult['chunkStats'] {
    const tokenCounts = chunks.map(c => c.tokens);
    const charCounts = chunks.map(c => c.char_count);

    const optimalRange = RAG_CONFIG.CHUNKING.QUALITY.OPTIMAL_SIZE_RANGE;
    const tokensInOptimalRange = tokenCounts.filter(
      t => t >= optimalRange.min && t <= optimalRange.max
    ).length;

    return {
      totalChunks: chunks.length,
      avgTokens: Math.round(tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length),
      minTokens: Math.min(...tokenCounts),
      maxTokens: Math.max(...tokenCounts),
      avgChars: Math.round(charCounts.reduce((a, b) => a + b, 0) / charCounts.length),
      tokensInOptimalRange,
      optimalRangePercentage: (tokensInOptimalRange / chunks.length) * 100
    };
  }

  /**
   * 구조화 데이터 통계 계산
   */
  private calculateStructuredDataStats(chunks: EnhancedChunkData[]): ValidationResult['structuredData'] {
    let totalTables = 0;
    let totalImages = 0;
    let chunksWithTables = 0;
    let chunksWithImages = 0;

    chunks.forEach(chunk => {
      const tables = chunk.enrichments?.tables || [];
      const images = chunk.enrichments?.images || [];

      if (tables.length > 0) {
        totalTables += tables.length;
        chunksWithTables++;
      }

      if (images.length > 0) {
        totalImages += images.length;
        chunksWithImages++;
      }
    });

    return {
      totalTables,
      totalImages,
      chunksWithTables,
      chunksWithImages,
      avgTablesPerChunk: chunksWithTables > 0 ? totalTables / chunksWithTables : 0,
      avgImagesPerChunk: chunksWithImages > 0 ? totalImages / chunksWithImages : 0
    };
  }

  /**
   * 오버랩 검사
   */
  private checkOverlaps(chunks: EnhancedChunkData[]): OverlapCheck[] {
    const overlaps: OverlapCheck[] = [];

    for (let i = 0; i < chunks.length - 1; i++) {
      const chunk1 = chunks[i].content;
      const chunk2 = chunks[i + 1].content;

      // 청크1의 끝부분과 청크2의 시작부분 비교
      const maxOverlapLength = Math.min(chunk1.length, chunk2.length, 500);

      for (let len = maxOverlapLength; len >= 20; len--) {
        const chunk1End = chunk1.substring(chunk1.length - len);

        if (chunk2.startsWith(chunk1End)) {
          overlaps.push({
            chunk1Index: i,
            chunk2Index: i + 1,
            overlapLength: len
          });
          break;
        }
      }
    }

    return overlaps;
  }

  /**
   * 전략 이름 추출
   */
  private getStrategyName(filePath: string): string {
    const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();

    for (const strategyName of Object.keys(RAG_CONFIG.CHUNKING.STRATEGIES)) {
      if (normalizedPath.includes(strategyName.toLowerCase())) {
        return strategyName;
      }
    }

    return 'default';
  }

  /**
   * 개별 파일 검증 결과 출력
   */
  private printFileValidation(result: ValidationResult): void {
    const status = result.isStrategyCorrect ? '[정상]' : '[실패]';
    const hasIssues = result.issues.length > 0;

    console.log(`\n${status} ${result.fileName}`);
    console.log(`  원본: ${result.sourceFile}`);
    console.log(`  전략: ${result.appliedStrategy} (예상: ${result.expectedStrategy})`);
    console.log(`  청크: ${result.chunkStats.totalChunks}개`);
    console.log(`  토큰: 평균 ${result.chunkStats.avgTokens} (${result.chunkStats.minTokens}-${result.chunkStats.maxTokens})`);
    console.log(`  최적 범위: ${result.chunkStats.optimalRangePercentage.toFixed(1)}% (${result.chunkStats.tokensInOptimalRange}/${result.chunkStats.totalChunks})`);

    if (result.configComparison.overlapVerified) {
      console.log(`  오버랩: [적용됨]`);
    } else if (result.configComparison.expectedOverlap > 0) {
      console.log(`  오버랩: [미적용]`);
    }

    // 메타데이터 보강 검증
    const { totalTables, totalImages } = result.structuredData;
    if (totalTables > 0 || totalImages > 0) {
      console.log(`  메타데이터: ${totalTables}개 테이블, ${totalImages}개 이미지`);

      if (totalTables > 0) {
        console.log(`    - 테이블 포함 청크: ${result.structuredData.chunksWithTables}개`);
        console.log(`    - 청크당 평균 테이블: ${result.structuredData.avgTablesPerChunk.toFixed(1)}개`);
      }

      if (totalImages > 0) {
        console.log(`    - 이미지 포함 청크: ${result.structuredData.chunksWithImages}개`);
        console.log(`    - 청크당 평균 이미지: ${result.structuredData.avgImagesPerChunk.toFixed(1)}개`);
      }
    }

    if (hasIssues) {
      console.log(`  [이슈]`);
      result.issues.forEach(issue => console.log(`    - ${issue}`));
    }

    if (result.warnings.length > 0) {
      console.log(`  [경고]`);
      result.warnings.forEach(warning => console.log(`    - ${warning}`));
    }
  }

  /**
   * 전체 요약 보고서
   */
  private printSummaryReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('[검증 요약 보고서]');
    console.log('='.repeat(80));

    const totalFiles = this.results.length;
    const correctStrategies = this.results.filter(r => r.isStrategyCorrect).length;
    const filesWithIssues = this.results.filter(r => r.issues.length > 0).length;
    const filesWithWarnings = this.results.filter(r => r.warnings.length > 0).length;

    console.log('\n[전체 현황]');
    console.log(`총 검증 파일: ${totalFiles}개`);
    console.log(`전략 일치: ${correctStrategies}/${totalFiles} (${(correctStrategies / totalFiles * 100).toFixed(1)}%)`);
    console.log(`이슈 있음: ${filesWithIssues}개`);
    console.log(`경고 있음: ${filesWithWarnings}개`);

    // 전략별 통계
    console.log('\n[전략별 평균 토큰 크기]');
    const strategyGroups = this.groupByStrategy();

    Object.entries(strategyGroups).forEach(([strategy, results]) => {
      const avgTokens = results.reduce((sum, r) => sum + r.chunkStats.avgTokens, 0) / results.length;
      const expectedSize = (RAG_CONFIG.CHUNKING.STRATEGIES as any)[strategy]?.chunkSize ||
        RAG_CONFIG.CHUNKING.DEFAULT_STRATEGY.chunkSize;
      const deviation = ((avgTokens - expectedSize) / expectedSize * 100).toFixed(1);

      console.log(`\n  ${strategy}:`);
      console.log(`    예상: ${expectedSize} 토큰`);
      console.log(`    실제: ${Math.round(avgTokens)} 토큰 (${Number(deviation) > 0 ? '+' : ''}${deviation}%)`);
      console.log(`    파일: ${results.length}개`);
    });

    // text-embedding-3-small 최적화 검증
    console.log('\n[text-embedding-3-small 최적화]');
    const allChunks = this.results.reduce((sum, r) => sum + r.chunkStats.totalChunks, 0);
    const optimalChunks = this.results.reduce((sum, r) => sum + r.chunkStats.tokensInOptimalRange, 0);
    const optimalPercentage = (optimalChunks / allChunks * 100).toFixed(1);

    console.log(`최적 범위(200-600 토큰) 내 청크: ${optimalChunks}/${allChunks} (${optimalPercentage}%)`);

    if (parseFloat(optimalPercentage) < 80) {
      console.log(`[경고] 최적화 필요: 80% 이상 권장`);
    } else {
      console.log(`[양호] 잘 최적화됨`);
    }

    // 메타데이터 보강 통계
    console.log('\n[메타데이터 보강 현황]');
    const totalTables = this.results.reduce((sum, r) => sum + r.structuredData.totalTables, 0);
    const totalImages = this.results.reduce((sum, r) => sum + r.structuredData.totalImages, 0);
    const filesWithTables = this.results.filter(r => r.structuredData.totalTables > 0).length;
    const filesWithImages = this.results.filter(r => r.structuredData.totalImages > 0).length;

    console.log(`총 테이블: ${totalTables}개 (${filesWithTables}개 파일)`);
    console.log(`총 이미지: ${totalImages}개 (${filesWithImages}개 파일)`);

    if (totalTables > 0 || totalImages > 0) {
      console.log('\n[메타데이터 분포]');
      this.results
        .filter(r => r.structuredData.totalTables > 0 || r.structuredData.totalImages > 0)
        .forEach(r => {
          console.log(`  ${r.fileName}:`);
          if (r.structuredData.totalTables > 0) {
            console.log(`    - 테이블: ${r.structuredData.totalTables}개`);
          }
          if (r.structuredData.totalImages > 0) {
            console.log(`    - 이미지: ${r.structuredData.totalImages}개`);
          }
        });
    }

    // 주요 이슈 요약
    if (filesWithIssues > 0) {
      console.log('\n[주요 이슈]');
      const issueTypes = this.categorizeIssues();
      Object.entries(issueTypes).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}건`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('[검증 완료]');
    console.log('='.repeat(80));
  }

  /**
   * 전략별 그룹화
   */
  private groupByStrategy(): Record<string, ValidationResult[]> {
    const groups: Record<string, ValidationResult[]> = {};

    this.results.forEach(result => {
      const strategy = result.expectedStrategy;
      if (!groups[strategy]) {
        groups[strategy] = [];
      }
      groups[strategy].push(result);
    });

    return groups;
  }

  /**
   * 이슈 분류
   */
  private categorizeIssues(): Record<string, number> {
    const categories: Record<string, number> = {};

    this.results.forEach(result => {
      result.issues.forEach(issue => {
        if (issue.includes('전략 불일치')) {
          categories['전략 불일치'] = (categories['전략 불일치'] || 0) + 1;
        } else if (issue.includes('오버랩')) {
          categories['오버랩 미적용'] = (categories['오버랩 미적용'] || 0) + 1;
        } else if (issue.includes('편차')) {
          categories['크기 편차'] = (categories['크기 편차'] || 0) + 1;
        } else {
          categories['기타'] = (categories['기타'] || 0) + 1;
        }
      });
    });

    return categories;
  }
}

// 메인 실행
async function main() {
  const validator = new ChunkingValidator();
  await validator.validateAllChunks();
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

export { ChunkingValidator };