import { DefaultOptions, Options, TrackerConfig } from '../type/index'
import { createHistoryEvent } from  '../utils/pv'


const MouseEventList: string[] = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseenter', 'mouseout', 'mouseover']


export default class Tracker {
  public data:Options
  constructor(options: Options) {
    this.data = Object.assign(this.initDef(), options)
    this.installTracker()
  }

  private initDef (): DefaultOptions {
    window.history['pushState'] = createHistoryEvent('pushState')
    window.history['replaceState'] = createHistoryEvent('replaceState')
    return <DefaultOptions> {
      sdkVersion: TrackerConfig.version,
      historyTracker: false,
      hashTracker:false,
      domTracker: false,
      jsError: false,
    }
  }

  private captureEvents <T>(mouseEventList: string[], targetKey: string, data?: T) {
    mouseEventList.forEach(event => {
      window.addEventListener(event, () => {
        console.log('监听到了');
        
        this.reportTracker({
          event,
          targetKey,
          data
        })
      })
    })
  }

  public sendTracker <T>(data: T) {
    this.reportTracker(data)
  }

  public setUserId <T extends DefaultOptions['uuid']>(uuid:T) {
    this.data.uuid = uuid
  }

  public setExtras <T extends DefaultOptions['extra']>(extra:T) {
    this.data.extra = extra
  }

  private targetKeyReport () {
    MouseEventList.forEach(ev => {
      window.addEventListener(ev, (e) => {
        const target = e.target as HTMLElement
        const targetKey = target.getAttribute('target-key')
        if(targetKey) {
          this.reportTracker({
            event: ev,
            targetKey
          })
        }
      })
    })
  }

  private jsError () {
    this.errorEvent()
    this.promiseReject()
  }


  private errorEvent(){
    window.addEventListener('error', event => {
      this.reportTracker({
        event: 'error',
        targetKey: 'message',
        message: event.message
      })
    })
  }

  private promiseReject () {
    window.addEventListener('unhandledrejection', (event) => {
      event.promise.catch(err => {
        this.reportTracker({
          event: 'promise',
          targetKey: 'message',
          message: err
        })
      })
    })
  }

  private reportTracker <T>(data:T) {
    const params = Object.assign(this.data, data, { time: new Date().getTime() })
    let headers = {
      type: 'application/x-www-form-urlencoded'
  };
    let blob = new Blob([JSON.stringify(params)], headers);
    
    navigator.sendBeacon(this.data.requestUrl, blob)
  }

  private installTracker() {
    if(this.data.historyTracker) {
      this.captureEvents(['pushState', 'replaceState', 'popstate'], 'history-pv')
    }

    if(this.data.hashTracker) {
      this.captureEvents(['hashchange'],'hash-pv')
    }

    if(this.data.domTracker) {
      this.targetKeyReport()
    }

    if(this.data.jsError) {
      this.jsError()
    }
  }
}

