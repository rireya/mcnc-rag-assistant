/**
 * 01.클래스 설명 : bizMOBCore 최상위 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : bizMOBCore 최상위 클래스
 *
 * @author 김승현
 * @version 1.0
 *
 */
var bizMOBCore = {}; // NameSpace 정의

bizMOBCore.name = 'bizMOBCore'; // NameSpace 명
bizMOBCore.version = '4.0'; // bizMOBCore 버전
bizMOBCore.readystatus = false; // bizMOB App이 initailize 작업이 완료된 후 ready event가 수행 되었는지 여부
bizMOBCore.loglevel = '1248';  //Log(1)Debug(2)Warn(4)Error(8)

/**
 *
 * 01.클래스 설명 : bizMOB App Plugin 호출시 Async 로 호출받을 Callback 함수 관리 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : Callback 함수 관리 클래스
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.CallbackManager = new Object(); // Callback Manager Class정의

bizMOBCore.CallbackManager.servicename = 'CallbackManager'; // log 기록을 위한 클래스명 선언

bizMOBCore.CallbackManager.index = 0; // 다중 PlugIn을 호출시 Callback Manager에서 callback함수를 저장하기 위해 저장스토리지 키를 유니크하게 만들어줄 index값 property 선언

bizMOBCore.CallbackManager.storage = {};// 다중 PlugIn을 호출시 Callback Manager에서 일회성 callback함수를 저장하기 위해 저장 스토리지 객체 선언

bizMOBCore.CallbackManager.listener = {}; // 다중 PlugIn을 호출시 Callback Manager에서 고정 callback함수를 저장하기 위해 저장 스토리지 객체 선언

/**
 * Callback 함수 저장 메소드
 *
 * @param Function fCallback	저장 할 callback함수.
 * @param String sType	저장할 타입(stg : 1회성, lsn : 반복성 ).
 * @param String sName	저장할 콜백 이름(alias).
 *
 * @return String callbackId
 */
bizMOBCore.CallbackManager.save = function(fCallback, sType, sName){

    var action = 'save'; // log기록을 위해 메소드명 정의
    var callbackId = ''; // CallbackManager에 저장할 콜백 함수명 정의 변수

    // Xross API중 Callback이 옵션일경우 callback 미 지정시 처리
    if(!fCallback){ 
       
        bizMOBCore.Module.logger(this.servicename, action ,'L', 'Callback function is not defined.');
        // bizMOB App에서 Callback 함수 호출시 스크립트 에러를 방지하기 위해 Core모듈에 정의된 echo메소드를 이용하여 callback함수로 리턴되는 Response값을 로깅한다.
        fCallback = bizMOBCore.Module.echo;
    }

    // Callback 함수 특성을 구분하여 스토리지를 분리하여 저장한다. 
    switch(sType){
        case 'listener' :
            // 반복성 고정 callback 을 사용시에 sType을 listener로 정의하여 CallbackManager.listener스토리지에 저장된다. 
            callbackId = 'lsn'+this.index++;

            // listener에 callbackID랑 callback함수 저장
            this.listener[callbackId] = fCallback;
            bizMOBCore.Module.logger(this.servicename, action, 'L', ' Callback listener saved the function at '+callbackId+' area.');
            break;
        case 'custom' :
            // 개발자가 callback함수를 특정이름으로 사용하고 싶을때, index로 인해 임의의 callback함수명을 받고 싶지 않을때 sName을 파라미터로 전달하고 해당 값으로 callbackID를 지정 하여 callback함수명을 저장한다.
            if (sName) {
                callbackId = 'cst_'+sName;
            } else {
                callbackId = 'cst_'+this.index++;
            }

            this.listener[callbackId] = fCallback;
            bizMOBCore.Module.logger(this.servicename, action, 'L', ' Callback listener saved the function at '+callbackId+' area.');
            break;
        default :
            // callback 타입이 별도 지정 된값이 없으면 1회성 callback으로 CallbackManager.storage에 저장
            callbackId = 'stg'+this.index++;

            // storage에 callbackID랑 callback함수 저장
            this.storage[callbackId] = fCallback;
            bizMOBCore.Module.logger(this.servicename, action, 'L', ' Callback storage saved the function at '+callbackId+' area.');
            break;
    }

    return callbackId;

};

/**
 * bizMOB App Plugin에서 결과값 Return을 위해 호출할 고정 Callback 함수 처리 메소드
 *
 * @param Object oCallback Xross에서 실행할 콜백 데이타.
 * @param Object oResdata 호출했던 App PlugIn 처리 결과 데이타.
 *
 * @return null
 */
bizMOBCore.CallbackManager.responser = function(oCallback, oResdata, oServiceInfo){

    // bizMOB App plugin으로 부터 결과가 callback으로 호출되었음을 로깅
    bizMOBCore.Module.logger(this.servicename, 'responser', 'L',  'CallbackManager recieve response from bizMOB App : ' );

    // bizMOB App plugin으로 부터 결과가 예외 오류가 발생했는지 확인
    if(oCallback.callback == 'exception'){
        bizMOBCore.Module.logger(this.servicename, 'responser', 'E',  'Recieve Message is ' + JSON.stringify(oResdata) );
        return;
    }

    // CallbackManager에 저장된 스토리지 위치를 찾기 위해 콜백정보 데이터에서 callbackID prefix값을 비교하여 스토리지를 찾은 후 해당 callbackID로 콜백함수를 실행.
    if(oCallback.callback.indexOf('stg') == 0){

        bizMOBCore.Module.logger(this.servicename, 'responser', 'D', oCallback.callback + ' call from the storage : ' );
        // 스토리지내 콜백함수를 실행
        this.storage[oCallback.callback](oResdata.message, oServiceInfo); // 네이티브에서 온 message와 함께 전달
        // 1회성 콜백함수는 호출 후 스토리지에서 삭제
        delete this.storage[oCallback.callback]; 
        bizMOBCore.Module.logger(this.servicename, 'responser', 'I', oCallback.callback+' function called and removed.');

    }else if(oCallback.callback.indexOf('lsn') == 0 || oCallback.callback.indexOf('cst') == 0){
        // 스토리지내 콜백함수를 실행
        bizMOBCore.Module.logger(this.servicename, 'responser', 'D', oCallback.callback + ' call from the listener : ' );
        this.listener[oCallback.callback](oResdata.message, oServiceInfo);

    }else{
        // bizMOB App PlugIn 호출이 아닌 경우의 콜백 함수.
        
        bizMOBCore.Module.logger(this.servicename, 'responser', 'D', oCallback.callback + ' call from the page : ' );

        var tempcall;

        try{
            // bizMOB App PlugIn 호출이 아닌 xross API호출시 직접 콜백 함수를 실행.
            tempcall = eval(oCallback.callback);
            tempcall.call(undefined, oResdata.message, oServiceInfo);
        }catch(e){
            // 직접 콜백 함수 실행시 오류가 발생하면 에러 메세지 처리
            if(tempcall == undefined ){
                bizMOBCore.Module.logger(this.servicename, 'responser', 'E', 'Callback does not exist. : ' + JSON.stringify(oCallback.callback));

            }else if(tempcall.constructor !== Function){
                bizMOBCore.Module.logger(this.servicename, 'responser', 'E', 'Callback is not a function. : ' + JSON.stringify(oCallback.callback));
            }
        }

    }

};


/**
 *
 * 01.클래스 설명 : bizMOBCore클래스 App PlugIn 기능 요청을 위한 공통 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : Callback 함수 관리 클래스
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Module = new Object(); //Module 클래스 정의

bizMOBCore.Module.servicename = 'AppModule'; //Module 클래스 이름 정의
bizMOBCore.Module.config = {}; //Module 클래스 설정 정보 정의

/** Xross 3.x 에서 사용하던 url 호출방식에서 JSBridge방식으로 변경함에 따라 삭제
* bizMOBCore.Module.cmdwatcher = false; //requester가 요청중인지 상태 check하기 위한변수
* bizMOBCore.Module.cmdPosition = 0;  //requester내에서 다음 요청을 처리하기 위한 index값
*/

/**
 * App PlugIn 호출전 파라미터 변수타입을 체크하기 위한 메소드
 *
 * @param Object oParams	확인될 파라미터 정보 객체.
 * @param Array aRequired	필수 파라미터 목록.
 *
 * @return boolean result 파라미터 체크 결과
 */
