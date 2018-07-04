import * as common from './common'

// store
let store = new common.Store()

// connection
let current: WebSocket
let connect = () => {
    if (current != undefined) {
        current.close()
    }

    current = common.connect(cs => {
        store.setState({
            ...store.state,
            cs: { ...cs },
        })
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
            .catch(e => cb({
                state: store.state,
                error: e.toString(),
            }))
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
            .catch(e => cb({
                state: store.state,
                error: e.toString(),
            }))
    }

    return true
})

// init
connect()
