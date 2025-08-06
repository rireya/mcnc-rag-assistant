# MCNC RAG Assistant - ChromaDB 통합 문제 해결 요약

## 📅 작업 일자
2025년 1월 (현재 진행 중)

## 🎯 프로젝트 목표
- bizMOB SDK 문서를 RAG 시스템으로 구축
- ChromaDB + MCP 서버를 Docker 컨테이너로 Render 배포

## ✅ 완료된 작업

### 1. 데이터 처리 파이프라인
- ✅ Python 기반 문서 파싱 (PDF, DOCX, PPTX, XLSX)
- ✅ TypeScript 기반 청킹 (RecursiveCharacterTextSplitter)
- ✅ OpenAI text-embedding-3-small로 123개 청크 임베딩 생성
- ✅ ChromaDB에 데이터 저장 완료

### 2. 최적화된 청킹 전략
- 문서 타입별 맞춤 설정 (400-600 토큰)
- 페이지 경계 처리 및 오버랩 관리
- 테이블/이미지 메타데이터 보강

## 🔧 해결한 문제들

### 1. ChromaDB 버전 호환성 문제
**문제**: JavaScript 클라이언트와 Python 서버 간 API 버전 불일치

**해결 과정**:
1. 초기 시도: `path` 파라미터 사용 → deprecated 경고
2. 수정: `host`, `port`, `ssl` 파라미터로 변경
3. 최종 해결:
```typescript
const url = new URL(CHROMA_URL);
const client = new ChromaClient({
  host: url.hostname,
  port: parseInt(url.port || '8000'),
  ssl: url.protocol === 'https:'
});
```

### 2. Embedding Function 경고
**문제**: `@chroma-core/undefined package is not installed` 경고

**해결**:
- `createCollection` → `getOrCreateCollection` 사용
- 임베딩을 직접 제공하므로 embedding function 불필요

### 3. 낮은 검색 유사도
**문제**: "회사 소개" 검색 시 최대 38.4% 유사도

**원인 분석**:
- 데이터는 정상 저장됨 (123개 문서)
- 검색 기능 정상 작동
- 쿼리와 기술 문서 간 의미적 거리가 실제로 멀 수 있음

**해결**:
1. 유사도 임계값 조정: 0.7 → 0.5 → 0.3
2. 디버깅 정보 추가로 상황 파악
3. 다양한 기술 용어로 테스트 권장

## 📊 현재 상태

### 시스템 상태
- ✅ ChromaDB 서버: 정상 작동
- ✅ 데이터 저장: 123개 청크 저장 완료
- ✅ 검색 기능: 정상 작동
- ⚠️ 유사도: 일반 쿼리에서 낮게 측정됨

### 버전 정보
- Python ChromaDB: 1.0.15
- JavaScript ChromaDB: ^3.0.10
- OpenAI 임베딩: text-embedding-3-small
- 벡터 차원: 1536

## 🚀 다음 단계

1. **검색 최적화**
   - 다양한 기술 용어로 검색 테스트
   - 필요시 하이브리드 검색 (키워드 + 벡터) 고려

2. **MCP 서버 구현**
   - 기존 `scripts/` 코드 재사용
   - 최소한의 MCP 통합 레이어만 구축

3. **Docker 배포**
   - PM2로 ChromaDB + MCP 프로세스 관리
   - Render free tier 단일 컨테이너 배포

## 💡 핵심 교훈

1. **ChromaDB JavaScript 클라이언트는 아직 불안정**
   - API가 자주 변경됨
   - 문서와 실제 동작이 다를 수 있음

2. **임베딩 유사도 ≠ 키워드 매칭**
   - 의미적 유사성 측정
   - 기술 문서는 기술 용어로 검색이 효과적

3. **디버깅 정보가 중요**
   - 문제 원인 파악에 필수
   - 실제 데이터 상태 확인 가능

## 📝 테스트 명령어
```bash
# 데이터 재로드
npm run chroma

# 검색 테스트
npm run search:examples
npm run search "bizMOB SDK"
npm run search --stats
```

---

**현재 상태: 데이터 저장 및 검색 기능 정상 작동 ✅**