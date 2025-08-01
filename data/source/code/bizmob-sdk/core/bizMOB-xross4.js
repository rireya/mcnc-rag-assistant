/**
 * <제목>bizMOB Xross4.0 Javascript Library<제목>
 * <개요>bizMOB Front Framework인 xross는 Front화면 개발시 모바일 네이티브 앱에서 제공하는 플러그인 연동을 위한 JS api Libarary다.xross.js를 직접적으로 사용하는 환경은 bizMOB 3.x에서 주로 사용하고 bizMOB4.x 부터는 웹프레임워크를 연동하여 typescript 가반의 xross디렉토리 내에 있는 class들을 사용한다.</개요>
 *
 * @namespace bizMOB
 * @version 4.0.0
 * @author mobile C&C
 *
 * @example
 * // 기본 사용법 - 환경 감지 및 파일 복사 (JavaScript)
 * if (bizMOB.Device.isApp()) {
 *   // 앱 환경에서만 사용 가능한 기능
 *   bizMOB.File.copy({
 *     _sSourcePath: '{external}/temp.png',
 *     _sTargetPath: '{internal}/images/copy.png',
 *     _fCallback: function(result) {
 *       console.log('파일 복사 완료:', result);
 *     }
 *   });
 * } else {
 *   // 웹 환경 처리
 *   console.log('웹 환경에서는 파일 시스템 접근이 제한됩니다');
 * }
 *
 * @example
 * // TypeScript 래퍼 사용법 - Promise 기반 모던 API
 * import File from '@/bizMOB/Xross/File';
 * import Device from '@/bizMOB/Xross/Device';
 *
 * const copyFiles = async () => {
 *   if (await Device.isApp()) {
 *     try {
 *       const result = await File.copy({
 *         _sSourcePath: '{external}/temp.png',
 *         _sTargetPath: '{internal}/images/copy.png',
 *         _bMock: false
 *       });
 *       console.log('파일 복사 완료:', result);
 *     } catch (error) {
 *       console.error('파일 복사 실패:', error);
 *     }
 *   }
 * };
 *
 * @example
 * // 서버 통신 JWT 토큰 자동 관리 (JavaScript)
 * bizMOB.Network.requestTr({
 *   _sTrcode: 'USER001',
 *   _oBody: { userId: 'test@example.com' },
 *   _fCallback: function(response) {
 *     if (response.header.result) {
 *       console.log('사용자 정보:', response.body);
 *     }
 *   }
 * });
 *
 * @example
 * // 서버 통신 JWT 토큰 자동 관리 (TypeScript)
 *  * import Network from '@/bizMOB/Xross/Network';
 *
 * const fetchUserData = async () => {
 *   try {
 *     const response = await Network.requestTr({
 *       _sTrcode: 'USER001',
 *       _oBody: { userId: 'test@example.com' },
 *       _bMock: false
 *     });
 *
 *     if (response.header.result) {
 *       console.log('사용자 정보:', response.body);
 *       return response.body;
 *     }
 *   } catch (error) {
 *     console.error('서버 통신 오류:', error);
 *   }
 * };
 *
 * @example
 * // 이벤트 처리 - 앱 생명주기 관리 (JavaScript)
 * bizMOB.setEvent('ready', function() {
 *   console.log('bizMOB SDK 초기화 완료');
 *   // 앱 초기화 로직
 * });
 *
 * bizMOB.setEvent('backbutton', function() {
 *   console.log('뒤로가기 버튼 감지');
 *   // 커스텀 뒤로가기 처리
 * });
 *
 * @example
 * // TypeScript 래퍼 이벤트 처리 - Promise와 타입 안전성
 * import Event from '@/bizMOB/Xross/Event';
 * import { onMounted } from 'vue';
 *
 * onMounted(() => {
 *   Event.setEvent('ready', () => {
 *     console.log('bizMOB SDK 초기화 완료');
 *     initializeApp();
 *   });
 *
 *   Event.setEvent('backbutton', () => {
 *     console.log('뒤로가기 버튼 감지');
 *     handleBackButton();
 *   });
 * });
 */
var bizMOB = new Object();

/**
 * bizMOB 클라이언트 라이브러리의 서비스 식별자
 * @type {String}
 */
bizMOB.servicename = 'bizMOB';

/**
 * Fast Storage - 앱 환경에서 Properties 데이터의 빠른 접근을 위한 메모리 캐시
 *
 * @description 앱 환경에서 bizMOB.Properties의 성능을 향상시키기 위한 JavaScript 메모리 캐시입니다.
 * Properties.set() 호출 시 네이티브 저장소와 함께 이 FStorage에도 동시에 저장되어,
 * Properties.get() 호출 시 네이티브 요청 없이 즉시 메모리에서 값을 반환할 수 있습니다.
 *
 * **동작 원리:**
 * - Properties.set(): 네이티브 저장소 + FStorage 동시 저장
 * - Properties.get(): FStorage에서 먼저 확인, 없으면 null 반환
 * - Properties.remove(): 네이티브 저장소 + FStorage 동시 삭제
 * - **Resume 복원**: 앱 resume 시점에 기기에 저장된 fStorage 데이터가 자동으로 bizMOB.FStorage에 로드됨
 *
 * **라이프사이클:**
 * - 앱 시작: 네이티브에서 저장된 Properties 데이터를 FStorage로 복원
 * - 앱 사용: Properties API 호출 시 FStorage와 네이티브 저장소 동기화
 * - 앱 종료: FStorage 메모리 해제, 네이티브 저장소는 영구 보존
 * - 앱 재시작/Resume: 네이티브 저장소에서 FStorage로 데이터 재로드
 *
 * **주의사항:**
 * - 앱 환경에서만 사용되며, 웹 환경에서는 사용되지 않음
 * - 앱 종료 시 메모리에서 사라지므로 영구 저장은 네이티브 저장소에 의존
 * - 개발자가 직접 조작하지 말고 Properties API를 통해서만 사용
 *
 * @type {Object}
 * @example
 * // ❌ 직접 사용하지 마세요
 * // bizMOB.FStorage['myKey'] = 'myValue';
 *
 * // ✅ Properties API를 사용하세요
 * bizMOB.Properties.set({ _sKey: 'myKey', _vValue: 'myValue' });
 * var value = bizMOB.Properties.get({ _sKey: 'myKey' }); // FStorage에서 빠른 조회
 */
bizMOB.FStorage = {};

/**
 * bizMOB Core 모듈의 설정 값을 설정하는 함수
 *
 * 앱/웹 환경에 따라 해당하는 Core 모듈의 config 객체에 설정 값을 병합합니다.
 * 환경별로 다른 Core 파일의 클래스 config를 관리하기 위한 통합 인터페이스입니다.
 *
 * @param {String} sTarget 대상 환경 구분 ('APP' 또는 'WEB')
 *   - 'APP': bizMOBCore (앱 환경) 모듈의 config 설정
 *   - 'WEB': bizMOBWebCore (웹 환경) 모듈의 config 설정
 * @param {String} sClassName 설정할 클래스명 (예: 'App', 'Network', 'Database' 등)
 * @param {Object} oParam 설정할 config 객체 (기존 config와 병합됨)
 *
 * @example
 * // 앱 환경의 Network 클래스 config 설정
 * bizMOB.setConfig('APP', 'Network', {
 *     _sBaseUrl: 'https://api.example.com',
 *     _bIsProxy: true
 * });
 *
 * // 웹 환경의 App 클래스 config 설정
 * bizMOB.setConfig('WEB', 'App', {
 *     _bIsRelease: false,
 *     _sAppKey: 'myAppKey123'
 * });
 */
bizMOB.setConfig = function (sTarget, sClassName, oParam) {
    switch (sTarget) {
        case 'APP':
            window.bizMOBCore[sClassName].config = Object.assign({}, window.bizMOBCore[sClassName].config, oParam);
            break;

        case 'WEB':
            window.bizMOBWebCore[sClassName].config = Object.assign({}, window.bizMOBWebCore[sClassName].config, oParam);
            break;

        default:
            break;
    }
};

/**
 * bizMOB Core 모듈의 설정 값을 조회하는 함수
 *
 * 앱/웹 환경에 따라 해당하는 Core 모듈의 config 객체를 반환합니다.
 * 환경별로 다른 Core 파일의 클래스 config를 조회하기 위한 통합 인터페이스입니다.
 *
 * @param {String} sTarget 대상 환경 구분 ('APP' 또는 'WEB')
 *   - 'APP': bizMOBCore (앱 환경) 모듈의 config 조회
 *   - 'WEB': bizMOBWebCore (웹 환경) 모듈의 config 조회
 * @param {String} sClassName 조회할 클래스명 (예: 'App', 'Network', 'Database' 등)
 *
 * @returns {Object|null} 해당 클래스의 config 객체 또는 null (잘못된 sTarget인 경우)
 *
 * @example
 * // 앱 환경의 Network 클래스 config 조회
 * var appNetworkConfig = bizMOB.getConfig('APP', 'Network');
 * console.log(appNetworkConfig._sBaseUrl);
 *
 * // 웹 환경의 App 클래스 config 조회
 * var webAppConfig = bizMOB.getConfig('WEB', 'App');
 * console.log(webAppConfig._bIsRelease);
 */
bizMOB.getConfig = function (sTarget, sClassName) {
    switch (sTarget) {
        case 'APP':
            // App Target인 경우 App Core인 경우에만 반환
            return window.bizMOBCore[sClassName].config;

        case 'WEB':
            // Web Target인 경우 Web Core인 경우에만 반환
            return window.bizMOBWebCore[sClassName].config;

        default:
            return null;
    }
};

/**
 * bizMOB 클라이언트 라이브러리 내부 Gateway 함수
 *
 * @description 이 함수는 bizMOB 클라이언트 라이브러리 내부에서 앱/웹 환경 분기 처리를 위해
 * 사용되는 내부 함수입니다. 개발자가 직접 호출할 필요는 없으며, 모든 bizMOB API 함수들이
 * 내부적으로 이 Gateway를 통해 적절한 Core 모듈의 함수를 호출합니다.
 *
 * - 앱 환경: bizMOB-core.js의 bizMOBCore 모듈 함수 호출
 * - 웹 환경: bizMOB-core-web.js의 bizMOBWebCore 모듈 함수 호출
 *
 * @internal 내부 함수 - 개발자가 직접 사용하지 마세요
 * @param {String} sClassName 호출할 Core 클래스명
 * @param {String} sMethod 호출할 Core 메서드명
 * @param {Array} aRequired 필수 파라미터 키 목록
 * @param {Object} oParam 전달할 파라미터 객체
 * @param {Boolean} [oParam._bMock] Mock 데이터 사용 여부
 * @param {Function} [oParam._fCallback] 콜백 함수
 *
 * @returns {*} Core 함수의 반환값 또는 false
 *
 * @example
 * // ❌ 개발자가 직접 호출하지 마세요
 * // bizMOB.gateway('ExtendsManager', 'executer', ['_sID'], {...});
 *
 * // ✅ 대신 공식 API를 사용하세요
 * bizMOB.App.callPlugIn('APP_UPDATE_CHECK', {
 *     callback: function(result) {
 *         console.log('플러그인 실행 결과:', result);
 *     }
 * });
 */
bizMOB.gateway = function (sClassName, sMethod, aRequired, oParam) {
    var $bizMOBCore = window.bizMOBCore.readystatus ? window.bizMOBCore : window.bizMOBWebCore;
    var required = aRequired || [];
    var param = oParam || {};
    var isMock = param._bMock || (param._oParam && param._oParam._bMock) || false; // mock 데이터 호출 여부 (callPlugin 까지 고려)
    var isRelease = $bizMOBCore.App.config._bRelease || false; // Release 모드 여부

    // 필수 파라미터 check
    if ($bizMOBCore.Module.checkParam(param, required)) {
        // Service Call
        try {
            // Mock 데이터 호출 여부 (Release 모드가 아닌 경우에만 호출)
            if (isMock && !isRelease) {
                window.bizMOBWebCore.Http.requestMock(sClassName, sMethod, param);
            }
            // Logger 호출
            else if (sMethod === 'logger') {
                $bizMOBCore[sClassName][sMethod](param._sService, param._sAction, param._sLogType, param._sMessage);
            }
            // Core 함수 호출
            else {
                return $bizMOBCore[sClassName][sMethod](param);
            }
        }
        // 지원하지 않는 서비스인 경우
        catch (error) {
            var call = param._fCallback || param.callback || null;
            $bizMOBCore.Module.logger('bizMOB', 'gateway', 'W', 'This feature is not supported. - ' + sClassName + '.' + sMethod);

            // 이벤트 추가 관련은 callback 실행하지 않음
            if (sClassName !== 'EventManager') {
                call && call({ result: false, type: $bizMOBCore.name === 'bizMOBCore' ? 'app' : 'web' });
            }
        }
    }
    else {
        return false;
    }
};

/**
 * Native 이벤트 리스너를 등록하는 함수
 *
 * 앱/웹 환경에 따라 해당하는 EventManager를 통해 이벤트를 등록합니다.
 * - 앱 환경: bizMOBCore.EventManager.set 호출
 * - 웹 환경: bizMOBWebCore.EventManager.set 호출 (웹에서는 즉시 실행되는 이벤트도 존재)
 *
 * @param {String} sEvent Native 이벤트명
 *   - 'open': 페이지(웹뷰)를 열었을 때 발생하는 이벤트
 *   - 'close': 페이지(웹뷰)를 닫았을 때 발생하는 이벤트
 *   - 'beforeready': 페이지(웹뷰)가 로드되기 전에 발생하는 이벤트
 *   - 'ready': 페이지(웹뷰)가 로드되었을 때 발생하는 이벤트
 *   - 'backbutton': Back Button이 눌러졌을 때 발생하는 이벤트 (Android 전용)
 *   - 'resume': 페이지(웹뷰)가 활성화 되었을 때 발생하는 이벤트 (포커스, 화면 표시시)
 *   - 'push': Push 메세지를 수신하였을 때 발생하는 이벤트
 *   - 'networkstatechange': 네트워크 상태가 변경되었을 때 발생하는 이벤트
 *   - 'sessiontimeout': 세션 타임아웃이 발생했을 때의 이벤트
 * @param {Function} fCallback 이벤트 발생시 실행될 콜백 함수
 *
 * @example
 * // 페이지 로드 완료 이벤트 등록
 * bizMOB.setEvent('ready', function() {
 *     console.log('페이지가 로드되었습니다!');
 *     // 초기화 코드 실행
 * });
 *
 * // 페이지 열림 이벤트 등록
 * bizMOB.setEvent('open', function() {
 *     console.log('페이지가 열렸습니다');
 * });
 *
 * // 백버튼 이벤트 등록 (Android)
 * bizMOB.setEvent('backbutton', function() {
 *     console.log('백버튼이 눌렸습니다');
 *     // 백버튼 처리 로직
 * });
 *
 * // 푸시 메시지 수신 이벤트 등록
 * bizMOB.setEvent('push', function(pushData) {
 *     console.log('푸시 메시지 수신:', pushData);
 *     // 푸시 메시지 처리 로직
 * });
 *
 * // 네트워크 상태 변경 이벤트 등록
 * bizMOB.setEvent('networkstatechange', function(networkState) {
 *     console.log('네트워크 상태 변경:', networkState);
 *     // 네트워크 상태에 따른 처리
 * });
 */
bizMOB.setEvent = function (sEvent, fCallback) {
    if (bizMOB.Device.isApp()) {
        window.bizMOBCore.EventManager.set({ _sEvent: sEvent, _fCallback: fCallback });
    }
    else {
        window.bizMOBWebCore.EventManager.set({ _sEvent: sEvent, _fCallback: fCallback });
    }
};

/**
 * Native 이벤트 리스너를 제거하는 함수
 *
 * 등록된 Native 이벤트 리스너를 제거하여 더 이상 해당 이벤트가 발생해도 콜백이 실행되지 않습니다.
 * 앱/웹 환경에 따라 해당하는 EventManager.clear를 통해 이벤트를 제거합니다.
 *
 * @param {String} sEvent 제거할 Native 이벤트명
 *   - 'open': 페이지(웹뷰) 열림 이벤트
 *   - 'close': 페이지(웹뷰) 닫힘 이벤트
 *   - 'beforeready': 페이지(웹뷰) 로드 전 이벤트
 *   - 'ready': 페이지(웹뷰) 로드 완료 이벤트
 *   - 'backbutton': Back Button 이벤트 (Android 전용)
 *   - 'resume': 페이지(웹뷰) 활성화 이벤트
 *   - 'push': Push 메세지 수신 이벤트
 *   - 'networkstatechange': 네트워크 상태 변경 이벤트
 *   - 'sessiontimeout': 세션 타임아웃 이벤트
 *
 * @example
 * // ready 이벤트 리스너 제거
 * bizMOB.clearEvent('ready');
 *
 * // 백버튼 이벤트 리스너 제거
 * bizMOB.clearEvent('backbutton');
 *
 * // 푸시 이벤트 리스너 제거
 * bizMOB.clearEvent('push');
 *
 * // 네트워크 상태 변경 이벤트 리스너 제거
 * bizMOB.clearEvent('networkstatechange');
 */
bizMOB.clearEvent = function (sEvent) {
    bizMOB.gateway('EventManager', 'clear', ['_sEvent'], { _sEvent: sEvent });
};

/**
 * Logger - Cross-Platform 로깅 및 디버깅 시스템
 *
 * @description bizMOB 애플리케이션에서 로그 메시지를 기록하고 관리하는 통합 로깅 시스템입니다.
 * 앱과 웹 환경에서 서로 다른 로깅 메커니즘을 사용하여 개발자에게 일관된 로깅 인터페이스를 제공합니다.
 * 로그 레벨별 필터링과 환경별 최적화된 출력 방식을 지원합니다.
 *
 * **주요 기능:**
 * - 레벨별 로그 메시지 기록 (info, log, warn, debug, error)
 * - 환경별 최적화된 로그 출력 시스템
 * - 릴리즈 빌드에서 로그 출력 제어
 * - 구조화된 로그 메시지 포맷팅
 *
 * **환경별 동작:**
 * - **앱 환경**: Native 로그 시스템 사용, OS별 로그 파일 저장, 외부 로그 수집 도구 연동 가능
 * - **웹 환경**: 브라우저 콘솔 출력, 컬러 스타일링 지원, 개발자 도구 통합
 *
 * @class bizMOB.Logger
 */
