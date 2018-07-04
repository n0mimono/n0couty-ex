declare function require(x: string): any;
var Vue = require('vue')

let vm = new Vue({
    el: '#my-group',
    data: {
        isReady: true,
        cs: {},
        message: "",
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
            return Math.round((this.cs.max - this.cs.now) * 2 / 60 / 60)
        },
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
        }
    }
})

// message (to popup)
chrome.runtime.onMessage.addListener((r, s, cb) => {
    if (r.name == 'update') {
        let state = r.state

        vm.cs = state.cs
    }
})
