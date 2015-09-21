Ext.define('ProjectPickerDialog', {
    extend: 'Rally.ui.dialog.Dialog',
    alias: 'widget.projectpickerdialog',


    height: 400,
    width: 600,
    layout: 'fit',
    closable: true,
    draggable: true,

    config: {
        /**
         * @cfg {String}
         * Title to give to the dialog
         */
        title: 'Choose an Item',

        /**
         * @cfg {Boolean}
         * Allow multiple selection or not
         */
        multiple: true,

        /**
         * @cfg {Object}
         * An {Ext.data.Store} config object used when building the grid
         * Handy when you need to limit the selection with store filters
         */
        storeConfig: {
            context: {
                project: null
            },
            sorters: [
                {
                    property: 'FormattedID',
                    direction: 'DESC'
                }
            ]
        },

        /**
         * @cfg {Ext.grid.Column}
         * List of columns that will be used in the chooser
         */
        columns: [
            {
                text: 'ID',
                dataIndex: 'FormattedID',
                renderer: _.identity
            },
            'Name'
        ],

        /**
         * @cfg {String}
         * Text to be displayed on the button when selection is complete
         */
        selectionButtonText: 'Done',

        /**
         * @cfg {Object}
         * The grid configuration to be used when creative the grid of items in the dialog
         */
        gridConfig: {},

        /**
         * @deprecated
         * @cfg {String}
         * The ref of a record to select when the chooser loads
         * Use selectedRecords instead
         */
        selectedRef: undefined,

        /**
         * @cfg {String}|{String[]}
         * The ref(s) of items which should be selected when the chooser loads
         */
        selectedRecords: undefined,

        /**
         * @cfg {Array}
         * The records to select when the chooser loads
         */
        initialSelectedRecords: undefined,

        /**
         * @private
         * @cfg userAction {String} (Optional)
         * The client metrics action to record when the user makes a selection and clicks done
         */

        /**
         * @cfg showRadioButtons {Boolean}
         */
        showRadioButtons: true
    },

    constructor: function(config) {
        this.mergeConfig(config);

        this.callParent([this.config]);
    },

    selectionCache: [],

    initComponent: function() {
        this.callParent(arguments);

        this.addEvents(
            /**
             * @event artifactchosen
             * Fires when user clicks done after choosing an artifact
             * @param {Rally.ui.dialog.ArtifactChooserDialog} source the dialog
             * @param {Rally.data.wsapi.Model}| {Rally.data.wsapi.Model[]} selection selected record or an array of selected records if multiple is true
             */
            'itemschosen'
        );

        this.addCls(['chooserDialog', 'chooser-dialog']);
    },

    destroy: function() {
        //      this._destroyTooltip();
        this.callParent(arguments);
    },

    beforeRender: function() {
        this.callParent(arguments);

        this.addDocked({
            xtype: 'toolbar',
            dock: 'bottom',
            padding: '0 0 10 0',
            layout: {
                type: 'hbox',
                pack: 'center'
            },
            ui: 'footer',
            items: [
                {
                    xtype: 'rallybutton',
                    itemId: 'doneButton',
                    text: this.selectionButtonText,
                    cls: 'primary rly-small',
                    scope: this,
                    disabled: true,
                    userAction: 'clicked done in dialog',
                    handler: function() {
                        this.fireEvent('itemschosen', this, this.getSelectedRecords());
                        this.close();
                    }
                },
                {
                    xtype: 'rallybutton',
                    text: 'Cancel',
                    cls: 'secondary rly-small',
                    handler: this.close,
                    scope: this,
                    ui: 'link'
                }
            ]
        });

        if (this.introText) {
            this.addDocked({
                xtype: 'component',
                componentCls: 'intro-panel',
                html: this.introText
            });
        }

        this.addDocked({
            xtype: 'toolbar',
            itemId: 'searchBar',
            dock: 'top',
            border: false,
            padding: '0 0 10px 0',
            items: this.getSearchBarItems()
        });

        this.buildGrid();

        this.selectionCache = this.getInitialSelectedRecords() || [];
    },

    /**
     * Get the records currently selected in the dialog
     * {Rally.data.Model}|{Rally.data.Model[]}
     */
    getSelectedRecords: function() {
        return this.multiple ? this.selectionCache : this.selectionCache[0];
    },

    getSearchBarItems: function() {
        return [
            {
                xtype: 'triggerfield',
                cls: 'rui-triggerfield chooser-search-terms',
                emptyText: 'Search Keyword or ID',
                enableKeyEvents: true,
                flex: 1,
                itemId: 'searchTerms',
                listeners: {
                    keyup: function (textField, event) {
                        console.log('keyup', textField, event.getKey());
                        if (event.getKey() === Ext.EventObject.ENTER) {
                            this._search();
                        }
                    },
                    afterrender: function (field) {
                        field.focus();
                    },
                    scope: this
                },
                triggerBaseCls: 'icon-search chooser-search-icon'
            }
        ];
    },
    getStoreFilters: function() {
        return [];
    },

    buildGrid: function() {
        if (this.grid) {
            this.grid.destroy();
        }

        this.fetchProjectTreeStore().then({
            scope: this,
            success: function(projectTree){
                this.projectTree = projectTree;
                this._addGrid(projectTree);
            }
        });
    },

    _enableDoneButton: function() {
        this.down('#doneButton').setDisabled(this.selectionCache.length ? false : true);
    },

    _findRecordInSelectionCache: function(record){
        return _.findIndex(this.selectionCache, function(cachedRecord) {
            return cachedRecord.get('_ref') === record.get('_ref');
        });
    },

    _onGridSelect: function(selectionModel, record) {

        var index = this._findRecordInSelectionCache(record);
        console.log('onGridSelect', record, index);
        if (index === -1) {
            if (!this.multiple) {
                this.selectionCache = [];
            }
            this.selectionCache.push(record);
            console.log('selectionCache', this.selectionCache);
        }

        this._enableDoneButton();
    },

    _onGridDeselect: function(selectionModel, record) {
        var index = this._findRecordInSelectionCache(record);
        if (index !== -1) {
            this.selectionCache.splice(index, 1);
        }

        this._enableDoneButton();
    },

    _onGridReady: function() {
        if (!this.grid.rendered) {
            this.mon(this.grid, 'afterrender', this._onGridReady, this, {single: true});
            return;
        }

        if (this.grid.getStore().isLoading()) {
            this.mon(this.grid, 'load', this._onGridReady, this, {single: true});
            return;
        }

        this._onGridLoad();
        this.center();
    },
    _onGridLoad: function() {
        var defaultSelection = Ext.Array.from(this.selectedRef || this.selectedRecords);
        if (defaultSelection.length) {
            var selectedRecords = _.compact(_.map(defaultSelection, function(ref) {
                var recordIndex = this.grid.getStore().find('_ref', ref);
                return recordIndex >= 0 ? this.grid.getStore().getAt(recordIndex) : null;
            }, this));
            if(selectedRecords.length) {
                this.grid.getSelectionModel().select(selectedRecords);
            }
        } else {
            var store = this.grid.store;
            var records = [];

            _.each(this.selectionCache, function(record) {
                var recordIndex = store.find('_ref', record.get('_ref'));

                if (recordIndex !== -1) {
                    var storeRecord = store.getAt(recordIndex);
                    records.push(storeRecord);
                }
            });

            if (records.length) {
                this.grid.getSelectionModel().select(records);
            }
        }
    },

    _search: function() {
        var terms = this._getSearchTerms();
        var store = this.grid.getStore();
        console.log('_search', terms, store);
        if (terms) {
            store.filter(function(item){
                console.log('filter', item);
                var re = new RegExp(terms, "i");
                if (re.test(item.get('Name'))){
                    return true;
                }
                return false;
            }, true);
            //Ext.Object.each(store.tree.nodeHash, function(key, node) {
            //
            //    console.log('node',node);
            //    if (!re.test(node.get('Name'))){
            //        node.remove();
            //    }
            //});
        } else {
            store.tree.filter(function(item){
                return true;
            }, true);
            //this._addGrid(this.projectTree);
        }
    },

    _getSearchTerms: function() {
        var textBox = this.down('#searchTerms');
        return textBox && textBox.getValue();
    },
    _getTreeArray:function(records) {

        var projectHash = {};
        _.each(records, function(rec){
            projectHash[rec.get('ObjectID')] = rec.getData();
            projectHash[rec.get('ObjectID')].leaf = true;
            projectHash[rec.get('ObjectID')].text = rec.get('Name');
            projectHash[rec.get('ObjectID')].children = [];
            projectHash[rec.get('ObjectID')]._ref = rec.get('_ref');
        });

        var root_array = [];

        Ext.Object.each(projectHash, function(oid,item){
            var direct_parent = item.Parent;
            if (!direct_parent && !Ext.Array.contains(root_array,item)) {
                root_array.push(item);
            } else {

                var parent_oid =  direct_parent.ObjectID;
                if (!projectHash[parent_oid]) {
                    if ( !Ext.Array.contains(root_array,item) ) {
                        root_array.push(item);
                    }
                } else {
                    var parent = projectHash[parent_oid];

                    var kids = parent.children;
                    kids.push(item);
                    parent.children = kids;
                    parent.leaf = false;
                }
            }
        },this);

        return root_array;
    },

    fetchProjectTreeStore: function(){
        var deferred = Ext.create('Deft.Deferred');

        var fetch = ['ObjectID','Name','Parent'];

        var store = Ext.create('Rally.data.wsapi.Store',{
            model: 'Project',
            fetch: fetch,
            remoteFilter: false
        });

        store.load({
            scope: this,
            callback: function(records, operation, success){
                if (success){
                    var projectTree = this._getTreeArray(records);
                    deferred.resolve(projectTree);
                } else {
                    deferred.resolve('Error fetching projects: ' + operation.error.errors.join(','));
                }
            }
        });
        return deferred;
    },
    _addGrid: function(projectTree){

        Ext.define('ProjectTreeModel',{
            extend: 'Ext.data.Model',
            fields: [
                { name: 'Name', type:'String' },
                { name: '_ref', type:'String' }
            ]
        });

        var tree_store = Ext.create('Ext.data.TreeStore', {
            model: ProjectTreeModel,
            root: {
                expanded: true,
                children: projectTree
            }
        });

        if (this.grid){
            this.grid.destroy();
        }

        this.grid = Ext.create('Ext.tree.Panel', {
            columnCfgs: [
                'Name'
            ],
            displayField: 'Name',
            store: tree_store,
            cls: 'rally-grid',
            rootVisible: false,
            selModel: Ext.create('Rally.ui.selection.CheckboxModel', {
                mode: 'SIMPLE',
                allowDeselect: true,
                enableKeyNav: false
            }),
            viewConfig: {
                emptyText: Rally.ui.EmptyTextFactory.get('defaultText'),
                publishLoadMessages: false
            }
        });
        this.grid.addCls('rally-grid-cell-no-wrap');
        this.mon(this.grid, {
            beforeselect: this._onGridSelect,
            beforedeselect: this._onGridDeselect,
            load: this._onGridLoad,
            scope: this
        });
        this.add(this.grid);
        this._onGridReady();
    }
});

