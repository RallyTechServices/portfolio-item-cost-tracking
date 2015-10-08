Ext.define('PortfolioItemCostTracking.Utilities',{
    singleton: true,
    isPortfolioItem: function(type){
        var portfolioItemRegExp = new RegExp('^portfolioitem/',"i");
        return portfolioItemRegExp.test(type);
    },
    fetchExportData: function(rootModel, rootFilters, fetch, columns){
        var deferred = Ext.create('Deft.Deferred');
        var recordCounter = 0;
        var rootFetch = Ext.Array.merge(fetch, PortfolioItemCostTracking.Settings.getPortfolioItemFetch());

        PortfolioItemCostTracking.WsapiToolbox.fetchWsapiRecords(rootModel, rootFilters || [], rootFetch).then({
            scope: this,
            success: function(records){
                console.log('fetchExportData success', records);
                var recordTotal = records.length;

                var oids = _.map(records, function(r){ return r.get('ObjectID'); });

                var rollupData = Ext.create('PortfolioItemCostTracking.RollupData',{
                    fetch: fetch,
                    listeners: {
                        scope: this,
                        dataUpdated: function(data){
                            console.log('dataUpdated', data, recordCounter, recordTotal);
                            recordCounter++;
                            if (recordCounter == recordTotal){
                                var exportData = rollupData.getExportableRollupData(oids,columns);
                                var csv = exportData;
                                deferred.resolve(csv);
                            }
                        },
                        error: function(msg){
                            console.log('error',msg);
                        }
                    }
                });

                _.each(records, function(r) {
                    rollupData.setRollupData(r);
                }, this);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred;
    }
});

