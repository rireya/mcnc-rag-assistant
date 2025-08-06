/**
 * MCNC RAG Assistant - ChromaDB 로드 스크립트
 * chunks와 embeddings를 ChromaDB에 저장
 * ChromaDB v1.x 최신 API 사용
 */

import fs from 'fs';
import path from 'path';
import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';
import { PATHS } from './config/paths.js';
import { DATABASE_CONFIG, withRetry } from './config/database-config.js';
import { ChunkData, EmbeddingData } from './types/embedding.types.js';

// 환경 변수 로드 (.env.local 우선)
dotenv.config({ path: '.env.local' });
dotenv.config();

// 설정 가져오기
const { COLLECTION_NAME, COLLECTION_METADATA, HNSW_CONFIG, BATCH } = DATABASE_CONFIG.CHROMADB;
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";

/**
 * 청크와 임베딩 매칭
 */
async function loadChunksAndEmbeddings(): Promise<{
  chunks: ChunkData[];
  embeddings: Map<string, number[]>;
}> {
  const chunksDir = PATHS.PROCESSED.CHUNKS.path;
  const embeddingsDir = PATHS.PROCESSED.EMBEDDINGS.path;

  // 모든 청크 파일 로드
  const chunkFiles = fs.readdirSync(chunksDir)
    .filter(f => f.endsWith('.chunks.json'))
    .sort();

  const allChunks: ChunkData[] = [];
  const embeddingsMap = new Map<string, number[]>();

  console.log(`[로드] ${chunkFiles.length}개 파일 처리 중...`);

  for (const chunkFile of chunkFiles) {
    const baseName = chunkFile.replace('.chunks.json', '');
    const embeddingFile = `${baseName}.embeddings.json`;

    // 청크 로드
    const chunksPath = path.join(chunksDir, chunkFile);
    const chunks: ChunkData[] = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
    allChunks.push(...chunks);

    // 임베딩 로드
    const embeddingsPath = path.join(embeddingsDir, embeddingFile);
    if (fs.existsSync(embeddingsPath)) {
      const embeddings: EmbeddingData[] = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8'));

      // Map에 저장 (chunk_id -> embedding)
      embeddings.forEach(emb => {
        embeddingsMap.set(emb.chunk_id, emb.embedding);
      });
    } else {
      console.warn(`[경고] 임베딩 파일 없음: ${embeddingFile}`);
    }
  }

  console.log(`[로드 완료] 청크: ${allChunks.length}개, 임베딩: ${embeddingsMap.size}개`);
  return { chunks: allChunks, embeddings: embeddingsMap };
}

/**
 * ChromaDB에 데이터 저장
 */
