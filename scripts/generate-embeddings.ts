/**
 * MCNC RAG Assistant - 임베딩 생성 스크립트
 * 청크 파일을 읽어 OpenAI text-embedding-3-small 모델로 임베딩 생성
 */

import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { PATHS, getPath } from './config/paths';
import { RAG_CONFIG } from './config/rag-config';
import { ChunkData, EmbeddingData, ProcessingStats } from './types/embedding.types';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });
dotenv.config(); // .env 파일도 로드 (fallback)

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 설정값
const BATCH_SIZE = RAG_CONFIG.EMBEDDING.BATCH_SIZE;
const MODEL = RAG_CONFIG.EMBEDDING.MODEL;
const MAX_RETRIES = RAG_CONFIG.EMBEDDING.MAX_RETRIES;
const PRICE_PER_1M_TOKENS = 0.02; // text-embedding-3-small 가격
const KRW_EXCHANGE_RATE = 1300; // USD to KRW 환율

/**
 * 청크 파일 로드
 */
function loadChunks(filePath: string): ChunkData[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`[오류] 청크 파일 로드 실패: ${filePath}`, error);
    return [];
  }
}

/**
 * 임베딩 생성 (배치 처리)
 */
async function generateEmbeddings(texts: string[]): Promise<{ embeddings: number[][], tokens: number }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: MODEL,
        input: texts,
      });

      return {
        embeddings: response.data.map(item => item.embedding),
        tokens: response.usage.total_tokens
      };
    } catch (error: any) {
      console.error(`[오류] 임베딩 생성 실패 (시도 ${attempt}/${MAX_RETRIES}):`, error.message);

      if (attempt < MAX_RETRIES) {
        // Rate limit 에러인 경우 대기
        if (error.status === 429) {
          const waitTime = Math.pow(2, attempt) * 1000; // 지수 백오프
          console.log(`[대기] Rate limit 도달. ${waitTime / 1000}초 대기...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } else {
        throw error;
      }
    }
  }

  throw new Error('[오류] 임베딩 생성 최대 재시도 횟수 초과');
}

/**
 * 임베딩 결과 저장
 */
function saveEmbeddings(embeddings: EmbeddingData[], outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(embeddings, null, 2));
}

/**
 * 단일 파일 처리
 */
async function processFile(chunkFilePath: string, stats: ProcessingStats): Promise<void> {
  const fileName = path.basename(chunkFilePath);
  const baseName = fileName.replace('.chunks.json', '');
  const outputPath = path.join(
    getPath(PATHS.PROCESSED.EMBEDDINGS),
    `${baseName}.embeddings.json`
  );

  // 이미 처리된 파일인지 확인
  if (fs.existsSync(outputPath)) {
    console.log(`[건너뛰기] ${fileName}: 이미 처리됨`);
    return;
  }

  console.log(`\n[처리 중] ${fileName}`);

  // 청크 로드
  const chunks = loadChunks(chunkFilePath);
  if (chunks.length === 0) {
    console.error(`[오류] ${fileName}: 청크가 없습니다`);
    return;
  }

  stats.totalChunks += chunks.length;
  const embeddings: EmbeddingData[] = [];
  const startTime = Date.now();
  let fileTokens = 0; // 파일별 토큰 추적

  // 배치 처리
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchTexts = batch.map(chunk => chunk.content);

    process.stdout.write(`   배치 처리: ${i + 1}-${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}...`);

    try {
      const result = await generateEmbeddings(batchTexts);

      // 결과 저장
      batch.forEach((chunk, idx) => {
        embeddings.push({
          chunk_id: chunk.id,
          embedding: result.embeddings[idx],
          model: MODEL,
          created_at: new Date().toISOString()
        });
      });

      stats.processedChunks += batch.length;
      stats.totalTokens += result.tokens;
      fileTokens += result.tokens;
      process.stdout.write(' 완료\n');
    } catch (error) {
      stats.failedChunks += batch.length;
      process.stdout.write(' 실패\n');
      console.error(`   [오류] 배치 처리 실패:`, error);
    }
  }

  // 결과 저장
  if (embeddings.length > 0) {
    saveEmbeddings(embeddings, outputPath);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const fileCost = (fileTokens / 1_000_000) * PRICE_PER_1M_TOKENS;
    console.log(`[완료] ${fileName}: ${embeddings.length}/${chunks.length} 청크 완료 (${duration}초)`);
    console.log(`       토큰: ${fileTokens.toLocaleString()} | 비용: ${fileCost.toFixed(4)}`);
    stats.processedFiles++;
  } else {
    console.error(`[오류] ${fileName}: 임베딩 생성 실패`);
  }
}

/**
 * 메인 함수
 */
async function main() {
  console.log('[시작] MCNC RAG Assistant - 임베딩 생성\n');

  // API 키 확인
  if (!process.env.OPENAI_API_KEY) {
    console.error('[오류] OPENAI_API_KEY가 설정되지 않았습니다.');
    console.error('      .env 파일에 OPENAI_API_KEY를 추가해주세요.');
    process.exit(1);
  }

  // 청크 디렉토리 확인
  const chunksDir = getPath(PATHS.PROCESSED.CHUNKS);
  if (!fs.existsSync(chunksDir)) {
    console.error(`[오류] 청크 디렉토리가 없습니다: ${chunksDir}`);
    process.exit(1);
  }

  // 청크 파일 목록 가져오기
  const chunkFiles = fs.readdirSync(chunksDir)
    .filter(file => file.endsWith('.chunks.json'))
    .map(file => path.join(chunksDir, file));

  if (chunkFiles.length === 0) {
    console.log('[경고] 처리할 청크 파일이 없습니다.');
    return;
  }

  console.log(`[정보] 발견된 청크 파일: ${chunkFiles.length}개\n`);

  // 통계 초기화
  const stats: ProcessingStats = {
    totalFiles: chunkFiles.length,
    processedFiles: 0,
    totalChunks: 0,
    processedChunks: 0,
    failedChunks: 0,
    totalTokens: 0,
    totalCost: 0,
    startTime: Date.now()
  };

  // 파일 처리
  for (const chunkFile of chunkFiles) {
    await processFile(chunkFile, stats);
  }

  // 결과 출력
  stats.endTime = Date.now();
  const totalDuration = ((stats.endTime - stats.startTime) / 1000).toFixed(1);

  // 비용 계산
  stats.totalCost = (stats.totalTokens / 1_000_000) * PRICE_PER_1M_TOKENS;

  console.log('\n' + '='.repeat(50));
  console.log('[완료] 임베딩 생성 완료');
  console.log('='.repeat(50));
  console.log(`총 파일: ${stats.processedFiles}/${stats.totalFiles}`);
  console.log(`총 청크: ${stats.processedChunks}/${stats.totalChunks}`);
  if (stats.failedChunks > 0) {
    console.log(`실패한 청크: ${stats.failedChunks}`);
  }
  console.log(`소요 시간: ${totalDuration}초`);
  console.log('-'.repeat(50));
  console.log(`[비용 정보]`);
  console.log(`사용된 토큰: ${stats.totalTokens.toLocaleString()} 토큰`);
  console.log(`예상 비용: ${stats.totalCost.toFixed(4)} USD`);
  console.log(`원화 환산: ₩${(stats.totalCost * KRW_EXCHANGE_RATE).toFixed(0)} (환율: ${KRW_EXCHANGE_RATE}원/USD)`);
  console.log('='.repeat(50));
}

// 실행
if (require.main === module) {
  main().catch(error => {
    console.error('\n[오류] 치명적 오류:', error);
    process.exit(1);
  });
}