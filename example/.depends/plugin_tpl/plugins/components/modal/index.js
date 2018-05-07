
Component({
    properties: {
        align: {
            type : String,
            value: ''
        },
        content: String,
        title  : String,
        showCancel: {
            type : Boolean,
            value: true
        },
        visible: {
            type : Boolean,
            value: false,
            observer: function (newVal, oldVal) {
                var self = this;
                if (newVal){self.showModal();}
            }
        },
        cancelColor : String,
        cancelText  : String,
        confirmColor: String,
        confirmText : String
    },
    attached: function () {
        this.initModal();
    },
    methods: {
        initModal: function () {
            let self = this;
            self.resetModal();
        },
        resetModal: function () {
            let self = this;
            self.setData({
                modal_title      : '',
                modal_align      : '',
                modal_contents   : '',
                cancel_color     : '',
                cancel_text      : '',
                confirm_text     : '',
                confirm_color    : '',
                visible          : false,
                modal_show_cancel: !!self.data.showCancel || true,
            });
        },
        nullAction: function () { },
        closeModal: function (evt) {
            let self = this;
            let data = (evt.currentTarget||evt.target).dataset;
            let obj  = {cancel: false, confirm: false }
            obj[data.btn] = true;
            self.resetModal();
            self.triggerEvent('complete', obj, {});
            self.data.visible = false;
        },
        showModal: function () {
            let self = this;
            if (!self.data.title && !self.data.content) {
                console.error('title or content must be string');
                return;
            }
            let contents = (self.data.content || '').toString();
            contents = contents.replace(/<br\s*\/?>/g, '\n').split(/[\r\n↵]+/);
            let msg = {
                visible        : true,
                modal_contents : self.data.content ? contents  : '',
                modal_title    : self.data.title        || '',
                modal_align    : self.data.align        || '',
                show_cancel    : !!self.data.showCancel || true,
                cancel_color   : self.data.cancelColor  || '',
                cancel_text    : self.data.cancelText   || '',
                confirm_color  : self.data.confirmColor || '',
                confirm_text   : self.data.confirmText  || '',
            }
            self.setData(msg);
        },
    }
})