import * as common from './common'

// store
let store = new common.Store()

// stats
let stats = {
    num: 0,
    elapsed: 0,
}
let timer = new common.Timer()

// network error
let error = (msg: string) => {
    chrome.browserAction.setBadgeText({
        text: msg
    })
    chrome.browserAction.setBadgeBackgroundColor({
        color: [180, 80, 80, 255]
    })
}

// connection
let current: WebSocket
let connect = () => {
    if (current != undefined) {
        current.close()
    }

    timer.start()
    current = common.connect(cs => {
        store.setState({
            ...store.state,
            cs: { ...cs },
        })
    }, () => {
        error('websocket connection error')
    })
}

// api
let api = new common.Api()

// add handler
store.addHandler(state => {
    chrome.runtime.sendMessage({ name: 'update', state: state })
})
store.addHandler(state => {
    chrome.browserAction.setBadgeText({
        text: String(state.cs.now % 1000)
    })
    chrome.browserAction.setBadgeBackgroundColor({
        color: state.cs.run ? [80, 180, 80, 255] : [100, 100, 100, 255]
    })    
})
store.addHandler(state => {
    if (!store.prev.cs.run && state.cs.run) {
        timer.start()
    }
    if (store.prev.cs.qiitaId != state.cs.qiitaId) {
        let elapsed = timer.next()
        stats = {
            num: stats.num + 1,
            elapsed: stats.elapsed + elapsed,
        }
        chrome.runtime.sendMessage({ name: 'update', state: state, stats: stats })
    }
})

// message (popup to background)
chrome.runtime.onMessage.addListener((r, s, cb) => {
    if (r.name == 'connect') {
        connect()
        cb({
            state: store.state,
            error: undefined,
        })
    } else if (r.name == 'api_init') {
        api.init()
            .then(r => {
                store.setState({
                    ...store.state,
                    cs: { ...r },
                })
                cb({
                    state: store.state,
                    error: undefined,
                })
            })
            .catch(e => {
                cb({
                    state: store.state,
                    error: e.toString(),
                })
                error('api error: ' + e)
            })
    } else if (r.name == 'api_crawl') {
        api.crawl(r.start)
            .then(r => {
                store.setState({
                    ...store.state,
                    cs: { ...r },
                })
                cb({
                    state: store.state,
                    error: undefined,
                })
            })
            .catch(e => {
                cb({
                    state: store.state,
                    error: e.toString(),
                })
                error('api error: ' + e)
            })
    }

    return true
})

// init
connect()
