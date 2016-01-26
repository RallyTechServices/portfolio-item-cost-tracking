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
           console.log('addRollupRecords', new Date());
            for (var i=this.portfolioItemTypes.length -1; i >= 0; i--){
                var portfolioRecords = portfolioItemRecordHash[this.portfolioItemTypes[i]] || [];
                this._addPortfolioRecords(portfolioRecords);
            }
            console.log('addRollupRecords._addStories', new Date());
            this._addStories(stories);
            console.log('addRollupRecords._calculatePortfolioItemRollups', new Date());
            this._calculatePortfolioItemRollups();
            console.log('addRollupRecords. DONE', new Date());
        },
        getRollupData: function(record){
            if (!record){
                return null;
            }
            var objectID = record.get('ObjectID');
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
            var parentHash = {},
                rollupItems = this.rollupItems,
                projectCostPerUnit = PortfolioItemCostTracking.Settings.projectCostPerUnit,
                normalizedCostPerUnit = PortfolioItemCostTracking.Settings.normalizedCostPerUnit,
                totalFn = PortfolioItemCostTracking.Settings.getCalculationTypeSettings().totalUnitsForStoryFn,
                actualFn = PortfolioItemCostTracking.Settings.getCalculationTypeSettings().actualUnitsForStoryFn;

            for(var i =0; i < stories.length; i++){
                var s = stories[i],
                    pi = s.get('PortfolioItem'),
                    parent = pi && pi.ObjectID;

                if (!parentHash[parent]){
                    parentHash[parent] = [s];
                } else {
                    parentHash[parent].push(s);
                }
            }

            _.each(parentHash, function(recs, objectID){
                if (rollupItems[objectID]){
                    rollupItems[objectID].processChildren(recs, projectCostPerUnit, normalizedCostPerUnit, totalFn, actualFn);
                }
            });

        },
        _calculatePortfolioItemRollups: function(){
           _.each(this.rollupItems, function(item){
                if (item && !item.parent){
                    item.processChildren();
                }
            });
        },
        updateModels: function(records){
            if (!records || records.length === 0){
                return [];
            }
            var totalFn = null,
                actualFn = null,
                type = records[0].get('_type').toLowerCase(),
                calcSettings = PortfolioItemCostTracking.Settings.getCalculationTypeSettings(),
                unloadedModels = [],
                isPortfolioItem = /portfolioitem/.test(type);

            if (type === 'task'){
                totalFn = PortfolioItemCostTracking.Settings.getCalculationTypeSettings().totalUnitsForTaskFn;
                actualFn = PortfolioItemCostTracking.Settings.getCalculationTypeSettings().actualUnitsForTaskFn;
            }
            if (type === 'hierarchicalrequirement'){
                totalFn = PortfolioItemCostTracking.Settings.getCalculationTypeSettings().totalUnitsForStoryFn;
                actualFn = PortfolioItemCostTracking.Settings.getCalculationTypeSettings().actualUnitsForStoryFn;
            }
            _.each(records, function(r){
                if (isPortfolioItem){
                    if (!this._updatePortfolioModel(r, type)){
                        unloadedModels.push(r);
                    }
                } else {
                    this._updateModel(r, calcSettings, totalFn, actualFn);
                }
            }, this);
            return unloadedModels;
        },
        _updatePortfolioModel: function(record){
            var rollupItem = this.rollupItems[record.get('ObjectID')] || null;
            if (rollupItem){
                record.set('_rollupData', rollupItem);
                return record;
            }
            return null;
        },
        _updateModel: function(record, calcSettings, totalFn, actualFn){

            var data = record.getData(),
                total = totalFn(data),
                actual = actualFn(data),
                totalCost = this._calculateCost(data, total),
                actualCost = this._calculateCost(data, actual),
                rollupData = {
                    _rollupDataPreliminaryBudget: null,
                    _rollupDataTotalCost: totalCost,
                    _rollupDataActualCost: actualCost,
                    _rollupDataRemainingCost: undefined,
                    _rollupDataToolTip: null
                };

            if (totalCost !== null && actualCost !== null) {
                rollupData._rollupDataRemainingCost = totalCost - actualCost;
            }
            record.set('_rollupData', rollupData);
            return record;
        },
        _calculateCost: function(data, units){
            if (units === null){
                return null;
            }
            return units * PortfolioItemCostTracking.Settings.getCostPerUnit(data.Project._ref);
        }
    });
}) ();