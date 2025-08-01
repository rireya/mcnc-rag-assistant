#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import json
import hashlib
from pathlib import Path
from datetime import datetime
import argparse

# 기존 파서 모듈 import
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from parsers.advanced_parser import parse_pdf, parse_docx, parse_pptx, parse_xlsx

def get_file_hash(file_path):
    """파일 해시 계산 (변경 감지용)"""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def load_processing_log():
    """처리 로그 로드"""
    log_path = Path('data/processed/processing_log.json')
    if log_path.exists():
        with open(log_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_processing_log(log_data):
    """처리 로그 저장"""
    log_path = Path('data/processed/processing_log.json')
    log_path.parent.mkdir(parents=True, exist_ok=True)

    with open(log_path, 'w', encoding='utf-8') as f:
        json.dump(log_data, f, ensure_ascii=False, indent=2)

def should_process_file(file_path, processing_log):
    """파일 처리 필요 여부 확인"""
    file_str = str(file_path)
    current_hash = get_file_hash(file_path)

    # 메모 파일 제외
    if file_path.name.startswith('_') and file_path.suffix == '.md':
        return False

    # 지원하는 파일 형식만
    supported_extensions = ['.pdf', '.docx', '.pptx', '.xlsx', '.md', '.mdx', '.js', '.ts']
    if file_path.suffix.lower() not in supported_extensions:
        return False

    # 로그에 없거나 해시가 다르면 처리 필요
    if file_str not in processing_log:
        return True

    return processing_log[file_str].get('hash') != current_hash

def parse_single_file(file_path):
    """단일 파일 파싱"""
    print(f"파싱 중: {file_path}")

    try:
        file_ext = file_path.suffix.lower()

        if file_ext == '.pdf':
            result = parse_pdf(str(file_path))
        elif file_ext == '.docx':
            result = parse_docx(str(file_path))
        elif file_ext == '.pptx':
            result = parse_pptx(str(file_path))
        elif file_ext in ['.xlsx', '.xls']:
            result = parse_xlsx(str(file_path))
        elif file_ext in ['.md', '.mdx', '.js', '.ts']:
            # 텍스트 파일은 간단히 읽기
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            result = {
                "content": content,
                "tables": [],
                "images": [],
                "metadata": {
                    "word_count": len(content.split()),
                    "char_count": len(content),
                    "file_type": file_ext[1:]
                }
            }
        else:
            raise ValueError(f"지원하지 않는 파일 형식: {file_ext}")

        # 공통 메타데이터 추가
        result.update({
            "file_path": str(file_path),
            "file_name": file_path.name,
            "parsing_method": "github_actions_python",
            "parsed_at": datetime.utcnow().isoformat(),
            "file_hash": get_file_hash(file_path)
        })

        return result

    except Exception as e:
        print(f"파싱 실패: {file_path} - {str(e)}")
        return {
            "file_path": str(file_path),
            "file_name": file_path.name,
            "parsing_method": "github_actions_python",
            "parsed_at": datetime.utcnow().isoformat(),
            "error": str(e),
            "status": "failed"
        }

def save_parsing_result(file_path, result):
    """파싱 결과 저장"""
    # 상대 경로를 processed 경로로 변환
    relative_path = file_path.relative_to('data/source')
    output_path = Path('data/processed/parsed') / relative_path.with_suffix('.json')

    # 디렉터리 생성
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # 결과 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"결과 저장: {output_path}")
    return output_path

def scan_source_files():
    """소스 파일 스캔"""
    source_path = Path('data/source')
    if not source_path.exists():
        print(f"소스 디렉터리가 없습니다: {source_path}")
        return []

    files = []
    for file_path in source_path.rglob('*'):
        if file_path.is_file():
            files.append(file_path)

    return files

def main():
    parser = argparse.ArgumentParser(description='문서 배치 파싱')
    parser.add_argument('--all', action='store_true', help='모든 파일 재파싱')
    parser.add_argument('--new-only', action='store_true', help='새로운 파일만 파싱')
    parser.add_argument('file_path', nargs='?', help='특정 파일 파싱')

    args = parser.parse_args()

    # 처리 로그 로드
    processing_log = load_processing_log()

    if args.file_path:
        # 특정 파일 처리
        file_path = Path(args.file_path)
        if not file_path.exists():
            print(f"파일이 존재하지 않습니다: {file_path}")
            sys.exit(1)

        result = parse_single_file(file_path)
        output_path = save_parsing_result(file_path, result)

        # 로그 업데이트
        processing_log[str(file_path)] = {
            "hash": result.get("file_hash"),
            "parsed_at": result.get("parsed_at"),
            "output_path": str(output_path),
            "status": "success" if "error" not in result else "failed"
        }

    else:
        # 전체 파일 스캔
        source_files = scan_source_files()
        processed_count = 0
        failed_count = 0

        for file_path in source_files:
            # 처리 필요성 확인
            if not args.all and not should_process_file(file_path, processing_log):
                continue

            result = parse_single_file(file_path)
            output_path = save_parsing_result(file_path, result)

            # 로그 업데이트
            processing_log[str(file_path)] = {
                "hash": result.get("file_hash"),
                "parsed_at": result.get("parsed_at"),
                "output_path": str(output_path),
                "status": "success" if "error" not in result else "failed"
            }

            if "error" in result:
                failed_count += 1
            else:
                processed_count += 1

        print(f"\n처리 완료: 성공 {processed_count}개, 실패 {failed_count}개")

    # 처리 로그 저장
    save_processing_log(processing_log)

if __name__ == "__main__":
    main()