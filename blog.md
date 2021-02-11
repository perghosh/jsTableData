CUITableText Edit setup
--

`CUITableText` use `CEdits` to hold edit controls for each column that are editable. These columns can be generated automatically in constructor if `CTableData` is sent. `CUITableText` checks properties for each column in `CTableData` and creates  edit controls for columns that are set to edit.
If `CTableData` isn't set or if `CTableData` is changed, edit controls need to be initialized or updated.

```js
// register edit controls
let eEditors = edit.CEditors.GetInstance();
eEditors.Add("string", edit.CEditInput); // register control for string values
eEditors.Add("number", edit.CEditNumber); // register control for number


let oTable = new CTableData();
oTable.ReadObjects(json_data); // read some data
oTable.COLUMNSetPropertyValue([ 1, 2, 3, 4, 5, 6 ], "edit.edit", true); // set editable columns
table.COLUMNSetPropertyValue([ 1, 2, 3, 4, 5, 6 ], [ "edit.name", "type.group" ], "string"); // set type of edit control for column, here it is "string"
// edit options set to true will create one internal CEdits object, this CEdits 
// object holds controls for columns that are editable.
let oTableText = new CUITableText({edit: true, parent: document.getElementById("idParentTableElement"), table: oTable});
oTableText.INPUTInitialize(true); // Create edit controls for editable columns
oTableText.INPUTActivate(4, 3);   // open edit on row 4 and column 3
oTableText.INPUTActivate(4);      // Open all edits on row 4
```


```ts
let oTableData = new CTableData();                                             // new table data object

// trigger logic, this will enable triggering callbacks
let oTrigger = new CTableDataTrigger({ table: oTableData, trigger: CALLBACK_TableData }); // create trigger object and set  callback to events for table data

let eContainer = document.getElementById("idTableCointainer");

let options = {
   parent: eContainer,
   section: [ "toolbar", "title", "table.header", "table.body", "table.footer", "statusbar" ],
   table: oTableData,
   name: "test-data",
   trigger: oTrigger,   // set trigger to get trigger events from CUITableText
};

let oTableText = new CUITableText(options);
oTableData.ReadObjects(aAddresses);
oTrigger.Trigger( CTableDataTrigger.GetTriggerNumber("AfterLoadNew") );        // Execute trigger called "AfterLoadNew"
```