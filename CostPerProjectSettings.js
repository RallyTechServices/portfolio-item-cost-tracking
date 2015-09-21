Ext.define('PortfolioItemCostTracking.CostPerProjectSettings',{
    extend: 'Ext.form.field.Base',
    alias: 'widget.costperprojectsettings',
    config: {
        value: undefined,
        decodedValue: {}
    },
    fieldSubTpl: '<div id="{id}" class="settings-grid"></div>',
    width: '100%',
    cls: 'column-settings',

    store: undefined,

    onDestroy: function() {
        if (this._grid) {
            this._grid.destroy();
            delete this._grid;
        }
        this.callParent(arguments);
    },
    initComponent: function(){

        this.callParent();
        this.addEvents('ready');

        var store = Ext.create('Rally.data.wsapi.Store', {
            model: 'Project',
            fetch: ['Name'],
            context: {
                project: null
            },
            limit: 'Infinity'
        });
        store.load({
            scope: this,
            callback: this._buildProjectGrid
        });

    },

    _buildProjectGrid: function(records, operation, success){

        var decodedValue = {};

        if (this.value && !_.isEmpty(this.value)){
            decodedValue = Ext.JSON.decode(this.value);
        }

        var data = [],
            empty_text = "No Data";

        if (success) {
            data = _.map(records, function(project){
                var cost = decodedValue[project.get('_ref')] || null;
                return {projectRef: project.get('_ref'), projectName: project.get('Name'), cost: cost};
            });
        } else {
            empty_text = "Error(s) fetching Project data: <br/>" + operation.error.errors.join('<br/>');
        }

        var custom_store = Ext.create('Ext.data.Store', {
            fields: ['projectRef', 'projectName', 'cost'],
            data: data
        });

        this._grid = Ext.create('Rally.ui.grid.Grid', {
            autoWidth: true,
            renderTo: this.inputEl,
            columnCfgs: this._getColumnCfgs(),
            showRowActionsColumn: false,
            showPagingToolbar: false,
            store: custom_store,
            maxHeight: 300,
            emptyText: empty_text,
            editingConfig: {
                publishMessages: false
            }
        });

       this.fireEvent('ready', true);
    },
    _getColumnCfgs: function() {

        var columns = [
            {
                text: 'Project',
                dataIndex: 'projectRef',
                flex: 1,
                editor: false,
                renderer: function(v, m, r){
                    return r.get('projectName');
                },
                getSortParam: function(v,m,r){
                    return 'projectName';
                }
            },{
                text: 'Cost Per Unit',
                dataIndex: 'cost',
                editor: {
                    xtype: 'rallynumberfield'
                },
                renderer: function(v){
                    if (v && v > 0){
                        return v;
                    }
                    return "Use Default";
                }
            }];
        return columns;
    },
    /**
     * When a form asks for the data this field represents,
     * give it the name of this field and the ref of the selected project (or an empty string).
     * Used when persisting the value of this field.
     * @return {Object}
     */
    getSubmitData: function() {
        var data = {};
        data[this.name] = Ext.JSON.encode(this._buildSettingValue());
        return data;
    },
    _buildSettingValue: function() {
        var mappings = {};
        var store = this._grid.getStore();

        store.each(function(record) {
            if (record.get('cost') && record.get('projectRef')) {
                mappings[record.get('projectRef')] = record.get('cost');
            }
        }, this);
        return mappings;
    },

    getErrors: function() {
        var errors = [];
        //Add validation here
        return errors;
    },
    setValue: function(value) {
        this.callParent(arguments);
        this._value = value;
    }
});
