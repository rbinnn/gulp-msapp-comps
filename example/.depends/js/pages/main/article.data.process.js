var tool = require('./articles.process');
module.exports = {
    processData: function(res, list){
        var data = res.data || {};
        list     = list || [];
        if(data.category_list){
            this.processHeroList(data);
        }
        if(data.board_info){
            this.processBoardInfo(data);
        }
        if(data.block_list){
            data.block_list = list.concat(tool.processBlockList(data.block_list, list.length));
        }
        return data;
    },
    processVideoJump: function(data){
        tool.processVideoJump(data)
    },
    getTopicImages: function(topic_id){
        return tool.getTopicImages(topic_id);
    },
    processHeroList: function(data){
        var list = data.category_list || [];
        var news = [];
        var nobj = {};
        for(var i=0,il=list.length;i<il;i++){
            var lst = list[i].hero_item_list || [];
            for(var j=0,jl=lst.length;j<jl;j++){
                var item = lst[j];
                // 2　hot 4 最新　8　周免　16　重做
                if((item.remark & 4 || item.remark & 16 ) && !(item.hero_id in nobj)){
                    news.push(item);
                    nobj[item.hero_id] = 1;
                }
            }
        }
        delete data.category_list;
        data.new_heros = news;
    },
    processBoardInfo: function(data){
        var info = data.board_info || {};
        var list = info.board_list || [];
        var _lst = [];
        var pic  = 'https://game.gtimg.cn/images/datamore/m/DataMore/wx/smoba/heroAvs/'
        for(var i=0,il=list.length;i<il;i++){
            var item = list[i];
            if(item.hero_name){
                item.hero_pic = pic + item.hero_id + '.png';
                _lst.push(item);
            }
            if(_lst.length>=3){
                break;
            }
        }
        data.board_info.board_list = _lst;
    }
}