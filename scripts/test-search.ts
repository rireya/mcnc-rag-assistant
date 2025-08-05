/**
 * MCNC RAG Assistant - ChromaDB 검색 테스트
 * 로컬 ChromaDB에서 검색 기능 테스트
 */

import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import readline from 'readline';
import { DATABASE_CONFIG, filterBySimilarity } from './config/database-config.js';

// 환경 변수 로드 (.env.local 우선)
dotenv.config({ path: '.env.local' });
dotenv.config(); // .env 파일도 로드 (fallback)

// 설정 가져오기
const { COLLECTION_NAME, SEARCH } = DATABASE_CONFIG.CHROMADB;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";

// OpenAI 클라이언트
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// readline 인터페이스
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 쿼리 임베딩 생성
 */
async function createQueryEmbedding(query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });

  return response.data[0].embedding;
}

/**
 * ChromaDB 검색 수행
 */
async function searchChroma(
  query: string,
  topK: number = SEARCH.DEFAULT_K
): Promise<void> {
  const client = new ChromaClient({
    path: CHROMA_URL
  });

  try {
    // 컬렉션 가져오기
    const collection = await client.getCollection({ name: COLLECTION_NAME });

    // 쿼리 임베딩 생성
    console.log(`\n[검색] "${query}"`);
    const queryEmbedding = await createQueryEmbedding(query);

    // 검색 수행
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: Math.min(topK, SEARCH.MAX_K),
      include: ['documents', 'metadatas', 'distances']
    });

    // 유사도 필터링
    const filtered = filterBySimilarity(results);

    // 결과 출력
    const documents = filtered.documents[0];
    const metadatas = filtered.metadatas[0];
    const distances = filtered.distances[0];

    if (documents.length === 0) {
      console.log('\n[결과 없음] 유사한 문서를 찾을 수 없습니다.');
      console.log(`(유사도 임계값: ${SEARCH.SIMILARITY_THRESHOLD * 100}% 이상)`);
      return;
    }

    console.log(`\n[검색 결과] ${documents.length}개 발견:\n`);
    console.log('─'.repeat(80));

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const metadata = metadatas[i];
      const distance = distances[i];
      const similarity = 1 - distance; // 코사인 유사도

      // metadata null 체크
      if (!metadata) {
        console.log(`\n[${i + 1}] 메타데이터 없음`);
        continue;
      }

      console.log(`\n[${i + 1}] 유사도: ${(similarity * 100).toFixed(1)}%`);
      console.log(`파일: ${metadata.file_name || '알 수 없음'}`);
      console.log(`위치: ${(metadata.chunk_index || 0) + 1}/${metadata.total_chunks || '?'} 청크`);

      if (metadata.pages && metadata.pages !== '[]') {
        try {
          const pages = JSON.parse(metadata.pages as string);
          if (Array.isArray(pages) && pages.length > 0) {
            console.log(`페이지: ${pages.join(', ')}`);
          }
        } catch (e) {
          // JSON 파싱 오류 무시
        }
      }

      if (metadata.has_tables || metadata.has_images) {
        const extras = [];
        if (metadata.has_tables) extras.push(`테이블 ${metadata.table_count || 0}개`);
        if (metadata.has_images) extras.push(`이미지 ${metadata.image_count || 0}개`);
        console.log(`포함: ${extras.join(', ')}`);
      }

      console.log(`\n내용 미리보기:`);
      const preview = doc && doc.length > 300 ? doc.substring(0, 300) + '...' : doc || '';
      console.log(preview);
      console.log('─'.repeat(80));
    }

  } catch (error) {
    console.error('[오류] 검색 실패:', error);
  }
}

/**
 * 예제 쿼리 실행
 */
