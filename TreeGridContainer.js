Ext.define('TreeGridContainer', {
    extend: 'Ext.Container',
    mixins: ['Rally.app.Scopeable'],
    requires: [
        'Rally.ui.LeftRight',
        'Rally.ui.grid.TreeGrid'
    ],

    alias: 'widget.treegridcontainer',
    cls: 'rui-gridboard',
    /**
     * @cfg {Object}
     * Common store configuration properties
     * to be applied to both the board and grid views
     */
    storeConfig: {},
    gridConfig: {},
    /**
     * @cfg {Array}
     * An array of model names of types to view on the grid board.
     */
    modelNames: [],
    /**
     * @inheritdoc
     */
    layout: {
        type: 'auto'
    },

    currentCustomFilter: [],

    items: [
        {
            itemId: 'header',
            xtype: 'rallyleftright',
            padding: '4 10 10 10',
            overflowX: 'hidden'
        }
    ],
    initComponent: function () {
        this.plugins = this.plugins || [];
        this.stateId = this.getAppContextOrEnvironmentContext().getScopedStateId(this.stateId);

        this.callParent(arguments);

        this.addEvents([
        /**
         * @event load
         * Fires when the data store for the grid or board has loaded.
         * @param {Rally.ui.gridboard.GridBoard} this
         */
            'load',
        /**
         * @event recordcreate
         * Fires when a new record is created.
         * @param {Ext.data.Record} record The record that was created.
         */
            'recordcreate',
        /**
         * @event recordupdate
         * Fires when a record is updated.
         */
            'recordupdate',
        /**
         * @event preferencesaved
         * Fires after the preference has been saved
         * @param {Rally.data.wsapi.Model} record for preference
         */
            'preferencesaved',
        /**
         * @event modeltypeschange
         * Fires when the model types of the gridboard are changed.
         */
            'modeltypeschange'
        ]);

        this.on('modeltypeschange', function (gridboard, types) {
            this.modelNames = types;
        }, this);
    },
    /**
     * Delay the addition of the grid or board until plugins had a chance to modify some state
     * and the header has rendered in order to set the height of the tree grid.
     * Plugins can modify things like what fields are displayed
     * @private
     */
    afterRender: function () {
        this.callParent(arguments);
        this._addGrid();
    },
    destroy: function () {
        var grid = this.getGrid();

        if (grid && grid.store && _.isFunction(grid.store.clearData)) {
            //clean up records in the store to free up memory
            grid.store.clearData();
        }

        this.callParent(arguments);
    },
    getGrid: function () {
        return this.down('rallytreegrid');
    },
    /**
     * Get the header
     * @return {Rally.ui.LeftRight}
     */
    getHeader: function () {
        return this.down('#header');
    },
    /**
     * Get the names of the artifacts currently shown
     * @returns {String[]}
     */
    getModelNames: function () {
        return this.modelNames;
    },
    /**
     * Get the models of the artifacts currently shown
     * @returns {Rally.data.Model[]}
     */
    getModels: function () {
        return this.getGrid().getModels();
    },
    applyCustomFilter: function (filterObj) {
        var grid = this.getGrid();

        this.currentCustomFilter = filterObj;
        console.log('grid', grid);
        if (grid) {
            this._applyGridFilters(grid, filterObj);
        }
    },
    /**
     * Returns the currently applied filter.
     *
     * @returns {Ext.util.Filter|Ext.util.Filter[]|Object|Object[]}
     */
    getFilter: function () {
        return this.currentFilter;
    },

    setHeight: function () {
        this.callParent(arguments);
        var grid = this.getGrid();
        if (grid && grid.rendered && grid.getHeight() !== this.getAvailableGridBoardHeight()) {
            this.grid().setHeight(this.getAvailableGridBoardHeight());
        }
    },
    /**
     * @private
     */
    getAvailableGridBoardHeight: function () {
        return this.getHeight() - this.down('#header').getHeight() - 10;
    },
    /**
     * This function is called from the FieldPicker plugin to update the displayed fields
     * In the Gridboard, this calls the reconfigureWithColumns function on the TreeGrid
     * @param fields
     */
    updateFields: function(fields){
        console.log('updateFields', fields);
        var grid = this.getGrid();

        columnCfgs = grid._getStatefulColumns(fields);

        //Always use the old configuration if we have it.
        fieldscolumnCfgs = grid._mergeColumnConfigs(columnCfgs, this.columns);

        columnCfgs = Ext.Array.merge(columnCfgs, this.gridConfig.customColumns || []);

        console.log('columnCfgs', columnCfgs);

        grid.columnCfgs = columnCfgs;

       // grid.getStore().load();

        //this._buildColumns(true);  //sets grid.columns
        //this.getStore().fetch = this._buildFetch();
        //
        //this.on('reconfigure', function() {
        //    this.headerCt.setSortState();
        //}, this, {single: true});
        //this.reconfigure(null, this.columns);
        //this.columns = this.headerCt.items.getRange();
        //
        //if (!suspendLoad) {
        //    this.getStore().load();
        //}

    },
    _getGridConfig: function () {
        var context = this.getContext() || Rally.environment.getContext(),
            columnCfgs = Ext.Array.merge(this.gridConfig.columnCfgs || [], this.gridConfig.customColumns || []),
            config = Ext.merge({
                xtype: 'rallytreegrid',
                context: context,
                enableRanking: false, //context.getWorkspace().WorkspaceConfiguration.DragDropRankingEnabled,
                defaultSortToRank: true,
                enableBlockedReasonPopover: true,
                stateId: this.stateId + '-grid',
                stateful: true,
                height: this.getAvailableGridBoardHeight()
            }, this.gridConfig);

            config.columnCfgs = columnCfgs;

        if (_.isEmpty(config.store)) {
            Ext.Error.raise('No grid store configured');
        }
        return config;
    },
    _getConfiguredFilters: function (extraFilters, types) {
        var filters = _.compact(Ext.Array.merge(
            this.getGrid().store.filters,
            this.storeConfig && this.storeConfig.filters,
            this.gridConfig && this.gridConfig.storeConfig && this.gridConfig.storeConfig.filters,
            extraFilters));


        console.log('_getConfiguredFilters',filters.toString(),
            _.isFunction(this.getModels()[0].getArtifactComponentModel));

        // don't do this if not artifact model or we are using filter collection
        //if ( _.isFunction(this.getModels()[0].getArtifactComponentModel)) {
        //    filters = Rally.util.Filter.removeNonapplicableTypeSpecificFilters(filters, types, this.getModels()[0]);
        //}
        console.log('_getConfiguredFilters', filters.toString);
        return filters;
    },

    _addGrid: function () {
        var grid = this.add(this._getGridConfig());
        this.mon(grid, 'afterproxyload', this._onGridLoad, this);
        if (this.currentCustomFilter) {
            this._applyGridFilters(grid, this.currentCustomFilter);
        }
        return grid;
    },

    _applyGridFilters: function (grid, filterObj) {
        if (!_.isEmpty(filterObj.types)) {
            grid.store.parentTypes = filterObj.types;
        }
        grid.store.clearFilter(true);
        console.log('applied filters', this._getConfiguredFilters(filterObj.filters || [], filterObj.types || []));
        grid.store.filter(this._getConfiguredFilters(filterObj.filters || [], filterObj.types || []));
    },
    _onGridLoad: function () {
        this.fireEvent('load', this);

        if (Rally.BrowserTest) {
            Rally.BrowserTest.publishComponentReady(this);
        }
    }

});