bizMOB.Logger = new Object();

/**
 * 정보성 로그 메시지 기록
 *
 * @description 일반적인 정보나 애플리케이션의 정상적인 동작을 기록할 때 사용합니다.
 * 사용자 액션, 시스템 상태 변경 등의 중요한 정보를 기록하는데 적합합니다.
 *
 * @param {String} sMessage 기록할 로그 메시지
 * @example
 * bizMOB.Logger.info('사용자 로그인 성공');
 */
bizMOB.Logger.info = function (sMessage) {
    bizMOB.gateway('Module', 'logger', [], { _sService: 'Page', _sAction: 'info', _sLogType: 'I', _sMessage: sMessage });
};

/**
 * 일반 로그 메시지 기록
 *
 * @description 개발 과정에서 추적이 필요한 일반적인 동작이나 상태를 기록할 때 사용합니다.
 * 디버깅보다는 가벼운 수준의 정보를 기록하는데 적합합니다.
 *
 * @param {String} sMessage 기록할 로그 메시지
 * @example
 * bizMOB.Logger.log('페이지 로드 시작');
 */
bizMOB.Logger.log = function (sMessage) {
    bizMOB.gateway('Module', 'logger', [], { _sService: 'Page', _sAction: 'log', _sLogType: 'L', _sMessage: sMessage });
};

/**
 * 경고 로그 메시지 기록
 *
 * @description 애플리케이션이 정상 동작하지만 주의가 필요한 상황을 기록할 때 사용합니다.
 * 잠재적인 문제나 예상치 못한 상황, 성능 이슈 등을 알릴 때 적합합니다.
 *
 * @param {String} sMessage 기록할 경고 메시지
 * @example
 * bizMOB.Logger.warn('네트워크 응답 시간이 길어집니다 (5초 초과)');
 */
bizMOB.Logger.warn = function (sMessage) {
    bizMOB.gateway('Module', 'logger', [], { _sService: 'Page', _sAction: 'warn', _sLogType: 'W', _sMessage: sMessage });
};

/**
 * 디버그 로그 메시지 기록
 *
 * @description 개발 및 디버깅 과정에서 상세한 정보를 추적할 때 사용합니다.
 * 변수값, 함수 호출 순서, 상태 변화 등 개발자가 문제를 진단하는데 필요한 정보를 기록합니다.
 * 일반적으로 개발 환경에서만 활성화되며, 운영 환경에서는 비활성화됩니다.
 *
 * @param {String} sMessage 기록할 디버그 메시지
 * @example
 * bizMOB.Logger.debug('함수 호출: getUserData() 시작');
 */
bizMOB.Logger.debug = function (sMessage) {
    bizMOB.gateway('Module', 'logger', [], { _sService: 'Page', _sAction: 'debug', _sLogType: 'D', _sMessage: sMessage });
};

/**
 * 오류 로그 메시지 기록
 *
 * @description 애플리케이션에서 발생한 오류나 예외 상황을 기록할 때 사용합니다.
 * 시스템 에러, API 호출 실패, 예외 처리, 치명적인 문제 등을 기록하여
 * 문제 해결과 시스템 안정성 향상에 활용합니다.
 *
 * @param {String} sMessage 기록할 오류 메시지
 * @example
 * bizMOB.Logger.error('파일 업로드 실패: ' + error.message);
 */
bizMOB.Logger.error = function (sMessage) {
    bizMOB.gateway('Module', 'logger', [], { _sService: 'Page', _sAction: 'error', _sLogType: 'E', _sMessage: sMessage });
};

/**
 * Storage - Session 기반 임시 데이터 저장소
 *
 * @description 애플리케이션 세션 동안 임시 데이터를 저장하고 관리하는 휘발성 저장소입니다.
 * 앱과 웹 환경 모두에서 sessionStorage API를 직접 사용하여 일관된 동작을 보장합니다.
 * 애플리케이션 종료 시 자동으로 데이터가 삭제되는 특성을 가집니다.
 *
 * **주요 기능:**
 * - 키-값 쌍 기반 임시 데이터 저장
 * - 세션 기반 자동 데이터 정리
 * - JSON 직렬화/역직렬화 자동 처리
 * - 앱/웹 환경 통합 인터페이스
 *
 * **환경별 동작:**
 * - **앱 환경**: sessionStorage API 직접 사용, 웹뷰 세션과 연동
 * - **웹 환경**: 브라우저 sessionStorage 직접 사용, 탭 단위 격리
 *
 * @class bizMOB.Storage
 */
bizMOB.Storage = new Object();

/**
 * Storage 데이터 저장
 *
 * @param {String} _sKey 저장할 값의 키
 * @param {Variable} _vValue 저장할 값
 * @example
 * // 문자열 데이터 저장
 * bizMOB.Storage.set({ _sKey: 'username', _vValue: '홍길동' });
 *
 * // 객체 데이터 저장
 * bizMOB.Storage.set({
 *   _sKey: 'user_info',
 *   _vValue: { name: '홍길동', age: 30, role: 'admin' }
 * });
 *
 * // 배열 데이터 저장
 * bizMOB.Storage.set({
 *   _sKey: 'menu_items',
 *   _vValue: ['홈', '설정', '로그아웃']
 * });
 */
bizMOB.Storage.set = function () {
    bizMOB.gateway('Storage', 'set', ['_sKey', '_vValue'], arguments[0]);
};

/**
 * Storage 복수 데이터 저장
 *
 * @param {Array} _aList 저장할 데이터들의 배열
 * @example
 * // 여러 데이터를 한 번에 저장
 * bizMOB.Storage.setList({
 *   _aList: [
 *     { key: 'username', value: '홍길동' },
 *     { key: 'theme', value: 'dark' },
 *     { key: 'language', value: 'ko' }
 *   ]
 * });
 *
 * // 설정값들을 일괄 저장
 * bizMOB.Storage.setList({
 *   _aList: [
 *     { key: 'app_version', value: '1.0.0' },
 *     { key: 'last_login', value: new Date().toISOString() }
 *   ]
 * });
 */
bizMOB.Storage.setList = function () {
    bizMOB.gateway('Storage', 'set', ['_aList'], arguments[0]);
};

/**
 * Storage 데이터 불러오기
 *
 * @param {String} _sKey 저장 값의 키
 * @returns {*} 저장된 데이터 값. 키가 존재하지 않으면 null 반환
 *
 * @example
 * // 기본 사용법
 * var userData = bizMOB.Storage.get({ _sKey: 'user_info' });
 * if (userData) {
 *   console.log('사용자 정보:', userData);
 * }
 *
 * // 객체 데이터 조회
 * var settings = bizMOB.Storage.get({ _sKey: 'app_settings' });
 * console.log('앱 설정:', settings);
 */
bizMOB.Storage.get = function () {
    return bizMOB.gateway('Storage', 'get', ['_sKey'], arguments[0]);
};


/**
 * Storage 데이터 삭제
 *
 * @param {String} _sKey 저장 값의 키
 * @example
 * // 특정 키의 데이터 삭제
 * bizMOB.Storage.remove({ _sKey: 'temp_data' });
 *
 * // 사용자 정보 삭제
 * bizMOB.Storage.remove({ _sKey: 'user_session' });
 *
 * // 임시 설정값 삭제
 * bizMOB.Storage.remove({ _sKey: 'form_draft' });
 */
bizMOB.Storage.remove = function () {
    bizMOB.gateway('Storage', 'remove', ['_sKey'], arguments[0]);
};

/**
 * Properties - 영구 데이터 저장소 및 설정 관리 시스템
 *
 * @description 애플리케이션 설정과 영구 보존이 필요한 데이터를 저장하고 관리하는 시스템입니다.
 * 앱 재시작 후에도 데이터가 유지되며, 앱 환경에서는 FStorage 메모리 캐시를 통해
 * 성능을 최적화합니다. 웹 환경에서는 브라우저의 localStorage를 활용합니다.
 *
 * **주요 기능:**
 * - 영구 키-값 쌍 데이터 저장
 * - FStorage 메모리 캐시를 통한 빠른 데이터 접근 (앱 환경)
 * - JSON 객체 및 배열 자동 직렬화/역직렬화
 * - 앱 Resume 시 자동 데이터 복원
 *
 * **환경별 동작:**
 * - **앱 환경**: Native File Storage + FStorage 메모리 캐시 이중 저장, Resume 시 자동 복원
 * - **웹 환경**: localStorage 브라우저 저장소 직접 사용, 도메인별 격리
 *
 * **⚠️ 중요 주의사항:**
 * - FStorage는 bizMOB 라이브러리 내부에서만 사용되는 메모리 캐시 시스템입니다
 * - 개발자가 FStorage에 직접 접근하거나 조작하는 것은 금지되어 있습니다
 * - 모든 영구 데이터 저장은 반드시 bizMOB.Properties API를 통해서만 수행해야 합니다
 *
 * @class bizMOB.Properties
 */
bizMOB.Properties = new Object();

/**
 * Properties 데이터 저장
 *
 * @param {String} _sKey 저장할 값의 키
 * @param {Variable} _vValue 저장할 값
 * @example
 * // 사용자 토큰 저장 (영구 보관)
 * bizMOB.Properties.set({ _sKey: 'auth_token', _vValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' });
 *
 * // 앱 설정 저장
 * bizMOB.Properties.set({
 *   _sKey: 'app_settings',
 *   _vValue: { theme: 'dark', notification: true, language: 'ko' }
 * });
 *
 * // 서버 URL 저장
 * bizMOB.Properties.set({ _sKey: 'server_url', _vValue: 'https://api.example.com' });
 */
bizMOB.Properties.set = function () {
    bizMOB.gateway('Properties', 'set', ['_sKey', '_vValue'], arguments[0]);
};

/**
 * Properties 복수 데이터 저장.
 *
 * @param {Array} _aList 저장할 데이터들의 배열
 * @example
 * // 초기 설정값들을 일괄 저장
 * bizMOB.Properties.setList({
 *   _aList: [
 *     { key: 'user_id', value: 'user@example.com' },
 *     { key: 'login_type', value: 'email' },
 *     { key: 'auto_login', value: true }
 *   ]
 * });
 *
 * // 앱 구성 정보를 영구 저장
 * bizMOB.Properties.setList({
 *   _aList: [
 *     { key: 'app_version', value: '2.1.0' },
 *     { key: 'first_run', value: false },
 *     { key: 'terms_agreed', value: true }
 *   ]
 * });
 */
bizMOB.Properties.setList = function () {
    bizMOB.gateway('Properties', 'set', ['_aList'], arguments[0]);
};

/**
 * Properties 데이터 불러오기
 *
 * @description 앱 환경에서는 FStorage 메모리 캐시를 통해 빠른 조회가 가능하며,
 * 웹 환경에서는 로컬스토리지에서 데이터를 조회합니다.
 *
 * @param {String} _sKey 저장 값의 키
 * @returns {*} 저장된 데이터 값. 키가 존재하지 않으면 null 반환
 *
 * @example
 * // 기본 사용법
 * var token = bizMOB.Properties.get({ _sKey: 'auth_token' });
 * if (token) {
 *   console.log('인증 토큰:', token);
 * }
 *
 * // 설정값 조회
 * var serverUrl = bizMOB.Properties.get({ _sKey: 'server_url' });
 * console.log('서버 URL:', serverUrl);
 *
 * // 앱 환경에서는 FStorage에서 빠른 조회
 * var userPrefs = bizMOB.Properties.get({ _sKey: 'user_preferences' });
 */
bizMOB.Properties.get = function () {
    return bizMOB.gateway('Properties', 'get', ['_sKey'], arguments[0]);
};

/**
 * Properties 데이터 삭제
 *
 * @param {String} _sKey 저장 값의 키
 * @example
 * // 사용자 토큰 삭제 (로그아웃 시)
 * bizMOB.Properties.remove({ _sKey: 'auth_token' });
 *
 * // 임시 설정 삭제
 * bizMOB.Properties.remove({ _sKey: 'temp_config' });
 *
 * // 사용자별 설정 초기화
 * bizMOB.Properties.remove({ _sKey: 'user_preferences' });
 */
bizMOB.Properties.remove = function () {
    return bizMOB.gateway('Properties', 'remove', ['_sKey'], arguments[0]);
};


/**
 * Network - bizMOB 서버 통신 및 HTTP 요청 관리 시스템
 *
 * @description bizMOB 서버와의 전문 통신, JWT 토큰 기반 인증, HTTP 요청을 통합 관리하는 시스템입니다.
 * 앱과 웹 환경에서 서로 다른 통신 메커니즘을 사용하며, 암호화, 토큰 갱신, 에러 처리 등을
 * 자동으로 처리합니다. 선택적으로 JWT 토큰 인증과 메시지 암호화를 지원합니다.
 *
 * **주요 기능:**
 * - bizMOB 서버 전문 통신 (requestTr, requestLogin)
 * - JWT 토큰 자동 관리 및 갱신
 * - 메시지 암호화/복호화 (선택적)
 * - RESTful HTTP API 통신 (requestHttp)
 * - 다국어 로케일 설정
 *
 * **환경별 동작:**
 * - **앱 환경**: Native HTTP 통신 + 콜백 큐 시스템, 네이티브 보안 저장소 활용
 * - **웹 환경**: fetch API + Promise 패턴, 브라우저 암호화 라이브러리 지원
 *
 * @class bizMOB.Network
 */
bizMOB.Network = new Object();

/**
 * Network 통신 시 애플리케이션 로케일(언어/지역) 변경
 *
 * @description 애플리케이션의 언어 설정을 변경하여 서버 통신 시 사용할 로케일을 설정합니다.
 * 이 함수는 앱/웹 환경에 따라 다르게 동작합니다:
 *
 * **앱 환경 (bizMOBCore)**:
 * - Native 디바이스의 언어 설정과 연동
 * - 전체 앱의 언어 환경을 변경
 * - 네이티브 UI 요소의 언어도 함께 변경됨
 *
 * **웹 환경 (bizMOBWebCore)**:
 * - 브라우저의 언어 설정을 기반으로 동작
 * - 웹 애플리케이션 내부의 언어 환경만 변경
 * - HTTP 헤더의 Accept-Language에 반영
 *
 * @param {String} _sLocaleCd 언어코드
 *   - 단순 언어코드: 'ko', 'en', 'ja', 'zh' 등
 *   - 전체 로케일코드: 'ko-KR', 'en-US', 'ja-JP', 'zh-CN' 등
 *   - 시스템이 자동으로 적절한 전체 로케일코드로 변환
 *
 * @example
 * // 한국어로 변경
 * bizMOB.Network.changeLocale({ _sLocaleCd: 'ko' });
 *
 * // 영어(미국)로 변경
 * bizMOB.Network.changeLocale({ _sLocaleCd: 'en-US' });
 *
 * // 일본어로 변경
 * bizMOB.Network.changeLocale({ _sLocaleCd: 'ja' });
 *
 * // 중국어(간체)로 변경
 * bizMOB.Network.changeLocale({ _sLocaleCd: 'zh-CN' });
 *
 * @example
 * // 언어 변경 후 서버 통신에서 자동으로 적용
 * bizMOB.Network.changeLocale({ _sLocaleCd: 'en' });
 *
 * // 이후 모든 서버 통신에서 영어 로케일이 적용됨
 * bizMOB.Network.requestTr({
 *   _sTrcode: 'USER001',
 *   _oBody: { userId: 'test@example.com' },
 *   _fCallback: function(response) {
 *     // 서버 응답이 영어로 제공됨
 *     console.log('Response:', response);
 *   }
 * });
 */
bizMOB.Network.changeLocale = function () {
    bizMOB.gateway('Network', 'changeLocale', ['_sLocaleCd'], arguments[0]);
};

/**
 * bizMOB Server 전문 통신
 *
 * @description bizMOB 서버와 전문 기반 통신을 수행합니다.
 * JWT 토큰이 설정된 경우 자동으로 Authorization 헤더에 추가되며,
 * 암호화가 활성화된 경우 메시지 암호화를 지원합니다.
 * 토큰 없이도 기본 전문 통신이 가능합니다.
 *
 * @param {String} _sTrcode bizMOB Server 인증 전문코드
 * @param {String} _oHeader bizMOB Server 인증 전문 Header 객체
 * @param {String} _oBody bizMOB Server 인증 전문 Body 객체
 * @param {Boolean} _bProgressEnable (default:true) 서버에 통신 요청시 progress 표시 여부( true 또는 false )
 * @param {Number} _nTimeout (default: 60) 서버에 통신 요청시 timeout 시간 (sec)
 * @param {Function} _fCallback 서버와 통신 후 실행될 callback 함수
 * @callback _fCallback
 * @param {Object} response - 서버 통신 결과
 * @param {Object} response.header - 응답 헤더
 * @param {boolean} response.header.result - 성공 여부
 * @param {string} response.header.error_code - 에러 코드
 * @param {string} response.header.error_text - 에러 메시지
 * @param {string} response.header.trcode - 트랜잭션 코드
 * @param {Object} response.body - 응답 본문 (비즈니스 로직에 따라 구조가 달라짐)
 *
 * @example
 * // 기본 전문 통신 (JWT 토큰 없이)
 * bizMOB.Network.requestTr({
 *   _sTrcode: 'USER001',
 *   _oBody: { userId: 'test@example.com' },
 *   _fCallback: function(response) {
 *     if (response.header.result) {
 *       console.log('Success:', response.body);
 *     }
 *   }
 * });
 *
 * @example
 * // JWT 토큰 자동 적용 (토큰이 설정된 경우)
 * bizMOB.Network.requestTr({
 *   _sTrcode: 'USER002',
 *   _oHeader: { customField: 'value' },
 *   _oBody: { data: 'example' },
 *   _nTimeout: 30,
 *   _fCallback: function(response) {
 *     // 자동으로 Authorization: Bearer [token] 헤더 추가됨
 *     console.log(response);
 *   }
 * });
 */

bizMOB.Network.requestTr = function () {
    bizMOB.gateway('Network', 'requestTr', ['_sTrcode'], arguments[0]);
};

