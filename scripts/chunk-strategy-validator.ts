// chunk-strategy-validator.ts
import fs from 'fs';
import path from 'path';
import { getChunkingStrategy } from './config/rag-config.js';
import { PATHS } from './config/paths.js';

interface ChunkFile {
  id: string;
  content: string;
  metadata: {
    source_file: string;
    chunk_strategy: string;
    chunk_size: number;
    overlap: number;
  };
  tokens: number;
}

async function validateChunkStrategies() {
  console.log('🔍 청크 전략 적용 검증 시작...\n');

  const chunksDir = PATHS.PROCESSED.CHUNKS.path;
  const chunkFiles = fs.readdirSync(chunksDir).filter(f => f.endsWith('.chunks.json'));

  console.log(`발견된 청크 파일: ${chunkFiles.length}개\n`);

  for (const chunkFile of chunkFiles) {
    const filePath = path.join(chunksDir, chunkFile);
    const chunks: ChunkFile[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (chunks.length === 0) continue;

    const firstChunk = chunks[0];
    const sourceFile = firstChunk.metadata.source_file;
    const appliedStrategy = firstChunk.metadata.chunk_strategy;
    const appliedChunkSize = firstChunk.metadata.chunk_size;
    const appliedOverlap = firstChunk.metadata.overlap;

    // 예상 전략 계산
    const expectedStrategy = getChunkingStrategy(sourceFile);

    console.log(`📄 ${chunkFile}`);
    console.log(`   원본: ${sourceFile}`);
    console.log(`   적용된 전략: ${appliedStrategy}`);
    console.log(`   설정값: 청크크기=${appliedChunkSize}, 오버랩=${appliedOverlap}`);
    console.log(`   예상값: 청크크기=${expectedStrategy.chunkSize}, 오버랩=${expectedStrategy.overlap}`);

    // 검증
    const isCorrect = appliedChunkSize === expectedStrategy.chunkSize &&
                     appliedOverlap === expectedStrategy.overlap;

    console.log(`   ✅ 전략 적용: ${isCorrect ? '정확' : '❌ 불일치'}`);

    // 실제 청크 크기 통계
    const tokenCounts = chunks.map(c => c.tokens);
    const avgTokens = Math.round(tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length);
    const minTokens = Math.min(...tokenCounts);
    const maxTokens = Math.max(...tokenCounts);

    console.log(`   실제 토큰: 평균=${avgTokens}, 범위=${minTokens}-${maxTokens}`);
    console.log(`   청크 개수: ${chunks.length}개\n`);
  }
}

validateChunkStrategies().catch(console.error);