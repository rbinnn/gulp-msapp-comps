let dataFunc  = {};

module.exports = {
    setDataFn: function(key, fun){
        dataFunc[key] = fun;
    },
    setData: function(key, data){
        if(typeof(dataFunc[key])=='function'){
            dataFunc[key](data);
        }
    }
}