/**
 * bizMOB Server 로그인(인증)전문 통신
 *
 * @description bizMOB 서버 로그인 인증을 수행합니다.
 * 성공 시 JWT Access Token과 Refresh Token을 반환하며,
 * 이후 requestTr 호출 시 자동으로 Authorization 헤더에 적용됩니다.
 * 레거시 시스템과의 통합을 위해 기존 로그인 전문을 감싸서 처리합니다.
 *
 * @param {String} _sUserId 인증 받을 사용자 아이디
 * @param {String} _sPassword 인증 받을 사용자 패스워드
 * @param {String} _sTrcode 레거시 로그인 인증 전문코드
 * @param {String} _oHeader 레거시 로그인 인증 전문 Header 객체
 * @param {String} _oBody 레거시 로그인 인증 전문 Body 객체
 * @param {Boolean} _bProgressEnable (default:true) 서버에 통신 요청시 progress 표시 여부( true 또는 false )
 * @param {Number} _nTimeout (default: 60) 서버에 통신 요청시 timeout 시간 (sec)
 * @param {Function} _fCallback 서버와 통신 후 실행될 callback 함수
 * @callback _fCallback
 * @param {Object} response - 로그인 통신 결과
 * @param {Object} response.header - 응답 헤더
 * @param {boolean} response.header.result - 성공 여부
 * @param {string} response.header.error_code - 에러 코드
 * @param {string} response.header.error_text - 에러 메시지
 * @param {string} response.header.trcode - 트랜잭션 코드
 * @param {boolean} response.header.content_update_flag - 컨텐츠 업데이트 플래그
 * @param {boolean} response.header.emergency_flag - 긴급 플래그
 * @param {string} response.header.info_text - 정보 텍스트
 * @param {string} response.header.login_session_id - 로그인 세션 ID
 * @param {string} response.header.message_version - 메시지 버전
 * @param {number} response.header.content_major_version - 컨텐츠 메이저 버전
 * @param {number} response.header.content_minor_version - 컨텐츠 마이너 버전
 * @param {Object} response.body - 응답 본문 (비즈니스 로직에 따라 구조가 달라짐)
 * @param {string} response.body.accessToken - JWT Access Token (웹 환경)
 * @param {string} response.body.refreshToken - JWT Refresh Token (웹 환경)
 * @param {number} response.body.accessTokenExpTime - Access Token 만료 시간 (웹 환경)
 * @param {number} response.body.refreshTokenExpTime - Refresh Token 만료 시간 (웹 환경)
 *
 * @example
 * // 기본 로그인 (레거시 시스템 연동)
 * bizMOB.Network.requestLogin({
 *   _sTrcode: 'DM0001',
 *   _sUserId: 'user@example.com', // 레거시 시스템용
 *   _sPassword: 'password123', // 레거시 시스템용
 *   _oBody: { userId: 'test', password: 'password123' }, // bizMOB 시스템용
 *   _fCallback: function(response) {
 *     if (response.header.result) {
 *       // 웹 환경: JWT 토큰 자동 저장됨
 *       // 앱 환경: 세션 정보 저장됨
 *       console.log('Login success:', response.body);
 *     }
 *   }
 * });
 *
 * @example
 * // 로그인 후 자동 토큰 적용 확인
 * bizMOB.Network.requestLogin({
 *   _sTrcode: 'DM0001',
 *   _sUserId: '',
 *   _sPassword: '',
 *   _oBody: { userId: 'admin', password: 'admin123' }, // bizMOB 시스템용
 *   _fCallback: function(response) {
 *     if (response.header.result) {
 *       // 이후 requestTr 호출 시 JWT 토큰 자동 적용
 *       bizMOB.Network.requestTr({
 *         _sTrcode: 'DM0002',
 *         _fCallback: function(userResponse) {
 *           // Authorization 헤더 자동 추가됨
 *           console.log(userResponse);
 *         }
 *       });
 *     }
 *   }
 * });
 */
bizMOB.Network.requestLogin = function () {
    bizMOB.gateway('Network', 'requestLogin', ['_sUserId', '_sPassword'], arguments[0]);
};

/**
 * API 서버 통신
 *
 * @param {String} _sUrl 서버 URL
 * @param {String} _sMethod 통신 방식 (get, post)
 * @param {String} _oHeader Http Header
 * @param {String} _oBody Http Body
 * @param {Boolean} _bProgressEnable (default:true) 서버에 통신 요청시 progress 표시 여부( true 또는 false )
 * @param {Number} _nTimeout (default: 60) 서버에 통신 요청시 timeout 시간 (sec)
 * @param {Function} _fCallback 서버와 통신 후 실행될 callback 함수
 * @callback _fCallback
 * @param {Object} response - HTTP 통신 결과
 * @param {boolean} response.result - 성공 여부
 * @param {Object} response.data - 응답 데이터 (API에 따라 구조가 달라짐)
 * @param {number} response.status - HTTP 상태 코드
 * @param {Object} response.headers - 응답 헤더
 * @example
 * // GET 요청으로 사용자 목록 조회
 * bizMOB.Network.requestHttp({
 *   _sUrl: 'https://api.example.com/users',
 *   _sMethod: 'get',
 *   _oHeader: { 'Accept': 'application/json' },
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('사용자 목록:', response.data);
 *     }
 *   }
 * });
 *
 * // POST 요청으로 데이터 전송
 * bizMOB.Network.requestHttp({
 *   _sUrl: 'https://api.example.com/users',
 *   _sMethod: 'post',
 *   _oHeader: { 'Content-Type': 'application/json' },
 *   _oBody: JSON.stringify({ name: '홍길동', email: 'hong@example.com' }),
 *   _nTimeout: 30,
 *   _fCallback: function(response) {
 *     console.log('생성 결과:', response);
 *   }
 * });
 */

bizMOB.Network.requestHttp = function () {
    bizMOB.gateway('Network', 'requestHttp', ['_sUrl', '_sMethod'], arguments[0]);
};

/**
 * System - 운영체제 및 디바이스 기능 통합 관리 시스템
 *
 * @description 모바일 디바이스의 Native 기능들(전화, 카메라, GPS, 브라우저 등)에 접근하고
 * 제어하는 시스템입니다. 앱 환경에서는 모든 Native API를 지원하며, 웹 환경에서는
 * 브라우저에서 지원 가능한 기능들만 제한적으로 제공합니다.
 *
 * **주요 기능:**
 * - 전화 걸기 및 SMS 발송
 * - 카메라 촬영 및 갤러리 접근
 * - GPS 위치 정보 조회
 * - 지도 앱 연동 및 브라우저 호출
 * - 외부 애플리케이션 연동
 *
 * **환경별 동작:**
 * - **앱 환경**: 모든 Native API 완전 지원, 디바이스 권한 관리 연동
 * - **웹 환경**: getGPS만 브라우저 Geolocation API로 제한적 지원, 나머지 기능은 기본 구조만 제공
 *
 * @class bizMOB.System
 */
bizMOB.System = new Object();

/**
 * 전화걸기
 *
 * @param {String} _sNumber 전화번호
 * @param {Function} _fCallback 실행후 결과를 처리할 callback 함수
 * @callback _fCallback
 * @param {Object} response - 전화걸기 결과
 * @param {boolean} response.result - 성공 여부
 * @param {Object} response.data - 응답 데이터
 * @example
 * // 전화번호로 전화걸기
 * bizMOB.System.callTEL({
 *   _sNumber: '010-1234-5678',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('전화 앱이 실행되었습니다');
 *     } else {
 *       console.log('전화걸기 실패');
 *     }
 *   }
 * });
 *
 * // 긴급전화 걸기
 * bizMOB.System.callTEL({
 *   _sNumber: '119',
 *   _fCallback: function(response) {
 *     console.log('긴급전화 실행 결과:', response);
 *   }
 * });
 */
bizMOB.System.callTEL = function () {
    bizMOB.gateway('System', 'callTEL', ['_sNumber'], arguments[0]);
};

/**
 * 문자보내기
 *
 * @param {Array} _aNumber 메세지를 보낼 전화번호 배열
 * @param {String} _sMessage 보낼 메세지
 * @param {Function} _fCallback 실행후 결과를 처리할 callback 함수
 * @callback _fCallback
 * @param {Object} response - 문자보내기 결과
 * @param {boolean} response.result - 성공 여부
 * @param {Object} response.data - 응답 데이터
 * @example
 * // 단일 수신자에게 문자 발송
 * bizMOB.System.callSMS({
 *   _aNumber: ['010-1234-5678'],
 *   _sMessage: '안녕하세요. 테스트 메시지입니다.',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('문자 앱이 실행되었습니다');
 *     }
 *   }
 * });
 *
 * // 여러 수신자에게 문자 발송
 * bizMOB.System.callSMS({
 *   _aNumber: ['010-1111-2222', '010-3333-4444'],
 *   _sMessage: '회의 알림: 오늘 오후 2시 회의실에서 회의가 있습니다.',
 *   _fCallback: function(response) {
 *     console.log('문자 발송 결과:', response);
 *   }
 * });
 */
bizMOB.System.callSMS = function () {
    bizMOB.gateway('System', 'callSMS', ['_aNumber'], arguments[0]);
};

/**
 * 단말기 설치된 브라우져 열기
 *
 * @param {String} _sURL 열어볼 URL 주소
 * @param {Function} _fCallback 브라우저 열기 후 결과를 처리할 callback 함수
 * @callback _fCallback
 * @param {Object} response - 브라우저 열기 결과
 * @param {boolean} response.result - 성공 여부
 * @param {Object} response.data - 응답 데이터
 * @example
 * // 웹사이트 열기
 * bizMOB.System.callBrowser({
 *   _sURL: 'https://www.google.com',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('브라우저가 실행되었습니다');
 *     }
 *   }
 * });
 *
 * // 특정 서비스 페이지 열기
 * bizMOB.System.callBrowser({
 *   _sURL: 'https://support.example.com/help',
 *   _fCallback: function(response) {
 *     console.log('도움말 페이지 열기 결과:', response);
 *   }
 * });
 */
bizMOB.System.callBrowser = function () {
    bizMOB.gateway('System', 'callBrowser', ['_sURL'], arguments[0]);
};

/**
 * 단말기 디바이스의 갤러리(사진앨범) 보기
 *
 * @param {String} _sType String (Default : all) 갤러리에서 불러올 미디어 타입( all, image, video )가 있습니다.
 * @param {Function} _fCallback 갤러리에서 선택한 미디어를 결과를 전달 받아서 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 갤러리 선택 결과
 * @param {Array} response.images - 선택된 이미지 목록
 * @param {string} response.images[].filename - 파일명
 * @param {number} response.images[].index - 인덱스
 * @param {string} response.images[].uri - 파일 URI
 * @param {string} response.images[].size - 파일 크기 (bytes)
 * @param {boolean} response.result - 성공 여부
 * @param {Object} response.error - 에러 정보
 * @example
 * // 모든 미디어 타입으로 갤러리 열기
 * bizMOB.System.callGallery({
 *   _sType: 'all',
 *   _fCallback: function(response) {
 *     if (response.result && response.images) {
 *       response.images.forEach(function(image) {
 *         console.log('선택된 파일:', image.filename, image.uri);
 *       });
 *     }
 *   }
 * });
 *
 * // 이미지만 선택 가능한 갤러리 열기
 * bizMOB.System.callGallery({
 *   _sType: 'image',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('선택된 이미지 수:', response.images.length);
 *     }
 *   }
 * });
 */
bizMOB.System.callGallery = function () {
    bizMOB.gateway('System', 'callGallery', ['_fCallback'], arguments[0]);
};

/**
 * 단말기 카메라 촬영
 *
 * @param {String} _sFileName 찍은 이미지를 저장할 이름
 * @param {String} _sDirectory 찍은 이미지를 저장할 경로
 * @param {Boolean} _bAutoVerticalHorizontal (Default : true) 찍은 이미지를 화면에 맞게 자동으로 회전시켜 저장할지를 설정 값
 * @param {Function} _fCallback 갤러리에서 선택한 미디어를 전달 받아서 처리하는 callback 함수
 * @callback _fCallback
 * @param {Object} response - 카메라 촬영 결과
 * @param {string} response.path - 촬영된 이미지 파일 경로
 * @param {boolean} response.result - 성공 여부
 * @example
 * // 기본 카메라 촬영
 * bizMOB.System.callCamera({
 *   _sFileName: 'photo_' + new Date().getTime() + '.jpg',
 *   _sDirectory: '{internal}/photos/',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('촬영된 이미지 경로:', response.path);
 *     } else {
 *       console.log('촬영이 취소되었습니다');
 *     }
 *   }
 * });
 *
 * // 자동 회전 비활성화로 촬영
 * bizMOB.System.callCamera({
 *   _sFileName: 'raw_photo.jpg',
 *   _sDirectory: '{external}/camera/',
 *   _bAutoVerticalHorizontal: false,
 *   _fCallback: function(response) {
 *     console.log('원본 방향 촬영 결과:', response);
 *   }
 * });
 */
bizMOB.System.callCamera = function () {
    bizMOB.gateway('System', 'callCamera', ['_fCallback'], arguments[0]);
};


/**
 * 단말기 지도 실행
 *
 * @param {String} _sLocation 위치 정보(주소, 위경도값)
 * @param {Function} _fCallback 지도 실행 후 결과를 처리할 callback 함수
 * @callback _fCallback
 * @param {Object} response - 지도 실행 결과
 * @param {boolean} response.result - 성공 여부
 * @param {Object} response.data - 응답 데이터
 * @example
 * // 주소로 지도 열기
 * bizMOB.System.callMap({
 *   _sLocation: '서울특별시 강남구 테헤란로 152',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('지도 앱이 실행되었습니다');
 *     }
 *   }
 * });
 *
 * // 위경도 좌표로 지도 열기
 * bizMOB.System.callMap({
 *   _sLocation: '37.5665, 126.9780',
 *   _fCallback: function(response) {
 *     console.log('지도 실행 결과:', response);
 *   }
 * });
 */
bizMOB.System.callMap = function () {
    bizMOB.gateway('System', 'callMap', ['_sLocation'], arguments[0]);
};

/**
 * 위치 정보 조회
 *
 * @param {String} _sLocation 위치 정보(주소, 위경도값)
 * @callback _fCallback
 * @param {Object} response - GPS 위치 정보
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.provider - GPS 제공자 (예: "fused")
 * @param {number} response.latitude - 위도
 * @param {number} response.longitude - 경도
 * @param {string} response.address - 주소
 * @param {boolean} response.gps_enabled - GPS 활성화 여부
 * @example
 * // 현재 위치 정보 조회
 * bizMOB.System.getGPS({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('현재 위치:', response.latitude, response.longitude);
 *       console.log('주소:', response.address);
 *       console.log('GPS 제공자:', response.provider);
 *     } else {
 *       console.log('GPS 권한이 없거나 위치를 가져올 수 없습니다');
 *     }
 *   }
 * });
 *
 * // GPS 상태 확인
 * bizMOB.System.getGPS({
 *   _fCallback: function(response) {
 *     if (response.gps_enabled) {
 *       console.log('GPS가 활성화되어 있습니다');
 *     } else {
 *       console.log('GPS를 활성화해 주세요');
 *     }
 *   }
 * });
 */
bizMOB.System.getGPS = function () {
    bizMOB.gateway('System', 'getGPS', ['_fCallback'], arguments[0]);
};

/**
 * Window - Native UI 컴포넌트 및 대화상자 관리 시스템
 *
 * @description 모바일 앱에서 사용할 수 있는 Native UI 컴포넌트들을 생성하고 관리하는 시스템입니다.
 * 서명패드, 이미지뷰어, 코드리더, 파일탐색기 등의 전문화된 Native Window를 제공하며,
 * 앱 환경에서만 완전한 기능을 지원합니다. 웹 환경에서는 기본 구조만 제공됩니다.
 *
 * **주요 기능:**
 * - 서명패드 (SignPad) 생성 및 이미지 저장
 * - 이미지뷰어 및 코드리더 (QR/바코드) 실행
 * - Native 대화상자 (alert, confirm, toast)
 * - 타이틀바, 툴바, 사이드바 UI 컴포넌트 생성
 * - 페이지 네비게이션 및 메시지 전달
 *
 * **환경별 동작:**
 * - **앱 환경**: 모든 Native Window 컴포넌트 완전 지원, 하드웨어 가속 UI
 * - **웹 환경**: 기본 브라우저 대화상자만 지원, Native 컴포넌트는 기본 구조만 제공
 *
 * @class bizMOB.Window
 */
bizMOB.Window = new Object();

/**
 * SignPad(서명) Window 띄우기
 *
 * @param {String} _sTargetPath 사인패드에서 서명한 이미지를 저장할 File Path.
 * @param {Function} _fCallback 사인패드 처리 결과값을 받을 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 서명 패드 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.sign_data - 서명 데이터 (Base64 인코딩)
 * @param {string} response.file_path - 서명 이미지 파일 경로
 * @example
 * // 서명패드 열기
 * bizMOB.Window.openSignPad({
 *   _sTargetPath: '{internal}/signatures/sign_' + new Date().getTime() + '.png',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('서명이 저장되었습니다:', response.file_path);
 *       console.log('서명 데이터:', response.sign_data);
 *     } else {
 *       console.log('서명이 취소되었습니다');
 *     }
 *   }
 * });
 *
 * // 계약서 서명
 * bizMOB.Window.openSignPad({
 *   _sTargetPath: '{external}/contract/signature.png',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       // 서명 완료 후 서버에 업로드
 *       console.log('계약서 서명 완료');
 *     }
 *   }
 * });
 */
bizMOB.Window.openSignPad = function () {
    bizMOB.gateway('Window', 'openSignPad', ['_sTargetPath'], arguments[0]);
};

/**
 * ImageViewer 띄우기
 *
 * @param {String} _sImagePath 이미지 뷰어로 열 이미지 File Path.
 * @param {Function} _fCallback 이미지 뷰어 Close시 결과값을 받을 callback함수.
 * @callback _fCallback
 * @param {Object} response - 이미지 뷰어 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.file_path - 이미지 파일 경로
 * @example
 * // 저장된 이미지 보기
 * bizMOB.Window.openImageViewer({
 *   _sImagePath: '{internal}/photos/image001.jpg',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('이미지 뷰어가 닫혔습니다');
 *     }
 *   }
 * });
 *
 * // 촬영한 사진 확인
 * bizMOB.Window.openImageViewer({
 *   _sImagePath: '{external}/camera/photo.png',
 *   _fCallback: function(response) {
 *     console.log('이미지 뷰어 종료:', response);
 *   }
 * });
 */
