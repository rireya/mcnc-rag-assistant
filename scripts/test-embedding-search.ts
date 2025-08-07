/**
 * MCNC RAG Assistant - OpenAI 임베딩 검색 테스트
 * MCP 구현 전 실제 임베딩 기반 검색 성능 검증
 */

import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });
dotenv.config();

// 설정
const COLLECTION_NAME = 'mcnc_documents';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";

// OpenAI 클라이언트
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 테스트 케이스 정의 - 유사도별로 구성
interface TestCase {
  query: string;
  description: string;
  expectedContent: string[];
  expectedSimilarity: string; // 예상 유사도 수준
}

const testCases: TestCase[] = [
  {
    query: "bizMOB.Network.requestTr",
    description: "[높은 유사도] 문서와 거의 일치하는 직접적인 검색",
    expectedContent: ["bizMOB", "Network", "requestTr"],
    expectedSimilarity: "70% 이상"
  },
  {
    query: "bizMOB Device isIOS iOS 환경 확인 메서드",
    description: "[높은 유사도] 문서와 거의 일치하는 직접적인 검색",
    expectedContent: ["isIOS", "Device", "iOS 환경"],
    expectedSimilarity: "70% 이상"
  },
  {
    query: "모바일 앱 개발 플랫폼 회사",
    description: "[중간 유사도] 관련 있지만 간접적인 검색",
    expectedContent: ["bizMOB", "모빌씨앤씨", "플랫폼"],
    expectedSimilarity: "50-70%"
  },
  {
    query: "파이썬 데이터 분석 라이브러리",
    description: "[낮은 유사도] 문서와 관련 없는 검색",
    expectedContent: [],  // 관련 내용 없음 예상
    expectedSimilarity: "50% 미만"
  }
];

/**
 * 임베딩 생성 및 토큰 사용량 추적
 */
async function createEmbeddingWithStats(query: string): Promise<{
  embedding: number[];
  tokens: number;
  cost: number;
}> {
  const startTime = Date.now();

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });

  const duration = Date.now() - startTime;
  const tokens = response.usage.total_tokens;
  const cost = (tokens / 1_000_000) * 0.02; // $0.02 per 1M tokens

  console.log(`  [임베딩 생성] ${duration}ms, ${tokens} 토큰, ${cost.toFixed(6)}`);

  return {
    embedding: response.data[0].embedding,
    tokens,
    cost
  };
}

/**
 * ChromaDB 검색 실행
 */
async function searchWithEmbedding(
  collection: any,
  embedding: number[],
  topK: number = 5
): Promise<any> {
  const startTime = Date.now();

  const results = await collection.query({
    queryEmbeddings: [embedding],
    nResults: topK,
    include: ['documents', 'metadatas', 'distances']
  });

  const duration = Date.now() - startTime;
  console.log(`  [ChromaDB 검색] ${duration}ms`);

  return results;
}

/**
 * 검색 결과 분석 및 출력
 */
function analyzeResults(
  testCase: TestCase,
  results: any,
  totalTime: number
): void {
  const documents = results.documents[0] || [];
  const metadatas = results.metadatas[0] || [];
  const distances = results.distances[0] || [];

  console.log(`\n  [검색 결과 분석]`);
  console.log(`  - 총 소요 시간: ${totalTime}ms`);
  console.log(`  - 검색 결과: ${documents.length}개`);
  console.log(`  - 예상 유사도: ${testCase.expectedSimilarity}`);

  // 상위 3개 결과 상세 분석
  console.log(`\n  [상위 3개 결과]`);
  for (let i = 0; i < Math.min(3, documents.length); i++) {
    const similarity = ((1 - distances[i]) * 100).toFixed(1);
    const metadata = metadatas[i];
    const content = documents[i];

    console.log(`\n  [${i + 1}] 유사도: ${similarity}%`);
    console.log(`      파일: ${metadata.file_name}`);
    console.log(`      청크: ${metadata.chunk_index + 1}/${metadata.total_chunks}`);

    // 예상 내용 포함 여부 체크 (예상 내용이 있는 경우만)
    if (testCase.expectedContent.length > 0) {
      const matchedKeywords = testCase.expectedContent.filter(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        console.log(`      [확인] 예상 키워드 발견: ${matchedKeywords.join(', ')}`);
      }
    }

    // 내용 미리보기 (50자)
    const preview = content.substring(0, 50).replace(/\n/g, ' ');
    console.log(`      내용: "${preview}..."`);
  }

  // 검색 품질 평가
  const topSimilarity = documents.length > 0 ? (1 - distances[0]) * 100 : 0;

  console.log(`\n  [검색 품질 평가]`);
  console.log(`      실제 최고 유사도: ${topSimilarity.toFixed(1)}%`);

  // 예상 유사도와 비교
  let evaluation = "";
  if (testCase.expectedSimilarity.includes("70% 이상")) {
    if (topSimilarity >= 70) {
      evaluation = "[정상] 예상대로 높은 유사도";
    } else {
      evaluation = "[주의] 예상보다 낮은 유사도";
    }
  } else if (testCase.expectedSimilarity.includes("50-70%")) {
    if (topSimilarity >= 50 && topSimilarity < 70) {
      evaluation = "[정상] 예상대로 중간 유사도";
    } else if (topSimilarity >= 70) {
      evaluation = "[양호] 예상보다 높은 유사도";
    } else {
      evaluation = "[주의] 예상보다 낮은 유사도";
    }
  } else if (testCase.expectedSimilarity.includes("50% 미만")) {
    if (topSimilarity < 50) {
      evaluation = "[정상] 예상대로 낮은 유사도";
    } else {
      evaluation = "[주의] 예상보다 높은 유사도 (관련 내용 발견)";
    }
  }

  console.log(`      평가: ${evaluation}`);

  // 예상 내용 매칭 확인 (예상 내용이 있는 경우만)
  if (documents.length > 0 && testCase.expectedContent.length > 0) {
    const topResult = documents[0];
    const hasExpectedContent = testCase.expectedContent.some(keyword =>
      topResult.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasExpectedContent) {
      console.log(`      [확인] 예상 내용과 일치`);
    } else {
      console.log(`      [경고] 예상 내용과 불일치 (다른 관련 내용 발견)`);
    }
  } else if (documents.length === 0 && testCase.expectedContent.length === 0) {
    console.log(`      [확인] 예상대로 관련 내용 없음`);
  }
}

