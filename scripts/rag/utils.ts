/**
 * MCNC RAG Assistant - 공통 유틸리티
 * 파일 처리, 토큰 계산, 경로 처리 등의 헬퍼 함수들
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ParsedDocument, ChunkData, ChunkQualityMetrics, QUALITY_THRESHOLDS } from './types.js';

// ==================== 파일 처리 유틸리티 ====================

/**
 * JSON 파일에서 파싱된 문서 로드
 */
export async function loadParsedDocument(filePath: string): Promise<ParsedDocument> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const document = JSON.parse(content) as ParsedDocument;

    // 더 상세한 구조 검증
    if (!document) {
      throw new Error(`Document is null or undefined in ${filePath}`);
    }

    if (typeof document !== 'object') {
      throw new Error(`Document is not an object in ${filePath}`);
    }

    if (!document.content) {
      // content가 없으면 경고하고 빈 문자열로 설정
      console.warn(`Warning: No content field in ${filePath}, using empty string`);
      document.content = '';
    }

    if (typeof document.content !== 'string') {
      console.warn(`Warning: Content is not a string in ${filePath}, converting to string`);
      document.content = String(document.content || '');
    }

    // 필수 필드들이 없으면 기본값 설정
    if (!document.file_path) document.file_path = filePath;
    if (!document.file_name) document.file_name = path.basename(filePath);
    if (!document.parsed_at) document.parsed_at = new Date().toISOString();
    if (!document.metadata) document.metadata = {};

    return document;
  } catch (error) {
    throw new Error(`Failed to load parsed document from ${filePath}: ${error}`);
  }
}

/**
 * 디렉터리 내의 모든 JSON 파일 스캔
 */
export async function scanParsedFiles(directoryPath: string): Promise<string[]> {
  try {
    if (!fs.existsSync(directoryPath)) {
      console.log(`Directory does not exist: ${directoryPath}`);
      return [];
    }

    console.log(`Scanning directory: ${directoryPath}`);
    const files = await fs.promises.readdir(directoryPath, { recursive: true });
    const jsonFiles = files
      .filter(file => typeof file === 'string' && file.endsWith('.json'))
      .map(file => path.join(directoryPath, file))
      .filter(filePath => fs.existsSync(filePath) && fs.statSync(filePath).isFile());

    console.log(`Found ${jsonFiles.length} JSON files in ${directoryPath}`);

    // 처음 5개 파일명 출력 (디버깅용)
    if (jsonFiles.length > 0) {
      console.log('Sample files:');
      jsonFiles.slice(0, 5).forEach(file => {
        console.log(`  - ${path.relative(directoryPath, file)}`);
      });
      if (jsonFiles.length > 5) {
        console.log(`  ... and ${jsonFiles.length - 5} more files`);
      }
    }

    return jsonFiles;
  } catch (error) {
    console.error(`Error scanning directory ${directoryPath}:`, error);
    return [];
  }
}

/**
 * 청크 데이터를 JSON 파일로 저장
 */
export async function saveChunks(chunks: ChunkData[], outputPath: string): Promise<void> {
  try {
    // 출력 디렉터리 생성
    const outputDir = path.dirname(outputPath);
    await fs.promises.mkdir(outputDir, { recursive: true });

    // 청크 데이터를 JSON으로 저장
    const jsonContent = JSON.stringify(chunks, null, 2);
    await fs.promises.writeFile(outputPath, jsonContent, 'utf-8');

    console.log(`Saved ${chunks.length} chunks to ${outputPath}`);
  } catch (error) {
    throw new Error(`Failed to save chunks to ${outputPath}: ${error}`);
  }
}

// ==================== 토큰 계산 유틸리티 ====================

/**
 * 간단한 토큰 수 추정 (GPT 계열 모델용)
 * 실제 tiktoken보다는 부정확하지만 빠른 추정치 제공
 */