bizMOBCore.Module.checkParam = function(oParams, aRequired){
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
    var missingKeys = required.filter(function(key) { // 없는 필수 파라미터 목록
        return paramKeys.indexOf(key) === -1;
    });

    // 전달된 파라미터가 오브젝트가 아닌 경우
    if (typeof param !== 'object') {
        bizMOBCore.Module.logger(this.serviceName, action, 'E', 'Invalid parameter format. Parameter have to define JSON.'); // 로그 출력
        return false;
    }
    // 전달된 파라미터가 없는 경우
    else if (!paramKeys.length) {
        if (required.length == 0) { // 필수 파라미터가 없는 경우
            return true; // 유효성 검사 통과
        }
        else {
            bizMOBCore.Module.logger(this.serviceName, action, 'L', 'Cannot found parameters.'); // 로그 출력
            return false; // 유효성 검사 실패
        }
    }
    // 필수 파라미터가 없는 경우
    else if (missingKeys.length) {
        bizMOBCore.Module.logger(this.serviceName, action, 'E', 'Parameter is required. - ' + missingKeys.join(', ')); // 로그 출력
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
                    bizMOBCore.Module.logger(this.serviceName, action, 'L', 'Parameter is undefined. it skip check - ' + key); // 로그 출력
                }
                // 속성 값이 null인 경우
                else if (value === null) {
                    bizMOBCore.Module.logger(this.serviceName, action, 'L', 'Parameter is null. it skip check. - ' + key); // 로그 출력
                }
                // 정의되지 않은 타입이면 false
                if (typeList[type] === undefined) {
                    bizMOBCore.Module.logger(this.serviceName, action, 'E', 'Parameter is unknown variable type. - ' + key); // 로그 출력
                    return false;
                }
                // 배열 타입인데, 배열이 아닌 경우 false
                else if (typeList[type] === 'array' && !Array.isArray(value)) {
                    bizMOBCore.Module.logger(this.serviceName, action, 'E', 'Parameter is not an array. - ' + key); // 로그 출력
                    return false;
                }
                // 배열 타입인데, 배열이 비어있는 경우 false
                else if (typeList[type] === 'array' && value.length === 0) {
                    bizMOBCore.Module.logger(this.serviceName, action, 'E', 'Parameter is empty Array. - ' + key); // 로그 출력
                    return false;
                }
                // 오브젝트 타입인데, 오브젝트가 아닌 경우 false
                else if (typeList[type] === 'object' && typeof value !== 'object') {
                    bizMOBCore.Module.logger(this.serviceName, action, 'E', 'Parameter is not an object. - ' + key); // 로그 출력
                    return false;
                }
                // 그 외 타입인데, 타입이 다른 경우 false
                else if (typeList[type] !== typeof value) {
                    bizMOBCore.Module.logger(this.serviceName, action, 'E', 'Parameter have wrong value. - ' + key); // 로그 출력
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
 * bizMOB 3.x 에서 사용하던 App PlugIn 호출 메소드. Deprecated
 * Command Queue에 저장된 커맨드 순서대로 bizMOB App에 요청
 *
 * @param
 *
 * @return
 */
/*
bizMOBCore.Module.requester = function() {
    // 실제로 네이티브에 요청하는 부분
    var action = 'requester';

    if(this.cmdQueue.length > this.cmdPosition){
        bizMOBCore.Module.logger(this.servicename , action, 'D', (this.cmdPosition+1)+'th COMMAND Request.');
        document.location.href=this.cmdQueue[this.cmdPosition];
        this.cmdQueue[this.cmdPosition] = null;
        this.cmdPosition++;
        // this.cmdwatcher = true;
        setTimeout('bizMOBCore.Module.requester();', 200);
    }else{
        console.log('COMMAND Stopped!!');
        // this.cmdwatcher = false;
    }

};
*/

/**
 * bizMOB APP api호출시 요청된 Data를 JSBridge 를 통해 App에 요청하는 메소드
 *
 * @param Object oMessage	bizMOB App PlugIn에 전달될 파라미터 정보 객체.
 * @param String sServiceName	요청한 커맨드의 서비스명 정보.
 * @param String sAction	요청한 커맨드의 서비스내 기능 정보.
 * @param Object oServiceInfo	bizMOB App에 전달하고 Core 로직을 위한 파라미터 정보 객체.
 *
 * @return
 */
bizMOBCore.Module.gateway = function(oMessage, sServiceName, sAction, oServiceInfo){
    var action = 'gateway';

    oMessage.service_info = {};

    if(oServiceInfo){
        oMessage.service_info = oServiceInfo;
    }

    oMessage.service_info['sServiceName'] = sServiceName;
    oMessage.service_info['sAction'] = sAction;

    // oMessage JSON object --> string으로 바꾸어 줌
    // replacer: 숫자를 string으로 변환해 줌(webkit에서 오류나서)

    oMessage = JSON.stringify(oMessage, this.replacer, 3);

    bizMOBCore.Module.logger(this.servicename , action, 'D', 'Request Service: ' + sServiceName + ', Action: ' + sAction + ', Param: ' + oMessage);

    if(bizMOBCore.DeviceManager.isApp()){

        if( bizMOBCore.DeviceManager.isIOS() ){
            // IOS console log
            window.webkit.messageHandlers.BMCLogger.postMessage(oMessage);

            window.webkit.messageHandlers.BMCManager.postMessage(oMessage);
        } else {
            window.BMCManager.execPluginWithJSB(oMessage);
        }

    }else{
        bizMOBCore.Module.logger(sServiceName , sAction, 'D', 'This function doesn\'t support in browser.');
    }

};

/**
 * 메세지 Data중 Command 요청시 오류가 발생하는 Data처리 함수
 *
 * @param String sKey	Data의 키값.
 * @param Variable vValue	변경할 데이터.
 *
 * @return vValue 가공된 데이터
 */
bizMOBCore.Module.replacer = function(sKey, vValue) {
    // 숫자를 string type으로 바꾸어 줌(number로 하면 오작동 하는 경우 발생)
    if (typeof vValue === 'number' && !isFinite(vValue)) {
        return String(vValue);
    }
    return vValue;
};

/**
 * JSON Object를 String으로 변환
 *
 * @param Variable vValue	변경할 데이터.
 *
 * @return value String으로 변환된 값.
 */
bizMOBCore.Module.stringjson = function(vValue) {
    // Object -> String
    var value =  vValue!=undefined && vValue!=null ? JSON.stringify(vValue) : '';
    return value;

};

/**
 *String을 JSON Object으로 변환
 *
 * @param Variable vValue	변경할 데이터.
 *
 * @return String vValue String으로 변환된 값.
 */
bizMOBCore.Module.parsejson = function(vValue) {
    // String -> Object
    var retValue;

    // 숫자를 다시 Object로 변환 할 때, 0으로 시작하면 8진수로 오작동 할 수 있으므로
    if ( vValue != undefined && vValue.slice(0, 1) != '0' && vValue != '' ) {
        retValue = JSON.parse(vValue);
    }

    return retValue;

};

/**
 *File 클래스내에서 FilePath지정시 지정위치 키워드 처리
 *
 * @param String sPath	변경할 FilePath 값.
 *
 * @return Object splitPathType FilePath 정보를 분할한 Data Object.
 */
bizMOBCore.Module.pathParser = function(sPath) {
    // bizMOB App 인터페이스 parsing을 위해 경로 분리
    var splitPathType = {};
    var regExp = new RegExp('{(.*?)}/(.*)','g');
    var result = regExp.exec(sPath);

    if(result){
    // {contents}/bizMOB/sign.bmp
    // result[1]: {contents}
    // result[2]: bizMOB/sign.bmp
        splitPathType.type = result[1] ? result[1] : 'absolute';
        splitPathType.path = result[2];
    }else {
        splitPathType.type = 'absolute';
        splitPathType.path = sPath;
    }
    return splitPathType;
};

/**
 *bizMOB App 요청시 정의된 Callback함수가 없을경우 Default로 지정될 함수
 *
 * @param Object oReturnValue	bizMOB App로 부터 전달된 데이터 값.
 *
 * @return
 */
bizMOBCore.Module.echo = function(oReturnValue){
    // callback이 option일때 callback이 없으면 script에러 나서 echo callback만들어 줌
    var action = 'echo';
    bizMOBCore.Module.logger('Module', action ,'L', 'Echo callback . : ');
    if(oReturnValue.constructor !== Event){
        bizMOBCore.Module.logger('Module', action ,'D', 'callback parameter . : '+ JSON.stringify(oReturnValue));
    }

};

/**
 * Log 출력
 *
 * @param String sServiceName	요청한 커맨드의 서비스명 정보.
 * @param String sAction	요청한 커맨드의 서비스내 기능 정보.
 * @param String sLogtype 로그 레벨
 * @param String sMessage 로그 메세지
 *
 * @return
 */
bizMOBCore.Module.logger = function(sService, sAction, sLogtype, sMessage){
    // 릴리즈 환경에서는 로그 출력 안함.
    if (bizMOBCore.App.config._bIsRelease) return;

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

    var trace = '[App]['+sService+']'+'['+sAction+']';
    var log = msg.replace(/\{/gi, '\n{').replace(/\}/gi, '}\n').replace(/\\"/gi, '');

    var logLevel = bizMOBCore.DeviceManager.getInfo({ _sKey: 'web_log_level' }) || bizMOBCore.loglevel;

    if (typeof logLevel == 'string' && logLevel.length == 4) {
        var logLevelArr = logLevel.split('');

        if (bizMOBCore.DeviceManager.isApp() && bizMOBCore.DeviceManager.isIOS() ) {
            window.webkit.messageHandlers.BMCLogger.postMessage('bizMOB LOG: ' + trace + ' - ' + log);
        }

        switch(sLogtype) {
            case 'I' :
                if (logLevelArr[0].indexOf('1') > -1) {
                    console.info('%c bizMOB INFO %c ' + '%c' + trace + '%c ' + log, infoStyle, '', infoBracketStyle, '');
                }
                break;
            case 'L' :
                if (logLevelArr[0].indexOf('1') > -1) {
                    console.info('%c bizMOB LOG %c ' + '%c' + trace + '%c ' + log, logStyle, '', logBracketStyle, '');
                }
                break;
            case 'D' :
                if (logLevelArr[1].indexOf('2') > -1) {
                    console.info('%c bizMOB DEBUG %c ' + '%c' + trace + '%c ' + log, debugStyle, '', debugBracketStyle, '');
                }
                break;
            case 'W' :
                if (logLevelArr[2].indexOf('4') > -1) {
                    console.info('%c bizMOB WARN %c ' + '%c' + trace + '%c ' + log, warnStyle, '', warnBracketStyle, '');
                }
                break;
            case 'E' :
                if (logLevelArr[3].indexOf('8') > -1) {
                    console.info('%c bizMOB ERROR %c ' + '%c' + trace + '%c ' + log, errorStyle, '', errorBracketStyle, '');
                }
                break;
        }
    }
};

/**
 * Core 초기화 작업
 *
 * @param Object oRequired 발생 이벤트 Data객체
 * @param Object oOptions 이벤트에 전달될 메세지 Data객체
 *
 * @return
 */
bizMOBCore.Module.init = function(oRequired, oOptions){

    var action = 'init';
    bizMOBCore.Module.logger(this.servicename, action, 'D', 'bizMOBCore Initailizing start.');

    /**
     * initXross에서 필요 값 셋팅으로 변경
     * - 제이쿼리 제거로 인한 $.ajax 제거
     */
    // bizMOBCore.APP_CONFIG = $.ajax({ "url" : "../../bizMOB/config/app.config", "async" : false, "cache" : false, "dataType" : "JSON" }).responseJSON;


    bizMOBCore.DeviceManager.init();
    bizMOBCore.EventManager.init();

    bizMOBCore.Module.logger(this.servicename, action ,'L', 'bizMOB Module initialized. ');

};

/**
 * 01.클래스 설명 : bizMOB Window 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 :  bizMOB Client에서 생성하는 Window 객체
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Window = new Object();

bizMOBCore.Window.servicename = 'Window';
bizMOBCore.Window.config = {};

/**
 * SignPad(서명) Window 띄우기
 *
 * @param String _sTargetPath		사인패드에서 서명한 이미지를 저장할 File Path.
 * @param Function _fCallback		사인패드 처리 결과값을 받을 callback 함수.
 *
 * @return
 */
bizMOBCore.Window.openSignPad = function() {

    var action = 'openSignPad';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var splitTargetPath = bizMOBCore.Module.pathParser(arguments[0]._sTargetPath);

    var oldparam = {
        target_path_type : splitTargetPath.type,
        target_path : splitTargetPath.path,
        callback:callback
    };

    var tr = {
        id:'OPEN_SIGNATURE',
        param:{}
    };

    var params = Object.assign({}, {
        callback: 'bizMOBCore.Module.echo'
    }, oldparam);

    tr.param = params;

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * File Explorer(탐색기) Window 띄우기
 *
 *
 * @return Object File 정보 객체
 */
bizMOBCore.Window.openFileExplorer = function() {

    var action = 'openFileExplorer';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id:'CALL_FILE_BROWSER',
        param:{
            'types' : arguments[0]._atype,
            'callback' : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * ImageViewer  띄우기
 *
 * @param String _sImagePath	이미지 뷰어로 열 이미지 File Path.
 * @param Function _fCallback	 이미지 뷰어 Close시 결과값을 받을 callback함수.
 *
 * @return
 */
bizMOBCore.Window.openImageViewer = function() {

    var action = 'openImageViewer';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sImagePath);

    var oldparam = {
        'source_path' : splitSourcePath.path,
        'source_path_type' : splitSourcePath.type,
        'orientation' : 'auto',
        callback : callback
    };

    var tr = {
        id:'OPEN_IMAGE_VIEW',
        param:{}
    };

    var params = Object.assign({}, {
        callback: 'bizMOBCore.Module.echo'
    }, oldparam);

    tr.param = params;

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * CodeReader( BarCode, QRCode )  띄우기
 *
 * @param Function _fCallback	 Code 판독 결과값을 받을 callback함수.
 *
 * @return
 */
bizMOBCore.Window.openCodeReader = function() {

    var action = 'openCodeReader';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var oldparam = {
        callback:callback
    };

    var tr = {
        id:'OPEN_CODE_READER',
        param:{}
    };

    var params = Object.assign({}, {
        message:{},
        callback: 'bizMOBCore.Module.echo'
    }, oldparam);

    tr.param = params;

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};


/**
 *
 * 01.클래스 설명 : Properties 저장 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : 영구 데이터 저장소
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Properties = new Object();

bizMOBCore.Properties.servicename = 'Properties';
bizMOBCore.Properties.config = {};

/**
 * Properties 데이터 저장
 *
 * @param Variable _aList또는_sKey 저장할 데이터
 * @param Variable _vValue 저장할 값(_sKey와 쌍으로 들어옴.)
 *
 * @return
 */
bizMOBCore.Properties.set = function() {

    var action = 'set';
    var tr = {
        call_type:'js2stg',
        id:'SET_FSTORAGE',
        param:{data:[]}
    };

    // bizMOB App한테 주기 전에 데이터 정리하는 용도의 array
    var properties = [];

    if(arguments[0]._aList)
    {
        var savelist = arguments[0]._aList;
        for(var i=0;i < savelist.length ; i++){

            properties.push({key:savelist[i]._sKey, value:bizMOBCore.Module.stringjson(savelist[i]._vValue)});
            // set하고 바로 get하고 싶을 때(개발자 입장에서 로직에따라)
            window.bizMOB.FStorage[savelist[i]._sKey] = bizMOBCore.Module.stringjson(savelist[i]._vValue);
        }
    }else{
        properties.push({key:arguments[0]._sKey, value:bizMOBCore.Module.stringjson(arguments[0]._vValue)});
        window.bizMOB.FStorage[arguments[0]._sKey] = bizMOBCore.Module.stringjson(arguments[0]._vValue);
    }

    tr.param.data = properties;
    bizMOBCore.Module.logger(this.servicename, action ,'D', arguments[0]._sKey+ ' set on bizMOB Properties. ');

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * Properties 데이터 불러오기
 *
 * @param String _sKey 저장 값의 키
 *
 * @return
 */
bizMOBCore.Properties.get = function() {
    var action = 'get';
    var key = arguments[0]._sKey;

    // bizMOB App에 요청 없이 FStorage에서 get
    if(window.bizMOB.FStorage[key]){
        return bizMOBCore.Module.parsejson( window.bizMOB.FStorage[key]);
    }else{
        return null;
    }


};

/**
 * Properties 데이터 삭제
 *
 * @param String _sKey 저장 값의 키
 *
 * @return
 */
bizMOBCore.Properties.remove = function() {
    var action = 'remove';
    var key = arguments[0]._sKey;

    // bizMOB App에서 지우기
    var tr = {
        id:'REMOVE_FSTORAGE',
        param:{data:[key]}
    };
    // FStorage에서 지우기
    delete window.bizMOB.FStorage[key];


    bizMOBCore.Module.logger(this.servicename, action ,'D', arguments[0]._sKey+ ' removed on bizMOB Properties. ');

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 *
 * 01.클래스 설명 : System 기능 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : OS 기반 기본 기능
 * 04.관련 API/화면/서비스 : bizMOBCore.Module.checkParam,bizMOBCore.System.callBrowser, bizMOBCore.System.callCamera, bizMOBCore.System.callGallery, bizMOBCore.System.callMap, bizMOBCore.System.callSMS, bizMOBCore.System.callTEL, bizMOBCore.System.getGPS
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.System = new Object();

bizMOBCore.System.servicename = 'System';
bizMOBCore.System.config = {};

/**
 * 전화걸기
 *
 * @param String _sNumber	전화번호
 * @param Function _fCallback	실행후 결과를 처리할 callback 함수
 *
 * @return
 */
bizMOBCore.System.callTEL = function() {

    var action = 'callTEL';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var number = arguments[0]._sNumber ? (arguments[0]._sNumber.match(/(^[+0-9])|[0-9]/gi).join('')) : '';

    var tr = {
        id:'TEL',
        param:{
            number: number,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 문자보내기
 *
 * @param Array _aNumber	메세지를 보낼 전화번호 배열
 * @param String _sMessage	보낼 메세지
 * @param Function _fCallback	실행후 결과를 처리할 callback 함수
 *
 * @return
 */
bizMOBCore.System.callSMS = function() {

    var action = 'callSMS';
    //var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var cell_list = arguments[0]._aNumber;

    for(var i=0; i< cell_list.length ; i++)
    {
        var validvalue = cell_list[i].match(/(^[+0-9])|[0-9]/gi);
        if(validvalue != null){
            cell_list[i] = validvalue.join('');
        }else{
            bizMOBCore.Module.logger(this.servicename, action ,'E', cell_list[i]+ ' is wrong number format.');
        }
    }

    arguments[0]._aNumber = cell_list;

    var tr = {
        id:'SMS',
        // ;로 구분해서 string으로 보냄
        param:{number:arguments[0]._aNumber.join(';'), message:arguments[0]._sMessage}
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 단말기에 설치된 브라우져 열기
 *
 * @param String _sURL	메세지를 보낼 전화번호 배열
 *
 * @return
 */
bizMOBCore.System.callBrowser = function(){

    var action = 'callBrowser';

    var tr = {

        id:'CALL_EXTERNAL_BROWSER',
        param:{ 'url':arguments[0]._sURL }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 단말기 디바이스의 갤러리(사진앨범) 보기
 *
 * @param String _sType	String	(Default : all) 갤러리에서 불러올 미디어 타입( all, image, video )가 있습니다.
 * @param Function _fCallback	갤러리에서 선택한 미디어를 결과를 전달 받아서 처리할 callback 함수.

 *
 * @return
 */
bizMOBCore.System.callGallery = function(){

    var action = 'callGallery';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    switch(arguments[0]._sType) {
        case 'all' :
            arguments[0]._sType = ['video','image'];
            break;
        case 'video' :
            arguments[0]._sType = ['video'];
            break;
        case 'image' :
            arguments[0]._sType = ['image'];
            break;
        default :
            arguments[0]._sType = ['video','image'];
            break;
    }

    var tr = {
        id:'OPEN_MEDIA_PICKER',
        param:{
            type_list : arguments[0]._sType,
            max_count : arguments[0]._nMaxCount,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 단말기 지도 실행
 *
 * @param String _sLocation	위치 정보(주소, 위경도값)
 *
 * @return
 */
bizMOBCore.System.callMap = function() {

    var action = 'callMap';

    var tr = {
        id:'SHOW_MAP',
        param:{
            location:arguments[0]._sLocation
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * OS별 지도 실행
 *
 * @param String _sLocation	위치 정보(주소, 위경도값)
 *
 * @return
 */
bizMOBCore.System.getGPS = function()
{
    var action = 'getGPS';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id:'GET_LOCATION',
        param:{
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 단말기 카메라 촬영
 *
 * @param Function _fCallback		갤러리에서 선택한 미디어를 전달 받아서 처리하는 callback 함수
 * @param String _sFileName		찍은 이미지를 저장할 이름
 * @param String _sDirectory	찍은 이미지를 저장할 경로
 * @param Boolean _bAutoVerticalHorizontal	(Default : true) 찍은 이미지를 화면에 맞게 자동으로 회전시켜 저장할지를 설정 값
 *
 * @return
 */
bizMOBCore.System.callCamera = function()
{
    var action = 'callCamera';

    var splitTargetDir = bizMOBCore.Module.pathParser(arguments[0]._sDirectory);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    // bAutoVerticalHorizontal: 사진을 자동으로 가로 세로 맞춰주는 옵션
    var autoVerticalHorizontal = arguments[0]._bAutoVerticalHorizontal === false ? false : true;

    var tr = {
        id:'CALL_CAMERA',
        param:{
            target_directory: splitTargetDir.path,
            target_directory_type: splitTargetDir.type,
            picture_name:arguments[0]._sFileName,
            rotate : autoVerticalHorizontal,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 *
 * 01.클래스 설명 : App 컨트롤 관련 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : App 컨트롤 관련 기능
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.App = new Object();

bizMOBCore.App.servicename = 'App';
bizMOBCore.App.config = {
    _sAppKey: '', // AppKey
    _bIsRelease: false, // 배포 빌드 여부
};

/**
 * App 프로그래스바 열기
 *
 * @param Function _fCallback	실행 후 호출될 callback 함수
 *
 * @return
 */
bizMOBCore.App.openProgress = function(){

    var action = 'openProgress';
    if(arguments[0] == undefined) { arguments[0] = {}; }
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        'id': 'PROGRESS_CONTROLLER',
        'param': {
            'type' : 'show' ,
            'callback' : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * App 프로그래스바 닫기
 *
 *@param Function _fCallback	실행 후 호출될 callback 함수
 *
 * @return
 */
bizMOBCore.App.closeProgress = function(){

    var action = 'closeProgress';
    if(arguments[0] == undefined) { arguments[0] = {}; }
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        'id': 'PROGRESS_CONTROLLER',
        'param': {
            'type' : 'close' ,
            'callback' : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * App 종료
 *
 * @param String _sType	(Default : kill)어플리케이션 종료 유형( logout 또는 kill )
 *
 * @return
 */
bizMOBCore.App.exit = function(){

    var action = 'exit';
    var type = arguments[0]._sType ? arguments[0]._sType : 'kill';

    var tr = {
        'id': 'EXIT_APP',
        'param': {'kill_type' : type }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * App 자동 종료 시간 설정
 *
 * @param Number _nSeconds	( default : 7200 )어플리케이션의 세션 만료 시간(초단위) 설정 값.
 * @param Variable _vMessage 세션 종료시 표시할 메세지
 *
 * @return
 */
bizMOBCore.App.requestTimeout = function(){

    var action = 'requestTimeout';

    var callback = arguments[0]._fCallback ? bizMOBCore.CallbackManager.save(arguments[0]._fCallback) : '' ;

    var tr = {
        'id': 'SET_INACTIVE_TIMEOUT',
        'param': {
            'callback':callback,
            'session_timeout': arguments[0]._nSeconds,
            'message': arguments[0]._vMessage
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * App 자동 종료 시간 조회
 *
 * @param Variable _vMessage 세션 종료시 표시할 메세지
 * @param Function _fCallback	서버와 통신 후 실행될 callback 함수
 *
 * @return
 */
bizMOBCore.App.getTimeout = function(){

    var action = 'getTimeout';
    var seconds = -1; // 조회시 -1로 설정
    var callback = arguments[0]._fCallback ? bizMOBCore.CallbackManager.save(arguments[0]._fCallback) : '' ;

    var tr = {
        'id': 'SET_INACTIVE_TIMEOUT',
        'param': {
            'callback':callback,
            'session_timeout': seconds,
            'message': ''
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * App 스플래시가 수동 조작인 경우 종료 기능
 *
 * @param Function _fCallback	서버와 통신 후 실행될 callback 함수
 *
 * @return
 */
bizMOBCore.App.hideSplash = function(){

    var action = 'hideSplash';
    var callback = arguments[0]._fCallback ? bizMOBCore.CallbackManager.save(arguments[0]._fCallback) : '' ;

    var tr = {
        'id': 'HIDE_SPLASH',
        'param': {
            'callback':callback,
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};


/**
 *
 * 01.클래스 설명 : Web Storage 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : 휘발성 데이터 저장소
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Storage = new Object();

bizMOBCore.Storage.servicename = 'Storage';
bizMOBCore.Storage.config = {};

/**
 * Storage 데이터 저장
 *
 * 24-04-09 mhchoi:
 *  - bizMOB 4.n 이상 부터는 도메인 기반이라 localStorage에 저장하면 영구적으로 저장됨.
 *  - 기존에 3.n 에서 Storage는 휘발성 데이터로 사용했기 때문에 동일한 구조를 유지하기 위해 sessionStorage로 변경
 *
 * @param Variable _aList또는_sKey 저장할 데이터
 * @param Variable _vValue 저장할 값(_sKey와 쌍으로 지정됨)
 *
 * @return
 */
bizMOBCore.Storage.set = function() {

    var action = 'set';

    // 1. Array로 올 때
    if(arguments[0]._aList)
    {		var savelist = arguments[0]._aList;
        for(var i=0;i < savelist.length ; i++){
            // HTML5에 있는 sessionStorage 저장
            // storage는 브라우저 web storage
            sessionStorage.setItem ( savelist[i]._sKey ,  bizMOBCore.Module.stringjson(savelist[i]._vValue) );
        }
    // 2. Key value로 들어 올 때
    }else{
        sessionStorage.setItem ( arguments[0]._sKey ,  bizMOBCore.Module.stringjson(arguments[0]._vValue) );
    }

    bizMOBCore.Module.logger(this.servicename, action ,'D', arguments[0]._sKey+ ' set on bizMOB Storage. ');


};

/**
 * Storage 데이터 불러오기
 *
 * @param String _sKey 저장 값의 키
 *
 * @return
 */
bizMOBCore.Storage.get = function() {

    var action = 'get';
    var key = arguments[0]._sKey;

    var value = sessionStorage.getItem ( key );

    return bizMOBCore.Module.parsejson(value);
};

/**
 * Storage 데이터 삭제
 *
 * @param String _sKey 저장 값의 키
 *
 * @return
 */
bizMOBCore.Storage.remove = function() {

    var action = 'remove';

    sessionStorage.removeItem(arguments[0]._sKey);

    bizMOBCore.Module.logger(this.servicename, action ,'D', arguments[0]._sKey+ ' removed on bizMOB Storage. ');

};


/**
 *
 * 01.클래스 설명 : Network 통신 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : bizMOB Server와 통신
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Network = new Object();

bizMOBCore.Network.servicename = 'Network';
bizMOBCore.Network.config = {
    _sJwtToken: '', // JWT Token
};

bizMOBCore.Network.index = 0;

bizMOBCore.Network.callbackStorage = {};

bizMOBCore.Network.changeLocale = function(arg) {
    // 언어 코드 (ko, ko-KR, en, en-US, ...)
    var localeCode = arg._sLocaleCd;
    // full locale 값 조회
    var fullLocale = bizMOBCore.Localization.getFullLocale(localeCode);

    // Web 환경에 맞는 언어코드 변경 로직
    bizMOBCore.Localization.locale = fullLocale;
    bizMOBCore.Module.logger(this.serviceName, 'changeLocale', 'L', 'Network locale change: ' + fullLocale);
};

bizMOBCore.Network.httpHeader = function() {
    var arg = arguments[0] || {};
    var httpHeader = arg._oHttpHeader || null; // http header
    var headers = Object.assign({}, {
    // 컨텐츠 타입
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    }, httpHeader);

    // 언어 코드 추가
    if (bizMOBCore.Localization.locale && !headers['Accept-Language']) {
        headers['Accept-Language'] = bizMOBCore.Localization.locale;
    }

    // JWT Token 존재시 추가
    if (arg._sTrcode !== 'LOGIN' && bizMOBCore.Network.config._sJwtToken) {
        headers['Authorization'] = 'Bearer ' + bizMOBCore.Network.config._sJwtToken;
    }

    return headers;
};

/**
 * bizMOB Server 전문 통신
 *
 * @param String _sTrcode	bizMOB Server 전문코드
 * @param String _oHeader	bizMOB Server 전문 Header 객체
 * @param String _oBody		bizMOB Server 전문 Body 객체
 * @param Boolean _bProgressEnable		(default:true) 서버에 통신 요청시 progress 표시 여부( true 또는 false )
 * @param Number _nTimeout (default: 60) 서버에 통신 요청시 timeout 시간 (sec)
 * @param Function _fCallback	서버와 통신 후 실행될 callback 함수
 *
 * @return
 */
bizMOBCore.Network.requestTr = function(arg) {
    var timeout = arg._nTimeout ? arg._nTimeout : 60;
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
    var httpHeader = bizMOBCore.Network.httpHeader({
        _sTrcode: arg._sTrcode,
        _oHttpHeader: arg._oHttpHeader
    });

    var action = 'requestTr';
    var progressEnable = arg._bProgressEnable === false ? false : true; // progress 진행 표시
    var tr = {
        id: 'REQUEST_TR',
        param: {
            trcode: arg._sTrcode,
            message: message,
            callback: bizMOBCore.CallbackManager.save(arg._fCallback),
            read_timeout: timeout,
            progress: progressEnable,
            header : httpHeader
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * bizMOB Server 로그인(인증)전문 통신
 *
 * @param String _sUserId	인증 받을 사용자 아이디
 * @param String _sPassword	인증 받을 사용자 패스워드
 * @param String _sTrcode	레거시 로그인 인증 전문코드
 * @param String _oHeader	레거시 로그인 인증 전문 Header 객체
 * @param String _oBody		레거시 로그인 인증 전문 Body 객체
 * @param Function _fCallback	서버와 통신 후 실행될 callback 함수
 * @param Boolean _bProgressEnable		(default:true) 서버에 통신 요청시 progress 표시 여부( true 또는 false )
 * @param Number _nTimeout (default: 60) 서버에 통신 요청시 timeout 시간 (sec)
 * @return
 */
bizMOBCore.Network.requestLogin = function(arg) {
    var timeout = arg._nTimeout ? arg._nTimeout : 60;
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
    var httpHeader = bizMOBCore.Network.httpHeader({
        _sTrcode: 'LOGIN',
        _oHttpHeader: arg._oHttpHeader
    });

    var action = 'requestLogin';
    var progressEnable = arg._bProgressEnable === false ? false : true;
    var tr = {
        id:'REQUEST_LOGIN',
        param: {
            // portal에 로그인
            auth_info: {
                user_id: arg._sUserId,
                password: arg._sPassword
            },
            // 확장
            legacy_trcode: arg._sTrcode,
            legacy_message: legacy_message,
            message: {},
            callback: bizMOBCore.CallbackManager.save(arg._fCallback),
            read_timeout : timeout,
            progress : progressEnable,
            header : httpHeader
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * bizMOB Server 전문 통신
 *
 * @param {String} _sUrl 서버 URL
 * @param {String} _sMethod 통신 방식 (get, post)
 * @param {String} _oHeader Http Header
 * @param {String} _oBody Http Body
 * @param {Boolean} _bProgressEnable (default:true) 서버에 통신 요청시 progress 표시 여부( true 또는 false )
 * @param {Number} _nTimeout (default: 60) 서버에 통신 요청시 timeout 시간 (sec)
 * @param {Function} _fCallback	서버와 통신 후 실행될 callback 함수
 *
 * @returns {Object} Response 객체
 * @returns {Boolean} returns.result 결과
 * @returns {Number} returns.response_code 응답 코드 (200 <= .. <= 300)
 * @returns {String} returns.response_data 응답 데이터
 * @returns {Object} returns.error 응답 실패시 에러 객체 (실패시에만 존재)
 * @returns {Number} returns.error.code bizMOB App 응답 실패코드 (ERR000)
 * @returns {String} returns.error.message bizMOB App에서 주는 응답 실패 메시지
 * @returns {Number} returns.error.response_code Server 응답 실패코드 (401, 402, ...) -- 없을 수도 있음
 * @returns {String} returns.error.response_data Server 응답 실패 데이터 -- 없을 수도 있음
 */
bizMOBCore.Network.requestHttp = function(arg) {
    var action = 'requestHttp';

    var url = arg._sUrl;
    var method = arg._sMethod;
    var timeout = arg._nTimeout ? arg._nTimeout : 60;
    var progressEnable = arg._bProgressEnable === false ? false : true; // progress 진행 표시
    var header = Object.assign({}, {
        'Content-Type': 'application/json'
    }, arg._oHeader);
    var body = arg._oBody;

    var tr = {
        id: 'REQUEST_HTTP',
        param: {
            url: url,
            method: method,
            timeout: timeout,
            progress: progressEnable,
            header: header,
            data: body,
            callback: bizMOBCore.CallbackManager.save(arg._fCallback),
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 *
 * 01.클래스 설명 : Event 관리 기능 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : bizMOB Event  관리 기능 클래스
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.EventManager = new Object();

bizMOBCore.EventManager.servicename = 'EventManager';
bizMOBCore.EventManager.config = {};

bizMOBCore.EventManager.storage = {
    // App init
    'ready' : [],
    // 페이지 관련
    'resume' : [],
    'backbutton' : [],
    'beforeready' : [],
    // 사이드 뷰 관련
    'open' : [],
    'close' : [],
    // 푸시 메시지 관련
    'push' : [],
    'networkstatechange' : [],
    // 세션타임아웃
    'sessiontimeout' : []
};

bizMOBCore.EventManager.beforeInitEvents =[];

bizMOBCore.EventManager.list = ['ready','resume','backbutton','open','close','networkstatechange','sessiontimeout'];

/**
 * bizMOB Window Load시 bizMOB Event 기능 초기화
 *
 * @param
 *
 * @return
 */
bizMOBCore.EventManager.init = function() {

    var action = 'init';

    bizMOBCore.Module.logger(this.servicename, action ,'L', 'EventManager initializing start.');

    for (var evtname in this.storage) {
    // bizMOBCore.Module.logger(this.servicename, action ,"L", evtname + " event handler.");
    // `&& this.storage[evtname].length > 0` 조건 제거: onReady가 App에서 너무 빨리 호출되는 경우 이벤트 등록이 안됨.
        if (Object.hasOwnProperty.call(this.storage, evtname)) {

            bizMOBCore.Module.logger(this.servicename, action ,'L', evtname + ' event handler registed.');
            document.addEventListener('bizMOB.on' + evtname, function(event) {
                var eventName = event.type.replace('bizMOB.on', '');
                var eventList = bizMOBCore.EventManager.storage[eventName];

                eventList.forEach(function(callback) {
                    if (callback instanceof Function) {
                        callback(event);
                    }
                    else {
                        try {
                            eval(callback);
                        } catch (error) {
                            bizMOBCore.Module.logger(this.servicename, action ,'W',  callback + ' is undefined. ');
                        }
                    }
                });
            });

        }else{
            bizMOBCore.Module.logger(this.servicename, action ,'L', evtname + ' event handler does not exist.');
        }
    }

    var recievedEventslength = bizMOBCore.EventManager.beforeInitEvents.length;
    if(recievedEventslength > 0 ){
    // console.log("run event before init");

        for(var i=0; i < recievedEventslength; i++ ){
            bizMOBCore.EventManager.raiseevent(bizMOBCore.EventManager.beforeInitEvents[i]['oRequired'], bizMOBCore.EventManager.beforeInitEvents[i]['oOptions']);
        }
    }
    if (bizMOBCore.DeviceManager.isAndroid()) {
    // bizMOB App에 backbutton에 대한 event 추가 요청
        bizMOBCore.EventManager.requester({ 'eventname' : 'backbutton' });
    }

    bizMOBCore.Module.logger(this.servicename, action ,'L', 'EventManager initialized.');
};

/**
 * bizMOB App에서 관장하는 Event  등록 요청 기능
 *
 * @param Object oRequired 요청 이벤트 Data객체
 * @param Object oOptions 요청 이벤트 등록 요청시 전달할 Data객체
 *
 * @return
 */
bizMOBCore.EventManager.requester = function(oRequired, oOptions) {

    var action = 'requester';

    switch(oRequired.eventname)
    {
        case 'backbutton' :

            var tr = {
                id:'ADD_EVENT_BACKBUTTON',
                param:{}
            };


            var params ={
                useBackEvent : true,
            };

            tr.param = params;

            // bizMOB App gateway에 요청
            bizMOBCore.Module.gateway(tr, this.servicename , action );
            bizMOBCore.Module.logger(this.servicename, action ,'L', 'EventManager request add event.');

            break;
    }

};

/**
 * bizMOB App에서 Event 발생시 Web으로 전달되는 기능
 *
 * @param Object oRequired 발생한 이벤트 Data객체
 * @param Object oOptions 이벤트에 전달될 메세지 Data객체
 *
 * @return
 */
bizMOBCore.EventManager.responser = function(oRequired, oOptions) {
    // 네이티브에게 응답을 받기위한 용도
    // 네이티브에서 로직처리 완료 후 responser를 호출

    var action = 'responser';

    bizMOBCore.Module.logger(this.servicename, action ,'L', 'EventManager recieved event. - ' + oRequired.eventname + ', ' + JSON.stringify(oOptions));

    switch(oRequired.eventname)
    {
    // 네이티브에서 준비되면 onReady
        case 'onReady' :
            if(!bizMOBCore.readystatus){
                // 웹 레디 준비(Module.init에서 device property랑 이벤트 등록해줌)
                bizMOBCore.Module.init(oRequired, oOptions);
                bizMOBCore.readystatus = true;
                // beforeready 호출(beforeready: 페이지가 로딩 전에 수행되어야하는 로직들)
                bizMOBCore.EventManager.raiseevent({eventname : 'onbeforeready'}, oOptions);
                // onReady불러줌 onReady에 page.init
                if(bizMOBCore.EventManager.beforeInitEvents.length == 0 || bizMOBCore.EventManager.beforeInitEvents[0]['oOptions']['message']['status'] == 'receive'){
                    bizMOBCore.EventManager.raiseevent(oRequired, oOptions);
                }else{
                    bizMOBCore.EventManager.raiseevent(oRequired, {'message' : { startBy : bizMOBCore.EventManager.beforeInitEvents[0]['oRequired']['eventname'].replace(/on/,'').toLowerCase()}});
                }
            }
            break;
            // 일반적인 이벤트
        default :
            if(bizMOBCore.readystatus){
                bizMOBCore.EventManager.raiseevent(oRequired, oOptions);
            }else{
                // console.log("event rev before init" + JSON.stringify(oRequired));
                bizMOBCore.EventManager.beforeInitEvents.push({'oRequired':oRequired, 'oOptions' :oOptions });
            }
            break;
    }

};

/**
 * 등록된 이벤트를 발생 시키는 기능
 *
 * @param Object oRequired 발생한 이벤트 Data객체
 * @param Object oOptions 이벤트에 전달될 메세지 Data객체
 *
 * @return
 */
bizMOBCore.EventManager.raiseevent = function(oRequired, oOptions) {
    // 이벤트 발생
    var action = 'raiseevent';

    bizMOBCore.Module.logger(this.servicename, action ,'L', 'EventManager raise event. - ' + oRequired.eventname.toLowerCase() + ', ' + JSON.stringify(oOptions.message));

    // 자바스크립트 custom이벤트 발생
    var evt = document.createEvent('Event');
    evt.initEvent('bizMOB.'+oRequired.eventname.toLowerCase(), false, true );
    // 이전페이지에서 온 message를 data에 넣어줌
    evt.data = oOptions.message;

    try{
        document.dispatchEvent(evt);
    }catch(e){
        bizMOBCore.Module.logger(this.servicename, action ,'E', e);
    }

};

// 이벤트 등록 (set)
bizMOBCore.EventManager.set = function() {
    var sEvent = arguments[0]._sEvent;
    var fCallback = arguments[0]._fCallback;

    if (bizMOBCore.EventManager.storage[sEvent]) {
    // bizMOB App에서 이미 onReady를 발생 시킨 후에 ready를 등록시 바로 실행
        if (sEvent === 'ready' && bizMOBCore.readystatus) {
            bizMOBCore.Module.logger(this.servicename, 'setEvent', 'L', 'Event execute. - ' + sEvent);
            fCallback();
        }
        // 그 외에는 등록
        else {
            bizMOBCore.EventManager.storage[sEvent] = [ fCallback ];
            bizMOBCore.Module.logger(this.servicename, 'setEvent', 'L', '\'' + sEvent + '\' event set.');
        }
    }
    else {
        bizMOBCore.Module.logger(this.servicename, 'setEvent','E', 'Event set failed. Cannot find \'' + sEvent + '\' eventname.');
    }
};

// 이벤트 삭제
bizMOBCore.EventManager.clear = function() {
    var sEvent = arguments[0]._sEvent;

    if (bizMOBCore.EventManager.storage[sEvent]) {
        bizMOBCore.EventManager.storage[sEvent] = [];
        bizMOBCore.Module.logger(this.servicename, 'clearEvent', 'L', '\'' + sEvent + '\' event clear.');
    }
    else {
        bizMOBCore.Module.logger(this.servicename, 'setEvent','E', 'Event clear failed. Cannot find \'' + sEvent + '\' eventname.');
    }
};

/**
 *
 * 01.클래스 설명 : 단말기 정보 관리 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : 단말기 정보 관리
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.DeviceManager = new Object();

bizMOBCore.DeviceManager.servicename = 'DeviceManager';
bizMOBCore.DeviceManager.config = {};

/**
 * bizMOB Window Load시 bizMOB Device Info 초기화
 *
 * @param
 *
 * @return
 */
bizMOBCore.DeviceManager.init = function(){
    // Device Info관련
    var appMajorVersion = bizMOBCore.DeviceManager.getInfo({ _sKey: 'app_major_version' });
    var appMinorVersion = bizMOBCore.DeviceManager.getInfo({ _sKey: 'app_minor_version' });
    var appBuildVersion = bizMOBCore.DeviceManager.getInfo({ _sKey: 'app_build_version' });
    var contentMinorVersion = bizMOBCore.DeviceManager.getInfo({ _sKey: 'content_major_version' });
    var contentBuildVersion = bizMOBCore.DeviceManager.getInfo({ _sKey: 'content_minor_version' });
    var appVersion = appMajorVersion + '.' + appMinorVersion + '.' + appBuildVersion + '_' + contentMinorVersion + '.' + contentBuildVersion;

    bizMOBCore.DeviceManager.setInfo({
        _sKey: 'app_version',
        _sValue: appVersion
    });

    bizMOBCore.Module.logger(this.servicename, 'init', 'D', 'Device Info initialized - ' + JSON.stringify(bizMOBCore.DeviceManager.getInfo()));
};

/**
 * 단말기 정보조회
 *
 * @param {String} _sKey	디바이스 정보 키 값.
 *
 * @return Object 단말기 정보
 */
bizMOBCore.DeviceManager.getInfo = function() {
    // Core에서 컨테이너에게 정보를 요청하지 않고  Xross에서 저장되어 있는 값을 return함.
    return arguments[0] && arguments[0]._sKey
        ? window.bizMOB.Device.Info[arguments[0]._sKey]
        : window.bizMOB.Device.Info;
};

/**
 * 단말기 정보조회
 *
 * @param {String} _sKey	디바이스 정보 key 값.
 * @param {String} _sValue	디바이스 정보 value 값.
 */
bizMOBCore.DeviceManager.setInfo = function() {
    window.bizMOB.Device.Info[arguments[0]._sKey] = arguments[0]._sValue;
};

/**
 * App 판단 여부
 */
bizMOBCore.DeviceManager.isApp = function() {
    return !!window.BMCManager || (!!window.webkit && !!window.webkit.messageHandlers && !!window.webkit.messageHandlers.BMCManager);
};

/**
 * Web 판단 여부
 */
bizMOBCore.DeviceManager.isWeb = function() {
    return !bizMOBCore.DeviceManager.isApp();
};

/**
 * Mobile 여부
 */
bizMOBCore.DeviceManager.isMobile = function() {
    var UA = navigator.userAgent || navigator.vendor || window.opera;
    return UA && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(UA);
};

/**
 * PC 여부
 */
bizMOBCore.DeviceManager.isPC = function() {
    return !bizMOBCore.DeviceManager.isMobile();
};

/**
 * Android 여부
 */
bizMOBCore.DeviceManager.isAndroid = function() {
    var UA = navigator.userAgent || navigator.vendor || window.opera;
    return /android/i.test(UA);
};

/**
 * IOS 여부
 */
bizMOBCore.DeviceManager.isIOS = function() {
    var UA = navigator.userAgent || navigator.vendor || window.opera;
    return /iPad|iPhone|iPod/.test(UA) && !window.MSStream;
};

/**
 * Tablet 여부
 */
bizMOBCore.DeviceManager.isTablet = function() {
    var UA = navigator.userAgent || navigator.vendor || window.opera;
    return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(UA.toLowerCase());
};

/**
 * Phone 여부
 */
bizMOBCore.DeviceManager.isPhone = function() {
    return bizMOBCore.DeviceManager.isMobile() && !bizMOBCore.DeviceManager.isTablet();
};

/**
 *
 * 01.클래스 설명 : bizMOB App API 실행 기능 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : bizMOB App API 실행 기능
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.ExtendsManager = new Object();

bizMOBCore.ExtendsManager.servicename = 'Extends';

bizMOBCore.ExtendsManager.executer = function(){

    var action = 'executer';

    for (var prop in arguments[0]._oParam) {
        if (Object.hasOwnProperty.call(arguments[0]._oParam, prop)) {
            if (typeof arguments[0]._oParam[prop] === 'function') {
                arguments[0]._oParam[prop] = bizMOBCore.CallbackManager.save(arguments[0]._oParam[prop], 'custom');
            }
        }
    }

    bizMOBCore.Module.logger(this.servicename, action, 'D', ' ExtendsManager executer : ' + arguments[0]._sID + ' -' + JSON.stringify(arguments[0]._oParam));

    var tr = {
        id: arguments[0]._sID,
        param:arguments[0]._oParam
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};


/**
 *
 * 01.클래스 설명 : 단말기 주소록 기능 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : 단말기 주소록 관리 기능
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Contacts = new Object();

bizMOBCore.Contacts.servicename = 'Contacts';
bizMOBCore.Contacts.config = {};

/**
 * 전화번호부 검색
 *
 * @param String _sSearchType	(Default : "", 전체조회) 주소록 검색 대상 필드(name 또는 phone)
 * @param String _sSearchText 	(Default : "") 주소록 검색어
 * @param Function _fCallback	주소록 검색 결과를 받아 처리할 callback함수
 *
 * @return
 */
bizMOBCore.Contacts.get = function(options) {

    var action = 'get';

    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {
        id:'GET_CONTACT',
        param:{
            search_type : arguments[0]._sSearchType || '',
            search_text : arguments[0]._sSearchText || '',
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};


/**
 *
 * 01.클래스 설명 : File 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : File 컨트롤 클래스
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.File = new Object();

bizMOBCore.File.servicename = 'File';
bizMOBCore.File.config = {};

/**
 * 파일 열기
 *
 * @param String _sSourcePath 열어볼 파일 경로. 기본 설치App으로 연결.
 * @param Function _fCallback 파일을 열고 난 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.open = function()
{
    var action = 'open';

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {
        id:'OPEN_FILE',
        param:{
            target_path : splitSourcePath.path,
            target_path_type : splitSourcePath.type,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 파일 압축
 *
 * @param String _sSourcePath 소스 File Path.
 * @param String _sTargetPath 결과 File Path.
 * @param Function _fCallback 압축 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.zip= function()
{
    var action = 'zip';

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var splitTargetPath = bizMOBCore.Module.pathParser(arguments[0]._sTargetPath);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {

        id:'MAKE_ZIPFILE',
        param:{
            source_path: splitSourcePath.path,
            source_path_type: splitSourcePath.type,
            target_path: splitTargetPath.path,
            target_path_type: splitTargetPath.type,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 압축해제
 *
 * @param String _sSourcePath 소스 File Path.
 * @param String _sDirectory 압축 해제할 Directory Path.
 * @param Function _fCallback 압축 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.unzip= function()
{
    var action = 'unzip';

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var splitTargetPath = bizMOBCore.Module.pathParser(arguments[0]._sDirectory);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {

        id:'EXTRACT_ZIPFILE',
        param:{
            source_path: splitSourcePath.path,
            source_path_type: splitSourcePath.type,
            target_directory: splitTargetPath.path,
            target_directory_type: splitTargetPath.type,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 이동
 *
 * @param String _sSourcePath 소스 File Path.
 * @param String _sTargetPath 이동될 File Path.
 * @param Function _fCallback 이동 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.move = function()
{
    var action = 'move';

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var splitTargetPath = bizMOBCore.Module.pathParser(arguments[0]._sTargetPath);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {

        id:'MOVE_FILE',
        param:{
            source_path: splitSourcePath.path,
            source_path_type: splitSourcePath.type,
            target_path: splitTargetPath.path,
            target_path_type: splitTargetPath.type,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 복사
 *
 * @param String _sSourcePath 소스 File Path.
 * @param String _sTargetPath 복사될 File Path.
 * @param Function _fCallback 복사 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.copy = function() {

    var action = 'copy';

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var splitTargetPath = bizMOBCore.Module.pathParser(arguments[0]._sTargetPath);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {

        'id': 'COPY_FILE',
        'param': {
            source_path: splitSourcePath.path,
            source_path_type: splitSourcePath.type,
            target_path: splitTargetPath.path,
            target_path_type: splitTargetPath.type,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 삭제
 *
 * @param Array _aSourcePath 삭제할 File Path 목록.
 * @param Function _fCallback 삭제 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.remove = function() {

    var action = 'remove';

    var targetfiles = [];
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    for(var i=0;i<arguments[0]._aSourcePath.length;i++){

        var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._aSourcePath[i]);

        var file = {
            'source_path': splitSourcePath.path,
            'source_path_type': splitSourcePath.type,
        };


        targetfiles[i] = file;
    }

    var tr = {

        'id': 'REMOVE_FILES',
        'param': {
            list: targetfiles,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 디렉토리 정보 읽기
 *
 * @param Array _aSourcePath 삭제할 File Path 목록.
 * @param Function _fCallback 삭제 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.directory = function()
{
    var action = 'directory';

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sDirectory);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {

        id:'GET_DIRECTORY',
        param:{
            source_directory: splitSourcePath.path,
            source_directory_type: splitSourcePath.type,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 파일 존재 여부 확인
 *
 * @param String _sSourcePath 확인할 File Path 목록.
 * @param Function _fCallback 확인 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.exist = function() {

    var action = 'exist';

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {

        id:'EXISTS_FILE',
        param:{
            source_path: splitSourcePath.path,
            source_path_type: splitSourcePath.type,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 업로드
 *
 * @param Array _aFileList	업로드할 File Path 목록.
 * @param Function _fCallback		결과를 받을 callback 함수.
 *
 * @return
 */
bizMOBCore.File.upload = function() {

    var action = 'upload';

    var file_list = arguments[0]._aFileList.map(function(row, index)	{
        var splitSourcePath = bizMOBCore.Module.pathParser(row._sSourcePath);

        return {
            source_path : splitSourcePath.path,
            source_path_type : splitSourcePath.type,
            file_name : row._sFileName
        };
    });

    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {
        id:'UPLOAD_FILE',
        param:{
            list : file_list,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 다운로드
 *
 * @param Array _aFileList	다운로드할 URL 주소 목록.
 * @param String _sMode		파일 다운로드 모드. (background 또는 foreground ).
 * @param String _sProgressBar	다운로드할 때 프로그래스바 설정 값.( off , each, full )
 * @param Function _fCallback		결과를 받을 callback 함수.
 *
 * @return
 */
bizMOBCore.File.download = function() {

    var action = 'download';
    var progressbar = {};

    switch(arguments[0]._sProgressBar)
    {
    // provider: progressbar를 어디서 그릴지 결정
    // bizMOB App-> bizMOB App에서 그림
        case 'full' :
            progressbar.provider = 'bizMOB App';
            progressbar.type = 'full_list';
            break;
        case 'each' :
            progressbar.provider = 'bizMOB App';
            progressbar.type = 'each_list';
            break;
        case 'off' :
            progressbar.provider = 'web';
            progressbar.type = '';
            break;
        default :
            progressbar.provider = 'bizMOB App';
            progressbar.type = 'default';
            // default: full_list
            break;
    }

    arguments[0]._oProgressBar = progressbar;

    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback, 'listener');
    var file_list = arguments[0]._aFileList;
    var list_len = file_list.length;

    for(var i=0;i< list_len; i++){
        var splitTargetPath = bizMOBCore.Module.pathParser(file_list[i]._sDirectory);
        file_list[i].target_path = splitTargetPath.path + file_list[i]._sFileName,
        file_list[i].target_path_type = splitTargetPath.type,
        file_list[i].overwrite = file_list[i]._bOverwrite,
        file_list[i].uri = file_list[i]._sURI,
        file_list[i].file_id = i;
    }

    var tr = {

        id:'DOWNLOAD_FILE',
        param:{
            method:arguments[0]._sMode,
            uri_list:file_list,
            progress : arguments[0]._oProgressBar,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 정보 가져오기
 *
 * @param Array _aFileList	정보를 가져올 File Path 목록.
 * @param Function _fCallback		결과를 받을 callback 함수.
 *
 * @return
 */
bizMOBCore.File.getInfo = function()    {
    var action = 'getInfo';

    var serviceName = this.servicename;
    var fileList = arguments[0]._aFileList.map(function(row, index)	{
        var splitSourcePath = bizMOBCore.Module.pathParser(row._sSourcePath);

        return {
            index : index,
            source_path : splitSourcePath.path,
            source_path_type : splitSourcePath.type
        };
    });
    var userCallback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    // JSON은 순서 보장이 안되니까 순서 맞춰서 usercallback대신 callback을 만들고
    // bizMOB App에 callback보내고 callback안에서 usercallback부르도록
    var callback = bizMOBCore.CallbackManager.save(function(res)   {
        bizMOBCore.Module.logger(serviceName, action ,'D', res);

        if(res.result)	{
            var nonIndexFileList = [];

            res.list.forEach(function(row)    {
                var index = row.index;

                nonIndexFileList[index] = row;
                delete nonIndexFileList[index].index;
            });

            res.list = nonIndexFileList;
        }

        // script에서 호출하는 CallbackManager responser
        bizMOBCore.CallbackManager.responser({
            'callback' : userCallback
        }, {
            'message' : res
        });
    });

    var tr = {
        id : 'GET_FILE_INFO',
        param : {
            file_path : fileList,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 이미지 파일 리사이즈
 *
 * @param Array _aFileList	이미지 파일 목록.
 * @param Boolean _bIsCopy	(Default : false) 원본 파일 유지 여부. (true 또는 false)
 * @param String _sTargetDirectory	_bIsCopy가 true일 경우 복사본이 저장될 디렉토리 경로.
 * @param Number _nWidth	파일의 가로 크기를 설정.
 * @param Number _nHeight	 파일의 세로 크기를 설정.
 * @param Number _nCompressRate	Number	X (Default : 1.0) 파일의 압축률 값( 0.0부터 1.0까지 값 지정가능 )
 * @param Number _nFileSize	리사이즈 된 파일 용량의 최대값.( byte단위 )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.File.resizeImage = function()    {
    var action = 'resizeImage';

    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var fileList = arguments[0]._aFileList.map(function(row)	{
        var splitSourcePath = bizMOBCore.Module.pathParser(row._sSourcePath);

        return {
            source_path : splitSourcePath.path,
            source_path_type : splitSourcePath.type
        };
    });
    var splitTargetDir = bizMOBCore.Module.pathParser(arguments[0]._sTargetDirectory);
    // resizeImage가 가로, 세로를 줄이는게 아니라 용량을 줄이는 것
    var compressRate = isNaN(Number(arguments[0]._nCompressRate)) ? 1.0 : arguments[0]._nCompressRate;
    // 원본 보존할지 여부
    var copy = arguments[0]._bIsCopy === false ? false : true;

    var tr = {
        id : 'RESIZE_IMAGE',
        param : {
            image_paths  : fileList,
            callback : callback,
            compress_rate : compressRate,
            copy_flag : copy,
            width : arguments[0]._nWidth,
            height : arguments[0]._nHeight,
            file_size : arguments[0]._nFileSize,
            target_path_type : splitTargetDir.type,
            target_path : splitTargetDir.path
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 이미지 파일 회전
 *
 * @param String _sSourcePath		이미지 File Path.
 * @param String _sTargetPath		회전된 이미지가 저장될 Path.
 * @param Number _nOrientation	회전 시킬 각도(EXIF_Orientation)값.(1, 2, 3, 4, 5, 6, 7, 8 )
 * @param Function _fCallback		결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.File.rotateImage = function()    {
    var action = 'rotateImage';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var splitTargetPath = bizMOBCore.Module.pathParser(arguments[0]._sTargetPath);
    var orientation = (arguments[0]._nOrientation).toString();

    var tr = {
        id : 'ROTATE_IMAGE',
        param : {
            orientation : orientation,
            source_path_type : splitSourcePath.type,
            source_path : splitSourcePath.path,
            target_path_type : splitTargetPath.type,
            target_path : splitTargetPath.path,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};


/**
 *
 * 01.클래스 설명 : Push 기능 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : bizPush Server Open API연동 본 기능
 * 04.관련 API/화면/서비스 : bizMOBCore.Module.checkparam,bizMOBCore.Push.getAlarm,bizMOBCore.Push.getMessageList,bizMOBCore.Push.getPushKey,bizMOBCore.Push.getUnreadCount,bizMOBCore.Push.readMessage,bizMOBCore.Push.registerToServer,bizMOBCore.Push.sendMessage,bizMOBCore.Push.setAlarm,bizMOBCore.Push.setBadgeCount
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.PushManager = new Object();

bizMOBCore.PushManager.servicename = 'PushManager';
bizMOBCore.PushManager.config = {
    _oPushPath: {
        REGISTER: '/v150/push'
    },
    _sPushUrl: '', // Push 서버 URL
};

bizMOBCore.PushManager.userCallback = {};

/**
 * 푸시 기본 저장 정보 초기화
 *
 * @param
 *
 * @return
 */
bizMOBCore.PushManager.reset = function()	{
    bizMOBCore.Properties.remove({
        '_sKey' : 'STORED_PUSHKEY'
    });
    bizMOBCore.Properties.remove({
        '_sKey' : 'STORED_PUSH_USERID'
    });
    bizMOBCore.Properties.remove({
        '_sKey' : 'IS_REGISTRATION'
    });
};

/**
 * 푸시 정보 등록 여부 체크
 *
 * @param
 *
 * @return Boolean isRegistration		등록 여부(true 또는 false )
 */
bizMOBCore.PushManager.isRegistration = function()	{
    // 앱 최초 실행 시, push서버에 register되었는지 확인(Properties)
    var isRegistration = bizMOBCore.Properties.get({
        '_sKey' : 'IS_REGISTRATION'
    }) ? true : false;

    return isRegistration;
};

/**
 * 푸시 키 일치 여부 확인
 *
 * @param
 *
 * @return Boolean result		일치 여부(true 또는 false )
 */
bizMOBCore.PushManager.checkValidPushKey = function()	{
    // 네이티브 device에 등록된 push_key랑 property에 있는 push_key일치 여부
    var deviceInfoPushKey = bizMOBCore.DeviceManager.getInfo({
        '_sKey' : 'push_key'
    });
    var storedPushKey = bizMOBCore.Properties.get({
        '_sKey' : 'STORED_PUSHKEY'
    });
    var result = false;

    // deviceInfoPushKey = bizMOBCore.PushManager.config._sPushUrl + ":" + deviceInfoPushKey;

    if(bizMOBCore.DeviceManager.isAndroid())	{
        if(typeof deviceInfoPushKey == 'string')	{
            if(deviceInfoPushKey.trim().length > 0)	{
                if(deviceInfoPushKey == storedPushKey)	result = true;
            }
        }
    } else	{
        if(deviceInfoPushKey == storedPushKey)	result = true;
    }

    return result;
};

/**
 * 푸시 사용 유저 정보 조회
 *
 * @param String userId	비교할 유저ID
 *
 *
 * @return Boolean result		일치 여부(true 또는 false )
 */
bizMOBCore.PushManager.checkValidPushUserId = function(userId)	{
    // 1인 1디바이스가 아니라 한 어플리케이션에 로그아웃 후 다른 사용자로 로그인 시 userid가 등록되어 있는지 확인
    var storedPushUserId = bizMOBCore.Properties.get({
        '_sKey' : 'STORED_PUSH_USERID'
    });
    var result = false;

    if(storedPushUserId != undefined)	{
        if(storedPushUserId.toString().trim().length > 0)	{
            if(storedPushUserId == userId)	{
                result = true;
            }
        }
    }

    return result;
};

/**
 * 푸시키 저장
 *
 * @param String pushKey	저장할 pushKey
 *
 * @return
 */
bizMOBCore.PushManager.setStoredPushKey = function(pushKey)	{
    // bizMOB App에 push_key setting용도
    var storedPushKey = bizMOBCore.Properties.get({
        '_sKey' : 'STORED_PUSHKEY'
    });

    // pushKey = bizMOBCore.PushManager.config._sPushUrl + ":" + pushKey;

    if(storedPushKey != pushKey)	{
        bizMOBCore.Properties.set({
            '_sKey' : 'STORED_PUSHKEY',
            '_vValue' : pushKey
        });
    }
};

/**
 * 푸시 사용 유저 정보 저장
 *
 * @param String userId	저장할 유저ID
 *
 * @return
 */
bizMOBCore.PushManager.setStoredPushUserId = function(userId)	{
    // bizMOB App에 pushUserID 저장 용도
    var storedPushUserId = bizMOBCore.Properties.get({
        '_sKey' : 'STORED_PUSH_USERID'
    });

    if(storedPushUserId != userId)	{
        bizMOBCore.Properties.set({
            '_sKey' : 'STORED_PUSH_USERID',
            '_vValue' : userId
        });
    }
};

/**
 * 푸시키 정보 조회
 *
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 * @param Boolean _bProgressEnable		(default:true) 푸시 서버와 통신 중일때 화면에 progress 를 표시할지에 대한 여부( true 또는 false )
 *
 * @return
 */
bizMOBCore.PushManager.getPushKey = function()	{
    // bizMOB push server로 부터 push key get
    var action = 'getPushKey';
    var callback = bizMOBCore.CallbackManager.save(this.resGetPushKey);
    var userCallback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var progressEnable = arguments[0]._bProgressEnable === false ? false : true;

    this.userCallback[action] = userCallback;

    var tr = {
        id : 'GET_PUSHKEY',
        param : {
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    if(!this.checkValidPushKey())	{
        bizMOBCore.Properties.remove({
            '_sKey' : 'IS_REGISTRATION'
        });
        bizMOBCore.Module.gateway(tr, this.servicename, action);
    } else	{
        var returnValue = {
            'result' : true,
            'resultCode' : '0000',
            'resultMessage' : bizMOBCore.DeviceManager.getInfo({
                '_sKey' : 'push_key'
            })
        };

        this.resGetPushKey(returnValue);
    }
};

/**
 * 푸시키 정보 결과처리 Callback 함수
 *
 * @param Object res	bizMOB App에서 전달받은 푸시키 정보 Data Object.
 *  *
 * @return
 */
bizMOBCore.PushManager.resGetPushKey = function(res)	{
    // push key get 후 response callback
    if(res.result)	{
        bizMOBCore.PushManager.setStoredPushKey(res.resultMessage);
        bizMOBCore.DeviceManager.setInfo({ _sKey: 'push_key', _sValue: res.resultMessage });
    } else	{
        bizMOBCore.Module.logger(this.servicename, 'getPushKey' ,'D', res.resultMessage);
    }

    bizMOBCore.CallbackManager.responser({
        'callback' : bizMOBCore.PushManager.userCallback['getPushKey']
    }, {
        'message' : res
    });
};

/**
 * 푸시서버에 사용자 정보 등록
 *
 * @param String _sServerType		푸시키를 등록할 서버 타입.( bizpush 또는 push )
 * @param String_sUserId			푸시키를 등록할 사용자 아이디.
 * @param String _sAppName		푸시키를 등록할 앱 이름.
 * @param Function _fCallback		결과를 받아 처리할 callback 함수.
 * @param Boolean _bProgressEnable		(default:true) 푸시 서버와 통신 중일때 화면에 progress 를 표시할지에 대한 여부( true 또는 false )
 *
 * @return
 */
bizMOBCore.PushManager.registerToServer = function(arg)	{
    // 서버에 register용도
    if (!bizMOBCore.DeviceManager.isApp()) {
        bizMOBCore.Module.logger(this.servicename, action, 'D', 'This function doesn\'t support in browser');
        arg._fCallback();
        return true;
    }

    var action = 'registerToServer';
    var callback = {};
    var userCallback = bizMOBCore.CallbackManager.save(arg._fCallback);
    var userId = arg._sUserId;
    var progressEnable = arg._bProgressEnable === false ? false : true;
    var pushKey = bizMOBCore.DeviceManager.getInfo({
        '_sKey' : 'push_key'
    });

    this.userCallback[action] = userCallback;

    callback = function(res)	{
        bizMOBCore.PushManager.resRegistration(res, userId, pushKey);
    };

    var tr = {
        id : 'PUSH_REGISTRATION',
        param : {
            type : arg._sServerType,
            push_key : pushKey,
            user_id : userId,
            app_name : arg._sAppName,
            callback : bizMOBCore.CallbackManager.save(callback),
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    if(this.checkValidPushUserId(userId) && this.checkValidPushKey()){
        var resultValue = {
            'result' : true,
            'resultCode' : '0000',
            'resultMessage' : '성공',
            'body' : null
        };

        this.resRegistration(resultValue, userId, pushKey);
    }else{
        bizMOBCore.PushManager.reset();
        bizMOBCore.Module.gateway(tr, this.servicename , action );
    }
};

/**
 * 푸시서버에 사용자 정보 등록 결과 처리 함
 *
 * @param Object res		bizMOB App에서 전달받은 등록 처리 결과 정보 Data
 * @param String_sUserId			등록한 사용자 아이디.
 *
 * @return
 */
bizMOBCore.PushManager.resRegistration = function(res, userId, pushKey)	{
    // 서버 register 후 response callback
    if(res.result)	{
        bizMOBCore.Properties.set({
            '_sKey' : 'IS_REGISTRATION',
            '_vValue' : true
        });

        bizMOBCore.PushManager.setStoredPushUserId(userId);
        bizMOBCore.PushManager.setStoredPushKey(pushKey);
    } else	{
        bizMOBCore.Module.logger(this.servicename, 'registerToServer' ,'D', res.resultMessage);
    }

    bizMOBCore.CallbackManager.responser({
        'callback' : bizMOBCore.PushManager.userCallback['registerToServer']
    }, {
        'message' : res
    });
};

/**
 * 푸시 알람 수신여부 설정
 *
 * @param String _sUserId		푸시 알림 설정을 등록할 사용자 이이디.
 * @param Boolean  _bEnabled		(Default : true) 알람 수신 여부 설정 ( true 또는 false )
 * @param Boolean _bProgressEnable		(Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.setAlarm = function()	{
    var action = 'setAlarm';

    // bizMOB push on/off기능: 사용자 앱 별 on/off(GCM, APNS는 디바이스 별 on/off)
    var params = Object.assign({}, {
        '_sPushKey' : bizMOBCore.DeviceManager.getInfo({
            '_sKey' : 'push_key'
        }),
        '_bEnabled' : true
    }, arguments[0]);
    var callback = bizMOBCore.CallbackManager.save(params._fCallback);
    var progressEnable = params._bProgressEnable === false ? false : true;

    var tr = {
        id : 'PUSH_UPDATE_ALARM_SETTING',
        param : {
            user_id : params._sUserId,
            push_key : params._sPushKey,
            enabled : params._bEnabled,
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 푸시 알람 수신여부 조회
 *
 * @param String _sUserId		푸시 알림 설정을 조회할 사용자 이이디.
 * @param Boolean _bProgressEnable		(Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.getAlarm = function()	{
    var action = 'getAlarm';
    // 앱 종료후 재 시작시에 화면에 설정 여부를 표시하기 서버에 설정된 값을 조회
    var params = Object.assign({}, {
        '_sPushKey' : bizMOBCore.DeviceManager.getInfo({
            '_sKey' : 'push_key'
        }),
    }, arguments[0]);
    var callback = bizMOBCore.CallbackManager.save(params._fCallback);
    var progressEnable = params._bProgressEnable === false ? false : true;

    var tr = {
        id : 'PUSH_ALARM_SETTING_INFO',
        param : {
            user_id : params._sUserId,
            push_key : params._sPushKey,
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 푸시 수신 목록 조회
 *
 * @param String _sAppName	푸시 서버에 등록된 앱 이름.
 * @param String _sUserId		푸시 메세지를 조회할 사용자 이이디.
 * @param Number _nPageIndex	푸시 메세지를 가져올 페이징 값.
 * @param Number _nItemCount	푸시 메세지를 가져올 페이징 처리 갯수
 * @param Boolean _bProgressEnable		(default:true) 푸시 서버와 통신 중일때 화면에 progress 를 표시할지에 대한 여부( true 또는 false )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.getMessageList = function()	{
    var action = 'getMessageList';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var progressEnable = arguments[0]._bProgressEnable === false ? false : true;

    var tr = {
        id : 'PUSH_GET_MESSAGES',
        param : {
            app_name : arguments[0]._sAppName,
            page_index : arguments[0]._nPageIndex,
            item_count : arguments[0]._nItemCount,
            user_id : arguments[0]._sUserId,
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 푸시 메세지 읽기
 *
 * @param String _sTrxDay		푸시 메세지를 읽은 날짜.(yyyymmdd)
 * @param String _sTrxId		푸시 메세지 아이디.
 * @param String _sUserId	사용자 아이디.
 * @param Boolean _bProgressEnable		(Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.readMessage = function()	{
    var action = 'read';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var progressEnable = arguments[0]._bProgressEnable === false ? false : true;

    var tr = {
        id : 'PUSH_MARK_AS_READ',
        param : {
            trx_day : arguments[0]._sTrxDay,
            trx_id : arguments[0]._sTrxId,
            user_id : arguments[0]._sUserId,
            read : true,
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 읽지 않은 푸시 메세지 카운트 조회
 *
 * @param String _sAppName	푸시 서버에 등록된 앱 이름.
 * @param String _sUserId		푸시 메세지를 조회할 사용자 이이디.
 * @param Boolean _bProgressEnable		(Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.getUnreadMessageCount = function()	{
    var action = 'getUnreadMessageCount';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var progressEnable = arguments[0]._bProgressEnable === false ? false : true;

    var tr = {
        id : 'PUSH_GET_UNREAD_PUSH_MESSAGE_COUNT',
        param : {
            app_name : arguments[0]._sAppName,
            user_id : arguments[0]._sUserId,
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 앱 아이콘에 숫자 표시하기
 *
 * @param Number _nBadgeCount		뱃지에 표시할 값 .( 양수 : 표시할 갯수 ,  0 : 뱃지카운트 초기화 )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.setBadgeCount = function()	{
    var action = 'setBadgeCount';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : 'SET_BADGE_COUNT',
        param : {
            badge_count : arguments[0]._nBadgeCount,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 푸시 메세지 발송
 *
 * @param String _sAppName	푸시 메세지 보낼 앱 이름.
 * @param Array _aUsers		푸시 메세지 받을 사용자 목록.
 * @param String _sFromUser	푸시 메세지를 보낼 사용자 아이디.
 * @param String _sSubject		푸시 메세지 제목.
 * @param String _sContent		푸시 메세지 내용.
 * @param String _sTrxType		(Default : INSTANT) 푸시 메세지 전송 방식.( INSTANT 또는 SCHEDULE )
 * @param String _sScheduleDate	푸시 메세지 전송 날짜.
 * @param Array _aGroups	푸시 메세지를 받을 그룹 목록
 * @param Boolean _bToAll	(Default : false) 해당 앱을 사용하는 전체 사용자에게 푸시 메세지를 발송할지 여부.
 * @param String _sCategory	(Default : def) 푸시 메세지 카테고리.
 * @param Object _oPayLoad	푸시 기폰 용량 초과시 전달할 메세지.
 * @param Boolean _bProgressEnable		(Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.sendMessage = function()	{
    var action = 'sendMessage';
    var params = Object.assign({}, {
    // 예약발송/SCHEDULE or 즉시발송/INSTANT
        _sTrxType : 'INSTANT',
        _sScheduleDate : '',
        // bizPush에 있는 group ID
        _aGroups : [],
        _bToAll : false,
        _sCategory : 'def',
        // 대량 Push 메시지
        _oPayLoad : {}
    }, arguments[0]);
    var callback = bizMOBCore.CallbackManager.save(params._fCallback);
    var progressEnable = params._bProgressEnable === false ? false : true;

    var tr = {
        id : 'SEND_PUSH_MESSAGE',
        param : {
            trx_type : params._sTrxType,
            app_name : params._sAppName,
            schedule_date : params._sScheduleDate,
            to_users : params._aUsers,
            to_groups : params._aGroups,
            to_all : params._bToAll,
            from_user : params._sFromUser,
            message_subject : params._sSubject,
            message_content : params._sContent,
            message_category : params._sCategory,
            message_payload : params._oPayLoad,
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }

    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 대용량 푸시 메세지 읽기
 *
 * @param String _sMessageId	푸시 메세지 아이디.
 * @param String _sUserId	사용자 아이디.
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.readReceiptMessage = function()	{
    var action = 'readReceiptMessage';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : 'CHECK_PUSH_RECEIVED',
        param : {
            callback : callback,
            user_id : arguments[0]._sUserId,
            message_id : arguments[0]._sMessageId
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 *
 * 01.클래스 설명 : Database 기능 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : 컨테이너 SQLite DB 사용 기능
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Database = new Object();

bizMOBCore.Database.servicename = 'Database';
bizMOBCore.Database.config = {};

/**
 * DataBase Open
 *
 * @param String _sDbName		오픈할 데이터베이스 명.
 * @param Function _fCallback		결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.openDatabase = function()	{
    var action = 'openDatabase';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var dbName = arguments[0]._sDbName;

    var tr = {
        id : 'OPEN_DATABASE',
        param : {
            db_name : dbName,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * DataBase Close
 *
 * @param Function _fCallback		결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.closeDatabase = function()	{
    var action = 'closeDatabase';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : 'CLOSE_DATABASE',
        param : {
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * DataBase Transaction 시작
 *
 * @param Function _fCallback		결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.beginTransaction = function()	{
    var action = 'beginTransaction';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : 'BEGIN_TRANSACTION',
        param : {
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * DataBase Transaction Commit
 *
 * @param Function _fCallback		결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.commitTransaction = function()	{
    var action = 'commitTransaction';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : 'COMMIT_TRANSACTION',
        param : {
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * DataBase Transaction Rollback
 *
 *  @param Function _fCallback		결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.rollbackTransaction = function()	{
    var action = 'rollbackTransaction';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : 'ROLLBACK_TRANSACTION',
        param : {
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * SQL쿼리문을 실행
 *
 * @param String _sQuery		실행할 SQL SELECT 쿼리문.
 * @param Array _aBindingValues		쿼리문의 각 변수 위치에 대입해줄 값의 배열.
 * @param Function _fCallback		SQL쿼리문 실행 요청 후 호출되는 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.executeSql = function()	{
    var action = 'executeSql';
    var query = arguments[0]._sQuery;
    var bidingValues = arguments[0]._aBindingValues ? arguments[0]._aBindingValues:[];
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : 'EXECUTE_SQL',
        param : {
            query : query,
            bind_array : bidingValues,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * SELECT SQL쿼리문을 실행
 *
 * @param String _sQuery		실행할 SQL SELECT 쿼리문.
 * @param Array _aBindingValues		쿼리문의 각 변수 위치에 대입해줄 값의 배열.
 * @param Function _fCallback		SQL쿼리문 실행 요청 후 호출되는 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.executeSelect = function()	{
    var action = 'executeSelect';
    var query = arguments[0]._sQuery;
    var bidingValues = arguments[0]._aBindingValues ? arguments[0]._aBindingValues:[];
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : 'EXECUTE_SELECT',
        param : {
            query : query,
            bind_array : bidingValues,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * SQL쿼리문을 일괄 실행
 *
 * @param String _sQuery		실행할 SQL SELECT 쿼리문.
 * @param Array _aBindingValues		쿼리문의 각 변수 위치에 대입해줄 값의 배열.
 * @param Function _fCallback		SQL쿼리문 실행 요청 후 호출되는 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.executeBatchSql = function()	{
    // batch: 특정 query에 대해 반복할 때 사용
    var action = 'executeBatchSql';
    var query = arguments[0]._sQuery;
    var bidingValues = arguments[0]._aBindingValues ? arguments[0]._aBindingValues:[];
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : 'EXECUTE_BATCH_SQL',
        param : {
            query : query,
            bind_array : bidingValues,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};


/**
 *
 * 01.클래스 설명 : Http 기능 클래스
 * 02.제품구분 : bizMOB Core
 * 03.기능(콤퍼넌트) 명 : bizMOB Http Client 관련 기능
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Localization = new Object();

bizMOBCore.Localization.servicename = 'Localization';
bizMOBCore.Localization.config = {};

// 현재 언어 값
bizMOBCore.Localization.locale = '';

// 언어 코드로 (언어코드)-(국가코드) 형태의 full locale 코드 반환
bizMOBCore.Localization.getFullLocale = function(localeCode) {
    // 사용자 언어 목록에서 언어 코드(ko, ...)에 대응되는 full locale(ko-KR, ...) 코드
    var fullLocale = navigator.languages.find(function(lang) {
        return lang.toLowerCase().startsWith(localeCode.toLowerCase() + '-');
    });
    // 미리 지정한 언어 목록에서 언어 코드에 대응되는 preset locale 코드
    var presetLocale = window.bizMOBLocale[localeCode.toLowerCase()];

    // 전달받은 언어 코드가 full locale(ko-KR)값이라면 그대로 전달
    if (localeCode.indexOf('-') > 0) {
        bizMOBCore.Module.logger(this.serviceName, 'getFullLocale', 'L', 'Gets the full locale value: (parameter) ' + localeCode);
        return localeCode;
    }
    // 전달받은 언어 코드가 'ko' 형식이고, navigator.languages 목록에서 'ko-KR' 형식이 있다면 찾은 값 전달
    else if (fullLocale) {
        bizMOBCore.Module.logger(this.serviceName, 'getFullLocale', 'L', 'Gets the full locale value: (navigator) ' + fullLocale);
        return fullLocale;
    }
    // 전달받은 언어 코드가 'ko' 형식이고, 프리셋에 있다면 프리셋 언어코드를 전달
    else if (presetLocale) {
        bizMOBCore.Module.logger(this.serviceName, 'getFullLocale', 'L', 'Gets the full locale value: (preset) ' + presetLocale);
        return  presetLocale;
    }
    // 전달받은 언어 코드가 navigator, 프리셋에 전부 없다면 전달받은 값 그대로 전달 (ko)
    else {
        bizMOBCore.Module.logger(this.serviceName, 'getFullLocale', 'L', 'Gets the full locale value: (unknown) ' + presetLocale);
        return  localeCode;
    }
};

// 설정된 (언어)-(국가) 코드 조회
bizMOBCore.Localization.getLocale = function() {
    var action = 'getlocale';
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : 'LOCALE',
        param : {
            type : 'get',
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

// 언어코드에 맞는 (언어)-(국가) 코드 저장
bizMOBCore.Localization.setLocale = function(arg) {
    var action = 'setlocale';
    // 언어 코드 (ko, ko-KR, en, en-US, ...)
    var localeCode = arg._sLocaleCd;
    // full locale 값 조회
    var fullLocale = bizMOBCore.Localization.getFullLocale(localeCode);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : 'LOCALE',
        param : {
            type : 'set',
            locale : fullLocale,
            callback : callback
        }
    };

    bizMOBCore.Localization.locale = fullLocale;
    bizMOBCore.Module.gateway(tr, this.servicename, action);
};
