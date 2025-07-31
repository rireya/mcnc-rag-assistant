import fs from 'fs';
import path from 'path';
import { PATHS, traversePaths, EXCLUDE_PATTERNS } from './config/paths.js';

function checkDirectory(dirPath: string): { exists: boolean; fileCount: number } {
  try {
    if (!fs.existsSync(dirPath)) {
      return { exists: false, fileCount: 0 };
    }

    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return { exists: false, fileCount: 0 };
    }

    const files = fs.readdirSync(dirPath);
    const fileCount = files.filter(file => {
      const filePath = path.join(dirPath, file);
      if (!fs.statSync(filePath).isFile()) return false;

      // 메모 파일 제외
      if (EXCLUDE_PATTERNS.MEMO_FILES.includes(file)) {
        return false;
      }

      // 패턴 매칭으로 제외
      if (EXCLUDE_PATTERNS.PATTERNS.some(pattern => pattern.test(file))) {
        return false;
      }

      return true;
    }).length;

    return { exists: true, fileCount };
  } catch (error) {
    console.error(`디렉터리 확인 중 오류 발생: ${dirPath}`, error);
    return { exists: false, fileCount: 0 };
  }
}

function verifyDataSetup() {
  console.log('='.repeat(50));
  console.log('MCNC RAG Assistant 데이터 설정 검증');
  console.log('='.repeat(50));

  let totalIssues = 0;

  // 기본 디렉터리 검증
  console.log('\n[기본 디렉터리 구조 검증]');
  const basicDirs = [
    { path: PATHS.DATA_ROOT.path, displayName: PATHS.DATA_ROOT.displayName },
    { path: PATHS.SOURCE_ROOT.path, displayName: PATHS.SOURCE_ROOT.displayName }
  ];

  basicDirs.forEach(({ path: dirPath, displayName }) => {
    const result = checkDirectory(dirPath);
    if (result.exists) {
      console.log(`충분한 설정: ${displayName} (${dirPath})`);
    } else {
      console.log(`누락: ${displayName} (${dirPath})`);
      totalIssues++;
    }
  });

  // 문서 디렉터리 검증
  console.log('\n[문서 디렉터리 검증]');
  traversePaths(PATHS.DOCUMENTS, (path, displayName, key) => {
    const result = checkDirectory(path);
    if (result.exists) {
      console.log(`존재함: ${displayName} - ${result.fileCount}개 파일 (${path})`);
    } else {
      console.log(`누락: ${displayName} (${path})`);
      if (key !== 'ROOT') totalIssues++;
    }
  });

  // 코드 디렉터리 검증
  console.log('\n[코드 디렉터리 검증]');
  traversePaths(PATHS.CODE, (path, displayName, key) => {
    const result = checkDirectory(path);
    if (result.exists) {
      console.log(`존재함: ${displayName} - ${result.fileCount}개 파일 (${path})`);
    } else {
      console.log(`누락: ${displayName} (${path})`);
      if (key !== 'ROOT') totalIssues++;
    }
  });

  // 가이드 디렉터리 검증
  console.log('\n[가이드 디렉터리 검증]');
  traversePaths(PATHS.GUIDES, (path, displayName, key) => {
    const result = checkDirectory(path);
    if (result.exists) {
      console.log(`존재함: ${displayName} - ${result.fileCount}개 파일 (${path})`);
    } else {
      console.log(`누락: ${displayName} (${path})`);
      if (key !== 'ROOT') totalIssues++;
    }
  });

  // 처리된 데이터 디렉터리 검증 (선택사항)
  console.log('\n[처리된 데이터 디렉터리 검증 - 선택사항]');
  traversePaths(PATHS.PROCESSED, (path, displayName, key) => {
    const result = checkDirectory(path);
    if (result.exists) {
      console.log(`존재함: ${displayName} - ${result.fileCount}개 파일 (${path})`);
    } else {
      console.log(`미생성: ${displayName} (${path}) - 처리 과정에서 자동 생성됨`);
    }
  });

  // 벡터 저장소 디렉터리 검증 (선택사항)
  console.log('\n[벡터 저장소 디렉터리 검증 - 선택사항]');
  traversePaths(PATHS.VECTOR, (path, displayName, key) => {
    const result = checkDirectory(path);
    if (result.exists) {
      console.log(`존재함: ${displayName} - ${result.fileCount}개 파일 (${path})`);
    } else {
      console.log(`미생성: ${displayName} (${path}) - ChromaDB 설정 시 자동 생성됨`);
    }
  });

  // 최종 결과
  console.log('\n' + '='.repeat(50));
  if (totalIssues === 0) {
    console.log('충분한 수의 파일이 배치되었습니다.');
    console.log('다음 단계: 문서 처리기 구현 및 테스트');
  } else {
    console.log(`${totalIssues}개의 디렉터리가 누락되었습니다.`);
    console.log('누락된 디렉터리를 생성하고 해당 파일들을 배치해주세요.');
  }
  console.log('='.repeat(50));
}

// 스크립트 실행
if (require.main === module) {
  verifyDataSetup();
}