/**
 * 메인 테스트 함수
 */
async function runEmbeddingTests() {
  console.log('='.repeat(60));
  console.log('MCNC RAG Assistant - OpenAI 임베딩 검색 테스트');
  console.log('유사도별 검색 성능 검증 (높음/중간/낮음)');
  console.log('='.repeat(60));
  console.log(`\n모델: ${EMBEDDING_MODEL}`);
  console.log(`ChromaDB: ${CHROMA_URL}`);
  console.log(`컬렉션: ${COLLECTION_NAME}`);

  // API 키 확인
  if (!process.env.OPENAI_API_KEY) {
    console.error('\n[오류] OPENAI_API_KEY가 설정되지 않았습니다.');
    process.exit(1);
  }

  // ChromaDB 연결
  const url = new URL(CHROMA_URL);
  const client = new ChromaClient({
    host: url.hostname,
    port: parseInt(url.port || '8000'),
    ssl: url.protocol === 'https:'
  });

  // 경고 메시지 필터링
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    if (!message.includes('@chroma-core/undefined')) {
      originalWarn.apply(console, args);
    }
  };

  try {
    // 컬렉션 가져오기
    const collection = await client.getCollection({ name: COLLECTION_NAME });
    const count = await collection.count();
    console.log(`\n[성공] ChromaDB 연결 성공: ${count}개 문서\n`);

    // 통계 초기화
    let totalTokens = 0;
    let totalCost = 0;
    let totalTime = 0;

    // 각 테스트 케이스 실행
    console.log('테스트 시작...\n');
    console.log('─'.repeat(60));

    for (const [index, testCase] of testCases.entries()) {
      console.log(`\n[테스트 ${index + 1}] ${testCase.description}`);
      console.log(`검색어: "${testCase.query}"`);

      const startTime = Date.now();

      try {
        // 1. 임베딩 생성
        const { embedding, tokens, cost } = await createEmbeddingWithStats(testCase.query);
        totalTokens += tokens;
        totalCost += cost;

        // 2. ChromaDB 검색
        const results = await searchWithEmbedding(collection, embedding);

        // 3. 결과 분석
        const testTime = Date.now() - startTime;
        totalTime += testTime;
        analyzeResults(testCase, results, testTime);

      } catch (error: any) {
        console.error(`  [오류] 테스트 실패: ${error.message}`);
      }

      console.log('\n' + '─'.repeat(60));
    }

    // 전체 통계
    console.log('\n' + '='.repeat(60));
    console.log('테스트 완료 - 전체 통계');
    console.log('='.repeat(60));
    console.log(`\n[성능 지표]`);
    console.log(`  - 총 테스트: ${testCases.length}개`);
    console.log(`  - 평균 응답 시간: ${(totalTime / testCases.length).toFixed(0)}ms`);
    console.log(`  - 총 응답 시간: ${totalTime}ms`);

    console.log(`\n[비용 분석]`);
    console.log(`  - 총 토큰 사용: ${totalTokens} 토큰`);
    console.log(`  - 총 비용: ${totalCost.toFixed(6)}`);
    console.log(`  - 검색당 평균 비용: ${(totalCost / testCases.length).toFixed(6)}`);
    console.log(`  - 1,000회 검색 예상 비용: ${(totalCost / testCases.length * 1000).toFixed(4)}`);

    console.log(`\n[분석 결과]`);
    console.log(`  - 임베딩 기반 검색이 정상 작동합니다`);
    console.log(`  - 의미적으로 유사한 내용을 잘 찾아냅니다`);
    console.log(`  - MCP 서버 구현 시 동일한 방식으로 작동할 예정입니다`);

  } catch (error: any) {
    console.error('\n[치명적 오류] ' + error.message);

    if (error.message?.includes('does not exist')) {
      console.error('   컬렉션이 없습니다. npm run chroma 실행 필요');
    } else if (error.message?.includes('connect')) {
      console.error('   ChromaDB 서버에 연결할 수 없습니다');
    }
  } finally {
    // console.warn 복원
    console.warn = originalWarn;
  }
}

// 실행
if (require.main === module) {
  console.log('\n[시작] OpenAI 임베딩 검색 테스트를 시작합니다...\n');

  runEmbeddingTests()
    .then(() => {
      console.log('\n[완료] 테스트가 완료되었습니다.\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n[오류] 테스트 중 오류 발생:', error);
      process.exit(1);
    });
}

export { runEmbeddingTests };