async function runExampleQueries() {
  const exampleQueries = [
    'bizMOB 파일 업로드 방법',
    'Network request 함수 사용법',
    'Database 연결하는 방법',
    'Push 알림 설정',
    '회사 소개'
  ];

  console.log('\n[예제 쿼리 실행]\n');

  for (const query of exampleQueries) {
    await searchChroma(query, 3);
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

/**
 * 대화형 검색
 */
async function interactiveSearch() {
  console.log('\n[대화형 검색 모드]');
  console.log('검색할 내용을 입력하세요. (종료: exit, 도움말: help)\n');

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  while (true) {
    const query = await question('검색> ');

    if (query.toLowerCase() === 'exit') {
      console.log('검색을 종료합니다.');
      rl.close();
      break;
    }

    if (query.toLowerCase() === 'help') {
      console.log('\n[도움말]');
      console.log('- 일반 검색: 검색하고 싶은 내용을 입력하세요');
      console.log('- 예시: "파일 업로드", "데이터베이스 연결", "회사 소개"');
      console.log('- 종료: exit');
      console.log('- 통계: stats\n');
      continue;
    }

    if (query.toLowerCase() === 'stats') {
      await printStatistics();
      continue;
    }

    if (query.trim()) {
      await searchChroma(query);
    }
  }
}

/**
 * 통계 정보 출력
 */
async function printStatistics() {
  const client = new ChromaClient({
    path: CHROMA_URL
  });

  try {
    const collection = await client.getCollection({ name: COLLECTION_NAME });
    const count = await collection.count();

    // 샘플 데이터로 통계 확인
    const sample = await collection.get({
      limit: 100,
      include: ['metadatas']
    });

    // 파일별 통계
    const fileStats = new Map<string, number>();
    const strategyStats = new Map<string, number>();
    let tableCount = 0;
    let imageCount = 0;

    sample.metadatas.forEach(metadata => {
      // metadata null 체크
      if (!metadata) return;

      // 파일별 카운트
      const fileName = metadata.file_name as string;
      if (fileName) {
        fileStats.set(fileName, (fileStats.get(fileName) || 0) + 1);
      }

      // 전략별 카운트
      const strategy = metadata.chunk_strategy as string;
      if (strategy) {
        strategyStats.set(strategy, (strategyStats.get(strategy) || 0) + 1);
      }

      // 테이블/이미지 카운트
      if (metadata.has_tables) tableCount++;
      if (metadata.has_images) imageCount++;
    });

    console.log('\n[ChromaDB 통계]');
    console.log('─'.repeat(50));
    console.log(`총 문서 수: ${count}개`);
    console.log(`\n주요 파일 (샘플 기준):`);

    const sortedFiles = Array.from(fileStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    sortedFiles.forEach(([file, cnt]) => {
      console.log(`  - ${file}: ${cnt}개 청크`);
    });

    console.log(`\n청킹 전략 분포:`);
    strategyStats.forEach((cnt, strategy) => {
      console.log(`  - ${strategy}: ${cnt}개`);
    });

    console.log(`\n구조화 데이터:`);
    console.log(`  - 테이블 포함: ${tableCount}개 청크`);
    console.log(`  - 이미지 포함: ${imageCount}개 청크`);
    console.log('─'.repeat(50) + '\n');

  } catch (error) {
    console.error('[오류] 통계 조회 실패:', error);
  }
}

/**
 * 메인 함수
 */
async function main() {
  console.log('='.repeat(60));
  console.log('MCNC RAG Assistant - ChromaDB 검색 테스트');
  console.log('='.repeat(60));

  // API 키 확인
  if (!process.env.OPENAI_API_KEY) {
    console.error('[오류] OPENAI_API_KEY가 설정되지 않았습니다.');
    process.exit(1);
  }

  // 명령줄 인자 처리
  const args = process.argv.slice(2);

  if (args.includes('--stats')) {
    await printStatistics();
  } else if (args.includes('--examples')) {
    await runExampleQueries();
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    // 직접 쿼리 실행
    const query = args.join(' ');
    await searchChroma(query);
  } else {
    // 대화형 모드
    await printStatistics();
    await interactiveSearch();
  }
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}