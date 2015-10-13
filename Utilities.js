Ext.define('PortfolioItemCostTracking.Utilities', {
    singleton: true,
    isPortfolioItem: function (type) {
        var portfolioItemRegExp = new RegExp('^portfolioitem/', "i");
        return portfolioItemRegExp.test(type);
    },

    saveCSVToFile:function(csv,file_name,type_object){
        if (type_object === undefined){
            type_object = {type:'text/csv;charset=utf-8'};
        }
        var blob = new Blob([csv],type_object);
        saveAs(blob,file_name);
    }
});