bizMOB.Window.openImageViewer = function () {
    bizMOB.gateway('Window', 'set', [], arguments[0]);
};

/**
 * CodeReader( BarCode, QRCode )  띄우기
 *
 * @param {Function} _fCallback Code 판독 결과값을 받을 callback함수.
 * @callback _fCallback
 * @param {Object} response - 코드 리더 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.result_value - 인식된 코드 값
 * @example
 * // QR코드/바코드 스캔
 * bizMOB.Window.openCodeReader({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('스캔된 코드:', response.result_value);
 *
 *       // URL인 경우 브라우저로 열기
 *       if (response.result_value.startsWith('http')) {
 *         bizMOB.System.callBrowser({
 *           _sURL: response.result_value
 *         });
 *       }
 *     } else {
 *       console.log('코드 스캔이 취소되었습니다');
 *     }
 *   }
 * });
 *
 * // 제품 바코드 스캔
 * bizMOB.Window.openCodeReader({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       // 제품 정보 조회 API 호출
 *       console.log('제품 바코드:', response.result_value);
 *     }
 *   }
 * });
 */
bizMOB.Window.openCodeReader = function () {
    bizMOB.gateway('Window', 'openCodeReader', [], arguments[0]);
};

/**
 * FileExplorer 띄우기
 *
 * @param {Function} _fCallback 탐색기에서 선택한 파일 정보 결과값을 받을 callback함수.
 * @callback _fCallback
 * @param {Object} response - 파일 탐색기 결과
 * @param {boolean} response.result - 성공 여부
 * @param {Array} response.file_path - 선택된 파일 경로 목록
 * @param {Array} response.uri_path - 선택된 파일 URI 경로 목록
 * @example
 * // 파일 선택 대화상자 열기
 * bizMOB.Window.openFileExplorer({
 *   _fCallback: function(response) {
 *     if (response.result && response.file_path) {
 *       response.file_path.forEach(function(filePath, index) {
 *         console.log('선택된 파일 ' + (index + 1) + ':', filePath);
 *         console.log('URI 경로:', response.uri_path[index]);
 *       });
 *     } else {
 *       console.log('파일 선택이 취소되었습니다');
 *     }
 *   }
 * });
 *
 * // 업로드할 파일 선택
 * bizMOB.Window.openFileExplorer({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       // 선택된 파일들을 서버에 업로드
 *       bizMOB.File.upload({
 *         _aFileList: response.file_path.map(function(path) {
 *           return { file_path: path };
 *         })
 *       });
 *     }
 *   }
 * });
 */
bizMOB.Window.openFileExplorer = function () {
    bizMOB.gateway('Window', 'openFileExplorer', ['_fCallback'], arguments[0]);
};

/**
 * App - 애플리케이션 생명주기 및 세션 관리 시스템
 *
 * @description 모바일 애플리케이션의 생명주기를 관리하고 세션 타임아웃, 앱 종료,
 * 플러그인 호출 등의 앱 레벨 기능을 제어하는 시스템입니다. 앱 환경에서는
 * Native 앱 제어 기능을 완전히 지원하며, 웹 환경에서는 기본 구조만 제공됩니다.
 *
 * **주요 기능:**
 * - 애플리케이션 종료 및 로그아웃 처리
 * - 세션 타임아웃 설정 및 관리
 * - 스플래시 화면 제어
 * - Native 플러그인 호출 및 연동
 * - 앱 상태 및 라이프사이클 관리
 *
 * **환경별 동작:**
 * - **앱 환경**: 모든 Native 앱 제어 기능 완전 지원, 스플래시 화면 및 타임아웃 관리
 * - **웹 환경**: 기본 구조만 제공, 브라우저 환경에 맞는 제한적 기능
 *
 * @class bizMOB.App
 */
bizMOB.App = new Object();

/**
 * App 종료
 *
 * @param {String} _sType (Default : kill )어플리케이션 종료 유형( logout 또는 kill )
 * @example
 * // 앱 강제 종료
 * bizMOB.App.exit({ _sType: 'kill' });
 *
 * // 로그아웃 처리 후 종료
 * bizMOB.App.exit({ _sType: 'logout' });
 *
 * // 기본 종료 (kill과 동일)
 * bizMOB.App.exit();
 */
bizMOB.App.exit = function () {
    bizMOB.gateway('App', 'exit', [], arguments[0]);
};

/**
 * App 자동 종료 시간 설정
 *
 * @param {Number} _nSeconds ( default : 7200 )어플리케이션의 세션 만료 시간(초단위) 설정 값.
 * @example
 * // 30분(1800초) 후 자동 종료 설정
 * bizMOB.App.setTimeout({ _nSeconds: 1800 });
 *
 * // 1시간(3600초) 후 자동 종료 설정
 * bizMOB.App.setTimeout({ _nSeconds: 3600 });
 *
 * // 기본값(2시간, 7200초) 설정
 * bizMOB.App.setTimeout({ _nSeconds: 7200 });
 *
 * // 세션 타임아웃 비활성화 (0으로 설정)
 * bizMOB.App.setTimeout({ _nSeconds: 0 });
 */
bizMOB.App.setTimeout = function () {
    bizMOB.gateway('App', 'requestTimeout', ['_nSeconds'], arguments[0]);
};

/**
 * App 자동 종료 설정 시간 조회
 *
 * @param {Function} _fCallback 세션 만료 시간을 받아서 처리할 Callback 함수.
 * @callback _fCallback
 * @param {Object} response - 세션 타임아웃 조회 결과
 * @param {boolean} response.result - 성공 여부
 * @param {number} response.session_timeout - 세션 만료 시간 (초)
 * @example
 * // 현재 세션 타임아웃 시간 조회
 * bizMOB.App.getTimeout({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       var timeoutMinutes = Math.floor(response.session_timeout / 60);
 *       console.log('현재 세션 타임아웃:', timeoutMinutes + '분');
 *
 *       if (response.session_timeout === 0) {
 *         console.log('세션 타임아웃이 비활성화되어 있습니다');
 *       }
 *     }
 *   }
 * });
 *
 * // 타임아웃 시간에 따른 UI 처리
 * bizMOB.App.getTimeout({
 *   _fCallback: function(response) {
 *     if (response.result && response.session_timeout > 0) {
 *       // 타이머 UI 표시
 *       startSessionTimer(response.session_timeout);
 *     }
 *   }
 * });
 */
bizMOB.App.getTimeout = function () {
    bizMOB.gateway('App', 'getTimeout', ['_fCallback'], arguments[0]);
};

/**
 * App 스플래시 화면 수동 종료
 *
 * @description 스플래시 화면의 자동 종료를 비활성화한 상태에서 수동으로 스플래시 화면을 닫는 함수.
 * 앱 초기화 로직 완료 후 호출하여 사용자에게 메인 화면을 표시한다.
 *
 * @usage
 * 1. 앱 설정에서 스플래시 자동 종료 비활성화 필요
 * 2. 초기화 로직 (데이터 로드, 설정 확인 등) 완료 후 호출
 * 3. 매개변수 및 콜백 함수 없음
 *
 * @example
 * // 앱 초기화 완료 후 스플래시 화면 닫기
 * function initializeApp() {
 *   // 초기화 로직 실행
 *   loadUserData();
 *   checkAppSettings();
 *
 *   // 초기화 완료 후 스플래시 화면 종료
 *   bizMOB.App.hideSplash();
 * }
 */
bizMOB.App.hideSplash = function () {
    bizMOB.gateway('App', 'hideSplash', [], arguments[0]);
};

/**
 * 커스텀 플러그인 호출
 *
 * @param {String} sId 커스텀으로 추가된 플러그인 Call ID.
 * @param {Object} oParam 플러그인에서 사용될 Parameters.
 * @param {Function} oParam.callback 플러그인 실행 결과를 받을 callback 함수.
 * @callback oParam.callback
 * @param {Object} response - 플러그인 실행 결과 (커스텀 데이터 포함)
 * @param {boolean} response.result - 실행 성공 여부 (항상 포함)
 * @param {...*} [response.customData] - 플러그인별 커스텀 응답 데이터 (예: isAppUpdate, storeUrl 등)
 * @example
 * // APP_UPDATE_CHECK 플러그인 호출 예시
 * bizMOB.App.callPlugIn('APP_UPDATE_CHECK', {
 *   callback: function(response) {
 *     console.log('결과:', response.result);
 *     console.log('앱 업데이트 필요:', response.isAppUpdate);
 *     console.log('스토어 URL:', response.storeUrl);
 *   }
 * });
 */
bizMOB.App.callPlugIn = function (sId, oParam) {
    bizMOB.gateway('ExtendsManager', 'executer', ['_sID'], { _sID: sId, _oParam: oParam });
};

/**
 * Contacts - 디바이스 주소록 접근 및 연락처 관리 시스템
 *
 * @description 모바일 디바이스의 주소록(연락처)에 접근하여 연락처 정보를 검색하고
 * 조회하는 시스템입니다. 앱 환경에서는 Native 주소록 API를 통해 완전한 기능을 지원하며,
 * 웹 환경에서는 보안상의 이유로 기본 구조만 제공됩니다.
 *
 * **주요 기능:**
 * - 디바이스 주소록 전체 조회
 * - 이름/전화번호 기반 연락처 검색
 * - 연락처 상세 정보 조회
 * - 연락처 권한 관리 및 접근 제어
 *
 * **환경별 동작:**
 * - **앱 환경**: Native 주소록 API 완전 지원, 연락처 권한 관리 연동
 * - **웹 환경**: 기본 구조만 제공, 브라우저 보안 정책으로 인한 접근 제한
 *
 * @class bizMOB.Contacts
 */
bizMOB.Contacts = new Object();

/**
 * 전화번호부 검색
 *
 * @param {String} _sSearchType (Default : "", 전체조회) 주소록 검색 대상 필드(name 또는 phone)
 * @param {String} _sSearchText (Default : "") 주소록 검색어
 * @param {Function} _fCallback 주소록 검색 결과를 받아 처리할 callback함수
 * @callback _fCallback
 * @param {Object} response - 전화번호부 검색 결과
 * @param {number} response.total_count - 전체 연락처 수
 * @param {number} response.contact_count - 검색된 연락처 수
 * @param {Array} response.list - 연락처 목록
 * @param {string} response.list[].fax_number - 팩스 번호
 * @param {string} response.list[].department - 부서
 * @param {string} response.list[].concurrent - 동시 연락처
 * @param {string} response.list[].company_telphone - 회사 전화번호
 * @param {string} response.list[].title - 직책
 * @param {string} response.list[].full_name - 이름
 * @param {string} response.list[].email - 이메일
 * @param {string} response.list[].mobile_number - 휴대폰 번호
 * @param {string} response.list[].company_name - 회사명
 * @param {string} response.list[].contact_uid - 연락처 UID
 * @param {string} response.list[].contact_box_id - 연락처 박스 ID
 * @example
 * // 전체 연락처 조회
 * bizMOB.Contacts.get({
 *   _fCallback: function(response) {
 *     console.log('전체 연락처 수:', response.total_count);
 *     response.list.forEach(function(contact) {
 *       console.log(contact.full_name + ': ' + contact.mobile_number);
 *     });
 *   }
 * });
 *
 * // 이름으로 연락처 검색
 * bizMOB.Contacts.get({
 *   _sSearchType: 'name',
 *   _sSearchText: '홍길동',
 *   _fCallback: function(response) {
 *     if (response.contact_count > 0) {
 *       console.log('검색된 연락처:', response.list[0].full_name);
 *       console.log('전화번호:', response.list[0].mobile_number);
 *     } else {
 *       console.log('검색 결과가 없습니다');
 *     }
 *   }
 * });
 *
 * // 전화번호로 연락처 검색
 * bizMOB.Contacts.get({
 *   _sSearchType: 'phone',
 *   _sSearchText: '010',
 *   _fCallback: function(response) {
 *     console.log('010으로 시작하는 연락처 수:', response.contact_count);
 *   }
 * });
 */
bizMOB.Contacts.get = function () {
    bizMOB.gateway('Contacts', 'get', [], arguments[0]);
};

/**
 * File - 파일시스템 및 미디어 처리 관리 시스템
 *
 * @description 모바일 디바이스의 파일시스템에 접근하여 파일 관리, 이미지 처리,
 * 압축/해제, 업로드/다운로드 등의 파일 관련 작업을 수행하는 시스템입니다.
 * 앱 환경에서는 Native 파일시스템 API를 완전히 지원하며, 웹 환경에서는 보안상 제한됩니다.
 *
 * **주요 기능:**
 * - 파일 복사, 이동, 삭제 및 정보 조회
 * - 파일 업로드/다운로드 (서버 연동)
 * - 이미지 리사이징, 회전 등 미디어 처리
 * - ZIP 압축/해제 기능
 * - 디렉토리 생성 및 관리
 *
 * **환경별 동작:**
 * - **앱 환경**: Native 파일시스템 완전 지원, 내부/외부 저장소 접근, 미디어 처리
 * - **웹 환경**: 기본 구조만 제공, 브라우저 보안 정책으로 인한 파일 시스템 접근 제한
 *
 * @class bizMOB.File
 */
bizMOB.File = new Object();

/**
 * 파일 열기
 *
 * @param {String} _sSourcePath 열어볼 파일 경로. 기본 설치App으로 연결.
 * @param {Function} _fCallback 파일을 열고 난 후 호출될 callback함수.
 * @callback _fCallback
 * @param {Object} response - 파일 열기 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.file_path - 열린 파일의 경로
 * @example
 * // PDF 파일 열기
 * bizMOB.File.open({
 *   _sSourcePath: '{internal}/documents/manual.pdf',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('파일이 열렸습니다:', response.file_path);
 *     } else {
 *       console.log('파일 열기에 실패했습니다');
 *     }
 *   }
 * });
 *
 * // 이미지 파일 기본 앱으로 열기
 * bizMOB.File.open({
 *   _sSourcePath: '{external}/photos/vacation.jpg',
 *   _fCallback: function(response) {
 *     console.log('이미지 뷰어 실행:', response);
 *   }
 * });
 */
bizMOB.File.open = function () {
    bizMOB.gateway('File', 'open', ['_sSourcePath'], arguments[0]);
};


/**
 * 파일 압축
 *
 * @param {String} _sSourcePath 소스 File Path.
 * @param {String} _sTargetPath 결과 File Path.
 * @param {Function} _fCallback 압축 후 호출될 callback함수.
 * @callback _fCallback
 * @param {Object} response - 파일 압축 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.file_path - 압축된 파일의 경로
 * @example
 * // 폴더를 ZIP 파일로 압축
 * bizMOB.File.zip({
 *   _sSourcePath: '{internal}/documents/',
 *   _sTargetPath: '{external}/backup/documents.zip',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('압축 완료:', response.file_path);
 *     } else {
 *       console.log('압축에 실패했습니다');
 *     }
 *   }
 * });
 *
 * // 단일 파일 압축
 * bizMOB.File.zip({
 *   _sSourcePath: '{internal}/logs/app.log',
 *   _sTargetPath: '{external}/archive/logs.zip',
 *   _fCallback: function(response) {
 *     console.log('로그 압축 결과:', response);
 *   }
 * });
 */
bizMOB.File.zip = function () {
    bizMOB.gateway('File', 'zip', ['_sSourcePath', '_sTargetPath'], arguments[0]);
};

/**
 * 파일 압축해제
 *
 * @param {String} _sSourcePath 소스 File Path.
 * @param {String} _sDirectory 압축 해제할 Directory Path.
 * @param {Function} _fCallback 압축 후 호출될 callback함수.
 * @callback _fCallback
 * @param {Object} response - 파일 압축해제 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.file_path - 압축해제된 파일들이 저장된 디렉토리 경로
 * @example
 * // ZIP 파일 압축해제
 * bizMOB.File.unzip({
 *   _sSourcePath: '{external}/download/data.zip',
 *   _sDirectory: '{internal}/extracted/',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('압축해제 완료:', response.file_path);
 *     } else {
 *       console.log('압축해제에 실패했습니다');
 *     }
 *   }
 * });
 *
 * // 백업 파일 복원
 * bizMOB.File.unzip({
 *   _sSourcePath: '{external}/backup/app_backup.zip',
 *   _sDirectory: '{internal}/restore/',
 *   _fCallback: function(response) {
 *     console.log('백업 복원 결과:', response);
 *   }
 * });
 */
bizMOB.File.unzip = function () {
    bizMOB.gateway('File', 'unzip', ['_sSourcePath', '_sDirectory'], arguments[0]);
};

/**
 * 파일 이동
 *
 * @param {String} _sSourcePath 소스 File Path.
 * @param {String} _sTargetPath 이동될 File Path.
 * @param {Function} _fCallback 이동 후 호출될 callback함수.
 * @callback _fCallback
 * @param {Object} response - 파일 이동 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.file_path - 이동된 파일의 경로
 * @example
 * // 파일 이동
 * bizMOB.File.move({
 *   _sSourcePath: '{external}/download/temp.pdf',
 *   _sTargetPath: '{internal}/documents/moved.pdf',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('파일이 이동되었습니다:', response.file_path);
 *     } else {
 *       console.log('파일 이동에 실패했습니다');
 *     }
 *   }
 * });
 *
 * // 임시 파일을 정식 위치로 이동
 * bizMOB.File.move({
 *   _sSourcePath: '{internal}/temp/upload.jpg',
 *   _sTargetPath: '{internal}/gallery/final.jpg',
 *   _fCallback: function(response) {
 *     console.log('파일 정리 완료:', response);
 *   }
 * });
 */
bizMOB.File.move = function () {
    bizMOB.gateway('File', 'move', ['_sSourcePath', '_sTargetPath'], arguments[0]);
};