export function estimateTokenCount(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  // 기본적인 토큰 추정 로직
  // 영어: ~4 문자 = 1 토큰, 한글: ~2 문자 = 1 토큰
  const englishChars = (text.match(/[a-zA-Z0-9\s]/g) || []).length;
  const koreanChars = (text.match(/[가-힣]/g) || []).length;
  const otherChars = text.length - englishChars - koreanChars;

  const estimatedTokens = Math.ceil(englishChars / 4) + Math.ceil(koreanChars / 2) + Math.ceil(otherChars / 3);

  // 최소 1토큰은 보장
  return Math.max(1, estimatedTokens);
}

/**
 * 텍스트가 토큰 한도를 초과하는지 확인
 */
export function isTokenLimitExceeded(text: string, maxTokens: number): boolean {
  return estimateTokenCount(text) > maxTokens;
}

/**
 * 토큰 수에 맞게 텍스트 자르기
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  if (!isTokenLimitExceeded(text, maxTokens)) {
    return text;
  }

  // 대략적인 문자 수로 자르기 (안전 마진 포함)
  const avgCharsPerToken = 3;
  const maxChars = Math.floor(maxTokens * avgCharsPerToken * 0.9); // 10% 마진

  if (text.length <= maxChars) {
    return text;
  }

  // 문장 단위로 자르기 시도
  const sentences = text.split(/[.!?]\s+/);
  let result = '';

  for (const sentence of sentences) {
    const testResult = result + sentence + '. ';
    if (testResult.length > maxChars) {
      break;
    }
    result = testResult;
  }

  return result.trim() || text.substring(0, maxChars);
}

// ==================== 문자열 처리 유틸리티 ====================

/**
 * 텍스트 정규화 (공백, 줄바꿈 정리)
 */
export function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/\r\n/g, '\n')           // Windows 줄바꿈 통일
    .replace(/\r/g, '\n')             // Mac 줄바꿈 통일
    .replace(/\n{3,}/g, '\n\n')       // 연속된 줄바꿈 정리
    .replace(/\t/g, ' ')              // 탭을 공백으로
    .replace(/[ ]{2,}/g, ' ')         // 연속된 공백 정리
    .trim();
}

/**
 * 빈 청크인지 확인
 */
export function isEmptyChunk(text: string): boolean {
  const normalized = normalizeText(text);
  return normalized.length === 0 || normalized.replace(/\s/g, '').length < 10;
}

/**
 * 중복 청크인지 확인 (유사도 기반)
 */
export function isDuplicateChunk(chunk1: string, chunk2: string, threshold: number = 0.95): boolean {
  if (chunk1 === chunk2) {
    return true;
  }

  // 간단한 유사도 계산 (문자 기반)
  const similarity = calculateStringSimilarity(
    normalizeText(chunk1),
    normalizeText(chunk2)
  );

  return similarity >= threshold;
}

/**
 * 두 문자열의 유사도 계산 (0-1)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  // 간단한 Jaccard 유사도 계산
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...set1].filter(word => set2.has(word)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

// ==================== ID 및 해시 생성 ====================

/**
 * 청크 ID 생성
 */
export function generateChunkId(filePath: string, chunkIndex: number): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathHash = crypto.createHash('md5').update(normalizedPath).digest('hex').substring(0, 8);
  return `${pathHash}_${chunkIndex.toString().padStart(4, '0')}`;
}

/**
 * 파일 해시 생성
 */
export function generateFileHash(content: string): string {
  return crypto.createHash('md5').update(content, 'utf-8').digest('hex');
}

// ==================== 경로 처리 유틸리티 ====================

/**
 * 청킹 전략명을 파일 경로에서 추출
 */
export function getStrategyNameFromPath(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();

  // rag-config.ts의 전략과 매칭
  const strategies = [
    'documents/corporate',
    'documents/specifications',
    'documents/manuals',
    'documents/policies',
    'documents/presentations',
    'code/bizmob-sdk',
    'code/components',
    'guides/tutorials',
    'guides/api-docs',
    'guides/examples'
  ];

  for (const strategy of strategies) {
    if (normalizedPath.includes(strategy)) {
      return strategy;
    }
  }

  return 'default';
}

