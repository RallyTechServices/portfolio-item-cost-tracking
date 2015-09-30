Ext.define('PortfolioItemCostTracking.RollupData',{
    mixins: {
        observable: 'Ext.util.Observable'
    },
    data: {},

    keyField: 'ObjectID',
    portfolioItemTypes: undefined,
    sourceType: 'hierarchicalrequirement',

    constructor: function(config){
        this.portfolioItemTypes = _.map(config.portfolioItemTypes, function(p){return p.toLowerCase();});
        console.log('pi types',this.portfolioItemTypes);
        this.mixins.observable.constructor.call(this, config);
        this.addEvents(
            'dataUpdated',
            'error'
        );
    },
    /**
     * Clears out the data in the tree (called if settings are updated/changed, etc
     */
    clearRollupData: function(key){
        if (key){
            //Just clear this part of the tree
            this.data[key] = null;
        } else {
            //Clear everything
            this.data = {};
        }
    },
    setRollupData: function(record){
        var rollup_data = this.data[record.get(this.keyField)] || null;

        if (rollup_data){
            //If we already loaded the data, then use that, we don't want to take the time to reload.
           this._setDataOnModel(record, rollup_data);
           return;
        }
        this._buildRollupData(record);
    },
    _buildRollupData: function(record){
        console.log('_buildRollupData',record.get('FormattedID'),record);

        var key = record.get(this.keyField);
        this.data[key] = this._getDataObj(record.getData(), record.get('_type'));

        if (record.get('UserStories')){
            this._fetchTopLevelUserStories([key]).then({
                scope: this,
                success: function(){
                    console.log('_buildRollupData._fetchTopLevelUserStories success', this.data);
                    this._calculateRollupData(key);
                    this._setDataOnModel(record, this.data[key]);
                },
                failure: function(operation){
                    console.log('_buildRollupData._fetchTopLevelUserStories failure', operation);
                }
            });
            return;
        }

        var portfolioItemRegExp = new RegExp('^portfolioitem/',"i");

        if (portfolioItemRegExp.test(record.get('_type')) &&
            record.get('Children') && record.get('Children').Count > 0){
            var child_model_type = this._getChildPortfolioModelType(record.get('_type'));
            this._fetchChildPortfolioItems(child_model_type, [key]).then({
                scope: this,
                success: function(){
                    console.log('_buildRollupData._fetchChildPortfolioItems success', this.data);
                    this._calculateRollupData(key);
                    this._setDataOnModel(record, this.data[key]);
                },
                failure: function(operation){
                    console.log('_buildRollupData._fetchChildPortfolioItems failure', operation);
                }
            });
        } else {
            console.log('_buildRollupData else', record);
            this._calculateRollupData(key);
            this._setDataOnModel(record, this.data[key]);
        }
    },
    _getDataObj: function(data, type){
        return new PortfolioItemCostTracking.RollupDataItem({
            data: data,
            type: type
        });
    },

    _calculateRollupData: function(key){
        var data = this.data[key] || null;
        console.log('_calculateRollupData key, data, this.data',key, data, this.data);
        if (data){
            console.log('data', data.data.FormattedID);
            if (data.type.toLowerCase() === this.portfolioItemTypes[0].toLowerCase()){
                data.calculateRollupFromChildren();
                data.preliminaryBudget = PortfolioItemCostTracking.CostCalculator.calculatePreliminaryBudget(data.data);
            } else {
                data.totalCost = 0;
                data.actualCost = 0;
                data.remainingCost = 0;
                _.each(data.children, function(c){
                    var child_key = c[this.keyField];
                    this._calculateRollupData(child_key);
                    var child_data = this.data[child_key];
                    data.totalCost += child_data.totalCost ;
                    data.actualCost += child_data.actualCost;
                    data.remainingCost += child_data.remainingCost;
                    //console.log('---', data.totalCost, data.data.FormattedID,child_data);
                }, this);
            }
        }
    },

    _setDataOnModel: function(record, data){
        record.set('_rollupDataPreliminaryBudget', data.preliminaryBudget);
        record.set('_rollupDataTotalCost',data.totalCost);
        record.set('_rollupDataActualCost',data.actualCost);
        record.set('_rollupDataRemainingCost', data.remainingCost);
        record.set('_rollupDataToolTip', data.tooltip || null);
     },
    _getChildPortfolioModelType: function(portfolioItemType){
        var found = Ext.Array.filter(this.portfolioItemTypes, function(item){
            return item.toLowerCase() === portfolioItemType.toLowerCase();
        });


        if (found && found.length > 0){
            var idx = _.indexOf(this.portfolioItemTypes, found[0]);
            if (idx > 0){
                return this.portfolioItemTypes[idx-1].toLowerCase();
            }
        }
        return null;
    },
    _fetchChildPortfolioItems: function(portfolioItemType, portfolioItemObjectIDs){

        var portfolioItemFetch = ['ObjectID','Parent','Children','UserStories'];
        var filters = _.map(portfolioItemObjectIDs, function(poid){
            return {
                property: 'Parent.ObjectID',
                value: poid
            };
        });
        filters = Rally.data.wsapi.Filter.or(filters);
        console.log('_fetchChildPortfolioItems',portfolioItemType, filters);

        return PortfolioItemCostTracking.WsapiToolbox.fetchWsapiRecords(portfolioItemType,filters,portfolioItemFetch,{project: null}).then({
            scope: this,
            success: function(records){

                var child_model_type = this._getChildPortfolioModelType(portfolioItemType);
                _.each(records, function(r){
                    if (r.get('Parent') && r.get('Parent').ObjectID){
                        var parent = r.get('Parent').ObjectID;
                        this.data[parent].addChild(r.getData());
                        console.log(this.data[parent].children.length);
                    }
                    var obj_id = r.get('ObjectID');
                    this.data[obj_id] = this._getDataObj(r.getData(),portfolioItemType);
                }, this);

                 var obj_ids = _.map(records, function(r){return r.get('ObjectID');});
                 if (records.length > 0 && child_model_type){
                     return this._fetchChildPortfolioItems(child_model_type, obj_ids);
                 } else {
                     return this._fetchTopLevelUserStories(obj_ids);
                 }
            }
        });
    },
    _fetchTopLevelUserStories: function(portfolioItemObjectIDs){
        var deferred = Ext.create('Deft.Deferred');

        if (portfolioItemObjectIDs.length === 0){
            deferred.resolve();
        }

        var filters = _.map(portfolioItemObjectIDs, function(pi_oid){
            return {
                property: 'PortfolioItem.ObjectID',
                value: pi_oid
            };
        });
        filters = Rally.data.wsapi.Filter.or(filters);
        var storyFetch = PortfolioItemCostTracking.CostCalculator.getStoryFetch();
    //    console.log('storyFetch',storyFetch);
        PortfolioItemCostTracking.WsapiToolbox.fetchWsapiRecords('HierarchicalRequirement',filters,storyFetch,{project: null}).then({
            scope: this,
            success: function(records){
                _.each(records, function(r){
                    if (r.get('PortfolioItem') && r.get('PortfolioItem').ObjectID){
                        var obj_id = r.get('PortfolioItem').ObjectID;
                        this.data[obj_id].addChild(r.getData());
                        console.log('adding children', this.data[obj_id].children.length);
                        this.data[r.get('ObjectID')] = this._getDataObj(r.getData(), r.get('_type'));
                    }
                }, this);
                console.log('data', this.data);
                deferred.resolve();
            },
            failure: function(operation){
                console.log('_fetchTopLevelUserStories failed', operation);
                deferred.reject(operation);
            }
        });
        return deferred;
    },
    _fetchChildStories: function(){

    },
    _fetchTasks: function(storyIDs){
        var fetch = ['ObjectID','TimeSpent','ToDo','Actuals','Estimate'];
    }
});