/**
 * 파일 복사
 *
 * @param {String} _sSourcePath 소스 File Path.
 * @param {String} _sTargetPath 복사될 File Path.
 * @param {Function} _fCallback 복사 후 호출될 callback함수.
 * @callback _fCallback
 * @param {Object} response - 파일 복사 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.file_path - 복사된 파일의 경로
 * @example
 * // 파일 복사
 * bizMOB.File.copy({
 *   _sSourcePath: '{external}/temp.png',
 *   _sTargetPath: '{internal}/images/copy.png',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('파일이 복사되었습니다:', response.file_path);
 *     } else {
 *       console.log('파일 복사에 실패했습니다');
 *     }
 *   }
 * });
 *
 * // 백업 파일 생성
 * bizMOB.File.copy({
 *   _sSourcePath: '{internal}/data/important.db',
 *   _sTargetPath: '{external}/backup/important_backup.db',
 *   _fCallback: function(response) {
 *     console.log('백업 완료:', response);
 *   }
 * });
 */
bizMOB.File.copy = function () {
    bizMOB.gateway('File', 'copy', ['_sSourcePath', '_sTargetPath'], arguments[0]);
};

/**
 * 파일 삭제
 *
 * @param {Array} _aSourcePath 삭제할 File Path 목록.
 * @param {Function} _fCallback 삭제 후 호출될 callback함수.
 * @callback _fCallback
 * @param {Object} response - 파일 삭제 결과
 * @param {boolean} response.result - 성공 여부
 * @param {Array} response.list - 삭제된 파일 목록
 * @param {boolean} response.list[].result - 각 파일의 삭제 성공 여부
 * @param {string} response.list[].file_path - 삭제된 파일 경로
 * @example
 * // 단일 파일 삭제
 * bizMOB.File.remove({
 *   _aSourcePath: ['{internal}/temp/cache.tmp'],
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('파일이 삭제되었습니다');
 *     }
 *   }
 * });
 *
 * // 여러 파일 일괄 삭제
 * bizMOB.File.remove({
 *   _aSourcePath: [
 *     '{internal}/temp/file1.tmp',
 *     '{internal}/temp/file2.tmp',
 *     '{internal}/temp/file3.tmp'
 *   ],
 *   _fCallback: function(response) {
 *     response.list.forEach(function(item) {
 *       if (item.result) {
 *         console.log('삭제 완료:', item.file_path);
 *       } else {
 *         console.log('삭제 실패:', item.file_path);
 *       }
 *     });
 *   }
 * });
 */
bizMOB.File.remove = function () {
    bizMOB.gateway('File', 'remove', ['_aSourcePath'], arguments[0]);
};

/**
 * 디렉토리 정보 읽기
 *
 * @param {String} _sDirectory 읽어올 Directory Path.
 * @param {Function} _fCallback 디렉토리 정보 조회 후 호출될 callback함수.
 * @callback _fCallback
 * @param {Object} response - 디렉토리 조회 결과
 * @param {boolean} response.result - 성공 여부
 * @param {Array} response.directory_info - 디렉토리 내 파일/폴더 목록
 * @param {string} response.directory_info[].file_path - 파일/폴더 경로
 * @param {boolean} response.directory_info[].is_directory - 디렉토리 여부
 * @example
 * // 디렉토리 내용 조회
 * bizMOB.File.directory({
 *   _sDirectory: '{internal}/photos/',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       response.directory_info.forEach(function(item) {
 *         if (item.is_directory) {
 *           console.log('폴더:', item.file_path);
 *         } else {
 *           console.log('파일:', item.file_path);
 *         }
 *       });
 *     }
 *   }
 * });
 *
 * // 다운로드 폴더 파일 목록 확인
 * bizMOB.File.directory({
 *   _sDirectory: '{external}/download/',
 *   _fCallback: function(response) {
 *     console.log('다운로드 파일 수:', response.directory_info.length);
 *   }
 * });
 */
bizMOB.File.directory = function () {
    bizMOB.gateway('File', 'directory', ['_sDirectory'], arguments[0]);
};


/**
 * 파일 존재 여부 확인
 *
 * @param {String} _sSourcePath 확인할 File Path.
 * @param {Function} _fCallback 확인 후 호출될 callback함수.
 * @callback _fCallback
 * @param {Object} response - 파일 존재 여부 확인 결과
 * @param {boolean} response.result - 성공 여부 (파일 존재 시 true, 없으면 false)
 * @param {string} response.file_path - 확인한 파일 경로
 * @example
 * // 파일 존재 여부 확인
 * bizMOB.File.exist({
 *   _sSourcePath: '{internal}/config/settings.json',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('파일이 존재합니다:', response.file_path);
 *     } else {
 *       console.log('파일이 존재하지 않습니다');
 *     }
 *   }
 * });
 *
 * // 백업 파일 확인 후 처리
 * bizMOB.File.exist({
 *   _sSourcePath: '{external}/backup/data.bak',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       // 백업 파일이 있으면 복원 진행
 *       console.log('백업 파일 발견, 복원을 시작합니다');
 *     } else {
 *       console.log('백업 파일이 없습니다');
 *     }
 *   }
 * });
 */
bizMOB.File.exist = function () {
    bizMOB.gateway('File', 'exist', ['_sSourcePath'], arguments[0]);
};

/**
 * 파일 다운로드
 *
 * @param {Array} _aFileList 다운로드할 URL 주소 목록.
 * @param {String} _sMode 파일 다운로드 모드. (background 또는 foreground ).
 * @param {String} _sProgressBar 다운로드할 때 프로그래스바 설정 값.( off , each, full )
 * @param {Function} _fCallback 결과를 받을 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 다운로드 결과
 * @param {boolean} response.result - 성공 여부
 * @param {Array} response.list - 다운로드된 파일 목록
 * @param {boolean} response.list[].result - 각 파일의 다운로드 성공 여부
 * @param {string} response.list[].file_path - 다운로드된 파일 경로
 * @param {string} response.list[].message - 메시지
 * @param {number} response.list[].file_id - 파일 ID
 * @param {number} response.list[].total_count - 전체 파일 수
 * @param {number} response.list[].current_count - 현재 다운로드된 파일 수
 * @example
 * // 단일 파일 다운로드
 * bizMOB.File.download({
 *   _aFileList: [{
 *     url: 'https://example.com/files/document.pdf',
 *     file_path: '{external}/download/document.pdf'
 *   }],
 *   _sMode: 'foreground',
 *   _sProgressBar: 'full',
 *   _fCallback: function(response) {
 *     if (response.result && response.list[0].result) {
 *       console.log('다운로드 완료:', response.list[0].file_path);
 *     }
 *   }
 * });
 *
 * // 여러 파일 백그라운드 다운로드
 * bizMOB.File.download({
 *   _aFileList: [
 *     { url: 'https://example.com/file1.jpg', file_path: '{external}/images/file1.jpg' },
 *     { url: 'https://example.com/file2.jpg', file_path: '{external}/images/file2.jpg' }
 *   ],
 *   _sMode: 'background',
 *   _sProgressBar: 'each',
 *   _fCallback: function(response) {
 *     console.log('전체 다운로드 진행률:', response.list[0].current_count + '/' + response.list[0].total_count);
 *   }
 * });
 */
bizMOB.File.download = function () {
    bizMOB.gateway('File', 'download', ['_aFileList'], arguments[0]);
};

/**
 * 파일 업로드
 *
 * @param {Array} _aFileList 업로드할 File Path 목록.
 * @param {Function} _fCallback 결과를 받을 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 업로드 결과
 * @param {boolean} response.result - 성공 여부
 * @param {Array} response.list - 업로드된 파일 목록
 * @param {boolean} response.list[].result - 각 파일의 업로드 성공 여부
 * @param {string} response.list[].uid - 업로드된 파일의 고유 ID
 * @param {string} response.list[].file_name - 업로드된 파일명
 * @param {string} response.exception_msg - 예외 메시지
 * @example
 * // 단일 파일 업로드
 * bizMOB.File.upload({
 *   _aFileList: [{
 *     file_path: '{internal}/photos/photo.jpg',
 *     server_url: 'https://api.example.com/upload'
 *   }],
 *   _fCallback: function(response) {
 *     if (response.result && response.list[0].result) {
 *       console.log('업로드 완료:', response.list[0].uid);
 *       console.log('파일명:', response.list[0].file_name);
 *     } else {
 *       console.log('업로드 실패:', response.exception_msg);
 *     }
 *   }
 * });
 *
 * // 여러 파일 일괄 업로드
 * bizMOB.File.upload({
 *   _aFileList: [
 *     { file_path: '{internal}/documents/report.pdf' },
 *     { file_path: '{internal}/images/chart.png' }
 *   ],
 *   _fCallback: function(response) {
 *     response.list.forEach(function(item, index) {
 *       if (item.result) {
 *         console.log('파일 ' + (index + 1) + ' 업로드 성공:', item.uid);
 *       }
 *     });
 *   }
 * });
 */
bizMOB.File.upload = function () {
    bizMOB.gateway('File', 'upload', ['_aFileList'], arguments[0]);
};

/**
 * 파일 정보 가져오기
 *
 * @param {Array} _aFileList 정보를 가져올 File Path 목록.
 * @param {Function} _fCallback 결과를 받을 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 파일 정보 조회 결과
 * @param {boolean} response.result - 성공 여부
 * @param {Array} response.list - 파일 정보 목록
 * @param {string} response.list[].path - 파일 경로
 * @param {Object} response.list[].detail - 파일 상세 정보
 * @param {number} response.list[].detail.width - 이미지 너비 (-1은 해당 없음)
 * @param {number} response.list[].detail.height - 이미지 높이 (-1은 해당 없음)
 * @param {string} response.list[].index - 파일 인덱스
 * @param {number} response.list[].file_size - 파일 크기 (bytes)
 * @param {boolean} response.list[].result - 각 파일 조회 성공 여부
 * @example
 * // 여러 파일의 정보 조회
 * bizMOB.File.getInfo({
 *   _aFileList: [
 *     '/storage/photos/image1.jpg',
 *     '/storage/documents/report.pdf',
 *     '/storage/videos/video1.mp4'
 *   ],
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       response.list.forEach(function(fileInfo) {
 *         console.log('파일: ' + fileInfo.path);
 *         console.log('크기: ' + fileInfo.file_size + ' bytes');
 *         if (fileInfo.detail.width > 0) {
 *           console.log('이미지 해상도: ' + fileInfo.detail.width + 'x' + fileInfo.detail.height);
 *         }
 *       });
 *     }
 *   }
 * });
 */
bizMOB.File.getInfo = function () {
    bizMOB.gateway('File', 'getInfo', ['_aFileList'], arguments[0]);
};

/**
 * 이미지 파일 리사이즈
 *
 * @param {Array} _aFileList 이미지 파일 목록.
 * @param {Boolean} _bIsCopy (Default : false) 원본 파일 유지 여부. (true 또는 false)
 * @param {String} _sTargetDirectory _bIsCopy가 true일 경우 복사본이 저장될 디렉토리 경로.
 * @param {Number} _nWidth 파일의 가로 크기를 설정.
 * @param {Number} _nHeight 파일의 세로 크기를 설정.
 * @param {Number} _nCompressRate Number X (Default : 1.0) 파일의 압축률 값( 0.0부터 1.0까지 값 지정가능 )
 * @param {Number} _nFileSize 리사이즈 된 파일 용량의 최대값.( byte단위 )
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 이미지 리사이즈 결과
 * @param {boolean} response.result - 성공 여부
 * @param {Array} response.list - 리사이즈된 이미지 목록
 * @param {string} response.list[].origin_path - 원본 이미지 파일 경로
 * @param {string} response.list[].target_path - 리사이즈된 이미지 파일 경로
 * @example
 * // 썸네일 생성 (원본 유지, 압축률 적용)
 * bizMOB.File.resizeImage({
 *   _aFileList: ['/storage/photos/original.jpg'],
 *   _bIsCopy: true,
 *   _sTargetDirectory: '/storage/thumbnails/',
 *   _nWidth: 300,
 *   _nHeight: 300,
 *   _nCompressRate: 0.8,
 *   _nFileSize: 102400, // 100KB 최대
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('썸네일 생성 완료: ' + response.list[0].target_path);
 *     }
 *   }
 * });
 *
 * // 프로필 이미지 최적화 (원본 덮어쓰기)
 * bizMOB.File.resizeImage({
 *   _aFileList: ['/storage/profile/avatar.jpg'],
 *   _bIsCopy: false,
 *   _nWidth: 500,
 *   _nHeight: 500,
 *   _nCompressRate: 0.9,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('프로필 이미지 최적화 완료');
 *     }
 *   }
 * });
 */
bizMOB.File.resizeImage = function () {
    bizMOB.gateway('File', 'resizeImage', ['_aFileList'], arguments[0]);
};

/**
 * 이미지 파일 회전
 *
 * @param {String} _sSourcePath 이미지 File Path.
 * @param {String} _sTargetPath 회전된 이미지가 저장될 Path.
 * @param {Number} _nOrientation 회전 시킬 각도(EXIF_Orientation)값.(1, 2, 3, 4, 5, 6, 7, 8 )
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 이미지 회전 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.path - 회전된 이미지 파일의 저장 경로
 * @example
 * // 세로로 찍힌 사진을 가로로 회전 (90도 시계방향)
 * bizMOB.File.rotateImage({
 *   _sSourcePath: '/storage/photos/portrait.jpg',
 *   _sTargetPath: '/storage/photos/portrait_rotated.jpg',
 *   _nOrientation: 6, // 90도 시계방향 회전
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('이미지 회전 완료: ' + response.path);
 *     } else {
 *       console.log('이미지 회전 실패');
 *     }
 *   }
 * });
 *
 * // EXIF 정보에 따른 자동 회전 보정
 * bizMOB.File.rotateImage({
 *   _sSourcePath: '/storage/camera/IMG_001.jpg',
 *   _sTargetPath: '/storage/camera/IMG_001_corrected.jpg',
 *   _nOrientation: 3, // 180도 회전
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('EXIF 회전 보정 완료');
 *     }
 *   }
 * });
 */
bizMOB.File.rotateImage = function () {
    bizMOB.gateway('File', 'rotateImage', ['_sSourcePath', '_sTargetPath', '_nOrientation'], arguments[0]);
};

/**
 * Push - 실시간 푸시 메시징 및 알림 관리 시스템
 *
 * @description bizPush 서버와 연동하여 실시간 푸시 메시지 송수신, 알림 관리,
 * 배지 카운트 등의 푸시 서비스를 제공하는 시스템입니다. 앱 환경에서는
 * Native Push 서비스를 완전히 지원하며, 웹 환경에서는 기본 구조만 제공됩니다.
 *
 * **주요 기능:**
 * - 푸시 서버 등록 및 키 관리
 * - 실시간 푸시 메시지 송수신
 * - 읽지 않은 메시지 카운트 관리
 * - 앱 배지 카운트 설정
 * - 푸시 알림 및 알람 관리
 *
 * **환경별 동작:**
 * - **앱 환경**: Native Push 서비스 완전 지원, FCM/APNS 연동, 백그라운드 수신
 * - **웹 환경**: 기본 구조만 제공, 브라우저 알림 API 제한적 활용
 *
 * @class bizMOB.Push
 */
bizMOB.Push = new Object();

/**
 * 푸시 기본 저장 정보 초기화
 *
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 푸시 정보 초기화 결과
 * @param {boolean} response.result - 성공 여부
 * @example
 * // 푸시 설정 초기화
 * bizMOB.Push.reset({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('푸시 설정이 초기화되었습니다');
 *     } else {
 *       console.log('푸시 설정 초기화에 실패했습니다');
 *     }
 *   }
 * });
 *
 * // 앱 재설치 시 푸시 정보 재설정
 * bizMOB.Push.reset({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       // 초기화 후 새로운 푸시 키 발급
 *       bizMOB.Push.getPushKey({
 *         _fCallback: function(keyResponse) {
 *           console.log('새 푸시 키:', keyResponse.resultMessage);
 *         }
 *       });
 *     }
 *   }
 * });
 */
bizMOB.Push.reset = function () {
    bizMOB.gateway('PushManager', 'reset', [], arguments[0]);
};

/**
 * 푸시키 정보 조회
 *
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @param {Boolean} _bProgressEnable  (default:true) 푸시 서버와 통신 중일때 화면에 progress 를 표시할지에 대한 여부( true 또는 false )
 * @callback _fCallback
 * @param {Object} response - 푸시키 조회 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.resultCode - 결과 코드
 * @param {string} response.resultMessage - 푸시키
 * @example
 * // 현재 디바이스의 푸시키 조회
 * bizMOB.Push.getPushKey({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('푸시키:', response.resultMessage);
 *       // 서버에 푸시키 등록
 *       registerPushKeyToServer(response.resultMessage);
 *     } else {
 *       console.log('푸시키 조회 실패:', response.resultCode);
 *     }
 *   }
 * });
 *
 * // 프로그레스 없이 푸시키 조회
 * bizMOB.Push.getPushKey({
 *   _bProgressEnable: false,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('백그라운드 푸시키 조회 완료');
 *     }
 *   }
 * });
 */
bizMOB.Push.getPushKey = function () {
    bizMOB.gateway('PushManager', 'getPushKey', ['_fCallback'], arguments[0]);
};

/**
 * 푸시서버에 사용자 정보 등록
 *
 * @param {String} _sServerType 푸시키를 등록할 서버 타입.( bizpush 또는 push )
 * @param {String_sUserId}   푸시키를 등록할 사용자 아이디.
 * @param {String} _sAppName 푸시키를 등록할 앱 이름.
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @param {Boolean} _bProgressEnable  (default:true) 푸시 서버와 통신 중일때 화면에 progress 를 표시할지에 대한 여부( true 또는 false )
 * @callback _fCallback
 * @param {Object} response - 푸시 서버 등록 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.resultCode - 결과 코드
 * @param {string} response.resultMessage - 결과 메시지
 * @example
 * // bizPush 서버에 사용자 등록
 * bizMOB.Push.registerToServer({
 *   _sServerType: 'bizpush',
 *   _sUserId: 'user@example.com',
 *   _sAppName: 'MyMobileApp',
 *   _bProgressEnable: true,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('푸시 서버 등록 성공');
 *       // 등록 완료 후 알람 설정 등 추가 작업 수행
 *     } else {
 *       console.log('등록 실패: ' + response.resultMessage);
 *     }
 *   }
 * });
 *
 * // 일반 푸시 서버에 등록 (progress 숨김)
 * bizMOB.Push.registerToServer({
 *   _sServerType: 'push',
 *   _sUserId: 'admin',
 *   _sAppName: 'AdminApp',
 *   _bProgressEnable: false,
 *   _fCallback: function(response) {
 *     console.log('등록 결과:', response.resultCode);
 *   }
 * });
 */
