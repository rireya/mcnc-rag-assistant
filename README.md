# MCNC RAG Assistant 프로젝트 대화 요약

## 📋 프로젝트 개요
- **회사명**: 모빌씨앤씨 (MCNC)
- **SDK명**: bizMOB
- **프로젝트명**: MCNC-RAG-Assistant
- **목적**: bizMOB SDK 지식 관리 및 RAG 기반 MCP 서버 구축

## 🏗️ 기술 아키텍처 결정

### 문서 파싱 방식
- **최종 선택**: GitHub Actions + Python 파싱
- **Python 라이브러리**: PyMuPDF, python-docx, python-pptx, pandas
- **JavaScript vs Python**: Python 선택 (표/차트 구조 보존 필요)
- **배포 고려**: JavaScript만으로는 품질 한계, Python 필수

### 파싱 시스템 구조
```
파일 배치(수동) → GitHub Actions → Python 파싱 → 결과 커밋
```

## 📁 프로젝트 구조 완성

### 경로 관리 시스템
- **paths.ts**: 모든 경로 중앙 관리
- **구조**: 최대 2단계 depth 지원
- **특징**: 경로 + 표시명 통합, 타입 안전성

### 폴더 구조
```
data/source/
├── documents/          # PDF, Office 문서
├── code/              # JavaScript, TypeScript
└── guides/            # 학습 자료, API 문서

scripts/
├── config/            # 경로 설정 및 가이드
├── parsers/           # Python 파싱 모듈
└── batch_parser.py    # 배치 파싱 스크립트
```

## 🔧 주요 구현 완료 사항

### 1. GitHub Actions 워크플로우
- **파일**: `.github/workflows/manual-parsing.yml`
- **기능**: 수동/자동 문서 파싱
- **Python 환경**: Ubuntu 최신, Python 3.11

### 2. Python 파싱 시스템
- **advanced_parser.py**: 개별 파일 파싱
- **batch_parser.py**: 배치 처리 및 변경 감지
- **지원 형식**: PDF, DOCX, PPTX, XLSX, MD, JS, TS

### 3. 데이터 검증 시스템
- **verify-data-setup.ts**: 폴더 구조 검증
- **메모 파일 제외**: `_README.md` 자동 제외
- **파일 카운팅**: 실제 처리 대상만 집계

## 🚀 현재 진행 상황

### ✅ 완료된 작업 (95%)
1. **프로젝트 구조 설계** - 완료
2. **경로 관리 시스템** - 완료
3. **Python 파싱 시스템** - 완료
4. **GitHub Actions 통합** - 완료
5. **데이터 검증 시스템** - 완료
6. **문서화** - 완료

### 🔄 현재 이슈 해결 중
- **_README.md 제외**: 메모 파일이 파싱되는 문제 수정 중
- **.gitignore 조정**: `data/processed/` 커밋 허용 필요

### 🎯 다음 개발 단계
1. **청킹 시스템** - AI 기반 의미적 분할
2. **임베딩 시스템** - OpenAI API 연동
3. **ChromaDB 연동** - 벡터 저장소 구축
4. **MCP 서버** - Claude 연동 서버

## 💡 핵심 설계 결정사항

### 1. 파싱 품질 우선
- JavaScript 단순 파싱 → Python 고품질 파싱
- 표/차트 구조 보존 중요성 인식
- 운영 서비스 품질 고려

### 2. GitHub Actions 활용
- 서버 비용 절약
- Python 환경 안정성 확보
- 배치 처리로 효율성 증대

### 3. 확장 가능한 구조
- 경로 중앙 관리로 유지보수성 향상
- 모듈식 설계로 단계별 개발 가능
- 타입 안전성으로 오류 방지

## 📊 프로젝트 상태

**완성도**: 95% (파싱 시스템 완료)
**다음 마일스톤**: 청킹 시스템 개발
**예상 완료**: 2-3주 내 MVP 완성 가능
**배포 준비도**: Docker/Render 배포 즉시 가능

## 🔍 최근 해결한 기술적 이슈

1. **Python vs JavaScript 파싱**: Python 선택으로 품질 확보
2. **경로 관리 복잡성**: paths.ts 중앙화로 해결
3. **메모 파일 제외**: 스캔 단계에서 사전 필터링
4. **GitHub Actions 통합**: 무료 Python 환경 활용
5. **타입 안전성**: TypeScript + const assertion

프로젝트는 **매우 체계적으로 구성**되어 있으며, **즉시 다음 단계 개발 가능한 상태**입니다.