async function saveToChroma(
  chunks: ChunkData[],
  embeddings: Map<string, number[]>
): Promise<void> {
  // URL 파싱
  const url = new URL(CHROMA_URL);

  // ChromaClient 초기화 (host, port 사용)
  const client = new ChromaClient({
    host: url.hostname,
    port: parseInt(url.port || '8000'),
    ssl: url.protocol === 'https:'
  });

  // 기존 컬렉션 삭제 (있으면)
  try {
    await client.deleteCollection({ name: COLLECTION_NAME });
    console.log(`[삭제] 기존 컬렉션 삭제됨: ${COLLECTION_NAME}`);
  } catch (error: any) {
    // 컬렉션이 없으면 무시
    if (!error.message?.includes('does not exist')) {
      console.error('[오류] 컬렉션 삭제 실패:', error.message);
    }
  }

  // 새 컬렉션 생성 - 임베딩은 직접 제공하므로 함수 불필요
  const collection = await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: {
      ...COLLECTION_METADATA,
      ...HNSW_CONFIG
    }
  });

  console.log(`[생성] 컬렉션 생성됨: ${COLLECTION_NAME}`);
  console.log(`[설정] HNSW 설정 적용됨:`, HNSW_CONFIG);

  // 배치 처리
  let processedCount = 0;
  const totalChunks = chunks.length;

  for (let i = 0; i < chunks.length; i += BATCH.INSERT_SIZE) {
    const batch = chunks.slice(i, i + BATCH.INSERT_SIZE);

    // 임베딩이 있는 청크만 필터링
    const validBatch = batch.filter(chunk => embeddings.has(chunk.id));

    if (validBatch.length === 0) {
      console.warn(`[경고] 배치 ${i}-${i + batch.length}: 유효한 임베딩 없음`);
      continue;
    }

    // ChromaDB 형식으로 변환
    const ids = validBatch.map(chunk => chunk.id);
    const documents = validBatch.map(chunk => chunk.content);
    const embeddingsList = validBatch.map(chunk => embeddings.get(chunk.id)!);

    // 메타데이터 준비 (필요한 정보만 간단하게)
    const metadatas = validBatch.map(chunk => ({
      // 기본 정보
      source_file: chunk.metadata.source_file,
      file_name: chunk.metadata.file_name,
      file_type: chunk.metadata.file_type,
      chunk_index: chunk.metadata.chunk_index,
      total_chunks: chunk.metadata.total_chunks,

      // 청킹 정보
      chunk_strategy: chunk.metadata.chunk_strategy,

      // 위치 정보
      pages: JSON.stringify(chunk.metadata.position.pages || []),

      // 원본 메타데이터
      title: chunk.metadata.original_metadata?.title || '',
      author: chunk.metadata.original_metadata?.author || '',

      // 보강 정보
      has_tables: (chunk.enrichments?.tables?.length || 0) > 0,
      has_images: (chunk.enrichments?.images?.length || 0) > 0,
      table_count: chunk.enrichments?.tables?.length || 0,
      image_count: chunk.enrichments?.images?.length || 0,

      // 통계
      tokens: chunk.tokens,
      char_count: chunk.char_count
    }));

    // ChromaDB에 추가 (재시도 로직 포함)
    await withRetry(async () => {
      await collection.add({
        ids,
        documents,
        embeddings: embeddingsList,
        metadatas
      });
    }, `배치 ${i}-${i + validBatch.length} 저장`);

    processedCount += validBatch.length;
    console.log(`[진행] ${processedCount}/${totalChunks} (${(processedCount / totalChunks * 100).toFixed(1)}%)`);
  }

  console.log(`[완료] ${processedCount}개 청크 저장됨`);
}

/**
 * 메인 함수
 */
async function main() {
  console.log('='.repeat(60));
  console.log('MCNC RAG Assistant - ChromaDB 로드');
  console.log('='.repeat(60));
  console.log(`ChromaDB URL: ${CHROMA_URL}`);
  console.log(`Collection: ${COLLECTION_NAME}`);

  try {
    // URL 파싱
    const url = new URL(CHROMA_URL);

    // ChromaDB 연결 테스트
    const client = new ChromaClient({
      host: url.hostname,
      port: parseInt(url.port || '8000'),
      ssl: url.protocol === 'https:'
    });
    const heartbeat = await client.heartbeat();
    console.log('[연결] ChromaDB 서버 상태:', heartbeat);

    // 1. 데이터 로드
    const { chunks, embeddings } = await loadChunksAndEmbeddings();

    // 2. 임베딩 매칭 검증
    const matchedChunks = chunks.filter(chunk => embeddings.has(chunk.id));
    console.log(`\n[매칭] ${matchedChunks.length}/${chunks.length} 청크에 임베딩 존재`);

    if (matchedChunks.length === 0) {
      console.error('[오류] 매칭된 청크가 없습니다. 임베딩을 먼저 생성하세요.');
      process.exit(1);
    }

    // 3. ChromaDB에 저장
    console.log('\n[ChromaDB 저장 시작]');
    await saveToChroma(matchedChunks, embeddings);

    // 4. 통계 출력
    console.log('\n' + '='.repeat(60));
    console.log('[완료] ChromaDB 로드 완료');
    console.log(`- 컬렉션: ${COLLECTION_NAME}`);
    console.log(`- 저장된 청크: ${matchedChunks.length}개`);
    console.log(`- 다음 단계: npm run search`);
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('[치명적 오류]:', error.message || error);
    console.error('\n[도움말]');
    console.error('1. ChromaDB 서버가 실행 중인지 확인하세요:');
    console.error('   docker ps | grep chromadb');
    console.error('2. ChromaDB URL이 올바른지 확인하세요:');
    console.error(`   현재 URL: ${CHROMA_URL}`);
    console.error('3. 네트워크 연결을 확인하세요');
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  main();
}

export { main as loadToChroma };