bizMOB.Push.registerToServer = function () {
    bizMOB.gateway('PushManager', 'registerToServer', ['_sServerType', '_sUserId', '_sAppName'], arguments[0]);
};

/**
 * 푸시 알람 수신여부 설정
 *
 * @param {String} _sUserId 푸시 알림 설정을 등록할 사용자 이이디.
 * @param {Boolean}  _bEnabled  (Default : true) 알람 수신 여부 설정 ( true 또는 false )
 * @param {Boolean} _bProgressEnable  (Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 푸시 알람 설정 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.resultCode - 결과 코드
 * @param {string} response.resultMessage - 결과 메시지
 * @example
 * // 푸시 알람 활성화
 * bizMOB.Push.setAlarm({
 *   _sUserId: 'user@example.com',
 *   _bEnabled: true,
 *   _bProgressEnable: true,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('푸시 알람이 활성화되었습니다');
 *     } else {
 *       console.log('알람 설정 실패: ' + response.resultMessage);
 *     }
 *   }
 * });
 *
 * // 푸시 알람 비활성화 (조용한 모드)
 * bizMOB.Push.setAlarm({
 *   _sUserId: 'user@example.com',
 *   _bEnabled: false,
 *   _bProgressEnable: false,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('푸시 알람이 비활성화되었습니다');
 *     }
 *   }
 * });
 */
bizMOB.Push.setAlarm = function () {
    bizMOB.gateway('PushManager', 'setAlarm', ['_sUserId'], arguments[0]);
};

/**
 * 푸시 알람 수신여부 조회
 *
 * @param {String} _sUserId 푸시 알림 설정을 조회할 사용자 이이디.
 * @param {Boolean} _bProgressEnable  (Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 푸시 알람 조회 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.resultCode - 결과 코드
 * @param {string} response.resultMessage - 결과 메시지
 * @example
 * // 현재 푸시 알람 설정 상태 확인
 * bizMOB.Push.getAlarm({
 *   _sUserId: 'user@example.com',
 *   _bProgressEnable: true,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('알람 설정 조회 성공');
 *       // response.data에서 알람 활성화 상태 확인 가능
 *     } else {
 *       console.log('알람 설정 조회 실패: ' + response.resultMessage);
 *     }
 *   }
 * });
 *
 * // 백그라운드에서 조용히 확인 (progress 숨김)
 * bizMOB.Push.getAlarm({
 *   _sUserId: 'user@example.com',
 *   _bProgressEnable: false,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       // 설정 UI 업데이트 등
 *     }
 *   }
 * });
 */
bizMOB.Push.getAlarm = function () {
    bizMOB.gateway('PushManager', 'getAlarm', ['_sUserId'], arguments[0]);
};

/**
 * 푸시 수신 목록 조회
 *
 * @param {String} _sAppName 푸시 서버에 등록된 앱 이름.
 * @param {String} _sUserId 푸시 메세지를 조회할 사용자 이이디.
 * @param {Number} _nPageIndex 푸시 메세지를 가져올 페이징 값.
 * @param {Number} _nItemCount 푸시 메세지를 가져올 페이징 처리 갯수
 * @param {Boolean} _bProgressEnable  (default:true) 푸시 서버와 통신 중일때 화면에 progress 를 표시할지에 대한 여부( true 또는 false )
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 푸시 메시지 목록 조회 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.resultCode - 결과 코드
 * @param {string} response.resultMessage - 결과 메시지
 * @example
 * // 최신 푸시 메시지 목록 조회 (첫 페이지, 20개)
 * bizMOB.Push.getMessageList({
 *   _sAppName: 'MyMobileApp',
 *   _sUserId: 'user@example.com',
 *   _nPageIndex: 0,
 *   _nItemCount: 20,
 *   _bProgressEnable: true,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('메시지 목록 조회 성공');
 *       // response.data.list에서 메시지 목록 확인
 *       response.data.list.forEach(function(message) {
 *         console.log('메시지: ' + message.title);
 *       });
 *     } else {
 *       console.log('메시지 조회 실패: ' + response.resultMessage);
 *     }
 *   }
 * });
 *
 * // 다음 페이지 조회 (페이징)
 * bizMOB.Push.getMessageList({
 *   _sAppName: 'MyMobileApp',
 *   _sUserId: 'user@example.com',
 *   _nPageIndex: 1,
 *   _nItemCount: 10,
 *   _bProgressEnable: false,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       // 추가 메시지 목록 처리
 *     }
 *   }
 * });
 */
bizMOB.Push.getMessageList = function () {
    bizMOB.gateway('PushManager', 'getMessageList', ['_sAppName', '_nPageIndex', '_nItemCount', '_sUserId', '_fCallback'], arguments[0]);
};

/**
 * 푸시 메세지 읽기
 *
 * @param {String} _sTrxDay 푸시 메세지를 읽은 날짜.(yyyymmdd)
 * @param {String} _sTrxId 푸시 메세지 아이디.
 * @param {String} _sUserId 사용자 아이디.
 * @param {Boolean} _bProgressEnable  (Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 푸시 메시지 읽기 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.resultCode - 결과 코드
 * @param {string} response.resultMessage - 결과 메시지
 * @example
 * // 특정 푸시 메시지 읽음 처리
 * bizMOB.Push.readMessage({
 *   _sTrxDay: '20241201',
 *   _sTrxId: '103',
 *   _sUserId: 'user@example.com',
 *   _bProgressEnable: true,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('메시지 읽음 처리 완료');
 *       // 읽지 않은 메시지 카운트 업데이트
 *       updateUnreadCount();
 *     } else {
 *       console.log('읽음 처리 실패: ' + response.resultMessage);
 *     }
 *   }
 * });
 *
 * // 백그라운드에서 조용히 읽음 처리
 * bizMOB.Push.readMessage({
 *   _sTrxDay: '20241201',
 *   _sTrxId: '104',
 *   _sUserId: 'user@example.com',
 *   _bProgressEnable: false,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       // UI 업데이트 등 후속 처리
 *     }
 *   }
 * });
 */
bizMOB.Push.readMessage = function () {
    bizMOB.gateway('PushManager', 'readMessage', ['_sTrxDay', '_sTrxId', '_sUserId'], arguments[0]);
};

/**
 * 읽지 않은 푸시 메세지 카운트 조회
 *
 * @param {String} _sAppName 푸시 서버에 등록된 앱 이름.
 * @param {String} _sUserId 푸시 메세지를 조회할 사용자 이이디.
 * @param {Boolean} _bProgressEnable  (Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 읽지 않은 메시지 수 조회 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.resultCode - 결과 코드
 * @param {string} response.resultMessage - 결과 메시지
 * @example
 * // 읽지 않은 메시지 수 조회 및 배지 업데이트
 * bizMOB.Push.getUnreadCount({
 *   _sAppName: 'MyMobileApp',
 *   _sUserId: 'user@example.com',
 *   _bProgressEnable: true,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       var unreadCount = response.data.unreadCount;
 *       console.log('읽지 않은 메시지: ' + unreadCount + '개');
 *
 *       // 앱 배지에 카운트 표시
 *       bizMOB.Push.setBadgeCount({
 *         _nBadgeCount: unreadCount,
 *         _fCallback: function(badgeResponse) {
 *           console.log('배지 업데이트 완료');
 *         }
 *       });
 *     } else {
 *       console.log('카운트 조회 실패: ' + response.resultMessage);
 *     }
 *   }
 * });
 *
 * // 정기적인 카운트 체크 (백그라운드)
 * setInterval(function() {
 *   bizMOB.Push.getUnreadCount({
 *     _sAppName: 'MyMobileApp',
 *     _sUserId: 'user@example.com',
 *     _bProgressEnable: false,
 *     _fCallback: function(response) {
 *       if (response.result) {
 *         updateUnreadBadge(response.data.unreadCount);
 *       }
 *     }
 *   });
 * }, 30000); // 30초마다 체크
 */
bizMOB.Push.getUnreadCount = function () {
    bizMOB.gateway('PushManager', 'getUnreadMessageCount', ['_sAppName', '_sUserId', '_fCallback'], arguments[0]);
};

/**
 * 앱 아이콘에 숫자 표시하기
 *
 * @param {Number} _nBadgeCount 뱃지에 표시할 값 .( 양수 : 표시할 갯수 ,  0 : 뱃지카운트 초기화 )
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 뱃지 카운트 설정 결과
 * @param {boolean} response.result - 성공 여부
 * @example
 * // 앱 아이콘에 뱃지 숫자 표시
 * bizMOB.Push.setBadgeCount({
 *   _nBadgeCount: 5,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('앱 아이콘에 뱃지 5개가 표시되었습니다');
 *     }
 *   }
 * });
 *
 * // 뱃지 카운트 초기화 (숫자 제거)
 * bizMOB.Push.setBadgeCount({
 *   _nBadgeCount: 0,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('앱 아이콘의 뱃지가 제거되었습니다');
 *     }
 *   }
 * });
 *
 * // 읽지 않은 메시지 수에 따라 뱃지 설정
 * bizMOB.Push.getUnreadCount({
 *   _sAppName: 'MyApp',
 *   _sUserId: 'user@example.com',
 *   _fCallback: function(countResponse) {
 *     if (countResponse.result) {
 *       bizMOB.Push.setBadgeCount({
 *         _nBadgeCount: countResponse.unreadCount
 *       });
 *     }
 *   }
 * });
 */
bizMOB.Push.setBadgeCount = function () {
    bizMOB.gateway('PushManager', 'setBadgeCount', ['_nBadgeCount'], arguments[0]);
};

/**
 * 푸시 메세지 발송
 *
 * @param {String} _sAppName 푸시 메세지 보낼 앱 이름.
 * @param {Array} _aUsers 푸시 메세지 받을 사용자 목록.
 * @param {String} _sFromUser 푸시 메세지를 보낼 사용자 아이디.
 * @param {String} _sSubject 푸시 메세지 제목.
 * @param {String} _sContent 푸시 메세지 내용.
 * @param {String} _sTrxType  (Default : INSTANT) 푸시 메세지 전송 방식.( INSTANT 또는 SCHEDULE )
 * @param {String} _sScheduleDate 푸시 메세지 전송 날짜.
 * @param {Array} _aGroups 푸시 메세지를 받을 그룹 목록
 * @param {Boolean} _bToAll (Default : false) 해당 앱을 사용하는 전체 사용자에게 푸시 메세지를 발송할지 여부.
 * @param {String} _sCategory (Default : def) 푸시 메세지 카테고리.
 * @param {Object} _oPayLoad 푸시 기폰 용량 초과시 전달할 메세지.
 * @param {Boolean} _bProgressEnable  (Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 푸시 메시지 발송 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.resultCode - 결과 코드
 * @param {string} response.resultMessage - 결과 메시지
 * @example
 * // 특정 사용자들에게 즉시 푸시 메시지 발송
 * bizMOB.Push.sendMessage({
 *   _sAppName: 'MyMobileApp',
 *   _aUsers: ['user1@example.com', 'user2@example.com'],
 *   _sFromUser: 'admin@company.com',
 *   _sSubject: '중요 공지사항',
 *   _sContent: '시스템 점검이 오늘 오후 6시에 진행됩니다.',
 *   _sTrxType: 'INSTANT',
 *   _sCategory: 'notice',
 *   _oPayLoad: { type: 'system', priority: 'high' },
 *   _bProgressEnable: true,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('푸시 메시지 발송 성공');
 *     } else {
 *       console.log('발송 실패: ' + response.resultMessage);
 *     }
 *   }
 * });
 *
 * // 전체 사용자에게 예약 발송
 * bizMOB.Push.sendMessage({
 *   _sAppName: 'MyMobileApp',
 *   _aUsers: [],
 *   _sFromUser: 'marketing@company.com',
 *   _sSubject: '새로운 업데이트 출시',
 *   _sContent: '새로운 기능이 추가된 앱 업데이트가 출시되었습니다!',
 *   _sTrxType: 'SCHEDULE',
 *   _sScheduleDate: '20241201120000', // 2024년 12월 1일 12시
 *   _bToAll: true,
 *   _sCategory: 'marketing',
 *   _oPayLoad: { version: '2.1.0', updateRequired: false },
 *   _bProgressEnable: false,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('예약 발송 등록 완료');
 *     }
 *   }
 * });
 *
 * // 그룹 단위 메시지 발송
 * bizMOB.Push.sendMessage({
 *   _sAppName: 'MyMobileApp',
 *   _aUsers: [],
 *   _aGroups: ['admin_group', 'manager_group'],
 *   _sFromUser: 'system@company.com',
 *   _sSubject: '관리자 공지',
 *   _sContent: '관리자 권한 변경사항을 확인해 주세요.',
 *   _sTrxType: 'INSTANT',
 *   _sCategory: 'admin',
 *   _fCallback: function(response) {
 *     console.log('그룹 메시지 발송:', response.resultCode);
 *   }
 * });
 */
bizMOB.Push.sendMessage = function () {
    bizMOB.gateway('PushManager', 'sendMessage', ['_sAppName', '_aUsers', '_sFromUser', '_sSubject', '_sContent'], arguments[0]);
};

/**
 * 수신받은 푸시 메세지의 상세 정보를 조회합니다.
 *
 * @param {String} _sMessageId 푸시 메세지 아이디.
 * @param {String} _sUserId 사용자 아이디.
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 푸시 메세지의 상세 정보 조회 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.resultCode - 결과 코드
 * @param {string} response.resultMessage - 결과 메시지
 * @param {Object} response.body - 푸시 메시지 상세 정보
 * @param {string} response.body.channelType - 푸시발송시 요청이 들어온 채널 (HTTP 또는 DB)
 * @param {string} response.body.messageSubject - 푸시메세지 제목
 * @param {string} response.body.fromUser - 푸시메세지 발송자
 * @param {string} response.body.messageContent - 푸시메세지 내용
 * @param {string} response.body.messageCategory - 푸시메세지 카테고리
 * @param {string} response.body.processedDate - 발송처리시간
 * @param {string} response.body.trxType - 푸시메세지 전송방식
 * @param {string} response.body.appName - 푸시메세지를 수신한 앱 이름
 * @param {boolean} response.body.processed - 푸시 발송 처리 여부
 * @param {Object} response.body.messagePayload - 푸시메세지와 함께 전송된 파라미터
 * @param {number} response.body.trxId - 트랜잭션 아이디
 * @param {string} response.body.trxDay - 트랜잭션날짜
 * @param {string} response.body.serverId - 푸시서버아이디
 * @param {string} response.body.trxDate - 푸시발송을 등록한 시간
 * @example
 * // 푸시 메시지 상세 정보 조회
 * bizMOB.Push.readReceiptMessage({
 *   _sMessageId: '105',
 *   _sUserId: 'user@example.com',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('메시지 상세 정보 조회 성공');
 *       var messageInfo = response.body;
 *
 *       console.log('제목: ' + messageInfo.messageSubject);
 *       console.log('내용: ' + messageInfo.messageContent);
 *       console.log('발송자: ' + messageInfo.fromUser);
 *       console.log('카테고리: ' + messageInfo.messageCategory);
 *       console.log('발송시간: ' + messageInfo.processedDate);
 *
 *       // 추가 파라미터가 있는 경우 처리
 *       if (messageInfo.messagePayload) {
 *         console.log('추가 데이터:', messageInfo.messagePayload);
 *
 *         // 페이지 이동 등 액션 처리
 *         if (messageInfo.messagePayload.action === 'navigate') {
 *           navigateToPage(messageInfo.messagePayload.url);
 *         }
 *       }
 *     } else {
 *       console.log('메시지 조회 실패: ' + response.resultMessage);
 *     }
 *   }
 * });
 *
 * // 푸시 알림 클릭 시 상세 정보 조회 및 처리
 * function handlePushNotificationClick(messageId, userId) {
 *   bizMOB.Push.readReceiptMessage({
 *     _sMessageId: messageId,
 *     _sUserId: userId,
 *     _fCallback: function(response) {
 *       if (response.result) {
 *         var msg = response.body;
 *
 *         // 메시지 타입별 처리
 *         switch (msg.messageCategory) {
 *           case 'notice':
 *             showNoticeDetail(msg);
 *             break;
 *           case 'chat':
 *             openChatRoom(msg.messagePayload.roomId);
 *             break;
 *           case 'update':
 *             showUpdateDialog(msg.messagePayload.version);
 *             break;
 *           default:
 *             showGeneralMessage(msg);
 *         }
 *
 *         // 읽음 처리
 *         bizMOB.Push.readMessage({
 *           _sTrxDay: msg.trxDay,
 *           _sTrxId: msg.trxId.toString(),
 *           _sUserId: userId,
 *           _fCallback: function() {
 *             console.log('읽음 처리 완료');
 *           }
 *         });
 *       }
 *     }
 *   });
 * }
 */
bizMOB.Push.readReceiptMessage = function () {
    bizMOB.gateway('PushManager', 'readReceiptMessage', ['_sUserId', '_sMessageId', '_fCallback'], arguments[0]);
};

/**
 * Device - 디바이스 정보 및 플랫폼 감지 시스템
 *
 * @description 현재 실행 중인 디바이스의 하드웨어 정보, 운영체제 정보, 플랫폼 타입 등을
 * 조회하고 앱/웹 환경을 구분하는 시스템입니다. 환경별로 다른 정보 수집 방식을 사용하여
 * 일관된 디바이스 정보를 제공합니다.
 *
 * **주요 기능:**
 * - 디바이스 하드웨어 정보 조회 (모델명, OS 버전 등)
 * - 플랫폼 구분 (앱/웹, 모바일/PC, iOS/Android)
 * - 디바이스 상태 정보 (배터리, 네트워크 등)
 * - 앱 환경 감지 및 컨텍스트 정보
 *
 * **환경별 동작:**
 * - **앱 환경**: Native API를 통한 상세한 디바이스 정보 수집, 하드웨어 직접 접근
 * - **웹 환경**: 브라우저 UserAgent 및 Web API를 통한 제한적 정보 수집
 *
 * **Device.Info 변수:**
 * - **bizMOB.Device.Info**는 Native 런타임 전용 디바이스 정보 저장 변수입니다
 * - Native 앱 Resume 시점에 자동으로 기기 정보가 삽입되는 특수 변수
 * - JavaScript 코드에서는 직접 접근하지 말고 **bizMOB.Device.getInfo() API만 사용**해야 합니다
 * - 웹 환경에서는 빈 객체 상태로 유지되며, Native 정보 캐싱 역할을 담당
 *
 * @class bizMOB.Device
 */
