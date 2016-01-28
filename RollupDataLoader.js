(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * Class to load lots of data and update as status is made.
     */
    Ext.define('PortfolioItemCostTracking.RollupDataLoader', {
        extend: 'Ext.Base',

        mixins: {
            observable: 'Ext.util.Observable'
        },

        context: undefined,
        promise: undefined,

        constructor: function (config) {
            console.log('loader', this, config);
            this.mixins.observable.constructor.call(this, config);

            this.context = config && config.context || null;

            this.additionalFetch = config && config.additionalFetch || [];
        },
        load: function(rootRecords){

            if (!rootRecords || rootRecords.length === 0){
                return;
            }
            this.rootRecords = rootRecords;

            if (this._getPortfolioItemLevelsToFetch() > 0){

                this._fetchPortfolioItems();
            } else {
                this._fetchStories();
            }
        },
        _fetchStories: function(portfolioItemHash){
            var me = this;

            me.fireEvent('statusupdate',"Loading Stories");
            var portfolioRootLevel = me._getPortfolioItemLevelsToFetch();
            me.fetchWsapiRecordsWithPaging(me._getStoryConfig(portfolioRootLevel)).then({
                success: function(stories){
                    me.fireEvent('statusupdate',"Processing data");
                    //Setting a timeout here so that the processing data status update shows up
                    setTimeout(function() {me.fireEvent('rollupdataloaded', portfolioItemHash || {}, stories);}, 50);
                },
                failure: function(msg){
                    me.fireEvent('loaderror', 'Error fetching stories: ' + msg);
                },
                scope: this
            });

        },

        _fetchPortfolioItems: function(){
            var promises = [],
                portfolioRootLevel = this._getPortfolioItemLevelsToFetch();

            this.fireEvent('statusupdate',"Loading Portfolio Items");

            for (var i = 0; i <= portfolioRootLevel; i++){
                promises.push(this.fetchWsapiRecordsWithPaging(this._getPortfolioItemConfig(i, portfolioRootLevel)));
            }

            Deft.Promise.all(promises).then({
                success: function(results){
                    var recordHash = {};
                    _.each(results, function(records){
                        if (records && records.length > 0){
                            recordHash[records[0].get('_type')] = records;
                        }
                    });
                    this._fetchStories(recordHash);
                },
                failure: function(msg){
                    this.fireEvent('loaderror', 'Error fetching portfolio items: ' + msg);
                },
                scope: this
            });

        },
        _getPortfolioItemLevelsToFetch: function(){
            var type = this.rootRecords[0].get('_type'),
                portfolioRootLevel = PortfolioItemCostTracking.Settings.getPortfolioItemTypeLevel(type);

            return portfolioRootLevel;
        },
        _getStoryConfig: function(portfolioRootLevel){
            console.log('storefetch', PortfolioItemCostTracking.Settings.getStoryFetch(this.additionalFetch));
           return {
                model: 'hierarchicalrequirement',
                fetch: PortfolioItemCostTracking.Settings.getStoryFetch(this.additionalFetch),
                filters: this._buildFetchFilter(-1, portfolioRootLevel),
               statusDisplayString: "Loading data for {0} User Stories",
               completedStatusDisplayString: "Processing data"
            };
        },
        _getPortfolioItemConfig: function(idx, portfolioRootLevel){

            return {
                model: PortfolioItemCostTracking.Settings.getPortfolioItemTypes()[idx],
                fetch: PortfolioItemCostTracking.Settings.getPortfolioItemFetch(this.additionalFetch),
                filters: this._buildFetchFilter(idx, portfolioRootLevel),
                statusDisplayString: "Loading data for {0} Portfolio Items"
            };
        },
        _buildParentLevelString: function(idx, portfolioRootLevel){
            console.log('_buildParentLevelString', idx, portfolioRootLevel);
            var startIdx = idx,
                parentStringArray = [];

            if (idx < 0){
                startIdx = 0;
                parentStringArray.push("PortfolioItem");
            }

            parentStringArray = parentStringArray.concat(_.range(startIdx, portfolioRootLevel).map(function(){ return 'Parent'; }));
            parentStringArray.push("ObjectID");
            return parentStringArray.join('.');
        },
        _buildFetchFilter: function(idx, portfolioRootLevel){
            var records = this.rootRecords,
                parentLevelString = this._buildParentLevelString(idx, portfolioRootLevel),
                filters = _.map(records, function(r){ return {property: parentLevelString, value: r.get('ObjectID')}; });

            return Rally.data.wsapi.Filter.or(filters);
        },

        fetchlookback: function(ancestorOids, fetchList, typeHierarchy){
            var deferred = Ext.create('Deft.Deferred');

            fetchList = fetchList.concat(['_ItemHierarchy','_TypeHierarchy']);
            console.log('fetchlookback', ancestorOids, fetchList, typeHierarchy);
            Ext.create('Rally.data.lookback.SnapshotStore', {
                fetch: fetchList,
                find: {
                    _ItemHierarchy: {$in: ancestorOids},
                    __At: "current",
                    _TypeHierarchy: typeHierarchy
                },
                hydrate: ['_TypeHierarchy'],
                limit: 'Infinity',
                removeUnauthorizedSnapshots: true
            }).load({
                callback: function(records, operation, success){
                    console.log('lookback', records, operation, success);
                    deferred.resolve(records);
                }
            });

            return deferred;
        },
        cancel: function(){
            if ((this.promise && this.promise.getState() === 'pending')){
                this.promise.cancel();
                this.fireEvent('loadcancelled');
            }
        },
        fetchWsapiCount: function(model, query_filters){
            var deferred = Ext.create('Deft.Deferred');

            Ext.create('Rally.data.wsapi.Store',{
                model: model,
                fetch: ['ObjectID'],
                filters: query_filters,
                limit: 1,
                pageSize: 1
            }).load({
                callback: function(records, operation, success){
                    if (success){
                        deferred.resolve(operation.resultSet.totalRecords);
                    } else {
                        deferred.reject(Ext.String.format("Error getting {0} count for {1}: {2}", model, query_filters.toString(), operation.error.errors.join(',')));
                    }
                }
            });
            return deferred;
        },
        fetchWsapiRecordsWithPaging: function(config){
            var deferred = Ext.create('Deft.Deferred'),
                promises = [],
                me = this;

            this.fetchWsapiCount(config.model, config.filters).then({
                success: function(totalCount){
                    var store = Ext.create('Rally.data.wsapi.Store',{
                        model: config.model,
                        fetch: config.fetch,
                        filters: config.filters,
                        pageSize: 200
                    }),
                        totalPages = Math.ceil(totalCount/200);

                    var pages = _.range(1,totalPages+1,1);

                    this.fireEvent('statusupdate',Ext.String.format(config.statusDisplayString || "Loading {0} artifacts", totalCount));

                    _.each(pages, function(page){
                        promises.push(function () {return me.loadStorePage(page, store);});
                    });

                    PortfolioItemCostTracking.promise.ParallelThrottle.throttle(promises, 12, me).then({
                        success: function(results){
                            deferred.resolve(_.flatten(results));
                        },
                        failure: function(msg){
                            deferred.reject(msg);
                        },
                        scope: me
                    });
                },
                failure: function(msg){
                    deferred.reject(msg);
                },
                scope: me
            });
            return deferred;
        },
        loadStorePage: function(pageNum, store){
            var deferred = Ext.create('Deft.Deferred');

            store.loadPage(pageNum, {
                callback: function(records, operation){
                    if (operation.wasSuccessful()){
                         deferred.resolve(records);
                    } else {
                        deferred.reject('loadStorePage error: ' + operation.error.errors.join(','));
                    }
                },
                scope: this
            });

            return deferred;
        }
    });
})();