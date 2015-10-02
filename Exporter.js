Ext.define('GridExporter',{
    singleton: true,
/*
 * will render using your grid renderer.  If you want it to ignore the grid renderer,
 * have the column set _csvIgnoreRender: true
 */
getCSVFromGrid:function(app, grid){
    var deferred = Ext.create('Deft.Deferred');

    var store = Ext.create('Rally.data.wsapi.Store',{
        fetch: grid.getStore().config.fetch,
        filters: grid.getStore().config.filters,
        model: grid.getStore().config.model,
        pageSize: 200
    });

    var columns = grid.columns;
    var column_names = [];
    var headers = [];

    Ext.Array.each(columns,function(column){
        if ( column.dataIndex || column.renderer ) {
            column_names.push(column.dataIndex);
            if ( column.csvText ) {
                headers.push(column.csvText);
            } else {
                headers.push(column.text);
            }
        }
    });

    var record_count = grid.getStore().getTotalCount(),
        page_size = grid.getStore().pageSize,
        pages = Math.ceil(record_count/page_size),
        promises = [];

    for (var page = 1; page <= pages; page ++ ) {
        promises.push(this.loadStorePage(app, grid, store, columns, page, pages));
    }
    Deft.Promise.all(promises).then({
        success: function(csvs){
            var csv = [];
            csv.push('"' + headers.join('","') + '"');
            _.each(csvs, function(c){
                _.each(c, function(line){
                    csv.push(line);
                });
            });
            csv = csv.join('\r\n');
            deferred.resolve(csv);
            app.setLoading(false);
        }
    });
    return deferred.promise;

},
loadStorePage: function(app, grid, store, columns, page, total_pages){
    var deferred = Ext.create('Deft.Deferred');
    this.logger.log('loadStorePage',page, total_pages);

    var mock_meta_data = {
        align: "right",
        classes: [],
        cellIndex: 9,
        column: null,
        columnIndex: 9,
        innerCls: undefined,
        recordIndex: 5,
        rowIndex: 5,
        style: "",
        tdAttr: "",
        tdCls: "x-grid-cell x-grid-td x-grid-cell-headerId-gridcolumn-1029 x-grid-cell-last x-unselectable",
        unselectableAttr: "unselectable='on'"
    }

    store.loadPage(page, {
        callback: function (records) {
            var csv = [];
            app.setLoading(Ext.String.format('Page {0} of {1} loaded',page, total_pages));
            for (var i = 0; i < records.length; i++) {
                var record = records[i];

                var node_values = [];
                Ext.Array.each(columns, function (column) {
                    if (column.xtype != 'rallyrowactioncolumn') {
                        if (column.dataIndex) {
                            var column_name = column.dataIndex;
                            var display_value = record.get(column_name);

                            if (!column._csvIgnoreRender && column.renderer) {
                                if (column.exportRenderer) {
                                    display_value = column.exportRenderer(display_value, mock_meta_data, record, 0, 0, store, grid.getView());
                                } else {
                                    display_value = column.renderer(display_value, mock_meta_data, record, 0, 0, store, grid.getView());
                                }
                            }
                            node_values.push(display_value);
                        } else {
                            var display_value = null;
                            if (!column._csvIgnoreRender && column.renderer) {
                                if (column.exportRenderer) {
                                    display_value = column.exportRenderer(display_value, mock_meta_data, record, record, 0, 0, store, grid.getView());
                                } else {
                                    display_value = column.renderer(display_value, mock_meta_data, record, record, 0, 0, store, grid.getView());
                                }
                                node_values.push(display_value);
                            }
                        }

                    }
                }, this);
                csv.push('"' + node_values.join('","') + '"');
            }
            deferred.resolve(csv);
        },
        scope: this
    });
    return deferred;
}
});
