// scripts/verify-data-setup.js
const fs = require('fs');
const path = require('path');

function getFileInfo(filePath) {
  const stats = fs.statSync(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  return {
    name: path.basename(filePath),
    size: `${sizeInMB} MB`,
    extension,
    type: getFileType(extension),
    lastModified: stats.mtime.toISOString().split('T')[0]
  };
}

function getFileType(extension) {
  const typeMap = {
    '.pdf': 'PDF Document',
    '.docx': 'Word Document',
    '.doc': 'Word Document',
    '.xlsx': 'Excel Spreadsheet',
    '.xls': 'Excel Spreadsheet',
    '.pptx': 'PowerPoint Presentation',
    '.ppt': 'PowerPoint Presentation',
    '.js': 'JavaScript',
    '.ts': 'TypeScript',
    '.vue': 'Vue Component',
    '.md': 'Markdown'
  };
  return typeMap[extension] || 'Unknown';
}

function scanDirectory(dirPath, basePath = 'data/source') {
  const results = {
    totalFiles: 0,
    totalSize: 0,
    filesByType: {},
    filesByLocation: {}
  };

  function scan(currentPath, relativePath = '') {
    if (!fs.existsSync(currentPath)) {
      console.log(`❌ Directory not found: ${currentPath}`);
      return;
    }

    const items = fs.readdirSync(currentPath);

    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const relativeItemPath = path.join(relativePath, item);

      if (fs.statSync(fullPath).isDirectory()) {
        scan(fullPath, relativeItemPath);
      } else {
        try {
          const fileInfo = getFileInfo(fullPath);
          const sizeInBytes = fs.statSync(fullPath).size;

          results.totalFiles++;
          results.totalSize += sizeInBytes;

          // 파일 타입별 집계
          if (!results.filesByType[fileInfo.type]) {
            results.filesByType[fileInfo.type] = [];
          }
          results.filesByType[fileInfo.type].push({
            ...fileInfo,
            path: relativeItemPath
          });

          // 위치별 집계
          const location = relativePath.split('/')[0] || 'root';
          if (!results.filesByLocation[location]) {
            results.filesByLocation[location] = [];
          }
          results.filesByLocation[location].push({
            ...fileInfo,
            path: relativeItemPath
          });

        } catch (error) {
          console.log(`⚠️  Error reading file ${fullPath}: ${error.message}`);
        }
      }
    });
  }

  scan(dirPath);
  return results;
}

// 메인 실행 함수
function main() {
  console.log('🔍 MCNC-RAG-Assistant 데이터 배치 검증\n');
  console.log('='.repeat(60));

  const dataPath = 'data/source';

  if (!fs.existsSync(dataPath)) {
    console.log(`❌ 데이터 폴더를 찾을 수 없습니다: ${dataPath}`);
    console.log('다음 명령어로 폴더를 생성하세요:');
    console.log('mkdir -p data/source/documents/{manuals,specifications,policies,presentations}');
    console.log('mkdir -p data/source/code/{bizmob-sdk,components,composables}');
    console.log('mkdir -p data/source/guides/{tutorials,examples,api-docs}');
    return;
  }

  const results = scanDirectory(dataPath);

  // 전체 통계
  console.log('\n📊 전체 통계');
  console.log('-'.repeat(40));
  console.log(`총 파일 수: ${results.totalFiles}개`);
  console.log(`총 크기: ${(results.totalSize / (1024 * 1024)).toFixed(2)} MB`);

  // 파일 타입별 분석
  console.log('\n📁 파일 타입별 분석');
  console.log('-'.repeat(40));
  Object.entries(results.filesByType).forEach(([type, files]) => {
    console.log(`${type}: ${files.length}개`);
    files.forEach(file => {
      console.log(`  📄 ${file.name} (${file.size}) - ${file.path}`);
    });
  });

  // 위치별 분석
  console.log('\n📍 위치별 분석');
  console.log('-'.repeat(40));
  Object.entries(results.filesByLocation).forEach(([location, files]) => {
    console.log(`\n${location}/ 폴더: ${files.length}개 파일`);
    files.forEach(file => {
      const statusIcon = getFileStatusIcon(file.size, file.type);
      console.log(`  ${statusIcon} ${file.name} (${file.size})`);
    });
  });

  // 권장사항
  console.log('\n💡 검증 결과 및 권장사항');
  console.log('-'.repeat(40));

  if (results.totalFiles === 0) {
    console.log('❌ 배치된 파일이 없습니다.');
    console.log('   원본 문서들을 data/source/ 하위 폴더에 배치해주세요.');
  } else if (results.totalFiles < 5) {
    console.log('⚠️  파일 수가 적습니다. 더 많은 문서를 추가하면 RAG 성능이 향상됩니다.');
  } else {
    console.log('✅ 충분한 수의 파일이 배치되었습니다.');
  }

  // bizMOB SDK 파일 확인
  const bizMOBFiles = results.filesByLocation['code'] || [];
  const hasBizMOBSDK = bizMOBFiles.some(file =>
    file.name.includes('bizMOB') && file.extension === '.js'
  );

  if (hasBizMOBSDK) {
    console.log('✅ bizMOB SDK 파일이 감지되었습니다.');
  } else {
    console.log('⚠️  bizMOB SDK 파일(bizMOB-xross4.js)을 data/source/code/bizmob-sdk/ 에 배치해주세요.');
  }

  // 대용량 파일 경고
  const largeFiles = Object.values(results.filesByType).flat()
    .filter(file => parseFloat(file.size) > 10);

  if (largeFiles.length > 0) {
    console.log('⚠️  10MB를 초과하는 파일들이 있습니다:');
    largeFiles.forEach(file => {
      console.log(`   📄 ${file.name} (${file.size})`);
    });
    console.log('   처리 시간이 오래 걸릴 수 있습니다.');
  }

  console.log('\n🎯 다음 단계: 문서 처리기 구현 및 테스트');
  console.log('   npm run test-processors (다음 단계에서 생성 예정)');
}

function getFileStatusIcon(size, type) {
  const sizeNum = parseFloat(size);
  if (sizeNum > 10) return '🟡'; // 대용량
  if (sizeNum > 5) return '🟠';  // 중간 크기
  if (type.includes('JavaScript') || type.includes('TypeScript')) return '💻'; // 코드
  if (type.includes('PDF')) return '📕'; // PDF
  if (type.includes('Word')) return '📘'; // Word
  if (type.includes('Excel')) return '📗'; // Excel
  if (type.includes('PowerPoint')) return '📙'; // PPT
  if (type.includes('Markdown')) return '📝'; // Markdown
  return '📄'; // 기본
}

// 스크립트 실행
main();