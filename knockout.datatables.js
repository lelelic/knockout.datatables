/**
 * @summary     Datatables Custom Binding for Knockout.js
 * @description Allows Datatables to work with Knockout.js
 * @version     0
 * @file        knockout-datatables.js
 * @author      Chad Mullins (
 * @originalSrc    https://github.com/CogShift/Knockout.Extensions
 *
 * This source file is free software, under either the GPL v2 license or a
 * BSD style license, available at:
 *   http://datatables.net/license_gpl2
 *   http://datatables.net/license_bsd
 * 
 * This source file is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 * 
 * For details please refer to: http://www.datatables.net
 */

/*jslint sloppy: true, white: true, vars: true, nomen: true, eqeq: true, browser: true, plusplus: true */
/*globals $, jQuery, isInitialisedKey, ko*/
define(['ko'], function (ko) {
    ko.bindingHandlers.dataTable = {
        'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            "use strict";

            var binding, isInitialisedKey, options, theIndex, dataSource, dataTable, unwrappedItems, destRow, columnName, accesor;

            if ($.data(element, isInitialisedKey) === true) {
                return;
            }

            binding = ko.utils.unwrapObservable(valueAccessor());
            isInitialisedKey = "ko.bindingHandlers.dataTable.isInitialised";
            options = {};

            // ** Initialise the DataTables options object with the data-bind settings **

            // Clone the options object found in the data bindings.  This object will form the base for the DataTable initialisation object.
            if (binding.options) {
                options = $.extend(options, binding.options);
            }
            // Define the tables columns.
            if (binding.columns && binding.columns.length) {
                options.aoColumns = [];
                ko.utils.arrayForEach(binding.columns, function (col) {
                    options.aoColumns.push({ mData: col.Name, sName: col.name });

                });
            }

            // Define column data attributes
            if (binding.columns && binding.columns.length) {
                options.aoColumns = [];
                ko.utils.arrayForEach(binding.columns, function (col) {
                    // DA CAMBIARE COSI`; IN QUESTO MODO POSSO COMMENTARE
                    // TUTTO IL CODICE SOTTO E USARE LE PROPRIETA DIRETTE
                    // DI DATATABLES!
                    //options.aoColumns.push(col);

                    options.aoColumns.push({ mData: col.name, sName: col.name });

                    theIndex = binding.columns.indexOf(col);

                    if (col.dataSort) {
                        options.aoColumns[theIndex].aDataSort = col.dataSort;
                    }

                    if (col.sortType) {
                        options.aoColumns[theIndex].sType = col.sortType;
                    }

                    if (col.sortable === false) {
                        options.aoColumns[theIndex].bSortable = col.sortable;
                    }

                    if (col.visible === false) {
                        options.aoColumns[theIndex].bVisible = col.visible;
                    }

                    if (col.sDefaultContent) {
                        options.aoColumns[theIndex].sDefaultContent = col.sDefaultContent;
                    }
                });
            }

            if (binding.sorting && binding.sorting.length) {
                options.aaSorting = [];
                ko.utils.arrayForEach(binding.sorting, function (item) {
                    options.aaSorting.push(
                        [item.column, item.direction]
                    );

                });
            }
            else {
                options.aaSorting = [];
            }

            if (binding.sortingFixed && binding.sortingFixed.length) {
                options.aaSortingFixed = [];
                ko.utils.arrayForEach(binding.sortingFixed, function (item) {
                    options.aaSortingFixed.push(
                        [item.column, item.direction]
                    );

                });
            }
            else {
                options.aaSortingFixed = [];
            }

            if (binding.retrieve) {
                options.bRetrieve = binding.retrieve;
            }

            if (binding.initialSortColumn) {
                options.aaSortingFixed = [[binding.initialSortColumn, 'asc']];
            }

            if (binding.autoWidth) {
                options.bAutoWidth = binding.autoWidth;
            } else {
                options.bAutoWidth = false;
            }

            if (binding.sDom) {
                options.sDom = binding.sDom;
            }

            if (binding.iDisplayLength) {
                options.iDisplayLength = binding.iDisplayLength;
            }

            if (binding.sPaginationType) {
                options.sPaginationType = binding.sPaginationType;
            }

            if (binding.hasOwnProperty("bPaginate")) {
                options.bPaginate = binding.bPaginate;
            }

            if (binding.bDestroy) {
                options.bDestroy = binding.bDestroy;
            }

            if (binding.bServerSide) {
                options.bServerSide = binding.bServerSide;
            }

            if (binding.sAjaxSource) {
                options.sAjaxSource = binding.sAjaxSource;
            }


            if (binding.fnServerData) {
                options.fnServerData = binding.fnServerData;
            }


            if (binding.sServerMethod) {
                options.sServerMethod = binding.sServerMethod;
            }

            if (binding.sPaginationType) {
                options.sPaginationType = binding.sPaginationType;
            }

            if (binding.fnCreatedRow) {

            }

            if (binding.stateSave) {
                options.stateSave = binding.stateSave;
            }


            // Register the row template to be used with the DataTable.
            if (binding.rowTemplate && binding.rowTemplate !== '') {
                options.fnRowCallback = function (row, data, displayIndex, displayIndexFull) {
                    // Render the row template for this row.
                    ko.renderTemplate(binding.rowTemplate, data, null, row, "replaceChildren");
                    return row;
                };
            }

            // Set the data source of the DataTable.
            if (binding.dataSource) {

                dataSource = ko.utils.unwrapObservable(binding.dataSource);
                var dataSource = ko.utils.unwrapObservable(binding.dataSource);

                // If the data source is a function that gets the data for us...
                if (typeof dataSource == 'function' && dataSource.length == 2) {
                    // Register a fnServerData callback which calls the data source function when the DataTable requires data.
                    options.ajax = function (data, callback, settings) {
                        dataSource.call(viewModel, convertDataCriteria(data), function (result) {
                            //console.log(result);
                            callback({
                                aaData: ko.utils.unwrapObservable(result.Data),
                                iTotalRecords: ko.utils.unwrapObservable(result.TotalRecords),
                                iTotalDisplayRecords: ko.utils.unwrapObservable(result.DisplayedRecords)
                            });
                        });
                    }

                    // In this data source scenario, we are relying on the server processing.
                    options.bProcessing = binding.bProcessing;
                    options.bServerSide = true;
                    options.aaData = [];
                }
                else if (dataSource instanceof Array) {
                    // Set the initial datasource of the table.
                    options.aaData = ko.utils.unwrapObservable(binding.dataSource);

                    // If the data source is a knockout observable array...
                    if (ko.isObservable(binding.dataSource)) {
                        // Subscribe to the dataSource observable.  This callback will fire whenever items are added to 
                        // and removed from the data source.
                        binding.dataSource.subscribe(function (newItems) {
                            // ** Redraw table **
                            dataTable = $(element).dataTable();

                            // Get a list of rows in the DataTable.
                            var tableNodes = dataTable.fnGetNodes();

                            // If the table contains rows...
                            if (tableNodes.length) {
                                // Unregister each of the table rows from knockout.
                                ko.utils.arrayForEach(tableNodes, function (node) { ko.cleanNode(node); });
                                // Clear the datatable of rows.
                                dataTable.fnClearTable();
                            }

                            // Unwrap the items in the data source if required.
                            unwrappedItems = [];
                            ko.utils.arrayForEach(newItems, function (item) {
                                unwrappedItems.push(ko.utils.unwrapObservable(item));
                            });

                            // Add the new data back into the data table.
                            dataTable.fnAddData(unwrappedItems);
                        });
                    }

                } else { // If the dataSource was not a function that retrieves data, or a javascript object array containing data.
                    throw 'The dataSource defined must a javascript object array';
                }
            }

            // If no fnRowCallback has been registered in the DataTable's options, then register the default fnRowCallback.
            // This default fnRowCallback function is called for every row in the data source.  The intention of this callback
            // is to build a table row that is bound it's associated record in the data source via knockout js.

            //NOOOOOOOO
            //se ho un template il rowCallback e` chiamato sopra (vedi rowTemplate)
            //se non ho un template allora il rowCallback non server perche` ci pensano i metodi ajax / fnAddData a scrivere le righeee
            /*if (!options.fnRowCallback) {
                options.fnRowCallback = function (row, srcData, displayIndex, displayIndexFull) {
                    //var columns = this.fnSettings().aoColumns;

                    // Empty the row that has been build by the DataTable of any child elements.
                    /*destRow = $(row);
                    destRow.empty();

                    // For each column in the data table...
                    ko.utils.arrayForEach(columns, function (column) {
                        var newCell, accesor;

                        columnName = column.mData;

                        newCell = $("<td></td>");

                        // bind the cell to the observable in the current data row.
                        accesor = eval("srcData['" + columnName.replace(".", "']['") + "']");

                        if (column.bVisible)
                            destRow.append(newCell);

                        
                        if (columnName === 'action') {
                            ko.applyBindingsToNode(newCell[0], { html: accesor }, srcData);
                        } else {
                            ko.applyBindingsToNode(newCell[0], { text: accesor }, srcData);
                        }
                    });

                    return destRow[0];
                };
            }*/

            // If no fnDrawCallback has been registered in the DataTable's options, then register the default here. 
            // This default callback is called every time the table is drawn (for example, when the pagination is clicked). 

            if (binding.fnDrawCallback)
                options.fnDrawCallback = binding.fnDrawCallback;

            if (!options.fnDrawCallback) {

                options.fnDrawCallback = function () {

                    /*
                    // There are some assumptions here that need to be better abstracted
                    $(binding.expandIcon).click(function(){
                        var theRow = $(this).parent().parent()[0]; //defined by the relationship between the clickable expand icon and the row. assumes that the icon (the trigger) is in a td which is in a tr. 
                        rowContent = $(theRow).find(".hiddenRow").html();
                        
                        tableId = local[binding.gridId];
                        
                        if(tableId.fnIsOpen(theRow)){
                            $(this).removeClass('icon-contract '+binding.expandIcon);
                            $(this).addClass('icon-expand '+binding.expandIcon);
                            tableId.fnClose(theRow);
                        }else{
                            $(this).removeClass('icon-expand '+binding.expandIcon);
                            $(this).addClass('icon-contract ' +binding.expandIcon);
                            tableId.fnOpen(theRow, rowContent, 'info_row');
                        }
                    });
                    */

                    if (binding.tooltip) {
                        if (binding.tooltip[0]) {
                            // bootstrap tooltip definition
                            $("[rel=" + binding.tooltip[1] + "]").tooltip({
                                placement: 'top',
                                trigger: 'hover',
                                animation: true,
                                delay: {
                                    show: 1000,
                                    hide: 10
                                }
                            });
                        }
                    }
                };

            }

            binding.gridId = $(element).dataTable(options);

            $.data(element, isInitialisedKey, true);

            // Tell knockout that the control rendered by this binding is capable of managing the binding of it's descendent elements.
            // This is crutial, otherwise knockout will attempt to rebind elements that have been printed by the row template.
            return { controlsDescendantBindings: true };

        }
    };

    function convertDataCriteria(srcOptions) {
        /*var i, j, getColIndex, destOptions, optionsLen;

        getColIndex = function (name) {
            var matches = name.match("\\d+");

            if (matches && matches.length) {
                return matches[0];
            }
            return null;
        };

        destOptions = { Columns: [] };
        optionsLen = srcOptions.length;
        // Figure out how many columns in in the data table.
        for (i = 0; i < optionsLen ; i++) {
            if (srcOptions[i].name == "iColumns") {
                for (j = 0; j < srcOptions[i].value; j++) {
                    destOptions.Columns.push({});
                }
                break;
            }
        }

        ko.utils.arrayForEach(srcOptions, function (item) {
            var colIndex = getColIndex(item.name);

            if (item.name == "_iDisplayStart")
                destOptions.RecordsToSkip = item.value;
            else if (item.name == "_iDisplayLength")
                destOptions.RecordsToTake = item.value;
            else if (item.name == "sSearch")
                destOptions.GlobalSearchText = item.value;
            else if (cog.utils.string.startsWith(item.name, "bSearchable_"))
                destOptions.Columns[colIndex].IsSearchable = item.value;
            else if (cog.utils.string.startsWith(item.name, "sSearch_"))
                destOptions.Columns[colIndex].SearchText = item.value;
            else if (cog.utils.string.startsWith(item.name, "mDataProp_"))
                destOptions.Columns[colIndex].ColumnName = item.value;
            else if (cog.utils.string.startsWith(item.name, "iSortCol_")) {
                destOptions.Columns[item.value].IsSorted = true;
                destOptions.Columns[item.value].SortOrder = colIndex;

                var sortOrder = ko.utils.arrayFilter(srcOptions, function (item) {
                    return item.name == "sSortDir_" + colIndex;
                });

                if (sortOrder.length && sortOrder[0].value == "desc")
                    destOptions.Columns[item.value].SortDirection = "Descending";
                else
                    destOptions.Columns[item.value].SortDirection = "Ascending";
            }
        });*/

        //console.log(srcOptions);

        var destOptions = { columns: [] };

        for (var i = 0; i < srcOptions.columns.length; i++) {
            var c = srcOptions.columns[i];

            var obj = {};
            obj.IsSearchable = c.searchable;
            obj.SearchText = c.search.value;
            obj.ColumnName = c.data;

            for (var j = 0; j < srcOptions.order.length; j++) {
                var columnOrder = srcOptions.order[j];

                if (columnOrder.column == i) {
                    obj.IsSorted = true;
                    obj.SortOrder = j;
                    obj.SortDirection = (columnOrder.dir === "asc") ? "Ascending" : "Descending";
                }
            }

            destOptions.columns.push(obj);
        };


        destOptions.RecordsToSkip = srcOptions.start;
        destOptions.RecordsToTake = srcOptions.length;
        destOptions.GlobalSearchText = srcOptions.search.value;

        return destOptions;
    };
});