bizMOB.Device = new Object();

/**
 * 디바이스 정보 저장 변수
 *
 * @description Native 앱에서 디바이스 정보를 저장하기 위한 전용 변수입니다.
 * 이 변수는 JavaScript 코드에서 직접 값을 설정하지 않으며, Native 런타임이
 * 앱 Resume 시점에 현재 기기의 하드웨어 및 시스템 정보를 자동으로 삽입합니다.
 *
 * **주요 특징:**
 * - Native 앱 Resume 시점에 자동으로 디바이스 정보가 갱신됨
 * - JavaScript에서는 읽기 전용으로만 사용해야 함
 * - 웹 환경에서는 빈 객체 상태로 유지됨
 * - 실시간 기기 정보 접근을 위한 캐시 역할
 *
 * **포함되는 정보:**
 * - 기기 모델명, OS 버전, 앱 버전
 * - 화면 해상도, 메모리 정보
 * - 네트워크 상태, 배터리 정보
 * - 기타 플랫폼별 하드웨어 정보
 *
 * **⚠️ 중요 주의사항:**
 * - JavaScript 코드에서 이 변수에 직접 값을 할당하지 마세요
 * - Native에서 설정된 값을 임의로 수정하지 마세요
 * - 디바이스 정보 조회는 bizMOB.Device.getInfo() 함수를 사용하세요
 *
 * @type {Object}
 * @readonly
  * @example
 * // ❌ 잘못된 사용법 - 직접 수정 금지
 * bizMOB.Device.Info.model = 'CustomModel'; // 금지!
 *
 * // ⚠️ 비권장 - 직접 접근 (개발시 사용 금지)
 * // bizMOB.Device.Info에 직접 접근하는 것은 권장하지 않습니다
 * // console.log('기기 모델:', bizMOB.Device.Info.model); // 사용하지 마세요
 *
 * // ✅ 권장 사용법 - 공식 API만 사용
 * bizMOB.Device.getInfo({
 *   _fCallback: function(deviceInfo) {
 *     console.log('디바이스 정보:', deviceInfo);
 *     console.log('기기 모델:', deviceInfo.model);
 *     console.log('OS 버전:', deviceInfo.osVersion);
 *   }
 * });
 *
 * // ✅ 특정 정보만 조회하는 경우
 * bizMOB.Device.getInfo({
 *   _sKey: 'model',
 *   _fCallback: function(modelInfo) {
 *     console.log('기기 모델:', modelInfo);
 *   }
 * });
 */
bizMOB.Device.Info = {}; // Native에서 직접 값을 저장하는 변수

/**
 * 단말기 정보 조회
 *
 * @description 현재 디바이스의 정보를 JSON 객체 형태로 즉시 반환하는 함수.
 * callback 함수 없이 동기적으로 디바이스 정보에 접근할 수 있다.
 *
 * @param {String} _sKey 디바이스 정보 키 값 (선택적)
 * @returns {DeviceInfo} 디바이스 정보 객체
 *
 * @typedef {Object} DeviceInfo
 * @property {string} device_id 디바이스 고유 식별자 - 기기를 구별하는 유니크한 ID
 * @property {string} os_type 운영체제 타입 - "Android", "iOS" 등의 플랫폼 구분
 * @property {string} device_os_type 디바이스 운영체제 타입 - "ANDROID", "IOS" 등의 상수값
 * @property {string} os_version 운영체제 상세 버전 - "15.0", "17.2.1" 등의 정확한 OS 버전
 * @property {string} device_os_version 디바이스 운영체제 메이저 버전 - "15", "17" 등의 주요 버전
 * @property {number} content_major_version 컨텐츠 메이저 버전 - 앱 컨텐츠의 주요 버전 번호
 * @property {number} content_minor_version 컨텐츠 마이너 버전 - 앱 컨텐츠의 세부 버전 번호
 * @property {number} app_major_version 앱 메이저 버전 - 애플리케이션의 주요 버전 번호
 * @property {number} app_minor_version 앱 마이너 버전 - 애플리케이션의 세부 버전 번호
 * @property {number} app_build_version 앱 빌드 버전 - 빌드 번호 또는 패치 버전
 * @property {string} [app_version] 통합 앱 버전 - bizMOBCore 초기화 시 동적으로 생성되는 버전 문자열 (예: "2.0.7_4.15")
 * @property {string} network_operater_name 통신사명 - "KT", "SKT", "LGU+" 등의 이동통신사
 * @property {number} screen_density 화면 밀도 - 화면의 픽셀 밀도 값
 * @property {number} screen_density_dpi 화면 DPI 값 - 인치당 도트 수 (120, 160, 240, 320, 480, 640 등)
 * @property {number} screen_width 화면 너비 - 화면의 가로 픽셀 수
 * @property {number} screen_height 화면 높이 - 화면의 세로 픽셀 수
 * @property {string} manufacturer 제조사명 - "Samsung", "Apple", "LG" 등의 기기 제조업체
 * @property {string} model 기기 모델명 - "SM-S921N", "iPhone14,2" 등의 구체적 모델명
 * @property {string} device_type 기기 타입 - "Phone", "Tablet", "Desktop" 등의 디바이스 분류
 * @property {string} app_key 앱 고유 키 - 애플리케이션을 식별하는 고유한 키값
 * @property {string} [push_key] 푸시 키 - 푸시 서비스를 위한 고유 키값 (bizMOB.Push.getPushKey() 호출 후 설정됨)
 * @property {boolean} release_flag 릴리즈 모드 여부 - true(운영환경), false(개발환경)
 *
 * @example
 * // 전체 디바이스 정보 조회
 * const deviceInfo = bizMOB.Device.getInfo();
 * console.log('디바이스 ID:', deviceInfo.device_id);
 * console.log('운영체제:', deviceInfo.os_type);
 * console.log('화면 크기:', deviceInfo.screen_width + 'x' + deviceInfo.screen_height);
 * console.log('제조사:', deviceInfo.manufacturer);
 * console.log('모델명:', deviceInfo.model);
 *
 * // 특정 키로 정보 조회 (키 지원 시)
 * const screenWidth = bizMOB.Device.getInfo({ "_sKey" : "screen_width" });
 */
bizMOB.Device.getInfo = function () {
    return bizMOB.gateway('DeviceManager', 'getInfo', [], arguments[0]);
};

/**
 * 현재 환경이 App 환경인지 판별
 *
 * @description bizMOB 앱 컨테이너 내에서 실행 중인지 확인하는 함수.
 * 앱 환경에서만 사용 가능한 네이티브 기능을 호출하기 전에 체크하는데 사용된다.
 *
 * @returns {boolean} App 환경이면 true, 그렇지 않으면 false
 *
 * @example
 * if (bizMOB.Device.isApp()) {
 *   // 네이티브 기능 사용 가능
 *   bizMOB.System.callCamera();
 * }
 */
bizMOB.Device.isApp = function () {
    return bizMOB.gateway('DeviceManager', 'isApp', [], arguments[0]);
};

/**
 * 현재 환경이 Web 환경인지 판별
 *
 * @description 웹 브라우저 환경에서 실행 중인지 확인하는 함수.
 * 웹 환경에서만 사용 가능한 기능을 분기 처리할 때 사용된다.
 *
 * @returns {boolean} Web 환경이면 true, 그렇지 않으면 false
 *
 * @example
 * if (bizMOB.Device.isWeb()) {
 *   // 웹 환경 전용 처리
 *   console.log('웹 브라우저에서 실행 중');
 * }
 */
bizMOB.Device.isWeb = function () {
    return bizMOB.gateway('DeviceManager', 'isWeb', [], arguments[0]);
};

/**
 * 현재 디바이스가 모바일 기기인지 판별
 *
 * @description 스마트폰, 태블릿 등 모바일 디바이스에서 실행 중인지 확인하는 함수.
 * 모바일 특화 UI나 기능을 적용할 때 사용된다.
 *
 * @returns {boolean} 모바일 기기이면 true, 그렇지 않으면 false
 *
 * @example
 * if (bizMOB.Device.isMobile()) {
 *   // 모바일 전용 UI 적용
 *   document.body.classList.add('mobile-layout');
 * }
 */
bizMOB.Device.isMobile = function () {
    return bizMOB.gateway('DeviceManager', 'isMobile', [], arguments[0]);
};

/**
 * 현재 디바이스가 PC인지 판별
 *
 * @description 데스크톱, 노트북 등 PC 환경에서 실행 중인지 확인하는 함수.
 * PC 환경에 최적화된 UI나 기능을 적용할 때 사용된다.
 *
 * @returns {boolean} PC 환경이면 true, 그렇지 않으면 false
 *
 * @example
 * if (bizMOB.Device.isPC()) {
 *   // PC 전용 키보드 단축키 활성화
 *   enableKeyboardShortcuts();
 * }
 */
bizMOB.Device.isPC = function () {
    return bizMOB.gateway('DeviceManager', 'isPC', [], arguments[0]);
};

/**
 * 현재 디바이스가 Android 기기인지 판별
 *
 * @description Android 운영체제를 사용하는 디바이스인지 확인하는 함수.
 * Android 특화 기능이나 UI를 적용할 때 사용된다.
 *
 * @returns {boolean} Android 기기이면 true, 그렇지 않으면 false
 *
 * @example
 * if (bizMOB.Device.isAndroid()) {
 *   // Android 전용 머티리얼 디자인 적용
 *   applyMaterialDesign();
 * }
 */
bizMOB.Device.isAndroid = function () {
    return bizMOB.gateway('DeviceManager', 'isAndroid', [], arguments[0]);
};

/**
 * 현재 디바이스가 iOS 기기인지 판별
 *
 * @description iPhone, iPad 등 iOS 운영체제를 사용하는 디바이스인지 확인하는 함수.
 * iOS 특화 기능이나 UI를 적용할 때 사용된다.
 *
 * @returns {boolean} iOS 기기이면 true, 그렇지 않으면 false
 *
 * @example
 * if (bizMOB.Device.isIOS()) {
 *   // iOS 전용 쿠퍼티노 디자인 적용
 *   applyCupertinoDesign();
 * }
 */
bizMOB.Device.isIOS = function () {
    return bizMOB.gateway('DeviceManager', 'isIOS', [], arguments[0]);
};

/**
 * 현재 디바이스가 태블릿인지 판별
 *
 * @description iPad, Android 태블릿 등 태블릿 형태의 디바이스인지 확인하는 함수.
 * 태블릿에 최적화된 레이아웃이나 기능을 적용할 때 사용된다.
 *
 * @returns {boolean} 태블릿이면 true, 그렇지 않으면 false
 *
 * @example
 * if (bizMOB.Device.isTablet()) {
 *   // 태블릿 전용 2열 레이아웃 적용
 *   enableTwoColumnLayout();
 * }
 */
bizMOB.Device.isTablet = function () {
    return bizMOB.gateway('DeviceManager', 'isTablet', [], arguments[0]);
};

/**
 * 현재 디바이스가 스마트폰인지 판별
 *
 * @description iPhone, Android 폰 등 스마트폰 형태의 디바이스인지 확인하는 함수.
 * 스마트폰에 최적화된 UI나 기능을 적용할 때 사용된다.
 *
 * @returns {boolean} 스마트폰이면 true, 그렇지 않으면 false
 *
 * @example
 * if (bizMOB.Device.isPhone()) {
 *   // 스마트폰 전용 1열 레이아웃 적용
 *   enableSingleColumnLayout();
 * }
 */
bizMOB.Device.isPhone = function () {
    return bizMOB.gateway('DeviceManager', 'isPhone', [], arguments[0]);
};

/**
 * Database - SQLite 데이터베이스 연결 및 쿼리 실행 시스템
 *
 * @description 모바일 앱에서 SQLite 데이터베이스에 연결하고 SQL 쿼리를 실행하는 시스템입니다.
 * 트랜잭션 관리, 배치 쿼리 실행, 데이터베이스 생명주기 관리 등의 기능을 제공합니다.
 * 앱 환경에서만 완전한 기능을 지원하며, 웹 환경에서는 기본 구조만 제공됩니다.
 *
 * **주요 기능:**
 * - SQLite 데이터베이스 연결 및 해제
 * - SQL 쿼리 실행 (SELECT, INSERT, UPDATE, DELETE)
 * - 트랜잭션 관리 (BEGIN, COMMIT, ROLLBACK)
 * - 배치 SQL 실행 및 성능 최적화
 *
 * **환경별 동작:**
 * - **앱 환경**: Native SQLite 엔진 완전 지원, 파일 기반 데이터베이스, 트랜잭션 관리
 * - **웹 환경**: 기본 구조만 제공, 브라우저 제약으로 인한 SQLite 지원 제한
 *
 * @class bizMOB.Database
 */
bizMOB.Database = new Object();

/**
 * DataBase Open
 *
 * @param {String} _sDbName 오픈할 데이터베이스 명.
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 데이터베이스 오픈 결과
 * @param {boolean} response.result - 데이터베이스 오픈 결과 값
 * @param {string} response.error_message - 데이터베이스 오픈 실패시 오류 메세지
 * @example
 * // 데이터베이스 연결
 * bizMOB.Database.openDatabase({
 *   _sDbName: 'myapp.db',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('데이터베이스 연결 성공');
 *       // 테이블 생성 또는 초기화 작업 수행
 *       initializeDatabase();
 *     } else {
 *       console.log('데이터베이스 연결 실패:', response.error_message);
 *     }
 *   }
 * });
 *
 * // 사용자별 데이터베이스 연결
 * bizMOB.Database.openDatabase({
 *   _sDbName: 'user_' + userId + '.db',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('사용자 데이터베이스 연결 완료');
 *     }
 *   }
 * });
 */
bizMOB.Database.openDatabase = function () {
    bizMOB.gateway('Database', 'openDatabase', ['_sDbName', '_fCallback'], arguments[0]);
};

/**
 * DataBase Close
 *
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 데이터베이스 닫기 결과
 * @param {boolean} response.result - 데이터베이스 닫기 결과 값
 * @param {string} response.error_message - 데이터베이스 닫기 실패시 오류 메세지
 * @example
 * // 데이터베이스 작업 완료 후 정리
 * bizMOB.Database.closeDatabase({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('데이터베이스가 정상적으로 닫혔습니다');
 *       // 앱 종료 또는 다른 DB로 전환 등 후속 작업
 *     } else {
 *       console.log('데이터베이스 닫기 실패:', response.error_message);
 *     }
 *   }
 * });
 *
 * // 앱 종료 시 리소스 정리
 * function cleanupResources() {
 *   bizMOB.Database.closeDatabase({
 *     _fCallback: function(response) {
 *       if (response.result) {
 *         console.log('앱 종료 전 데이터베이스 정리 완료');
 *       }
 *     }
 *   });
 * }
 */
bizMOB.Database.closeDatabase = function () {
    bizMOB.gateway('Database', 'closeDatabase', ['_fCallback'], arguments[0]);
};

/**
 * DataBase Transaction 시작
 *
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 트랜잭션 시작 결과
 * @param {boolean} response.result - 트랜잭션 시작 결과 값
 * @param {string} response.error_message - 트랜잭션 시작 실패시 오류 메세지
 * @example
 * // 여러 작업을 하나의 트랜잭션으로 처리
 * bizMOB.Database.beginTransaction({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('트랜잭션 시작 성공');
 *
 *       // 여러 SQL 작업 수행
 *       bizMOB.Database.executeSql({
 *         _sQuery: 'INSERT INTO orders (user_id, product_id, quantity) VALUES (?, ?, ?)',
 *         _aBindingValues: [userId, productId, quantity],
 *         _fCallback: function(insertResponse) {
 *           if (insertResponse.result) {
 *             // 재고 업데이트
 *             bizMOB.Database.executeSql({
 *               _sQuery: 'UPDATE products SET stock = stock - ? WHERE id = ?',
 *               _aBindingValues: [quantity, productId],
 *               _fCallback: function(updateResponse) {
 *                 if (updateResponse.result) {
 *                   // 모든 작업 성공 시 커밋
 *                   bizMOB.Database.commitTransaction({
 *                     _fCallback: function() {
 *                       console.log('주문 처리 완료');
 *                     }
 *                   });
 *                 } else {
 *                   // 오류 발생 시 롤백
 *                   bizMOB.Database.rollbackTransaction({});
 *                 }
 *               }
 *             });
 *           }
 *         }
 *       });
 *     } else {
 *       console.log('트랜잭션 시작 실패:', response.error_message);
 *     }
 *   }
 * });
 */
bizMOB.Database.beginTransaction = function () {
    bizMOB.gateway('Database', 'beginTransaction', ['_fCallback'], arguments[0]);
};

/**
 * DataBase Transaction Commit
 *
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 트랜잭션 커밋 결과
 * @param {boolean} response.result - 트랜잭션 커밋 결과 값
 * @param {string} response.error_message - 트랜잭션 커밋 실패시 오류 메세지
 * @example
 * // 트랜잭션 내 모든 작업 성공 시 커밋
 * bizMOB.Database.commitTransaction({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('트랜잭션 커밋 성공 - 모든 변경사항이 저장되었습니다');
 *       // UI 업데이트 등 후속 작업
 *       updateUserInterface();
 *     } else {
 *       console.log('트랜잭션 커밋 실패:', response.error_message);
 *       // 오류 처리
 *     }
 *   }
 * });
 *
 * // 복잡한 데이터 이전 작업 커밋
 * function migrationCommit() {
 *   bizMOB.Database.commitTransaction({
 *     _fCallback: function(response) {
 *       if (response.result) {
 *         console.log('데이터 마이그레이션 완료');
 *         showSuccessMessage('데이터 이전이 완료되었습니다');
 *       } else {
 *         console.log('마이그레이션 커밋 실패');
 *         showErrorMessage('데이터 이전 중 오류가 발생했습니다');
 *       }
 *     }
 *   });
 * }
 */
bizMOB.Database.commitTransaction = function () {
    bizMOB.gateway('Database', 'commitTransaction', ['_fCallback'], arguments[0]);
};

