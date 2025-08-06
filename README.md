# MCNC RAG Assistant - ChromaDB 통합 작업 요약

## 🎯 프로젝트 현황
- **완료**: 문서 파싱, 청킹, 임베딩 생성 (123개 청크)
- **목표**: ChromaDB + MCP 서버를 단일 Docker 컨테이너로 Render 배포

## 📋 주요 결정사항

### 1. ChromaDB JavaScript 제약사항
- JavaScript 클라이언트는 HTTP 모드만 지원 (PersistentClient 없음)
- 별도 ChromaDB 서버 필요

### 2. 아키텍처 선택: 단일 컨테이너 통합
```
Docker Container (Render)
├── ChromaDB Server (Python) - localhost:8000
└── MCP Server (Node.js) - 0.0.0.0:3000
```
- PM2로 두 프로세스 관리
- Render free tier에서 단일 서비스로 운영

### 3. 프로젝트 구조 (단순화)
```
src/
├── index.ts           # MCP 서버 (~150줄)
├── tools.ts           # Tool 구현 (~100줄)
├── services/
│   ├── chroma.ts     # ChromaDB 클라이언트 (~80줄)
│   └── search.ts     # 검색 로직 (~60줄)
├── config.ts         # 환경 설정 (~30줄)
└── types.ts          # 타입 정의 (~50줄)

docker/
├── Dockerfile
├── ecosystem.config.js
└── docker-compose.yml

scripts/              # 기존 개발 도구 유지
└── (기존 파일들...)
```

## 🚨 현재 이슈

### ChromaDB 버전 불일치
- **문제**: Python ChromaDB (v2 API) vs JavaScript 클라이언트 (v1 API)
- **해결책**:
  ```bash
  pip install chromadb==0.4.24  # 호환 버전으로 다운그레이드
  ```

### API 변경사항
- `path` → `host`, `port`, `ssl` 파라미터로 변경
- 임베딩 함수 명시적 설정 필요

## 📝 남은 작업

1. **ChromaDB 버전 맞추기**
2. **로컬 테스트 완료**
3. **MCP 서버 구현**
   - src 폴더 구조 생성
   - 서비스 코드 작성
4. **Docker 설정**
   - Dockerfile 작성
   - PM2 설정
5. **Render 배포**

## 🔧 환경 설정
- TypeScript path alias 설정 (`@scripts/*`, `@src/*`)
- dotenv는 진입점에서만 로드
- 기존 scripts 폴더는 그대로 유지하며 재사용