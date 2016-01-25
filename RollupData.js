(function() {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('PortfolioItemCostTracking.RollupData', {
        extend: 'Ext.Base',

        mixins: {
            observable: 'Ext.util.Observable'
        },
        data: undefined,

        additionalFetch: undefined,

        constructor: function (config) {
           this.mixins.observable.constructor.call(this, config);
           this.additionalFetch = (config && config.fetch) || [];
        },
        /**
         * Clears out the data in the tree (called if settings are updated/changed, etc
         */
        clearRollupData: function (key) {
            if (key && this.data) {
                //Just clear this item
                this.data[key] = null;
            } else {
                //Clear everything
                this.data = {};
            }
        },
        getRollupItem: function (key) {

            if (!this.data) {
                this.data = {};
            }
            return this.data[key] || null;
        },
        addRollupItem: function (record) {
            if (!this.data) {
                this.data = {};
            }
            var key = record.get('ObjectID');
            this.data[key] = new PortfolioItemCostTracking.RollupDataItem({
                record: record
            });
            return this.data[key];
        },
        addRecords: function(records){
            Ext.Array.each(records, function(r){
                this.addRollupItem(r);
            }, this);
            this._processRollups(records);
        },
        _processRollups: function(records){
            //First add the children
            var rootParents = [];
            Ext.Array.each(records, function(r){
                var parentOid = (r.get('Parent') && r.get('Parent').ObjectID) || (r.get('PortfolioItem') && r.get('PortfolioItem').ObjectID) || null,
                    parent = parentOid ? this.getRollupItem(parentOid) : null;

                if (parent){
                    parent.addChild(r);
                    if (!parent.data.Parent){
                        rootParents.push(parentOid);
                    }
                }
            }, this);
        },
        setRollupData: function (record) {
            var oid = record.get('ObjectID'),
                rollup_data = this.getRollupItem(record.get('ObjectID'));

            this._calculatePortfolioItemRollupData(oid);

            if (rollup_data) {
                 //If we already loaded the data, then use that, we don't want to take the time to reload.
                this._setDataOnModel(record, rollup_data);
                this.fireEvent('dataUpdated', rollup_data);
                return;
            }


            var key = record.get('ObjectID'),
                item = this.addRollupItem(record);


                //this._buildRollupData(record).then({
                //    scope: this,
                //    success: function (data) {
                //        this._setDataOnModel(record, data);
                //        this.fireEvent('dataUpdated', data);
                //    },
                //    failure: function (msg) {
                //        this.fireEvent('error', msg);
                //    }
                //});


        },

        _buildRollupData: function (record) {
            var deferred = Ext.create('Deft.Deferred');
            var key = record.get('ObjectID');
            var item = this.addRollupItem(record);
            if (PortfolioItemCostTracking.Utilities.isPortfolioItem(record.get('_type'))) {

                    if (record.get('UserStories')) {  //If this is the lowest level PI, then get the first level User Stories
                        this._fetchTopLevelUserStories([key]).then({
                            scope: this,
                            success: function () {
                                //this._setDataOnModel(record, item);
                                deferred.resolve(item);
                            },
                            failure: function (operation) {
                                deferred.reject(operation);
                            }
                        });
                    } else { //else this does not have a UserStories field and is not the lowest level PI
                        if (record.get('Children') && record.get('Children').Count > 0) {
                            var child_model_type = this._getChildPortfolioModelType(record.get('_type'));
                            //console.log('_fetchChildPortfolioItems');
                            this._fetchChildPortfolioItems(child_model_type, [key]).then({
                                scope: this,
                                success: function () {
                                    this._calculatePortfolioItemRollupData(key);
                                    //   this._setDataOnModel(record, item);
                                    deferred.resolve(item);
                                },
                                failure: function (operation) {
                                    //console.log('_buildRollupData._fetchChildPortfolioItems failure', operation);
                                    deferred.reject(operation);
                                }
                            });
                        }
                    } // end if is the lowest level PI

            } else { // else this is not a PI
               // this._setDataOnModel(record, item);
                deferred.resolve(this.getRollupItem(key));
            } //end if is a PI
            return deferred;
        },
        _getDataObj: function (record) {
            return new PortfolioItemCostTracking.RollupDataItem({
                record: record
            });
        },
        _calculatePortfolioItemRollupData: function (key) {
            var data = this.getRollupItem(key);
            if (data && PortfolioItemCostTracking.Utilities.isPortfolioItem(data.type) &&
                (data.type.toLowerCase() !== PortfolioItemCostTracking.Settings.getPortfolioItemTypes()[0].toLowerCase())) {
                _.each(data.children, function (childKey) {
                    this._calculatePortfolioItemRollupData(childKey);
                    data.addChildRollupData(this.getRollupItem(childKey));
                }, this);
            }
        },

        _setDataOnModel: function (record, data) {
            record.set('_rollupDataPreliminaryBudget', data.getPreliminaryBudget());
            record.set('_rollupDataTotalCost', data.getTotalCostRollup());
            record.set('_rollupDataActualCost', data.getActualCostRollup());
            record.set('_rollupDataRemainingCost', data.getRemainingCostRollup());
            record.set('_notEstimated', data.usePreliminaryBudgetInCalcuation());
            record.set('_rollupDataToolTip', data.getTooltip() || null);
        },

        _getChildPortfolioModelType: function (portfolioItemType) {
            var found = Ext.Array.filter(PortfolioItemCostTracking.Settings.getPortfolioItemTypes(), function (item) {
                return item.toLowerCase() === portfolioItemType.toLowerCase();
            });

            if (found && found.length > 0) {
                var idx = _.indexOf(PortfolioItemCostTracking.Settings.getPortfolioItemTypes(), found[0]);
                if (idx > 0) {
                    return PortfolioItemCostTracking.Settings.getPortfolioItemTypes()[idx - 1].toLowerCase();
                }
            }
            return null;
        },
        _fetchChildPortfolioItems: function (portfolioItemType, portfolioItemObjectIDs) {

            var portfolioItemFetch = PortfolioItemCostTracking.Settings.getPortfolioItemFetch(this.additionalFetch);
             var filters = _.map(portfolioItemObjectIDs, function (poid) {
                return {
                    property: 'Parent.ObjectID',
                    value: poid
                };
            });
            filters = Rally.data.wsapi.Filter.or(filters);

            return PortfolioItemCostTracking.WsapiToolbox.fetchWsapiRecords(portfolioItemType, filters, portfolioItemFetch, {project: null}).then({
                scope: this,
                success: function (records) {

                    var child_model_type = this._getChildPortfolioModelType(portfolioItemType);
                    _.each(records, function (r) {
                        if (r.get('Parent') && r.get('Parent').ObjectID) {
                            var parent = r.get('Parent').ObjectID;
                            this.getRollupItem(parent).addChild(r);
                        }
                        this.addRollupItem(r);
                    }, this);

                    var obj_ids = _.map(records, function (r) {
                        return r.get('ObjectID');
                    });
                    if (records.length > 0 && child_model_type) {
                        return this._fetchChildPortfolioItems(child_model_type, obj_ids);
                    } else {
                        return this._fetchTopLevelUserStories(obj_ids);
                    }
                }
            });
        },
        _fetchTopLevelUserStories: function (portfolioItemObjectIDs) {
            var deferred = Ext.create('Deft.Deferred');

            if (portfolioItemObjectIDs.length === 0) {
                deferred.resolve();
            }

            var filters = _.map(portfolioItemObjectIDs, function (pi_oid) {
                return {
                    property: 'PortfolioItem.ObjectID',
                    value: pi_oid
                };
            });
            filters = Rally.data.wsapi.Filter.or(filters);
            var storyFetch = PortfolioItemCostTracking.Settings.getStoryFetch(this.additionalFetch);
           var starttime = Date.now();

            //PortfolioItemCostTracking.WsapiToolbox.fetchWsapiRecordsWithPaging('HierarchicalRequirement', filters, storyFetch, {project: null}).then({
            PortfolioItemCostTracking.WsapiToolbox.fetchWsapiRecords('HierarchicalRequirement', filters, storyFetch, {project: null}).then({
                scope: this,
                success: function (records) {
                    console.log('end time', Date.now()- starttime);
                    _.each(records, function (r) {
                        if (r.get('PortfolioItem') && r.get('PortfolioItem').ObjectID) {
                            var obj_id = r.get('PortfolioItem').ObjectID;
                            this.getRollupItem(obj_id).addChild(r);
                            this.addRollupItem(r);
                        }
                    }, this);
                    deferred.resolve();
                },
                failure: function (operation) {
                    deferred.reject(operation);
                }
            });
            return deferred;
        }
    });
})();