/**
 * DataBase Transaction Rollback
 *
 * @param {Function} _fCallback 결과를 받아 처리할 callback 함수.
 * @callback _fCallback
 * @param {Object} response - 트랜잭션 롤백 결과
 * @param {boolean} response.result - 트랜잭션 롤백 결과 값
 * @param {string} response.error_message - 트랜잭션 롤백 실패시 오류 메세지
 * @example
 * // 오류 발생 시 트랜잭션 롤백
 * bizMOB.Database.rollbackTransaction({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('트랜잭션 롤백 성공 - 모든 변경사항이 취소되었습니다');
 *       // 사용자에게 오류 알림
 *       showErrorMessage('작업 중 오류가 발생하여 변경사항이 취소되었습니다');
 *     } else {
 *       console.log('트랜잭션 롤백 실패:', response.error_message);
 *       // 심각한 오류 상황
 *     }
 *   }
 * });
 *
 * // 검증 실패 시 자동 롤백
 * function validateAndProcess(data) {
 *   if (!isValidData(data)) {
 *     console.log('데이터 검증 실패 - 롤백 수행');
 *     bizMOB.Database.rollbackTransaction({
 *       _fCallback: function(response) {
 *         if (response.result) {
 *           console.log('잘못된 데이터로 인한 롤백 완료');
 *           resetForm();
 *         }
 *       }
 *     });
 *     return;
 *   }
 * }
 *
 * // 사용자 취소 시 롤백
 * function handleUserCancel() {
 *   bizMOB.Database.rollbackTransaction({
 *     _fCallback: function(response) {
 *       if (response.result) {
 *         console.log('사용자 취소로 인한 롤백 완료');
 *       }
 *     }
 *   });
 * }
 */
bizMOB.Database.rollbackTransaction = function () {
    bizMOB.gateway('Database', 'rollbackTransaction', ['_fCallback'], arguments[0]);
};

/**
 * SQL쿼리문을 실행
 *
 * @param {String} _sQuery 실행할 SQL SELECT 쿼리문.
 * @param {Array} _aBindingValues 쿼리문의 각 변수 위치에 대입해줄 값의 배열.
 * @param {Function} _fCallback SQL쿼리문 실행 요청 후 호출되는 callback 함수.
 * @callback _fCallback
 * @param {Object} response - SQL 실행 결과
 * @param {boolean} response.result - SQL쿼리문 실행 결과 값
 * @param {string} response.error_message - SQL쿼리문 실행 실패시 오류 메세지
 * @param {Object} response.data - SQL 실행 응답 데이터
 * @param {number} response.data.affected_number - SQL쿼리문 실행 후 영향을 받은 레코드 수
 * @example
 * // 새 사용자 추가
 * bizMOB.Database.executeSql({
 *   _sQuery: 'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
 *   _aBindingValues: ['홍길동', 'hong@example.com', 30],
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('사용자 추가 완료. 영향받은 레코드:', response.data.affected_number);
 *     } else {
 *       console.log('사용자 추가 실패:', response.error_message);
 *     }
 *   }
 * });
 *
 * // 사용자 정보 업데이트
 * bizMOB.Database.executeSql({
 *   _sQuery: 'UPDATE users SET age = ? WHERE email = ?',
 *   _aBindingValues: [31, 'hong@example.com'],
 *   _fCallback: function(response) {
 *     if (response.result && response.data.affected_number > 0) {
 *       console.log('사용자 정보가 업데이트되었습니다');
 *     }
 *   }
 * });
 */
bizMOB.Database.executeSql = function () {
    bizMOB.gateway('Database', 'executeSql', ['_sQuery', '_fCallback'], arguments[0]);
};

/**
 * SELECT SQL쿼리문을 실행
 *
 * @param {String} _sQuery 실행할 SQL SELECT 쿼리문.
 * @param {Array} _aBindingValues 쿼리문의 각 변수 위치에 대입해줄 값의 배열.
 * @param {Function} _fCallback SQL쿼리문 실행 요청 후 호출되는 callback 함수.
 * @callback _fCallback
 * @param {Object} response - SELECT 쿼리 실행 결과
 * @param {boolean} response.result - SELECT SQL쿼리문 실행 결과 값
 * @param {string} response.error_message - SELECT SQL쿼리문 실행 실패시 오류 메세지
 * @param {Object} response.data - SELECT 쿼리 응답 데이터
 * @param {Object} response.data.result_set - 쿼리 결과 집합
 * @param {Array} response.data.result_set.rows - SELECT SQL쿼리문 실행으로 반환된 레코드 배열
 * @example
 * // 전체 사용자 목록 조회
 * bizMOB.Database.executeSelect({
 *   _sQuery: 'SELECT * FROM users',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       response.data.result_set.rows.forEach(function(user) {
 *         console.log('사용자:', user.name, user.email);
 *       });
 *     } else {
 *       console.log('쿼리 실행 실패:', response.error_message);
 *     }
 *   }
 * });
 *
 * // 조건부 검색 (바인딩 파라미터 사용)
 * bizMOB.Database.executeSelect({
 *   _sQuery: 'SELECT * FROM users WHERE age > ? AND city = ?',
 *   _aBindingValues: [25, '서울'],
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('검색된 사용자 수:', response.data.result_set.rows.length);
 *     }
 *   }
 * });
 */
bizMOB.Database.executeSelect = function () {
    bizMOB.gateway('Database', 'executeSelect', ['_sQuery', '_fCallback'], arguments[0]);
};

/**
 * SQL쿼리문을 일괄 실행
 *
 * @param {String} _sQuery 실행할 SQL SELECT 쿼리문.
 * @param {Array} _aBindingValues 쿼리문의 각 변수 위치에 대입해줄 값의 배열.
 * @param {Function} _fCallback SQL쿼리문 실행 요청 후 호출되는 callback 함수.
 * @callback _fCallback
 * @param {Object} response - SQL 일괄 실행 결과
 * @param {boolean} response.result - SQL쿼리문 일괄 실행 결과 값
 * @param {string} response.error_message - SQL쿼리문 일괄 실행 실패시 오류 메세지
 * @param {Object} response.data - SQL 일괄 실행 응답 데이터
 * @param {number} response.data.affected_number - SQL쿼리문 일괄 실행 후 영향을 받은 레코드 수
 * @param {string} response.data.code - 오류 코드 (오류시에만 반환)
 * @example
 * // 여러 사용자 정보를 한 번에 삽입
 * var insertQuery = 'INSERT INTO users (name, email, department, created_at) VALUES (?, ?, ?, DATETIME("now"))';
 * var userList = [
 *   ['김철수', 'kim@company.com', '개발팀'],
 *   ['이영희', 'lee@company.com', '디자인팀'],
 *   ['박민수', 'park@company.com', '기획팀']
 * ];
 *
 * bizMOB.Database.executeBatchSql({
 *   _sQuery: insertQuery,
 *   _aBindingValues: userList,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('일괄 삽입 성공:', response.data.affected_number + '명 추가됨');
 *     } else {
 *       console.log('일괄 삽입 실패:', response.error_message);
 *       if (response.data && response.data.code) {
 *         console.log('오류 코드:', response.data.code);
 *       }
 *     }
 *   }
 * });
 *
 * // 대량 데이터 업데이트 (성능 최적화)
 * var updateQuery = 'UPDATE products SET price = price * ? WHERE category = ?';
 * var priceUpdates = [
 *   [1.1, 'electronics'],  // 전자제품 10% 인상
 *   [0.9, 'clothing'],     // 의류 10% 할인
 *   [1.05, 'books']        // 도서 5% 인상
 * ];
 *
 * bizMOB.Database.executeBatchSql({
 *   _sQuery: updateQuery,
 *   _aBindingValues: priceUpdates,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('가격 일괄 업데이트 완료');
 *       console.log('총 ' + response.data.affected_number + '개 상품 가격 변경');
 *     } else {
 *       console.log('가격 업데이트 실패:', response.error_message);
 *     }
 *   }
 * });
 *
 * // 로그 데이터 정리 (일괄 삭제)
 * var deleteQuery = 'DELETE FROM logs WHERE log_date < ? AND log_level = ?';
 * var cleanupConditions = [
 *   ['2024-01-01', 'DEBUG'],
 *   ['2024-01-01', 'INFO'],
 *   ['2023-01-01', 'WARNING']
 * ];
 *
 * bizMOB.Database.executeBatchSql({
 *   _sQuery: deleteQuery,
 *   _aBindingValues: cleanupConditions,
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('로그 정리 완료:', response.data.affected_number + '개 레코드 삭제');
 *     }
 *   }
 * });
 */
bizMOB.Database.executeBatchSql = function () {
    bizMOB.gateway('Database', 'executeBatchSql', ['_sQuery', '_aBindingValues', '_fCallback'], arguments[0]);
};

/**
 * Http - RESTful API 통신 및 HTTP 요청 관리 시스템
 *
 * @description 웹 환경에서 REST API 호출 및 일반적인 HTTP 통신을 위한 시스템입니다.
 * bizMOB 서버 통신과는 별도로 외부 API나 다른 서버와의 통신에 사용되며,
 * 주로 웹 환경에서 fetch API를 기반으로 동작합니다.
 *
 * **주요 기능:**
 * - RESTful API 호출 (GET, POST, PUT, DELETE 등)
 * - 커스텀 HTTP 헤더 설정
 * - 요청/응답 데이터 변환 처리
 * - 타임아웃 및 재시도 로직
 *
 * **환경별 동작:**
 * - **앱 환경**: 기본 구조만 제공, Network 클래스 사용 권장
 * - **웹 환경**: fetch API 기반 HTTP 통신 완전 지원, CORS 정책 준수
 *
 * @class bizMOB.Http
 */
bizMOB.Http = new Object();

/**
 * HTTP 요청 수행 (웹 환경 전용)
 *
 * @description 웹 환경에서 일반 API 통신을 위한 HTTP 요청 함수.
 * 앱 환경에서는 동작하지 않으며, bizMOB 서버가 아닌 외부 API와 통신할 때 사용한다.
 * JavaScript의 기본 fetch API를 기반으로 구현되어 fetch와 동일한 구조를 가진다.
 *
 * @param {Object} arg 요청 객체
 * @param {string} arg._sUrl 요청할 URL 주소
 * @param {string} arg._sMethod HTTP 요청 방식 (GET, POST, PUT, DELETE 등)
 * @param {number} [arg._nTimeout=60] 요청 제한시간 (초 단위, 기본값: 60초)
 * @param {number} [arg._nRetries=1] API 요청 재시도 횟수 (기본값: 1회)
 * @param {Object} [arg._oOption] fetch 옵션 객체 (추가 fetch 설정)
 * @param {Object} [arg._oHeader] HTTP 요청 헤더 객체
 * @param {string} [arg._oBody] HTTP 요청 본문 - JSON.stringify(data) 또는 new URLSearchParams(data).toString() 형태
 * @param {Function} arg._fCallback 요청 완료 후 실행될 callback 함수
 * @callback arg._fCallback
 * @param {Object} response - HTTP 요청 결과
 * @param {boolean} response.ok - 요청 성공 여부 (HTTP 200-299 범위)
 * @param {number} response.status - HTTP 상태 코드 (200, 404, 500 등)
 * @param {string} response.statusText - HTTP 상태 텍스트 ("OK", "Not Found" 등)
 * @param {*} response.data - 응답 데이터 (성공 시 JSON 파싱된 데이터, 실패 시 null)
 * @example
 * // GET 요청으로 외부 API 호출
 * bizMOB.Http.request({
 *   _sUrl: 'https://jsonplaceholder.typicode.com/users',
 *   _sMethod: 'GET',
 *   _oHeader: { 'Accept': 'application/json' },
 *   _fCallback: function(response) {
 *     if (response.ok) {
 *       console.log('사용자 목록:', response.data);
 *     } else {
 *       console.error('API 요청 실패:', response.status);
 *     }
 *   }
 * });
 *
 * // POST 요청으로 데이터 전송
 * bizMOB.Http.request({
 *   _sUrl: 'https://api.example.com/posts',
 *   _sMethod: 'POST',
 *   _oHeader: { 'Content-Type': 'application/json' },
 *   _oBody: JSON.stringify({ title: '제목', content: '내용' }),
 *   _nTimeout: 30,
 *   _nRetries: 2,
 *   _fCallback: function(response) {
 *     if (response.ok) {
 *       console.log('게시글 생성 성공:', response.data);
 *     } else {
 *       console.log('게시글 생성 실패');
 *     }
 *   }
 * });
 *
 * @note 이 함수는 웹 환경에서만 동작하며, 앱 환경에서는 사용할 수 없습니다.
 */
bizMOB.Http.request = function () {
    bizMOB.gateway('Http', 'request', [], arguments[0]);
};


/**
 * Localization - 다국어 지원 및 로케일 관리 시스템
 *
 * @description 애플리케이션의 다국어 처리와 로케일 관리를 담당하는 시스템입니다.
 * 언어 코드 설정, 지역별 언어 지원, 동적 언어 변경 등의 기능을 제공하며,
 * 앱과 웹 환경에서 각기 다른 언어 감지 방식을 사용합니다.
 *
 * **주요 기능:**
 * - 언어 코드 설정 및 조회 (ko, en, ja 등)
 * - 로케일 코드 관리 (ko-KR, en-US 등)
 * - 동적 언어 변경 및 적용
 * - 시스템 언어 감지 및 자동 설정
 *
 * **환경별 동작:**
 * - **앱 환경**: Native 디바이스 언어 설정 연동, 시스템 언어 자동 감지
 * - **웹 환경**: 브라우저 navigator.language 기반 언어 감지, localStorage 언어 설정 저장
 *
 * @class bizMOB.Localization
 */
bizMOB.Localization = new Object();

/**
 * 언어 코드 설정
 *
 * @description 애플리케이션의 언어 코드를 설정하는 함수.
 * 앱 환경에서는 네이티브 설정을 통해 언어를 변경하고,
 * 웹 환경에서는 브라우저 환경에 맞는 언어코드를 저장한다.
 *
 * @param {string} _sLocaleCd 설정할 언어 코드 (예: "ko", "ko-KR", "en", "en-US")
 * @param {Function} _fCallback 언어 설정 완료 후 실행될 callback 함수
 * @callback _fCallback
 * @param {Object} response - 언어 설정 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.locale - 설정된 전체 언어 코드 (예: "ko-KR", "en-US")
 * @example
 * // 앱 언어를 한국어로 설정
 * bizMOB.Localization.setLocale({
 *   _sLocaleCd: 'ko',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('언어가 한국어로 설정되었습니다:', response.locale);
 *       // UI 언어 변경
 *       updateUILanguage('ko');
 *     } else {
 *       console.log('언어 설정에 실패했습니다');
 *     }
 *   }
 * });
 *
 * // 영어(미국)로 설정
 * bizMOB.Localization.setLocale({
 *   _sLocaleCd: 'en-US',
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('Language set to English:', response.locale);
 *       // 네트워크 통신 시 언어 정보도 자동 반영
 *       bizMOB.Network.changeLocale({ _sLocaleCd: 'en-US' });
 *     }
 *   }
 * });
 *
 * // 사용자 선택에 따른 언어 변경
 * function changeLanguage(languageCode) {
 *   bizMOB.Localization.setLocale({
 *     _sLocaleCd: languageCode,
 *     _fCallback: function(response) {
 *       if (response.result) {
 *         // 언어 변경 후 페이지 새로고침
 *         location.reload();
 *       }
 *     }
 *   });
 * }
 */
bizMOB.Localization.setLocale = function () {
    bizMOB.gateway('Localization', 'setLocale', ['_sLocaleCd', '_fCallback'], arguments[0]);
};

/**
 * 현재 설정된 언어 코드 조회
 *
 * @description 현재 설정된 언어 코드를 조회하는 함수.
 * 앱 환경에서는 네이티브에서 설정된 언어 정보를 가져오고,
 * 웹 환경에서는 저장된 언어 코드 또는 브라우저 기본 언어를 반환한다.
 *
 * @param {Function} _fCallback 언어 조회 완료 후 실행될 callback 함수
 * @callback _fCallback
 * @param {Object} response - 언어 조회 결과
 * @param {boolean} response.result - 성공 여부
 * @param {string} response.locale - 현재 설정된 전체 언어 코드 (예: "ko-KR", "en-US")
 * @example
 * // 앱 시작 시 현재 언어 확인
 * bizMOB.Localization.getLocale({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       console.log('현재 언어 설정:', response.locale);
 *
 *       // 언어별 UI 초기화
 *       if (response.locale.startsWith('ko')) {
 *         loadKoreanResources();
 *       } else if (response.locale.startsWith('en')) {
 *         loadEnglishResources();
 *       } else if (response.locale.startsWith('ja')) {
 *         loadJapaneseResources();
 *       }
 *     } else {
 *       console.log('언어 정보 조회 실패');
 *       // 기본 언어로 설정
 *       bizMOB.Localization.setLocale({ _sLocaleCd: 'ko' });
 *     }
 *   }
 * });
 *
 * // 언어별 서버 API 엔드포인트 설정
 * bizMOB.Localization.getLocale({
 *   _fCallback: function(response) {
 *     if (response.result) {
 *       var apiUrl = getApiUrlForLocale(response.locale);
 *       console.log('언어별 API URL:', apiUrl);
 *     }
 *   }
 * });
 */
bizMOB.Localization.getLocale = function () {
    bizMOB.gateway('Localization', 'getLocale', ['_fCallback'], arguments[0]);
};

/**
 * bizMOB SDK 스크립트 초기화 완료 알림
 *
 * 스크립트가 로드되고 모든 클래스와 함수가 준비되었음을 알리는 로그를 기록합니다.
 * 환경에 따라 다른 Core 파일을 호출합니다:
 * - 웹 환경: bizMOB-core-web.js의 Module.logger 호출
 * - 앱 환경: bizMOB-core.js의 Module.logger 호출
 *
 * @example
 * // 스크립트 로드 완료 시 자동으로 실행되어 다음과 같은 로그가 기록됩니다:
 * // Service: bizMOB, Action: ready, Type: I, Message: bizMOB script is ready.
 */
(function () {
    bizMOB.gateway('Module', 'logger', [], { _sService: 'bizMOB', _sAction: 'ready', _sLogType: 'I', _sMessage: 'bizMOB script is ready.' });
})();
