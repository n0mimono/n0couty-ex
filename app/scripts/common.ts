// constants
export const host = "http://localhost:8080"

// crawler
export interface CrawlState {
    run: boolean
    stop: boolean
    max: number
    now: number
    qiitaId: string
    description: string
    score: number
    interval: number
    message: string
}

// state
export interface State {
    cs: CrawlState
}

const initState = {
    cs: {
        run: false,
        stop: true,
        max: 100,
        now: 0,
        qiitaId: '',
        description: '',
        score: 0,
        interval: 0,
        message: '',
    }
}

export type UpdateHandler = (state: State) => void

export class Store {
    state: State = {
        cs: { ...initState.cs },
    }
    private updateCbList: UpdateHandler[] = []

    setState(next: State) {
        this.state = next
        for (let i = 0; i < this.updateCbList.length; i++) {
            this.updateCbList[i](this.state)
        }
    }

    addHandler(cb: UpdateHandler) {
        this.updateCbList.push(cb)
    }
}

// socket
export function connect(cb: (cs: CrawlState) => void): WebSocket {
    let parser = new URL(host)
    let url = "ws://" + parser.host + "/socket/"

    let socket = new WebSocket(url)
    socket.onclose = ev => {
    }
    socket.onmessage = ev => {
        let cs = JSON.parse(ev.data) as CrawlState
        cb(cs)
    }
    return socket
}

// api
export class Api {
    async init() {
        return fetch(host + '/api/crawl', {
            method: 'GET',
            credentials: "same-origin",
        })
        .then(r => r.json())
    }
    
    async crawl(start: boolean) {
        let method = start ? 'POST' : 'PUT'
        
        return fetch(host + '/api/crawl', {
            method: method,
            credentials: "same-origin",
        })
        .then(r => r.json())
    }
}