/**
 * 출력 파일 경로 생성
 */
export function generateOutputPath(inputPath: string, outputDir: string): string {
  // 입력 파일 경로를 정규화
  const normalizedInputPath = path.resolve(inputPath);
  const parsedBasePath = path.resolve('data/processed/parsed');

  // parsed 폴더를 기준으로 상대 경로 추출
  let relativePath: string;

  if (normalizedInputPath.startsWith(parsedBasePath)) {
    relativePath = path.relative(parsedBasePath, normalizedInputPath);
  } else {
    // fallback: 파일명만 사용
    relativePath = path.basename(inputPath);
  }

  const parsedPath = path.parse(relativePath);

  // 출력 파일명 생성 (.json을 .chunks.json으로 변경)
  const outputFileName = `${parsedPath.name}.chunks.json`;

  // 최종 출력 경로 (outputDir 기준으로)
  const finalPath = path.join(outputDir, parsedPath.dir, outputFileName);

  console.log(`Output path mapping: ${inputPath} -> ${finalPath}`);

  return finalPath;
}

// ==================== 품질 검사 유틸리티 ====================

/**
 * 청크 품질 검사
 */
export function assessChunkQuality(chunk: ChunkData): ChunkQualityMetrics {
  const issues: string[] = [];
  let sizeScore = 1.0;
  let contentScore = 1.0;

  // 크기 검사
  if (chunk.tokens < QUALITY_THRESHOLDS.MIN_CHUNK_SIZE) {
    issues.push(`Too small: ${chunk.tokens} tokens (min: ${QUALITY_THRESHOLDS.MIN_CHUNK_SIZE})`);
    sizeScore = chunk.tokens / QUALITY_THRESHOLDS.MIN_CHUNK_SIZE;
  }

  if (chunk.tokens > QUALITY_THRESHOLDS.MAX_CHUNK_SIZE) {
    issues.push(`Too large: ${chunk.tokens} tokens (max: ${QUALITY_THRESHOLDS.MAX_CHUNK_SIZE})`);
    sizeScore = QUALITY_THRESHOLDS.MAX_CHUNK_SIZE / chunk.tokens;
  }

  // 내용 검사
  if (isEmptyChunk(chunk.content)) {
    issues.push('Empty or meaningless content');
    contentScore = 0;
  }

  // 의미있는 단어 비율 확인
  const words = chunk.content.split(/\s+/);
  const meaningfulWords = words.filter(word =>
    word.length > 2 && !/^\d+$/.test(word) && !/^[^\w가-힣]+$/.test(word)
  );

  const meaningfulRatio = meaningfulWords.length / Math.max(words.length, 1);
  if (meaningfulRatio < 0.3) {
    issues.push('Low meaningful content ratio');
    contentScore *= meaningfulRatio / 0.3;
  }

  const isValid = issues.length === 0 &&
                  sizeScore >= QUALITY_THRESHOLDS.MIN_SIZE_SCORE &&
                  contentScore >= QUALITY_THRESHOLDS.MIN_CONTENT_SCORE;

  return {
    chunk_id: chunk.id,
    is_valid: isValid,
    issues,
    size_score: Math.max(0, Math.min(1, sizeScore)),
    content_score: Math.max(0, Math.min(1, contentScore))
  };
}

// ==================== 시간 및 성능 유틸리티 ====================

/**
 * 실행 시간 측정
 */
export async function measureExecutionTime<T>(
  operation: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  console.log(`Starting ${label}...`);

  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    console.log(`Completed ${label} in ${duration}ms`);
    return { result, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Failed ${label} after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * 배열을 청크 단위로 분할
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * 지연 실행
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}