(function() {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('PortfolioItemCostTracking.RollupCalculator', {
        extend: 'Ext.Base',

        mixins: {
            observable: 'Ext.util.Observable'
        },

        rollupItems: {},

        constructor: function (config) {
            this.mixins.observable.constructor.call(this, config);
            this.portfolioItemTypes = PortfolioItemCostTracking.Settings.getPortfolioItemTypes();
        },
        addRollupRecords: function(portfolioItemRecordHash, stories){
            for (var i=this.portfolioItemTypes.length -1; i >= 0; i--){
                var portfolioRecords = portfolioItemRecordHash[this.portfolioItemTypes[i]] || [];
                this._addPortfolioRecords(portfolioRecords);
            }
            console.log('addRollupRecords._addStories', new Date());
            this._addStories(stories);
             this._calculatePortfolioItemRollups();
            console.log('addRollupRecords. DONE', new Date());
        },
        getRollupData: function(record){
            if (!record){
                return null;
            }
            var objectID = record.ObjectID || record.get('ObjectID');
            return this.rollupItems[objectID] || null;
        },
        /**
         * Adds records needed to calculate the rollup data
         * @param records
         */
        _addPortfolioRecords: function(records){
            if (!records || records.length === 0){
                return;
            }

            var type = records[0].get('_type').toLowerCase(),
                rollupItemType = PortfolioItemCostTracking.Settings.getRollupItemType(type);

            if (rollupItemType){ //this is a portfolio item type
                for (var i=0; i<records.length; i++){
                    var r = records[i],
                        parentObjectID = r.get('Parent') && r.get('Parent').ObjectID,
                        item = Ext.create(rollupItemType, r);

                    this.rollupItems[r.get('ObjectID')] = item;

                    if (parentObjectID && this.rollupItems[parentObjectID]){
                        this.rollupItems[parentObjectID].addChild(item);
                    }
                }
            }
        },

        _addStories: function(stories){
            var parents = [],
                rollupItems = this.rollupItems,
                totalFn = PortfolioItemCostTracking.Settings.getCalculationTypeSettings().totalUnitsForStoryFn,
                actualFn = PortfolioItemCostTracking.Settings.getCalculationTypeSettings().actualUnitsForStoryFn;

            for(var i =0; i < stories.length; i++){
                var item = Ext.create('PortfolioItemCostTracking.UserStoryRollupItem', stories[i], totalFn, actualFn);

                this.rollupItems[item.ObjectID] = item;

                if (item.parent && this.rollupItems[item.parent]){
                    parents.push(item.parent);
                    this.rollupItems[item.parent].addChild(item);
                }
            }
            _.each(parents, function(objectID){
                if (rollupItems[objectID]){
                    rollupItems[objectID].processChildren();
                }
            });
        },
        _calculatePortfolioItemRollups: function(){
           _.each(this.rollupItems, function(item){
                if (item && !item.parent && /^portfolioitem/.test(item._type)){
                    item.processChildren();
                }
            });
        },
        updateModels: function(records){
            records = records || [];
            var unloadedModels = [];
            _.each(records, function(r){
                var rollupItem = this.rollupItems[r.get('ObjectID')] || null;
                if (rollupItem){
                    console.log('r.get', r.get('_rollupData'));
                    r.set('_rollupData', rollupItem);
                } else {
                    unloadedModels.push(r);
                }

            }, this);
            return unloadedModels;
        }
    });
}) ();