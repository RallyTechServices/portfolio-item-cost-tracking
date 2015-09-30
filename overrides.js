Ext.define('Ext.CostTemplate', {
    extend: 'Ext.grid.column.Template',
    alias: ['widget.costtemplatecolumn'],

    tpl: '',
    costField: '',

    initComponent: function(){
        var me = this;

        me.tpl = new Ext.XTemplate("<tpl>{[this.getCost(values)]}</tpl>",{
            costField: me.costField,
            getCost: function(values){
                if (values[this.costField] === null){
                    return PortfolioItemCostTracking.CostCalculator.notAvailableText;
                } else {
                    return PortfolioItemCostTracking.CostCalculator.formatCost(values[this.costField] || 0);
                }

            }

        });
        me.hasCustomRenderer = true;
        me.callParent(arguments);
    },
    getValue: function(){

        return this.values[this.costField] || 0;
    },
    defaultRenderer: function(value, meta, record) {

        var data = Ext.apply({}, record.data, record.getAssociatedData());
        return this.tpl.apply(data);
    }
});
        //Ext.define('Rally.ui.grid.TreeGrid', {
        //    alias: 'widget.rallytreegrid',
        //
        //    extend: 'Ext.tree.Panel',
        //    cls: 'rally-grid',
        //
        //    requires: [
        //        'Ext.data.NodeInterface',
        //        'Ext.selection.Model',
        //        'Ext.state.Manager',
        //        'Rally.Message',
        //        'Rally.data.wsapi.TreeStoreBuilder',
        //        'Rally.ui.tree.PagingToolbar',
        //        'Rally.ui.grid.FieldColumnFactory',
        //        'Rally.ui.grid.FormattedIDTreeColumn',
        //        'Rally.ui.grid.ColumnBuilder',
        //        'Rally.ui.grid.RowModel',
        //        'Rally.ui.grid.TreeGridExpandTracker',
        //        'Rally.ui.grid.TreeView',
        //        'Rally.ui.grid.plugin.CellEditing',
        //        'Rally.ui.grid.plugin.CellValidationUi',
        //        'Rally.ui.grid.plugin.ClickHandlerPlugin',
        //        'Rally.ui.grid.plugin.ColorPickerPlugin',
        //        'Rally.ui.grid.plugin.ColumnAutoSizer',
        //        'Rally.ui.grid.plugin.FormattedIDHoverable',
        //        'Rally.ui.grid.plugin.TreeGridChildPager',
        //        'Rally.ui.grid.plugin.TreeGridObjectUpdateListener',
        //        'Rally.ui.grid.plugin.TreeViewDragDrop',
        //        'Rally.ui.grid.plugin.Validation',
        //        'Rally.ui.grid.plugin.ViewVisibilityListener',
        //        'Rally.ui.grid.feature.SummaryRow',
        //        'Rally.ui.grid.data.ColumnFetchBuilder',
        //        'Rally.ui.grid.TreeGridExpandTracker',
        //        'Rally.util.Animation',
        //        'Rally.util.Ref',
        //        'Rally.ui.grid.plugin.BufferedRenderer',
        //        'Rally.ui.grid.plugin.InlineAddRowExpander',
        //        'Rally.realtime.Realtime',
        //        'Rally.realtime.RealtimePlugin'
        //    ],
        //
        //    mixins: {
        //        messageable: 'Rally.Messageable',
        //        stateful: 'Ext.state.Stateful',
        //        filternotifiable: 'Rally.ui.filter.FilterNotifiable',
        //        clientMetrics: 'Rally.clientmetrics.ClientMetricsRecordable',
        //        treeGridRankable: 'Rally.ui.grid.dragdrop.TreeGridRankable'
        //    },
        //
        //    clientMetrics: [
        //        {
        //            beginEvent: 'expandbatch',
        //            endEvent: 'afterexpandbatch',
        //            description: 'expand batch'
        //        },
        //        {
        //            beginEvent: 'collapsebatch',
        //            endEvent: 'aftercollapsebatch',
        //            description: 'collapse batch'
        //        },
        //        {
        //            beginEvent: 'beforeitemcollapse',
        //            endEvent: 'afteritemcollapse',
        //            description: 'item collapse'
        //        },
        //        {
        //            beginEvent: 'beforeitemexpand',
        //            endEvent: 'itemexpand',
        //            description: 'item expand'
        //        }
        //    ],
        //
        //    /**
        //     * @private
        //     * @property
        //     *
        //     * The state that was applied by #applyState.
        //     *
        //     * Saved so plugins that are initialized after state is applied can access state.
        //     */
        //    appliedState: undefined,
        //
        //    config: {
        //        /**
        //         * @cfg {Rally.data.wsapi.TreeStore} (required)
        //         * A TreeStore instance, used to handle state and facilitate hierarchical behavior (enableHierarchy parameter on the store)
        //         * Must specify a store see {@link Rally.data.wsapi.TreeStoreBuilder} for building stores
        //         */
        //        store: undefined,
        //
        //        /**
        //         * @cfg {Object}
        //         * The object to enable displayed when not using collection filtering and there is no data.  Can be html string to be
        //         * inserted into the rendering template for the no data message in the {@link Rally.ui.view.NoData} mixin on the view.
        //         */
        //        noDataHelpLink: undefined,
        //
        //        /**
        //         * @cfg {String}
        //         * An optional item name to display in the no data text. Defaults to 'work item'.
        //         */
        //        noDataItemName: undefined,
        //
        //        /**
        //         * @cfg {Array}
        //         * Accepts {@link Ext.grid.Panel} column configs, or a string to use the default renderer for the type
        //         */
        //        columnCfgs: [],
        //
        //        /**
        //         * @cfg {Boolean}
        //         * True to always display default columns, regardless of save column state.
        //         */
        //        alwaysShowDefaultColumns: false,
        //
        //        /**
        //         * @cfg {Boolean}
        //         * True to use the Buffered Renderer plugin.
        //         */
        //        bufferedRenderer: false,
        //
        //        /**
        //         * @cfg {Boolean}
        //         * Automatically add all fields from the Model into the columns list
        //         * Note this only is compatible with an instance of {@link Rally.data.wsapi.Model}
        //         */
        //        autoAddAllModelFieldsAsColumns: false,
        //
        //        /**
        //         * @cfg {Boolean}
        //         * Automatically add gear menu column to the grid
        //         */
        //        shouldShowRowActionsColumn: true,
        //
        //        /**
        //         * @cfg {Object}
        //         * Custom config for the row action column
        //         */
        //        rowActionColumnConfig: null,
        //
        //        disableColumnMenus: true,
        //
        //        /**
        //         * @cfg {Boolean}
        //         * Enables the behavior for the blocked reason plugin
        //         */
        //        enableBlockedReasonPopover: true,
        //
        //        /**
        //         * @cfg {Boolean}
        //         * Enables a one-click to change the schedule state
        //         */
        //        enableScheduleStateClickable: true,
        //
        //        /**
        //         * @cfg {Boolean}
        //         * Enables drag drop of rows, persists the rank,
        //         * Uses the {#link Rally.ui.grid.plugin.TreeViewDragDrop} plugin
        //         */
        //        enableRanking: true,
        //
        //        /**
        //         * @cfg {Boolean}
        //         * Enables inline editing of cells,
        //         * Uses the {@link Rally.ui.grid.plugin.CellEditing} plugin
        //         */
        //        enableEditing: true,
        //
        //        /**
        //         * @cfg {Boolean}
        //         * Enables bulk edit
        //         */
        //        enableBulkEdit: true,
        //
        //        /**
        //         * @cfg {Object}
        //         * Configuration options for the bulk edit menu.
        //         * These properties will be passed to the {Rally.ui.menu.bulk.RecordMenu} on creation
        //         */
        //        bulkEditConfig: {},
        //
        //        lines: false,
        //        /**
        //         * @cfg {Boolean}
        //         * Enables validation icons on a grid,
        //         * Uses the {@link Rally.ui.grid.plugin.Validation} plugin
        //         * and the {@link Rally.ui.grid.plugin.CellValidationUi} plugin
        //         */
        //        enableValidationUi: true,
        //
        //        /**
        //         * @cfg {Object}
        //         * Additional config to pass to the editing plugin, depends on the {@link #enableEditing} flag to be set to true
        //         */
        //        editingConfig: {
        //            publishMessages: true
        //        },
        //
        //        /**
        //         * @cfg {Boolean}
        //         * Enables inline add
        //         */
        //        enableInlineAdd: false,
        //
        //        /**
        //         * @cfg {Object}
        //         * Additional config to pass to the inline add plugin, depends on the {@link #enableInlineAdd} flag to be set to true
        //         */
        //        inlineAddConfig: {
        //
        //        },
        //
        //        plugins: [],
        //
        //        selModel: {
        //            selType: 'rallycheckboxmodel'
        //        },
        //
        //        context: undefined,
        //
        //        rootVisible: false,
        //
        //        viewConfig: {
        //            xtype: 'rallytreeview',
        //            animate: false,
        //            loadMask: false,
        //            forceFit: true,
        //            plugins: [
        //                'rallytreeviewdragdrop',
        //                'rallyviewvisibilitylistener'
        //            ]
        //        },
        //
        //        /**
        //         * @cfg {String}
        //         * This column will contain a cheveron to expand/collapse the row if the row has children.
        //         * This field will be next to the rank column.
        //         */
        //        treeColumnDataIndex: 'FormattedID',
        //
        //        /**
        //         * @cfg {String}
        //         * The label for the treecolumn's header.
        //         */
        //        treeColumnHeader: 'ID',
        //
        //        /**
        //         * @cfg {Boolean}
        //         * Whether the tree column should be resizable
        //         */
        //        treeColumnResizable: false,
        //
        //        treeColumnRenderer: undefined,
        //
        //        /**
        //         * @cfg {String}
        //         * The field to be displayed next to the Expand icon on a tree grid.  Defaults to DragAndDropRank.
        //         */
        //        rankColumnDataIndex: 'DragAndDropRank',
        //
        //
        //        /**
        //         * @cfg {Function} onBeforeRecordMenuEdit
        //         * Function to execute before editing a record from the gear menu. Return false to not perform the action.
        //         * @param {Rally.data.Model} record The record that is being acted on.
        //         */
        //        onBeforeRecordMenuEdit: Ext.emptyFn,
        //
        //        /**
        //         * @cfg {Function} onBeforeRecordMenuCopy
        //         * Function to execute before copying a record from the gear menu. Return false to not perform the action.
        //         */
        //        onBeforeRecordMenuCopy: Ext.emptyFn,
        //
        //        /**
        //         * @cfg {Function} onRecordMenuCopy
        //         * Function to execute after copying a record from the gear menu.
        //         * @param {Rally.data.Model} copiedRecord The record that is being acted on.
        //         * @param {Rally.data.Model} originalRecord The record that is being acted on.
        //         * @param {Ext.data.Operation} operation The WSAPI operation
        //         */
        //        onRecordMenuCopy: Ext.emptyFn,
        //
        //        /**
        //         * @cfg {Function} onBeforeRecordMenuDelete
        //         * Function to execute before deleting a record from the gear menu. Return false to not perform the action.
        //         */
        //        onBeforeRecordMenuDelete: Ext.emptyFn,
        //
        //        /**
        //         * @cfg {Function} onRecordMenuDelete
        //         * Function to execute after deleting a record from the gear menu.
        //         */
        //        onRecordMenuDelete: Ext.emptyFn,
        //
        //        /**
        //         * @cfg {Function} onBeforeRecordMenuRankHighest
        //         * Function to execute before ranking a record highest from the gear menu. Return false to not perform the action.
        //         * @param {Rally.data.Model} record The record that is being acted on.
        //         */
        //        onBeforeRecordMenuRankHighest: Ext.emptyFn,
        //
        //        /**
        //         * @cfg {Function} onBeforeRecordMenuRankLowest
        //         * Function to execute before ranking a record highest from the gear menu. Return false to not perform the action.
        //         * @param {Rally.data.Model} record The record that is being acted on.
        //         */
        //        onBeforeRecordMenuRankLowest: Ext.emptyFn,
        //
        //        /**
        //         * @cfg {Function} onRecordMenuRemove
        //         * Function to execute after removing a record from the gear menu.
        //         * @param {Rally.data.Model} record The record that is being acted on.
        //         */
        //        onRecordMenuRemove: Ext.emptyFn,
        //
        //        /**
        //         * @cfg {Array}
        //         * Array of configurations for summary e.g. {field: 'PlanEstimate', type: 'sum', units: 'pt'}
        //         */
        //        summaryColumns: [],
        //
        //        expandTracker: null,
        //
        //        /**
        //         * @cfg {boolean}
        //         * If true, cells will word wrap.  When false, if contents does not fit the cell
        //         * the content will be truncated and ellipsis added to the end.
        //         */
        //        variableRowHeight: true,
        //
        //        expandAllInColumnHeaderEnabled: false
        //    },
        //
        //    constructor: function(config) {
        //        this.mergeConfig(config);
        //
        //        this.treeColumnRenderer = this.treeColumnRenderer || this._defaultTreeColumnRenderer;
        //        this.plugins = this._setupPlugins(config);
        //        this.features = this._setupFeatures(config);
        //
        //        this.callParent(arguments);
        //    },
        //
        //    initComponent: function() {
        //        if (!this.store) {
        //            Ext.Error.raise('A store must be specified in the config');
        //        }
        //
        //        if (!this.expandTracker) {
        //            this.expandTracker = Ext.create('Rally.ui.grid.TreeGridExpandTracker');
        //        }
        //
        //        if (!this.variableRowHeight) {
        //            this.addCls('rally-grid-cell-no-wrap');
        //        }
        //
        //        this.addEvents([
        //        /**
        //         * @event filterchange
        //         * Fires when the grid's filter is changed.
        //         * @param {Ext.util.Filter} filter
        //         * @param Boolean clearFilter - true if existing filters should be cleared before applying new filter
        //         * @param {Boolean} ignoreDefaultFilters True if filters passed in at initialization time should be removed when clearing other filters
        //         */
        //            'filterchange',
        //        /**
        //         * @event
        //         * Fires when user wants all items expanded
        //         * @param {Ext.Component} this
        //         */
        //            'expandall',
        //        /**
        //         * @event
        //         * Fires when user wants all item collapsed
        //         * @param {Ext.Component} this
        //         */
        //            'collapseall',
        //        /**
        //         * @event
        //         * Fires when all items are expanded and after all childern are loaded and rendered
        //         * @param {Ext.Component} this
        //         * @param {Array} expanded nodes
        //         */
        //            'afterexpandbatch',
        //        /**
        //         * @event
        //         * Fires when all items are collapsed and after all childern are rendered
        //         * @param {Ext.Component} this
        //         * @param {Array} collapsed nodes
        //         */
        //            'aftercollapsebatch',
        //        /**
        //         * @event
        //         * Fires after a new child has been added to a parent and rendered.
        //         *
        //         * @param {Ext.Component} this
        //         * @param {Ext.data.Mode} parentNode
        //         * @param {Ext.data.Mode} childNode
        //         */
        //            'afterchildadd'
        //        ]);
        //
        //        this.store.requester = this.store.requester || this;
        //        this.store.clientMetricsParent = this;
        //
        //        if (this.enableBulkEdit) {
        //            this.selType = 'rallycheckboxmodel';
        //            this.selModel = {
        //                injectCheckbox: this.enableRanking ? 1 : 0
        //            };
        //        }
        //
        //        this._applyInitialState();
        //        this._buildDockedItems();
        //        this._buildColumns();
        //        this._applySorters();
        //        this._applyFetch();
        //        this._initView();
        //
        //        this.callParent(arguments);
        //
        //        this.subscribe(Rally.Message.bulkImport, function() {
        //            this.refresh({
        //                callback: function(records, operation, success) {
        //                    this.store.sort();
        //                },
        //                scope: this
        //            });
        //        }, this);
        //    },
        //
        //    _defaultTreeColumnRenderer: function (value, metaData, record, rowIdx, colIdx, store) {
        //        store = store.treeStore || store;
        //        return Rally.ui.renderer.RendererFactory.getRenderTemplate(store.model.getField('FormattedID')).apply(record.data);
        //    },
        //
        //    _applySorters: function() {
        //        var store = this.store,
        //            sorterConfig,
        //            rankField;
        //
        //        if (store.sorters.getCount() > 0) {
        //            return; // use configured sorters
        //        }
        //
        //        if (Rally.data.Ranker.isRankable(store.model)) {
        //            rankField = Rally.data.Ranker.getRankField(store.model);
        //            sorterConfig = Rally.data.util.Sorter.sorters(rankField + ' ASC').pop();
        //        } else {
        //            sorterConfig = Rally.data.util.Sorter.getDefaultSort(store.model.typePath, {asSorter: true}).pop();
        //        }
        //
        //        store.sorters.add(Ext.create('Ext.util.Sorter', sorterConfig));
        //    },
        //
        //    _applyFetch: function() {
        //        this.store.fetch = this._buildFetch();
        //
        //        if (this._shouldShowSummary()) {
        //            this.store.summaryFields = _.pluck(this.summaryColumns, 'field');
        //        }
        //    },
        //
        //    _addStoreListeners: function() {
        //        this.relayEvents(this.store, [
        //            'load',
        //            'beforeexpand',
        //            'beforecollapse',
        //            'beforeload',
        //            'expand',
        //            'collapse',
        //            'currentpagereset',
        //            'datachanged',
        //            'excludebyfilter',
        //            'movetopage',
        //            'beforefilter',
        //            'afterbuscreate',
        //            'afterbusupdate',
        //            'afterbusremove'
        //        ], 'store');
        //        this.on('storeload', this._onStoreLoad, this);
        //        this.on('storedatachanged', this._onDataChanged, this);
        //        this.on('storeexcludebyfilter', this._onExcludeByFilter, this);
        //        this.on('storemovetopage', this._onMoveToPage, this);
        //        this._initStateEvents();
        //    },
        //
        //    _initPager: function() {
        //        var pager = this.down('#pagingToolbar');
        //
        //        this.relayEvents(pager, ['change', 'beforechange'], 'pagingtoolbar');
        //
        //        this._addPageResetListeners();
        //    },
        //
        //    _initView: function() {
        //        if (!this.rendered) {
        //            this.on('afterrender', this._initView, this, {single: true});
        //            return;
        //        }
        //
        //        this._addStoreListeners();
        //        this._initPager();
        //        this._fireComponentReady();
        //    },
        //
        //    _initStateEvents: function() {
        //        this.on('storeload', function() {
        //            this.readyForStateEvents = true;
        //            this.addStateEvents(['columnresize', 'columnmove', 'sortchange', 'reconfigure', 'pagingtoolbarchange']);
        //            this.recordComponentReady();
        //        }, this, {
        //            single: true,
        //            buffer: 100
        //        });
        //    },
        //
        //    _applyInitialState: function() {
        //        var id = this.getStateId() || '',
        //            state = this.appliedState || Ext.state.Manager.getProvider().get(id) || {};
        //
        //        this.applyState(state);
        //    },
        //
        //    _fireComponentReady: function() {
        //        if (Rally.BrowserTest) {
        //            Rally.BrowserTest.publishComponentReady(this);
        //            this.publish(Rally.Message.treeLoaded);
        //        }
        //    },
        //
        //    destroy: function() {
        //        this._removePageResetListeners();
        //        this.callParent(arguments);
        //    },
        //
        //    refresh: function(options) {
        //        return this.store.load(_.assign({
        //            node: this.getRootNode(),
        //            clearOnLoad: false
        //        }, options));
        //    },
        //
        //    refreshAfterBulkAction: function() {
        //        return Deft.Promise.when(true);
        //    },
        //
        //    _addPageResetListeners: function() {
        //        this.on('storecurrentpagereset', this._resetCurrentPage, this);
        //
        //    },
        //
        //    _removePageResetListeners: function() {
        //        this.un('storecurrentpagereset', this._resetCurrentPage, this);
        //    },
        //
        //    _getColumnCfgs: function() {
        //        return this.columnCfgs;
        //    },
        //
        //    _isStatefulColumn: function(columnName) {
        //
        //        columnName = columnName.toLowerCase();
        //
        //        if (this.store.enableHierarchy && columnName === this.treeColumnDataIndex.toLowerCase()) {
        //            return false;
        //        }
        //
        //        if (this.enableRanking && columnName === this.rankColumnDataIndex.toLowerCase()) {
        //            return false;
        //        }
        //
        //        return true;
        //    },
        //
        //    _getStatefulColumns: function(columnCfgs) {
        //        return _.filter(columnCfgs, function(columnCfg) {
        //            var columnName = Ext.isString(columnCfg) ? columnCfg: columnCfg.dataIndex;
        //
        //            return !Ext.isEmpty(columnName) && this._isStatefulColumn(columnName);
        //        }, this);
        //    },
        //
        //    addStateEvents: function() {
        //        // overridden to ignore state events set before initial load
        //        if (this.readyForStateEvents) {
        //            this.callParent(arguments);
        //        }
        //    },
        //
        //    applyState: function(state) {
        //        this.appliedState = state;
        //        this._applyState(state);
        //    },
        //
        //    _applyState: function(state) {
        //        if (state.columns) {
        //            // make sure flex is set correctly for column configs saved in a preference
        //            _.each(state.columns, this._setColumnFlex, this);
        //            if (this.enableRanking) {
        //                state.columns = this._removeExistingRankColumn(state.columns);
        //            }
        //
        //            this._applyStatefulColumns(state.columns);
        //        }
        //
        //        if (state.pagingToolbar) {
        //            var store = this.getStore();
        //            store.pageSize = state.pagingToolbar.pageSize;
        //            store.currentPage = state.pagingToolbar.currentPage;
        //        }
        //
        //        if (state.sorters) {
        //            var sorters = _.transform(state.sorters, function (collection, sorterState) {
        //                if(Rally.data.Ranker.isRankField(sorterState.property)) {
        //                    sorterState.property = Rally.data.Ranker.getRankField(this.store.model);
        //                }
        //
        //                collection.add(Ext.create('Ext.util.Sorter', {
        //                    property: sorterState.property,
        //                    direction: sorterState.direction
        //                }));
        //            }, Ext.create('Ext.util.MixedCollection'), this);
        //            this.getStore().sorters = sorters;
        //        }
        //
        //        if (state.expandedRowPersistence) {
        //            this.expandedRowPersistenceState = state.expandedRowPersistence;
        //        }
        //
        //        this.fireEvent('staterestore', this, state);
        //    },
        //
        //    _applyStatefulColumns: function(columns) {
        //        if (this.alwaysShowDefaultColumns) {
        //            _.each(this.columnCfgs, function(columnCfg) {
        //                var dataIndex = _.has(columnCfg.dataIndex) ? columnCfg.dataIndex : columnCfg;
        //                if (!_.any(columns, {dataIndex: dataIndex})) {
        //                    columns.push(columnCfg);
        //                }
        //            });
        //        }
        //
        //        this.columnCfgs = columns;
        //    },
        //
        //    _removeExistingRankColumn: function(columns) {
        //        return _.filter(columns, function(col) {
        //            return col.dataIndex !== this.rankColumnDataIndex;
        //        }, this);
        //    },
        //
        //    getState: function() {
        //        var state = {},
        //            statefulColumns = this._getStatefulColumns(this.headerCt.getGridColumns());
        //
        //        state.columns = _.map(statefulColumns, this._getColumnConfigFromColumn, this);
        //
        //        state.pagingToolbar = {
        //            pageSize: this.getStore().pageSize,
        //            currentPage: this.getStore().currentPage
        //        };
        //
        //        state.sorters = _.map(this.getStore().sorters.getRange(), function(sorter) {
        //            return {
        //                property: sorter.property,  //Why does this differ from what is in _initSorters()?
        //                direction: sorter.direction
        //            };
        //        });
        //
        //        state.expandedRowPersistence = this.expandedRowPersistenceState;
        //
        //        return state;
        //    },
        //
        //    // Buffer method to avoid spewing preference updates when state is updated multiple times within a short time period.
        //    saveState: Ext.Function.createBuffered(function () {
        //        if (!this.isDestroyed) {
        //            Ext.state.Stateful.prototype.saveState.apply(this, arguments);
        //        }
        //    }, 100),
        //
        //    /**
        //     * Reconfigure the columns to be displayed in the grid.
        //     * @param {Boolean} true to override existing column config with new column config already exists
        //     * @param {Boolean} true to suspend store load if it will be triggered elsewhere
        //     */
        //    reconfigureWithColumns: function(columnCfgs, reconfigureExistingColumns, suspendLoad) {
        //        columnCfgs = this._getStatefulColumns(columnCfgs);
        //        console.log('reconfigurewithcolumns', columnCfgs, this.columns);
        //        if (!reconfigureExistingColumns) {
        //            columnCfgs = this._mergeColumnConfigs(columnCfgs, this.columns);
        //        }
        //        console.log('reconfigurewithcolumns2', columnCfgs, this.columns);
        //        this.columnCfgs = columnCfgs;
        //        this._buildColumns(true);
        //        this.getStore().fetch = this._buildFetch();
        //        console.log('reconfigurewithcolumns3', this.columnCfgs, this.columns);
        //
        //        this.on('reconfigure', function() {
        //            this.headerCt.setSortState();
        //        }, this, {single: true});
        //        this.reconfigure(null, this.columns);
        //        this.columns = this.headerCt.items.getRange();
        //
        //        if (!suspendLoad) {
        //            this.getStore().load();
        //        }
        //    },
        //
        //    _getColumnConfigFromColumn: function(column) {
        //        var config = {
        //            xtype: column.xtype,
        //            dataIndex: column.dataIndex,
        //            text: column.text,
        //            sortable: column.sortable,
        //            width: Ext.isFunction(column.getWidth) ? column.getWidth() : column.width
        //        };
        //
        //        this._setColumnFlex(config);
        //
        //        return config;
        //    },
        //
        //    _setColumnFlex: function(column) {
        //        if (column.width) {
        //            column.flex = column.width;
        //            delete column.width;
        //        } else if (!_.isNumber(column.flex)) {
        //            column.flex = Rally.ui.grid.FieldColumnFactory.defaultFlexValue;
        //        }
        //    },
        //
        //    _getDataIndex: function(column) {
        //        return column.dataIndex ? column.dataIndex : column;
        //    },
        //
        //    _mergeColumnConfigs: function(newColumns, oldColumns) {
        //        var new_columns =  _.map(newColumns, function(newColumn) {
        //            var oldColumn = _.find(oldColumns, {dataIndex: this._getDataIndex(newColumn)});
        //            if (oldColumn) {
        //                return this._getColumnConfigFromColumn(oldColumn);
        //            }
        //            return newColumn;
        //        }, this);
        //
        //        _.each(oldColumns, function(o){
        //            if (o.xtype === 'costtemplatecolumn'){
        //                new_columns.push(o);
        //            }
        //        });
        //
        //
        //        return new_columns;
        //    },
        //
        //    _getExpandColumnCfg: function() {
        //        var xtype = this.expandAllInColumnHeaderEnabled ? 'rallyformattedidtreecolumn' : 'treecolumn';
        //
        //        return {
        //            xtype: xtype,
        //            text: this.treeColumnHeader,
        //            dataIndex: this.treeColumnDataIndex,
        //            draggable: false,
        //            resizable: this.treeColumnResizable,
        //            renderer: this.treeColumnRenderer,
        //            scope: this,
        //            menuDisabled: this.disableColumnMenus,
        //            listeners: {
        //                beforerender: function(column) {
        //                    if (!column.initialConfig.renderer) {
        //                        column.origRenderer = Rally.ui.grid.CellRendererFactory.createRendererFunction(column);
        //                    }
        //                }
        //            }
        //        };
        //    },
        //
        //    _buildColumns: function(isReconfiguring) {
        //        var model = this.getStore().model;
        //        var disabledEditorColumns = ['DisplayColor'].concat(this.enableBlockedReasonPopover ? ['Blocked'] : []);
        //        var columnCfgs = Ext.clone(this._getColumnCfgs());
        //        console.log('____buildColumns', columnCfgs);
        //        if (!this.enableRanking) {
        //            this.rowActionColumnConfig = _.merge({
        //                menuOptions: {
        //                    showRankMenuItems: false
        //                }
        //            }, this.rowActionColumnConfig);
        //        }
        //
        //        var rowActionOptions = this.shouldShowRowActionsColumn && this.rowActionColumnConfig ? this.rowActionColumnConfig : this.shouldShowRowActionsColumn;
        //
        //        if (this.store.enableHierarchy) {
        //            columnCfgs.unshift(this._getExpandColumnCfg());
        //        }
        //        this.columns = Ext.create('Rally.ui.grid.ColumnBuilder').
        //            withDefaultColumns(columnCfgs).
        //            withSortableColumns(this.sortableColumns).
        //            shouldAutoAddAllModelFieldsAsColumns(this.autoAddAllModelFieldsAsColumns).
        //            withDisableColumnMenus(this.disableColumnMenus).
        //            withEditorsDisabledForColumns(disabledEditorColumns).
        //            withEditingEnabled(this.enableEditing).
        //            withRankingEnabled(this.enableRanking).
        //            withTreeEnabled(true).
        //            withSummaryColumns(this.summaryColumns).
        //            withRankColumn(this.enableRanking ? this.rankColumnDataIndex : false).
        //            shouldShowRowActionsColumn(rowActionOptions).
        //            shouldResetFlexValuesToDefaults(isReconfiguring).
        //            buildCmps(model);
        //
        //        console.log('___buildColumns', this.columns);
        //    },
        //
        //    getAllFetchFields: function() {
        //        return this.getStore().fetch;
        //    },
        //
        //    _buildFetch: function() {
        //        var fetchConfig = this.getStore().fetch || [];
        //
        //        if (fetchConfig === true) {
        //            return fetchConfig;
        //        }
        //
        //        var fetchFields = Ext.create('Rally.ui.grid.data.ColumnFetchBuilder').build({
        //            grid: this,
        //            columns: this.columns,
        //            fetch: fetchConfig
        //        });
        //
        //        return _.union(fetchFields, [this.treeColumnDataIndex]);
        //    },
        //
        //    /**
        //     * Highlights the row representing the passed in record.
        //     * @param record
        //     */
        //    highlightRowForRecord: function(records) {
        //        var store = this.getStore(),
        //            recordIds = _.uniq(_.map(Ext.Array.from(records), function(record) {
        //                return record.getId();
        //            }));
        //
        //        _.each(recordIds, function(recordId) {
        //            var relatedRecords = store.findAllRecordsWithId(recordId);
        //
        //            _.each(relatedRecords, function(relatedRecord) {
        //                var row = this.getView().getNode(relatedRecord);
        //                if (row) {
        //                    Rally.util.Animation.highlight(Ext.fly(row).select('td'));
        //                }
        //            }, this);
        //        }, this);
        //    },
        //
        //    getItemSelector: function() {
        //        return this.view.getItemSelector();
        //    },
        //
        //    getRecord: function(x) {
        //        return this.view.getRecord(x);
        //    },
        //
        //    /**
        //     * Get models used by this grid
        //     *
        //     * @return {Model[]} models
        //     */
        //    getModels: function() {
        //        return [this.store.model];
        //    },
        //
        //    _setupPlugins: function(config) {
        //        var plugins = config.plugins || [];
        //
        //        plugins.push({ptype: 'rallytreegridobjectupdatelistener'});
        //        plugins.push({ptype: 'rallycolorpickerplugin'});
        //
        //        if (this.enableEditing) {
        //            plugins.push(Ext.apply({
        //                ptype: 'rallycellediting',
        //                messageBus: this._getMessageBus()
        //            }, this.editingConfig));
        //
        //            if (this.enableValidationUi) {
        //                plugins.push({ptype: 'rallygridvalidation'});
        //                plugins.push({ptype: 'rallycellvalidationui'});
        //            }
        //        }
        //
        //        if (this.enableBlockedReasonPopover) {
        //            plugins.push({ptype: 'rallyblockedreasonpopoverplugin'});
        //        }
        //
        //        if (!this.treeColumnResizable) {
        //            plugins.push({ptype: 'rallycolumnautosizerplugin'});
        //        }
        //
        //        if (this.bufferedRenderer) {
        //            plugins.push({
        //                ptype: 'rallybufferedrenderer',
        //                trailingBufferZone: 10, // increasing these values to 15 significantly degrades grid refresh performance
        //                leadingBufferZone: 10,
        //                variableRowHeight: this.variableRowHeight
        //            });
        //        }
        //
        //        if (this.store && this.store.enableHierarchy) {
        //            plugins.push({ptype: 'rallytreegridchildpager'});
        //        }
        //
        //        plugins.push({ptype: 'rallyclickhandlerplugin'});
        //
        //        if(this.enableInlineAdd){
        //            plugins.push(Ext.apply({
        //                ptype: 'rallyinlineaddrowexpander'
        //            }, this.inlineAddConfig));
        //        }
        //
        //        if (Rally.realtime.Realtime.enabled) {
        //            plugins.push({ptype: 'rallyrealtime'});
        //        }
        //
        //        plugins.push('rallyboardformattedidhoverable');
        //
        //        return _.uniq(plugins, 'ptype');
        //    },
        //
        //    _setupFeatures: function(config) {
        //        var features = [];
        //        if (this._shouldShowSummary()) {
        //            features.push({
        //                ftype: 'summaryrow',
        //                id: 'summaryrow'
        //            });
        //        }
        //
        //        return features;
        //    },
        //
        //    _shouldShowSummary: function() {
        //        return !(_.isEmpty(this.summaryColumns));
        //    },
        //
        //    _resetCurrentPage: function() {
        //        if (this.stateful) {
        //            //  NOTE: Considered extending Ext.state.stateful and adding a method to override a property on the
        //            //  state (which is what this is doing). If you are reading this to see how this was done, it's
        //            //  probably time to go ahead and make that change.
        //            var state = Ext.state.Manager.get(this.getStateId());
        //            if (state && Ext.isObject(state.pagingToolbar)) {
        //                state.pagingToolbar.currentPage = 1;
        //                Ext.state.Manager.set(this.getStateId(), state);
        //            }
        //        }
        //    },
        //
        //    _onStoreLoad: function() {
        //        this._showNoData();
        //        this._toggleHierarchy();
        //    },
        //
        //    _onDataChanged: function() {
        //        this._showNoData();
        //    },
        //
        //    _onExcludeByFilter: function(excludedRecord) {
        //        if (_.isFunction(this.showNewItemExcludedByFiltersWarning)) {
        //            this.showNewItemExcludedByFiltersWarning(excludedRecord);
        //        }
        //    },
        //
        //    _onMoveToPage: function(record, pageNumber) {
        //        if (_.isFunction(this.showItemMovedToPageNotification)) {
        //            var me = this;
        //            this.showItemMovedToPageNotification(record, pageNumber, function() {
        //                me.getStore().loadPage(pageNumber);
        //            });
        //        }
        //    },
        //
        //    _showNoData: function() {
        //        if (!this.store.getRootNode().hasChildNodes()) {
        //            this.getView().showNoData({
        //                noDataHelpLink: this.noDataHelpLink,
        //                itemName: this.noDataItemName,
        //                filters: [],
        //                useFilterCollection: false
        //            });
        //        }
        //    },
        //
        //    _toggleHierarchy: function() {
        //        if (this.getStore().isHierarchyEnabled()) {
        //            this.addCls('enable-hierarchy');
        //            this.removeCls('disable-hierarchy');
        //        } else {
        //            this.removeCls('enable-hierarchy');
        //            this.addCls('disable-hierarchy');
        //        }
        //    },
        //
        //    _buildDockedItems: function() {
        //        this.dockedItems = this.dockedItems || [];
        //        this.dockedItems.push(Ext.apply({
        //            itemId: 'pagingToolbar',
        //            xtype: 'rallytreepagingtoolbar',
        //            dock: 'bottom',
        //            store: this.store
        //        }, this.pagingToolbarCfg));
        //    }
        //});
        //
