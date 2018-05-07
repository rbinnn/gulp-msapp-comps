Component({
    methods: {
        tapHandler() {
            var vid = "h0390r6fgbk"
            setTimeout(() => {
                this.triggerEvent("click-btn", vid)
            })
        }
    }
})