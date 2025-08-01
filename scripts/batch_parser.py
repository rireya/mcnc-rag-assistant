def should_process_file(file_path, processing_log):
    """파일 처리 필요 여부 확인 (개선된 버전)"""
    file_str = str(file_path)
    file_name = file_path.name

    # 1. 메모 파일 제외 (우선 확인)
    if file_name.startswith('_') and file_path.suffix.lower() in ['.md', '.mdx']:
        print(f"메모 파일 제외: {file_path}")
        return False

    # 2. 지원하는 파일 형식만
    supported_extensions = ['.pdf', '.docx', '.pptx', '.xlsx', '.md', '.mdx', '.js', '.ts']
    if file_path.suffix.lower() not in supported_extensions:
        return False

    # 3. 시스템 파일 제외
    system_files = ['.DS_Store', 'Thumbs.db', '.gitkeep']
    if file_name in system_files:
        return False

    # 4. 해시 비교로 변경 감지
    try:
        current_hash = get_file_hash(file_path)
        if file_str not in processing_log:
            return True
        return processing_log[file_str].get('hash') != current_hash
    except Exception as e:
        print(f"해시 계산 실패: {file_path} - {str(e)}")
        return True  # 오류 시 처리 시도

def scan_source_files():
    """소스 파일 스캔 (개선된 버전)"""
    source_path = Path('data/source')
    if not source_path.exists():
        print(f"소스 디렉터리가 없습니다: {source_path}")
        return []

    files = []
    for file_path in source_path.rglob('*'):
        if file_path.is_file():
            # 미리 메모 파일 필터링
            if not (file_path.name.startswith('_') and file_path.suffix.lower() in ['.md', '.mdx']):
                files.append(file_path)
            else:
                print(f"스캔에서 제외: {file_path}")

    print(f"총 {len(files)}개 파일 스캔 완료")
    return files