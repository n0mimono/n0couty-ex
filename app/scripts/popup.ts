declare function require(x: string): any;
var Vue = require('vue')

let vm = new Vue({
    el: '#my-group',
    data: {
        isReady: true,
        cs: {},
        message: "",
        timer: -1,
        elapsed: 0,
        average: 2,
    },
    created: function () {
        chrome.runtime.sendMessage({ name: 'api_init' }, r => {
            this.cs = r.state.cs
            this.message = r.error
        })
    },
    computed: {
        progress: function () {
            return Math.round(1000 * this.cs.now / this.cs.max) / 10
        },
        countdown: function () {
            let total = (this.cs.max - this.cs.now) * this.interval
            return  {
                sec:  (total % 60) % 60,
                min: Math.floor(total / 60) % 60,
                hour: Math.floor(total / 60 / 60),
            }
        },
        interval: function() {
            return Math.round(this.average / 10) / 100
        }
    },
    methods: {
        onLeftClick: function () {
            chrome.runtime.sendMessage({ name: 'connect' }, r => {
            })
        },
        onRightClick: function () {
            let start = !this.cs.run

            this.isReady = false
            chrome.runtime.sendMessage({ name: 'api_crawl', start: start }, r => {
                this.isReady = true
                this.cs = r.state.cs
                this.message = r.error
            })
        },
        onOpenClick: function () {
            chrome.tabs.create({ url: "http://localhost:8080/crawl" })
        },
        update: function(state: any, stats: any) {
            this.cs = state.cs
            this.resetTimer()
            this.average = stats.elapsed / stats.num
        },
        resetTimer: function() {
            clearInterval(this.timer)
            this.elapsed = 0

            this.timer = setInterval(() => {
                this.elapsed += 1
            }, 1000)
        }
    }
})

// message (to popup)
chrome.runtime.onMessage.addListener((r, s, cb) => {
    if (r.name == 'update') {
        vm.update(r.state, r.stats)
    }
})
