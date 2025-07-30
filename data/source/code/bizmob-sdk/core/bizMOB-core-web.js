/**
 * @title bizMOB Web Extend
 * @author mhchoi@mcnc.co.kr
 * @version 1.0
 */
var bizMOBWebCore = {};

bizMOBWebCore.name = 'bizMOBWebCore';
bizMOBWebCore.version = '1.0';

/**
 * Web Module Class
 */
bizMOBWebCore.Module = {};
bizMOBWebCore.Module.serviceName = 'Module';
bizMOBWebCore.Module.config = {};

// bizMOB Web Logger
bizMOBWebCore.Module.logger = function (sService, sAction, sLogType, sMessage) {
    // 릴리즈 환경에서는 로그 출력 안함.
    if (bizMOBWebCore.App.config._bIsRelease) return;

    // 콘솔 로그 타입 스타일 정의
    var baseStyle = 'padding: 2px 4px; border-radius: 2px;';
    var infoStyle = baseStyle + ' color: white; background: #1a73e8;';
    var logStyle = baseStyle + ' color: white; background: #546e7a;';
    var debugStyle = baseStyle + ' color: white; background: #009688;';
    var warnStyle = baseStyle + ' color: white; background: #ffbb33;';
    var errorStyle = baseStyle + ' color: white; background: #d9534f;';

    // 콘솔 로그 Class 스타일 정의
    var bracketStyle = 'font-weight: bold;';
    var infoBracketStyle = bracketStyle + ' color: #1a73e8;';
    var logBracketStyle = bracketStyle + ' color: #546e7a;';
    var debugBracketStyle = bracketStyle + ' color: #009688;';
    var warnBracketStyle = bracketStyle + ' color: #ffbb33;';
    var errorBracketStyle = bracketStyle + ' color: #d9534f;';

    var msg = '';

    // JSON.stringify 오류시 빈 값으로 처리
    try {
        msg = typeof sMessage === 'object' ? JSON.stringify(sMessage) : sMessage;
    } catch (error) {
        msg = '';
    }

    // 콘솔 로그 정의
    var trace = '[Web][' + sService + ']' + '[' + sAction + ']';
    var log = msg.replace(/\{/gi, '\n{').replace(/\}/gi, '}\n').replace(/\\"/gi, '');

    // 로그 출력
    switch (sLogType) {
        case 'I':
            console.info('%c bizMOB INFO %c ' + '%c' + trace + '%c ' + log, infoStyle, '', infoBracketStyle, '');
            break;
        case 'L':
            console.info('%c bizMOB LOG %c ' + '%c' + trace + '%c ' + log, logStyle, '', logBracketStyle, '');
            break;
        case 'D':
            console.info('%c bizMOB DEBUG %c ' + '%c' + trace + '%c ' + log, debugStyle, '', debugBracketStyle, '');
            break;
        case 'W':
            console.info('%c bizMOB WARN %c ' + '%c' + trace + '%c ' + log, warnStyle, '', warnBracketStyle, '');
            break;
        case 'E':
            console.info('%c bizMOB ERROR %c ' + '%c' + trace + '%c ' + log, errorStyle, '', errorBracketStyle, '');
            break;
    }
};

/**
 * 파라미터 체크
 *
 * @param Object oParams	확인될 파라미터 정보 객체.
 * @param Array aRequired	필수 파라미터 목록.
 *
 * @return boolean result 파라미터 체크 결과
 */
bizMOBWebCore.Module.checkParam = function (oParams, aRequired) {
    var action = 'checkParam'; // 함수 동작을 식별하기 위한 변수
    var typeList = { // 변수 타입에 대한 매핑 객체
        'a': 'array',
        'o': 'object',
        'f': 'function',
        'b': 'boolean',
        's': 'string',
        'n': 'number',
        'v': 'variable',
        'e': 'element',
    };

    var param = oParams || {}; // 전달된 파라미터 객체
    var paramKeys = Object.keys(param); // 전달된 파라미터 객체의 속성 목록
    var required = aRequired || []; // 필수 파라미터 목록
    var missingKeys = required.filter(function (key) { // 없는 필수 파라미터 목록
        return paramKeys.indexOf(key) === -1;
    });

    // 전달된 파라미터가 오브젝트가 아닌 경우
    if (typeof param !== 'object') {
        bizMOBWebCore.Module.logger(this.serviceName, action, 'E', 'Invalid parameter format. Parameter have to define JSON.'); // 로그 출력
        return false;
    }
    // 전달된 파라미터가 없는 경우
    else if (!paramKeys.length) {
        if (required.length == 0) { // 필수 파라미터가 없는 경우
            return true; // 유효성 검사 통과
        }
        else {
            bizMOBWebCore.Module.logger(this.serviceName, action, 'L', 'Cannot found parameters.'); // 로그 출력
            return false; // 유효성 검사 실패
        }
    }
    // 필수 파라미터가 없는 경우
    else if (missingKeys.length) {
        bizMOBWebCore.Module.logger(this.serviceName, action, 'E', 'Parameter is required. - ' + missingKeys.join(', ')); // 로그 출력
        return false;
    }
    // 정상 파라미터
    else {
        // 파라미터 객체 속성 순회
        for (var key in param) {
            if (Object.hasOwnProperty.call(param, key)) {
                var type = key.substring(1, 2); // key값 앞에 _s, _n...에서 s, n...을 추출
                var value = param[key]; // value

                // 속성 값이 없는 경우
                if (value === undefined) {
                    bizMOBWebCore.Module.logger(this.serviceName, action, 'L', 'Parameter is undefined. it skip check - ' + key); // 로그 출력
                }
                // 속성 값이 null인 경우
                else if (value === null) {
                    bizMOBWebCore.Module.logger(this.serviceName, action, 'L', 'Parameter is null. it skip check. - ' + key); // 로그 출력
                }
                // 정의되지 않은 타입이면 false
                if (typeList[type] === undefined) {
                    bizMOBWebCore.Module.logger(this.serviceName, action, 'E', 'Parameter is unknown variable type. - ' + key); // 로그 출력
                    return false;
                }
                // 배열 타입인데, 배열이 아닌 경우 false
                else if (typeList[type] === 'array' && !Array.isArray(value)) {
                    bizMOBWebCore.Module.logger(this.serviceName, action, 'E', 'Parameter is not an array. - ' + key); // 로그 출력
                    return false;
                }
                // 배열 타입인데, 배열이 비어있는 경우 false
                else if (typeList[type] === 'array' && value.length === 0) {
                    bizMOBWebCore.Module.logger(this.serviceName, action, 'E', 'Parameter is empty Array. - ' + key); // 로그 출력
                    return false;
                }
                // 오브젝트 타입인데, 오브젝트가 아닌 경우 false
                else if (typeList[type] === 'object' && typeof value !== 'object') {
                    bizMOBWebCore.Module.logger(this.serviceName, action, 'E', 'Parameter is not an object. - ' + key); // 로그 출력
                    return false;
                }
                // 그 외 타입인데, 타입이 다른 경우 false
                else if (typeList[type] !== typeof value) {
                    bizMOBWebCore.Module.logger(this.serviceName, action, 'E', 'Parameter have wrong value. - ' + key); // 로그 출력
                    return false;
                }
                // variable 또는 element 타입인 경우 true
                else if (typeList[type] === 'variable' || typeList[type] === 'element') {
                    return true;
                }
                // 유효성 검사 통과
                else {
                    return true;
                }
            }
        }
    }
};

/**
 * Web EventManager Class
 */
bizMOBWebCore.EventManager = {};
bizMOBWebCore.EventManager.serviceName = 'EventManager';
bizMOBWebCore.EventManager.config = {};

bizMOBWebCore.EventManager.storage = {
    // Web init
    'ready': true,
};

// 이벤트 셋업 (웹에서는 EventManager.storage에 있는 이벤트를 set시 바로 실행)
bizMOBWebCore.EventManager.set = function () {
    var sEvent = arguments[0]._sEvent;
    var fCallback = arguments[0]._fCallback;

    if (bizMOBWebCore.EventManager.storage[sEvent]) {
        bizMOBWebCore.Module.logger(this.servicename, 'setEvent', 'L', 'Event execute. - ' + sEvent);
        fCallback({ type: 'web' });
    }
    else {
        bizMOBWebCore.Module.logger(this.servicename, 'setEvent', 'E', 'This event is not supported on the web. - ' + sEvent);
    }
};

/**
 * Web ExtendManager Class
 */
bizMOBWebCore.ExtendsManager = {};
bizMOBWebCore.ExtendsManager.serviceName = 'ExtendsManager';
bizMOBWebCore.ExtendsManager.config = {};

/**
 * Web App Class
 */
bizMOBWebCore.App = {};
bizMOBWebCore.App.serviceName = 'App';
bizMOBWebCore.App.config = {
    _bIsRelease: false, // 릴리즈 여부
    _sAppKey: '', // App Key
};

/**
 * Web Contacts Class
 */
bizMOBWebCore.Contacts = {};
bizMOBWebCore.Contacts.serviceName = 'Contacts';
bizMOBWebCore.Contacts.config = {};

/**
 * Web Database Class
 */
bizMOBWebCore.Database = {};
bizMOBWebCore.Database.serviceName = 'Database';
bizMOBWebCore.Database.config = {};

/**
 * Web Device Class
 */
bizMOBWebCore.DeviceManager = {};
bizMOBWebCore.DeviceManager.serviceName = 'DeviceManager';

// 단말기 정보조회
bizMOBWebCore.DeviceManager.getInfo = function () {
    return arguments[0] && arguments[0]._sKey
        ? window.bizMOB.Device.Info[arguments[0]._sKey]
        : window.bizMOB.Device.Info;
};

// 단말기 정보조회
bizMOBWebCore.DeviceManager.setInfo = function () {
    window.bizMOB.Device.Info[arguments[0]._sKey] = arguments[0]._sValue;
};

// App 판단 여부
bizMOBWebCore.DeviceManager.isApp = function () {
    return !!window.BMCManager || (!!window.webkit && !!window.webkit.messageHandlers && !!window.webkit.messageHandlers.BMCManager);
};

// Web 판단 여부
bizMOBWebCore.DeviceManager.isWeb = function () {
    return !bizMOBWebCore.DeviceManager.isApp();
};

// Mobile 여부
bizMOBWebCore.DeviceManager.isMobile = function () {
    var UA = navigator.userAgent || navigator.vendor || window.opera;
    return UA && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(UA);
};

// PC 여부
bizMOBWebCore.DeviceManager.isPC = function () {
    return !bizMOBWebCore.DeviceManager.isMobile();
};

// Android 여부
bizMOBWebCore.DeviceManager.isAndroid = function () {
    var UA = navigator.userAgent || navigator.vendor || window.opera;
    return /android/i.test(UA);
};

// IOS 여부
bizMOBWebCore.DeviceManager.isIOS = function () {
    var UA = navigator.userAgent || navigator.vendor || window.opera;
    return /iPad|iPhone|iPod/.test(UA) && !window.MSStream;
};

// Tablet 여부
bizMOBWebCore.DeviceManager.isTablet = function () {
    var UA = navigator.userAgent || navigator.vendor || window.opera;
    return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(UA.toLowerCase());
};

//Phone 여부
bizMOBWebCore.DeviceManager.isPhone = function () {
    return bizMOBWebCore.DeviceManager.isMobile() && !bizMOBWebCore.DeviceManager.isTablet();
};

/**
 * Web File Class
 */
bizMOBWebCore.File = {};
bizMOBWebCore.File.serviceName = 'File';
bizMOBWebCore.File.config = {};

/**
 * Web Network Class
 */
bizMOBWebCore.Network = {};
bizMOBWebCore.Network.serviceName = 'Network';
bizMOBWebCore.Network.config = {
    _sBaseUrl: '', // Client Base Url
    _sApiContext: '', // Client Context
    _sProxContext: '', // Proxy Context
    _bIsProxy: false, // Proxy 사용 여부
    _sJwtToken: '', // JWT Token
    _bIsCrypto: false, // 암호화 여부
    _sCryAuthToken: '', // 암호화 Token
    _sCrySymKey: '', // 암호화 Key
};

// locale 변경
bizMOBWebCore.Network.changeLocale = function (arg) {
    // 언어 코드 (ko, ko-KR, en, en-US, ...)
    var localeCode = arg._sLocaleCd;
    // full locale 값 조회
    var fullLocale = bizMOBWebCore.Localization.getFullLocale(localeCode);

    // Web 환경에 맞는 언어코드 변경 로직
    bizMOBWebCore.Localization.locale = fullLocale;
    bizMOBWebCore.Module.logger(this.serviceName, 'changeLocale', 'L', 'Network locale change: ' + fullLocale);
};

// 메시지 암호화
bizMOBWebCore.Network.encryption = function () {
    var CryptoJS = window.CryptoJS;
    var arg = arguments[0] || {};
    var message = arg._sMessage || '';

    try {
        var key = atob(bizMOBWebCore.Network.config._sCrySymKey);
        var iv = bizMOBWebCore.Network.config._sCrySymKey.substring(0, 16);
        var encrypt = CryptoJS.AES.encrypt(message, CryptoJS.enc.Utf8.parse(key), {
            iv: CryptoJS.enc.Utf8.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        bizMOBWebCore.Module.logger(this.serviceName, 'encryption', 'L', 'Message encryption success: ' + message);
        return { result: true, message: encrypt.toString() };
    }
    catch (error) {
        bizMOBWebCore.Module.logger(this.serviceName, 'encryption', 'E', 'Message encryption failed: ' + message);
        return { result: false, message: message };
    }
};

// 메시지 복호화
bizMOBWebCore.Network.decryption = function () {
    var CryptoJS = window.CryptoJS;
    var arg = arguments[0] || {};
    var message = arg._sMessage || '';

    try {
        var key = atob(bizMOBWebCore.Network.config._sCrySymKey);
        var iv = bizMOBWebCore.Network.config._sCrySymKey.substring(0, 16);
        var decipher = CryptoJS.AES.decrypt(message, CryptoJS.enc.Utf8.parse(key), {
            iv: CryptoJS.enc.Utf8.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        bizMOBWebCore.Module.logger(this.serviceName, 'encryption', 'L', 'Message decryption success: ' + message);
        return { result: true, message: decipher.toString(CryptoJS.enc.Utf8) };
    }
    catch (error) {
        bizMOBWebCore.Module.logger(this.serviceName, 'encryption', 'E', 'Message decryption failed: ' + message);
        return { result: false, message: message };
    }
};

/**
 * bizMOB Web Server Request
 * @param {string} _sTrcode bizMOB Server 전문코드
 * @param {object} _oHeader bizMOB Server 전문 Header 객체
 * @param {object} _oBody bizMOB Server 전문 Body 객체
 * @param {boolean} _bProgressEnable (default: true) 서버에 통신 요청시 progress 표시 여부( true 또는 false )
 * @param {number} _nTimeout (default: 60) 서버에 통신 요청시 timeout 시간 (sec)
 * @param {function} _fCallback 서버와 통신 후 실행될 callback 함수
 *
 * @return
 */
bizMOBWebCore.Network.requestTr = function (arg) {
    /** Parameter 셋팅 */
    var timeout = (arg._nTimeout ? arg._nTimeout : 60) * 1000; // native api와 시간 단위를 맞춤
    var message = {
        header: Object.assign({}, {
            result: true,
            error_code: '',
            error_text: '',
            info_text: '',
            message_version: '',
            login_session_id: '',
            trcode: arg._sTrcode
        }, arg._oHeader),
        body: arg._oBody
    };
    var body = {
        message: JSON.stringify(message)
    };

    /** bizMOB Auth Token */
    if (bizMOBWebCore.Network.config._bIsCrypto && !!bizMOBWebCore.Network.config._sCryAuthToken) {
        var crypto = bizMOBWebCore.Network.encryption({ _sMessage: body.message });

        // 암호화 성공시 암호화된 값으로 변경
        if (crypto.result) {
            body.message = crypto.message;
            body.isCrypto = true;
        }
        // 암호화 실패시 기존 값 유지
        else {
            body.isCrypto = false;
        }
    }

    /** Http.fetch 호출 */
    // url 생성
    var isProxy = bizMOBWebCore.Network.config._bIsProxy; // serve, build
    var context = isProxy ? bizMOBWebCore.Network.config._sProxContext : bizMOBWebCore.Network.config._sApiContext;
    var url = (bizMOBWebCore.Network.config._sApiContext === '/' ? '' : context) + '/' + arg._sTrcode + '.json' + (arg._sQuery ? '?' + arg._sQuery : ''); // 일반 조화시 url

    // fetch 옵션 생성
    var option = bizMOBWebCore.Http.bizmobOption({
        _sTrcode: arg._sTrcode,
        _oHttpHeader: arg._oHttpHeader,
        _oBody: body,
    });

    // fetch 호출
    bizMOBWebCore.Http.fetch(url, option, timeout)
        .then(function (res) {
            var message = res.data;

            // 복호화 필요시
            if (bizMOBWebCore.Network.config._bIsCrypto && !!bizMOBWebCore.Network.config._sCryAuthToken && message.resMessage) {
                var crypto = bizMOBWebCore.Network.decryption({ _sMessage: message.resMessage });

                // 복호화 성공시 결과값 전달
                if (crypto.result) {
                    message = JSON.parse(crypto.message);
                }
            }

            // callback 함수 호출
            bizMOBWebCore.Module.logger(bizMOBWebCore.Network.serviceName, 'requestTr', 'L', 'Request trcode success: ' + arg._sTrcode);
            arg._fCallback && arg._fCallback(message);
        })
        .catch(function () {
            bizMOBWebCore.Module.logger(bizMOBWebCore.Network.serviceName, 'requestTr', 'E', 'Request trcode failed: ' + arg._sTrcode);
            arg._fCallback && arg._fCallback({
                header: Object.assign({}, message.header || {}, {
                    result: false,
                    error_code: 'NE0002',
                }),
            });
        });
};

/**
 * bizMOB Web Server Request Login
 * @param {string} _sUserId 인증 받을 사용자 아이디
 * @param {string} _sPassword 인증 받을 사용자 패스워드
 * @param {string} _sTrcode 레거시 로그인 인증 전문코드
 * @param {string} _oHeader 레거시 로그인 인증 전문 Header 객체
 * @param {string} _oBody 레거시 로그인 인증 전문 Body 객체
 * @param {boolean} _bProgressEnable (default:true) 서버에 통신 요청시 progress 표시 여부( true 또는 false )
 * @param {number} _nTimeout (default: 60) 서버에 통신 요청시 timeout 시간 (sec)
 * @param {function} _fCallback 서버와 통신 후 실행될 callback 함수
 */
bizMOBWebCore.Network.requestLogin = function (arg) {
    /** Parameter 셋팅 */
    var timeout = (arg._nTimeout ? arg._nTimeout : 60) * 1000; // native api와 시간 단위를 맞춤
    var legacy_message = {
        header: Object.assign({}, {
            result: true,
            error_code: '',
            error_text: '',
            info_text: '',
            message_version: '',
            login_session_id: '',
            trcode: arg._sTrcode
        }, arg._oHeader),
        body: arg._oBody
    };
    var message = {
        header: {
            result: true,
            error_code: '',
            error_text: '',
            info_text: '',
            locale: bizMOBWebCore.Localization.locale,
            message_version: '',
            login_session_id: '',
            trcode: 'LOGIN',
        },
        body: {
            os_type: 'web',
            user_id: arg._sUserId,
            password: arg._sPassword,
            legacy_message: legacy_message,
            legacy_trcode: arg._sTrcode,
            app_key: bizMOBWebCore.App.config._sAppKey,
            emulator_flag: true,
            manual_phone_number: false,
            device_id: '',
            phone_number: '',
        },
    };
    var body = {
        message: JSON.stringify(message)
    };

    /** bizMOB Auth Token */
    if (bizMOBWebCore.Network.config._bIsCrypto && !!bizMOBWebCore.Network.config._sCryAuthToken) {
        var crypto = bizMOBWebCore.Network.encryption({ _sMessage: body.message });

        // 암호화 성공시 암호화된 값으로 변경
        if (crypto.result) {
            body.message = crypto.message;
            body.isCrypto = true;
        }
        // 암호화 실패시 기존 값 유지
        else {
            body.isCrypto = false;
        }
    }

    /** Http.fetch 호출 */
    // url 생성
    var isProxy = bizMOBWebCore.Network.config._bIsProxy; // serve, build
    var context = isProxy ? bizMOBWebCore.Network.config._sProxContext : bizMOBWebCore.Network.config._sApiContext;
    var url = (bizMOBWebCore.Network.config._sApiContext === '/' ? '' : context) + '/LOGIN.json' + (arg._sQuery ? '?' + arg._sQuery : ''); // 일반 조화시 url

    // fetch 옵션 생성
    var option = bizMOBWebCore.Http.bizmobOption({
        _sTrcode: 'LOGIN',
        _oHttpHeader: arg._oHttpHeader,
        _oBody: body,
    });

    /** Http.fetch 호출 */
    bizMOBWebCore.Http.fetch(url, option, timeout)
        .then(function (res) {
            var message = res.data;

            // 복호화 필요시
            if (bizMOBWebCore.Network.config._bIsCrypto && !!bizMOBWebCore.Network.config._sCryAuthToken && message.resMessage) {
                var crypto = bizMOBWebCore.Network.decryption({ _sMessage: message.resMessage });

                // 복호화 성공시 결과값 전달
                if (crypto.result) {
                    message = JSON.parse(crypto.message);
                }
            }

            // callback 함수 호출
            bizMOBWebCore.Module.logger(bizMOBWebCore.Network.serviceName, 'requestTr', 'L', 'Request login success: ' + arg._sTrcode);
            arg._fCallback && arg._fCallback(message.header.result
                ? Object.assign({}, message.body.legacy_message, {
                    accessToken: message.body.accessToken,
                    accessTokenExpTime: message.body.accessTokenExpTime,
                    refreshToken: message.body.refreshToken,
                    refreshTokenExpTime: message.body.refreshTokenExpTime,
                })
                : message);
        })
        .catch(function () {
            bizMOBWebCore.Module.logger(bizMOBWebCore.Network.serviceName, 'requestTr', 'E', 'Request login failed: ' + arg._sTrcode);
            arg._fCallback && arg._fCallback({
                header: Object.assign({}, message.header || {}, {
                    result: false,
                    error_code: 'NE0002',
                }),
            });
        });
};

/**
 * bizMOB Server 전문 통신
 *
 * @param {String} _sUrl 서버 URL
 * @param {String} _sMethod 통신 방식 (get, post)
 * @param {String} _oHeader Http Header
 * @param {String} _oBody Http Body
 * @param {Number} _nTimeout (default: 60) 서버에 통신 요청시 timeout 시간 (sec)
 * @param {Function} _fCallback	서버와 통신 후 실행될 callback 함수
 *
 * @returns {Object} Response 객체
 * @returns {Boolean} returns.result 결과
 * @returns {Number} returns.response_code 응답 코드 (200 <= .. <= 300)
 * @returns {String} returns.response_data 응답 데이터
 * @returns {Object} returns.error 응답 실패시 에러 객체 (실패시에만 존재)
 * @returns {Number} returns.error.code Native 응답 실패코드 (ERR000)
 * @returns {String} returns.error.message Native에서 주는 응답 실패 메시지
 * @returns {Number} returns.error.response_code Server 응답 실패코드 (401, 402, ...) -- 없을 수도 있음
 * @returns {String} returns.error.response_data Server 응답 실패 데이터 -- 없을 수도 있음
 */
bizMOBWebCore.Network.requestHttp = function (arg) {
    var action = 'requestHttp';

    var url = arg._sUrl;
    var timeout = (arg._nTimeout ? arg._nTimeout : 60) * 1000;
    var option = Object.assign({}, arg._oOption, {
        method: arg._sMethod,
        headers: Object.assign({}, {
            'Content-Type': 'application/json'
        }, arg._oHeader),
    });

    // Body 메시지 처리
    if (arg._oBody) {
        // Get 처리
        if (option.method.toLocaleUpperCase() === 'GET') {
            url += '?' + new URLSearchParams(arg._oBody || {}).toString();
        }
        // 그 외 method 처리
        else {
            option.body = new URLSearchParams(arg._oBody || {}).toString();
        }
    }

    // Http.fetch 요청
    bizMOBWebCore.Http.fetch(url, option, timeout)
        .then(function (res) {
            let responseData = null;

            try {
                // 보통 JSON 형태의 응답값
                responseData = JSON.stringify(res.data);
            } catch (error) {
                // 오류가 난 경우 전달받은 값 전달
                responseData = res.data;
            }

            if (200 <= res.status && res.status < 300) {
                arg._fCallback && arg._fCallback({
                    result: true,
                    response_code: res.status,
                    response_data: responseData,
                });
            }
            else {
                arg._fCallback && arg._fCallback({
                    result: false,
                    error: {
                        code: 'ERR001',
                        message: 'Response failed',
                        response_code: res.status,
                        response_data: responseData,
                    },
                });
            }
        })
        .catch(function (res) {
            arg._fCallback && arg._fCallback({
                result: false,
                error: {
                    code: 'ERR000',
                    message: 'Request failed',
                    response_code: res.status,
                    response_data: res.data,
                },
            });
        });
};

/**
 * Web Properties Class
 */
bizMOBWebCore.Properties = {};
bizMOBWebCore.Properties.prefix = 'bizMOB:WEB:PROPERTIES:';
bizMOBWebCore.Properties.serviceName = 'Properties';
bizMOBWebCore.Properties.config = {};

/**
 * bizMOB Web Properties Set
 * @param {object} arg
 * @param {string} arg._sKey Properties key
 * @param {any} arg._vValue Properties value
 * @param {object[]} arg._aList data map list (Ex. [{_sKey: "1", _vValue: "1"}, ...])
 */
bizMOBWebCore.Properties.set = function (arg) {
    var dataList = [];

    if (Object.hasOwnProperty.call(arg, '_aList')) {
        dataList = arg._aList;
    }
    else {
        dataList = [arg];
    }

    dataList.forEach(function (data) {
        var prop = bizMOBWebCore.Properties.prefix + data._sKey;
        var value = data._vValue;

        bizMOBWebCore.Module.logger(bizMOBWebCore.Properties.serviceName, 'set', 'L', 'bizMOB properties set: ' + data._sKey);
        localStorage.setItem(prop, value);
    });
};

/**
 * bizMOB Web Properties Get
 * @param {object} arg
 * @param {string} arg._sKey Properties key
 * @returns Properties value
 */
bizMOBWebCore.Properties.get = function (arg) {
    var prefix = bizMOBWebCore.Properties.prefix;

    if (arg && Object.hasOwnProperty.call(arg, '_sKey')) {
        var prop = prefix + arg._sKey;

        return localStorage.getItem(prop);
    }
    else {
        var storage = localStorage;
        var result = {};

        for (var key in storage) {
            if (Object.hasOwnProperty.call(storage, key)) {
                if (key.indexOf(prefix) === 0) {
                    result[key.replace(prefix, '')] = storage[key];
                }
            }
        }

        return result;
    }
};

/**
 * bizMOB Web Properties Remove
 * @param {object} arg
 * @param {string} arg._sKey Properties key
 */
bizMOBWebCore.Properties.remove = function (arg) {
    var prop = bizMOBWebCore.Properties.prefix + arg._sKey;

    bizMOBWebCore.Module.logger(bizMOBWebCore.Properties.serviceName, 'remove', 'L', 'bizMOB properties remove: ' + arg._sKey);

    localStorage.removeItem(prop);
    return true;
};

/**
 * Web Storage Class
 */
bizMOBWebCore.Storage = {};
bizMOBWebCore.Storage.prefix = 'bizMOB:WEB:STORAGE:';
bizMOBWebCore.Storage.serviceName = 'Storage';
bizMOBWebCore.Storage.config = {};

/**
 * bizMOB Web Storage Set
 * @param {object} arg
 * @param {string} arg._sKey Storage key
 * @param {any} arg._vValue Storage value
 * @param {object[]} arg._aList data map list (Ex. [{_sKey: "1", _vValue: "1"}, ...])
 */
bizMOBWebCore.Storage.set = function (arg) {
    var dataList = [];

    if (Object.hasOwnProperty.call(arg, '_aList')) {
        dataList = arg._aList;
    }
    else {
        dataList = [arg];
    }

    dataList.forEach(function (data) {
        var prop = bizMOBWebCore.Storage.prefix + data._sKey;
        var value = typeof data._vValue === 'string' ? data._vValue : JSON.stringify(data._vValue);

        bizMOBWebCore.Module.logger(bizMOBWebCore.Storage.serviceName, 'set', 'L', 'bizMOB storage set: ' + data._sKey);
        sessionStorage.setItem(prop, value);
    });
};

/**
 * bizMOB Web Storage Get
 * @param {object} arg
 * @param {string} arg._sKey Storage key
 * @returns Storage value
 */
bizMOBWebCore.Storage.get = function (arg) {
    var prefix = bizMOBWebCore.Storage.prefix;

    if (arg && Object.hasOwnProperty.call(arg, '_sKey')) {
        var prop = prefix + arg._sKey;
        var value = sessionStorage.getItem(prop);

        if (value === null) {
            return null;
        }

        // JSON 파싱 시도
        try {
            return JSON.parse(value);
        } catch (error) {
            // JSON이 아닌 문자열인 경우 그대로 반환
            return value;
        }
    }
    else {
        var storage = sessionStorage;
        var result = {};

        for (var key in storage) {
            if (Object.hasOwnProperty.call(storage, key)) {
                if (key.indexOf(prefix) === 0) {
                    var storageKey = key.replace(prefix, '');
                    var storageValue = storage[key];

                    // JSON 파싱 시도
                    try {
                        result[storageKey] = JSON.parse(storageValue);
                    } catch (error) {
                        // JSON이 아닌 문자열인 경우 그대로 저장
                        result[storageKey] = storageValue;
                    }
                }
            }
        }

        return result;
    }
};

/**
 * bizMOB Web Storage Remove
 * @param {object} arg
 * @param {string} arg._sKey Storage key
 */
bizMOBWebCore.Storage.remove = function (arg) {
    var prop = bizMOBWebCore.Storage.prefix + arg._sKey;

    bizMOBWebCore.Module.logger(bizMOBWebCore.Storage.serviceName, 'remove', 'L', 'bizMOB storage remove: ' + arg._sKey);

    sessionStorage.removeItem(prop);
    return true;
};

/**
 * Web PushManager Class
 */
bizMOBWebCore.PushManager = {};
bizMOBWebCore.PushManager.serviceName = 'PushManager';
bizMOBWebCore.PushManager.config = {};

/**
 * Web System Class
 */
bizMOBWebCore.System = {};
bizMOBWebCore.System.serviceName = 'System';
bizMOBWebCore.System.config = {};

bizMOBWebCore.System.getGPS = function (arg) {
    if ('geolocation' in navigator) {
        // Geolocation API 사용 가능
        navigator.geolocation.getCurrentPosition(function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            arg._fCallback && arg._fCallback({
                'result': true,
                'longitude': longitude,
                'latitude': latitude,
                'address': ''
            });
        }, function (error) {
            console.error('Geolocation error:', error);
            arg._fCallback && arg._fCallback({
                'result': false,
                'longitude': 0,
                'latitude': 0,
                'address': ''
            });
        });
    } else {
        // Geolocation API 사용 불가
        arg._fCallback && arg._fCallback({
            'result': false,
            'longitude': 0,
            'latitude': 0,
            'address': ''
        });
    }
};

/**
 * Web Window Class
 */
bizMOBWebCore.Window = {};
bizMOBWebCore.Window.serviceName = 'Window';
bizMOBWebCore.Window.config = {};

/**
 * Web Localization Class
 */
bizMOBWebCore.Localization = {};
bizMOBWebCore.Localization.serviceName = 'Localization';
bizMOBWebCore.Localization.config = {};

// 현재 언어 값
bizMOBWebCore.Localization.locale = '';

// 언어 코드로 (언어코드)-(국가코드) 형태의 full locale 코드 반환
bizMOBWebCore.Localization.getFullLocale = function (localeCode) {
    // 사용자 언어 목록에서 언어 코드(ko, ...)에 대응되는 full locale(ko-KR, ...) 코드
    var fullLocale = navigator.languages.find(function (lang) {
        return lang.toLowerCase().startsWith(localeCode.toLowerCase() + '-');
    });
    // 미리 지정한 언어 목록에서 언어 코드에 대응되는 preset locale 코드
    var presetLocale = window.bizMOBLocale[localeCode.toLowerCase()];

    // 전달받은 언어 코드가 full locale(ko-KR)값이라면 그대로 전달
    if (localeCode.indexOf('-') > 0) {
        bizMOBWebCore.Module.logger(this.serviceName, 'getFullLocale', 'L', 'Gets the full locale value: (parameter) ' + localeCode);
        return localeCode;
    }
    // 전달받은 언어 코드가 'ko' 형식이고, navigator.languages 목록에서 'ko-KR' 형식이 있다면 찾은 값 전달
    else if (fullLocale) {
        bizMOBWebCore.Module.logger(this.serviceName, 'getFullLocale', 'L', 'Gets the full locale value: (navigator) ' + fullLocale);
        return fullLocale;
    }
    // 전달받은 언어 코드가 'ko' 형식이고, 프리셋에 있다면 프리셋 언어코드를 전달
    else if (presetLocale) {
        bizMOBWebCore.Module.logger(this.serviceName, 'getFullLocale', 'L', 'Gets the full locale value: (preset) ' + presetLocale);
        return presetLocale;
    }
    // 전달받은 언어 코드가 navigator, 프리셋에 전부 없다면 전달받은 값 그대로 전달 (ko)
    else {
        bizMOBWebCore.Module.logger(this.serviceName, 'getFullLocale', 'L', 'Gets the full locale value: (unknown) ' + presetLocale);
        return localeCode;
    }
};

// 설정된 (언어)-(국가) 코드 조회
bizMOBWebCore.Localization.getLocale = function (arg) {
    var locale = bizMOBWebCore.Localization.locale; // 설정한 언어 코드
    var defaultLocale = bizMOBWebCore.Localization.getFullLocale(navigator.language); // 기본 언어 코드

    // 설정한 locale가 있는 경우 (Ex. ko-KR)
    if (locale) {
        arg._fCallback && arg._fCallback({ result: true, locale: bizMOBWebCore.Localization.locale });
    }
    // 그 외에는 Default 언어 코드 전달
    else {
        arg._fCallback && arg._fCallback({ result: true, locale: defaultLocale });
    }
};

// 언어코드에 맞는 (언어)-(국가) 코드 저장
bizMOBWebCore.Localization.setLocale = function (arg) {
    // 언어 코드 (ko, ko-KR, en, en-US, ...)
    var localeCode = arg._sLocaleCd;
    // full locale 값 조회
    var fullLocale = bizMOBWebCore.Localization.getFullLocale(localeCode);

    // Web 환경에 맞는 언어코드 변경 로직
    bizMOBWebCore.Localization.locale = fullLocale;
    bizMOBWebCore.Module.logger(this.serviceName, 'setLocale', 'L', 'Localization locale set: ' + fullLocale);

    // callback 함수 호출
    arg._fCallback && arg._fCallback({ result: true, locale: bizMOBWebCore.Localization.locale });
};

/**
 * Web Http Class
 */
bizMOBWebCore.Http = {};

// bizMOB Server용 fetch option 정보
bizMOBWebCore.Http.bizmobOption = function () {
    var arg = arguments[0] || {};
    var httpHeader = arg._oHttpHeader || null; // http header
    var headers = Object.assign({}, {
        // 컨텐츠 타입
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    }, httpHeader);
    var body = arg._oBody || {}; // body data

    // 언어 코드 추가
    if (bizMOBWebCore.Localization.locale && !headers['Accept-Language']) {
        headers['Accept-Language'] = bizMOBWebCore.Localization.locale;
    }

    // 암호화 코드 추가
    if (bizMOBWebCore.Network.config._bIsCrypto && !!bizMOBWebCore.Network.config._sCryAuthToken) {
        headers['BzCrypto-Authorization'] = 'BEAR ' + bizMOBWebCore.Network.config._sCryAuthToken;
    }

    // JWT Token 존재시 추가
    if (arg._sTrcode !== 'LOGIN' && bizMOBWebCore.Network.config._sJwtToken) {
        headers['Authorization'] = 'Bearer ' + bizMOBWebCore.Network.config._sJwtToken;
    }

    // 옵션 반환
    return {
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        method: 'POST',
        headers: headers,
        body: new URLSearchParams(body || {}).toString(),
    };
};

/**
 * 요청 파라미터를 fetch 형태에 맞춰서 변경 후 요청
 * @param {object} arg 요청 객체
 * @param {string} arg._sUrl
 * @param {string} arg._sMethod 요청 방식 (GET, POST, PUT, DELETE, ...)
 * @param {number} arg._nTimeout 요청 제한시간 (sec 단위)
 * @param {number} arg._nRetries API 요청 회수 (default: 1 -- 한번 요청 실패시 응답)
 * @param {object} arg._oOption fetch options
 * @param {object} arg._oHeader request 요청 header
 * @param {object} arg._oBody request 요청 body -- JSON.stringify(data) 또는 new URLSearchParams(data).toString() 후 전달
 * @param {function} arg._fCallback (custom) 요청 성공/실패시 응답값 반환 함수
 * @return
 */
bizMOBWebCore.Http.request = function (arg) {
    // 변수 설정
    var url = arg._sUrl;
    var option = Object.assign({}, arg._oOption, {
        method: arg._sMethod,
        headers: arg._oHeader,
    });
    var timeout = (arg._nTimeout ? arg._nTimeout : 60) * 1000; // requestTr과 시간 단위를 맞춤
    var retries = arg._nRetries;

    // Body 메시지 처리
    if (arg._oBody) {
        // Get 처리
        if (option.method.toLocaleUpperCase() === 'GET') {
            url += '?' + arg._oBody;
        }
        // 그 외 method 처리
        else {
            option.body = arg._oBody;
        }
    }

    // Http.fetch 요청
    bizMOBWebCore.Http.fetch(url, option, timeout, retries)
        .then(function (res) { arg._fCallback && arg._fCallback(res); })
        .catch(function (res) { arg._fCallback && arg._fCallback(res); });
};

/**
 * Mock 데이터 호출
 * @param {String} sClassName 클래스 명칭
 * @param {String} sMethod 함수 명칭
 * @param {Object} oMessage 전달 파라미터
 */
bizMOBWebCore.Http.requestMock = function (sClassName, sMethod, oMessage) {
    var call = oMessage._fCallback || oMessage.callback || null;
    var baseUrl = bizMOBWebCore.Network.config._sBaseUrl;
    var className = sClassName === 'PushManager' ? 'Push' : sClassName; // Push는 bizMOB과 Core의 클래스명이 다름
    var url = '';
    var option = {
        method: 'GET'
    };

    switch (sMethod) {
        case 'executer': // callPlugin
            url = baseUrl + 'mock/bizMOB/callPlugin/' + oMessage._sID + '/' + sMethod + '.json?param=' + JSON.stringify(oMessage._oParam);
            break;

        case 'requestTr': // 일반 전문
        case 'requestLogin': // 로그인 전문
            url = baseUrl + 'mock/' + oMessage._sTrcode + '.json?param=' + JSON.stringify(oMessage);
            break;

        case 'requestTimeout': // setTimeout
            url = baseUrl + 'mock/bizMOB/' + className + '/setTimeout.json?param=' + JSON.stringify(oMessage._oParam);
            break;

        default: // 평균
            url = baseUrl + 'mock/bizMOB/' + className + '/' + sMethod + '.json?param=' + JSON.stringify(oMessage);
            break;
    }

    bizMOBWebCore.Http.fetch(url, option)
        .then(function (res) {
            bizMOBWebCore.Module.logger(className, sMethod, 'D', className + ' ' + sMethod + ' mock response.');
            if (sMethod === 'requestLogin') {
                var msg = Object.assign({}, res.data.body.legacy_message, {
                    accessToken: res.data.body.accessToken,
                    accessTokenExpTime: res.data.body.accessTokenExpTime,
                    refreshToken: res.data.body.refreshToken,
                    refreshTokenExpTime: res.data.body.refreshTokenExpTime,
                });
                call && call(msg);
            }
            else {
                call && call(res.data);
            }
        })
        .catch(function () {
            bizMOBWebCore.Module.logger(className, sMethod, 'E', className + ' ' + sMethod + ' mock not found.');
            call && call({ result: false, type: 'mock' });
        });
};

/**
 * timeout + retries + fetch
 * @param {string} url 요청 URL
 * @param {object} opt fetch 옵션
 * @param {number} limitTime Timeout 시간
 * @param {number} retries API 요청 회수
 *
 * @return
 * @param {boolean} ok 성공여부
 * @param {number} status 결과 코드 (200, 404, ...)
 * @param {string} statusText 결과 Text
 * @param {object} data 데이터
 */
bizMOBWebCore.Http.fetch = function (url, opt, limitTime, retries) {
    var option = opt; // fetch option 셋팅
    var limit = limitTime || (60 * 1000); // timeout 시간
    var retry = retries || 1; // 재요청 회수

    // Fetch 요청 Promise
    var attemptFetch = function (url, opt) {
        return new Promise(function (resolve, reject) {
            fetch(url, opt).then(function (res) {
                if (res.ok) {
                    resolve(res.json());
                }
                else {
                    reject(res);
                }
            });
        });
    };

    // Timeout 제한 Promise
    var timeout = function (timeout) {
        return new Promise(function (_, reject) {
            setTimeout(function () { reject(new Error('timeout error')); }, timeout);
        });
    };

    // Promise 객체 Return
    return new Promise(function (resolve, reject) {
        var attempts = 1;
        var executeFetch = function () {
            var fetchAttempt = Promise.race([attemptFetch(url, option), timeout(limit)]); // 요청 경쟁
            var maxRetry = retry; // 최대 리트라이 회수

            // Fetch 요청
            fetchAttempt
                .then(function (data) {
                    resolve({ ok: true, status: 200, statusText: 'OK', data: data });
                })
                .catch(function (res) {
                    if (attempts < maxRetry) {
                        attempts++;
                        executeFetch(); // 재발송 회수만큼 재귀 호출
                    }
                    else {
                        reject({ ok: res.ok, status: res.status, statusText: res.statusText, data: null });
                    }
                });
        };

        // 요청 함수 실행
        executeFetch();
    });
};