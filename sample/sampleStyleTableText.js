/**
   * Cofigure page. Triggers, CSS and elements are prepared for page
   */
function setup() {
   CTableData_browser.AddCSS(sCSS); // prepare CSS
   document.createElement("table-info");

   let eEditors = edit.CEditors.GetInstance();
   eEditors.Add("string", edit.CEditInput);
   eEditors.Add("number", edit.CEditNumber);

}

/**
 * Render specified table. 
 * @param eParent Parent element to table
 * @param table table data (from CTableData)
 * @param sName name associated with table, this can be used to acces table ui object
 * @param oStyle css style for table
 * @param oCustomOptions custom options for CUITableText used to render table
 */
function render_table(eParent, table, sName, oStyle, oCustomOptions) {
   oStyle = oStyle || {};
   oCustomOptions = oCustomOptions || {};

   let options = {
      parent: eParent,
      section: [ "toolbar", "title", "table.header", "table.body", "table.footer", "statusbar" ],
      style: oStyle,
      table: table,
      name: sName || "",
      edit: 1,
   };

   Object.assign(options, oCustomOptions);

   let oTableText = new CUITableText(options);

   table.UIAppend(oTableText);
   oTableText.Render();


   return oTableText;
   /*
   let aWidth = oTableText.COLUMNCalculateMaxWidth("body", null, 1);
   oTableText.COLUMNSetWidth(aWidth, "header");
   */
}

/**
 * Render tables
 */
function TABLE_render_tables() {
   let aStyle = [
      { html_header: "b.bg_secondary secondary" },
      { html_cell: "i.text-small"},
      { class_section: "uitabletext-3" },
      {},
      {},
      { 
         class_section: "uitabletext-6", class_value_error: "error_value",
         html_value: "<div style='display: flex; align-items: stretch;'><span data-label='1' style='padding: 0px 4px; text-align: right; width: 100px;'></span><span data-value='1' style='flex-grow: 1; padding: 0px 4px;'></span></div>"
      },
   ];

   let tabledataTest = new CTableData();
   tabledataTest.ReadObjects(aAddresses);

   let oTrigger = new CTableDataTrigger({ table: tabledataTest, trigger: CALLBACK_TableData }); // trigger logic, this will enable triggering callbacks
   //g_vars.trigger = oTrigger;

         

   for(let i = 1; i <= 6; i++) {
      let oOptions = {};

      oOptions.trigger = oTrigger;

      if(i === 6) {
         oOptions.section = [ "toolbar", "title", "table.body", "statusbar" ];
         oOptions.max = 2;
         oOptions.render = (sType, v, e, oColumn) => {
            TABLE_set_label.call( this, sType, v, e, oColumn );
         };
      }

      let eContainer = document.querySelector("#idGrid > div:nth-child(" + i + ")");
      let oTT = render_table(eContainer, tabledataTest, "name" + i, aStyle[ i - 1 ], oOptions);
      eContainer.dataset.table_id = oTT.data.id;
      eContainer.dataset.uitable_id = oTT.id;
   }

   window.tabledataTest = tabledataTest;
   //g_vars.trigger.ObserveResize(document.querySelector("#idGrid > div:nth-child(" + 1 + ")"));

   oTrigger.ObserveResize(document.querySelector("#idGrid > div:nth-child(" + 1 + ")"));
}

function TABLE_set_width() {
   {
      let oTableText = tabledataTest.UIGet("name" + 3);
      let aWidth = oTableText.COLUMNCalculateMaxWidth("body", null, 1);
      aWidth.forEach((v, i) => { aWidth[ i ] = v + 1;})
      oTableText.COLUMNSetWidth(aWidth, "header");
      oTableText.COLUMNSetWidth(aWidth, "body");
   }

   {
      let oTableText = tabledataTest.UIGet("name" + 1);
      let aWidth = oTableText.COLUMNCalculateMaxWidth("body", null, 1);
      oTableText.COLUMNSetWidth(aWidth, "header");
   }

   {
      let oTableText = tabledataTest.UIGet("name" + 2);
      let aWidth = oTableText.COLUMNCalculateMaxWidth("body", null, 1);
      oTableText.COLUMNSetWidth(aWidth, "header");
   }
}

function TABLE_set_label( sType, v, e, oColumn ) {
   if(sType === "afterCellValue") {
      let eLabel = e.querySelector("[data-label]");
      eLabel.innerText = oColumn.name;
   }
}

function TABLE_toggle_data( sSelectData ) {
   let TDTest = window.tabledataTest;

   let aSource = aJson[sSelectData];

   TDTest.ClearData();
   TDTest.ReadObjects(aSource);

   TDTest.UIGet(0).trigger.TriggerUpdate( CTableDataTrigger.GetTriggerNumber("UpdateDataNew") );

   TDTest.COLUMNSetType(TDTest.ROWGet(1));
   TDTest.COLUMNSetPropertyValue([ 1, 2, 3, 4 ], "edit.edit", true);

   if(sSelectData === "WorldWarII") {
      TDTest.COLUMNSetPropertyValue([ 1, 2, 3, 4 ], "format.max", 50000000);
      TDTest.COLUMNSetPropertyValue([ 1, 2, 3, 4 ], "format.min", 10);
   }

   let aTableEdit = [2,3,5];
   for( let i = 0; i < aTableEdit.length; i++ ) {
      let oTableText = TDTest.UIGet(aTableEdit[i]);
      let oTrigger = oTableText.trigger;

      oTrigger.TriggerUpdate(CTableDataTrigger.GetTriggerNumber("OnResize"));

      iTrigger = CTableDataTrigger.GetTriggerNumber("AfterLoadNew");
      oTrigger.Trigger(iTrigger);

         
      oTableText.INPUTInitialize(true);
   }

   let aTableInsert = [4];
   for( let i = 0; i < aTableInsert.length; i++ ) {
      let oTableText = TDTest.UIGet(aTableInsert[i]);
         
      let aRow = oTableText.ROWInsert(3);
      let j = aRow[0].length;
      while( --j >= 0 ) { aRow[0][j] = "X"; }               console.assert( oTableText.ROWGetIndexForNew().length === 1, "Should be one new row!")
      oTableText.create_body();
      oTableText.render_body();
   }
}

/**
 * Callback for events managed by CTableDataTrigger
 * @param {EventDataTable} oEventData standard event data
 * @param {any} e This is dependent on the event.
 */
function CALLBACK_TableData(oEventData, e) {                              console.log("Event:", oEventData.iEvent, " Reason:", oEventData.iReason);

   let sName = CTableDataTrigger.s_aTriggerName[ oEventData.iEvent ];
   switch(sName) {
      case "AfterLoadNew": {
         let oUITable = oEventData.data.UIGet(0);
         let aWidth = oUITable.COLUMNCalculateMaxWidth("body", null, 1); // calculate first width for first row, this is enough because style is table-cell
         oUITable.COLUMNSetWidth(aWidth, "header");
      }
      break;
      case "OnResize": {
         console.log(e.target.tagName);
         console.log(e.target.dataset.uitable_id);

         let oUITable = oEventData.data.UIGetById(e.target.dataset.uitable_id);
         let eTitle = oUITable.GetSection("title");
         console.log(eTitle.tagName);
         if(eTitle.firstElementChild === null) {
            eTitle.innerHTML = "<div style='background-color: var(--gd-primary); text-align: right;'><table-info style='width: 120px;'></table-info><table-info style='width: 120px;'></table-info></div>";
         }
         let eInfo0 = eTitle.querySelector("table-info");
         let eInfo1 = eInfo0.nextElementSibling;
         eInfo0.innerText = "Width: " + Math.floor(e.contentRect.width);
         eInfo1.innerText = "Height: " + Math.floor(e.contentRect.height);

         let oTableText = oEventData.data.UIGetById()

         let aWidth = oUITable.COLUMNCalculateMaxWidth("body", null, 1); // calculate first width for first row, this is enough because style is table-cell
         oUITable.COLUMNSetWidth(aWidth, "header");
      }
      break;
   }
}






var aWWII = [
   {
      "ID": 1,
      "Country": "USSR",
      "Military deaths": 12000000,
      "Civilian deaths": 15000000,
      "Population": 111000000,
      "Size": 17100000,
   },
   {
      "ID": 2,
      "Country": "China",
      "Military deaths": 1800000,
      "Civilian deaths": 7500000,
      "Population": 267000000,
      "Size": 9600000,
   },
   {
      "ID": 3,
      "Country": "Poland",
      "Military deaths": 400000,
      "Civilian deaths": 5900000,
      "Population": 35000000,
      "Size": 312696,
   },
   {
      "ID": 4,
      "Country": "Germany",
      "Military deaths": 3250000,
      "Civilian deaths": 2440000,
      "Population": 68000000,
      "Size": 312696,
   },
   {
      "ID": 5,
      "Country": "Japan",
      "Military deaths": 1500000,
      "Civilian deaths": 5000000,
      "Population": 73000000,
      "Size": 377976,
   },
   {
      "ID": 6,
      "Country": "Yugoslavia",
      "Military deaths": 305000,
      "Civilian deaths": 1230000,
      "Population": 15400000,
      "Size": 255804,
   },
   {
      "ID": 7,
      "Country": "Romania",
      "Military deaths": 450000,
      "Civilian deaths": 465000,
      "Population": 20000000,
      "Size": 238397,
   }
];

var aAddresses = [
   {
      "ID": 1,
      "Name": "Edward the Elder",
      "Country": "United Kingdom",
      "House": "House of Wessex",
      "Reign": "899-925"
   },
   {
      "ID": 2,
      "Name": "Athelstan",
      "Country": "United Kingdom",
      "House": "House of Wessex",
      "Reign": "925-940"
   },
   {
      "ID": 3,
      "Name": "Edmund",
      "Country": "United Kingdom",
      "House": "House of Wessex",
      "Reign": "940-946"
   },
   {
      "ID": 4,
      "Name": "Edred",
      "Country": "United Kingdom",
      "House": "House of Wessex",
      "Reign": "946-955"
   },
   {
      "ID": 5,
      "Name": "Edwy",
      "Country": "United Kingdom",
      "House": "House of Wessex",
      "Reign": "955-959"
   }
];

var aJson = {
   "WorldWarII": aWWII,
   "Addresses": aAddresses,
}

/*.uitabletext { display: table; width: 100%; border-top: thin solid var(--gd-gray-light); border-right: thin solid var(--gd-gray-light); }*/


var sCSS = `
.uitabletext input:invalid { border-color: red; }

.uitabletext { outline: none; }
.uitabletext input { outline: none; }
.uitabletext { display: table; width: 100%; }
.uitabletext > div { display: table-row; }
.uitabletext > div > span { display: table-cell; padding: 5px; border-bottom: 1px solid var(--gd-gray-light); border-left: 1px solid var(--gd-gray-light); box-sizing: border-box;  }
.uitabletext > div > b { display: table-cell; padding: 5px; border-bottom: 1px solid var(--gd-gray-light); border-left: 1px solid var(--gd-gray-light); box-sizing: border-box;  }
.uitabletext > div > i { display: table-cell; padding: 5px; border-bottom: 2px solid #222; border-left: 1px solid #222; box-sizing: border-box;  }
.uitabletext .selected { border: 1px solid blue; }

.uitabletext-3 { display: block; width: 100%; }
.uitabletext-3 > div > span { background-color: var(--gd-gray); border: 1px solid var(--gd-gray-dark); color: var(--gd-gray-light); display: inline-block; margin: 2px; padding: 1px 5px; overflow: hidden; text-overflow: ellipsis; box-sizing: border-box; white-space: nowrap; }
.uitabletext-3 .selected { border-bottom: 3px solid blue; }

.uitabletext-6 { display: block; width: 100%; }
.uitabletext-6 > div > span { border: 1px solid var(--gd-gray-light); display: inline-block; margin: 1px; padding: 1px 5px; background-color: var(--gd-white); color: var(--gd-gray-dark); overflow: hidden; text-overflow: ellipsis; box-sizing: border-box; white-space: nowrap; width: 100%; }
.uitabletext-6 .selected { border: 1px solid blue; }
.uitabletext-6 > div { border-bottom: 2px solid blue; padding: 1em; }


[data-group="table"] { border-top: 1px solid var(--gd-gray-light); border-right: 1px solid var(--gd-gray-light); }
[data-group="table"] > section.uitabletext-header { position: sticky; top: 0;}
[data-section="component"] { background-color: var(--gd-white) }

.uitabletext .input { border: 1px solid grey; }

.secondary { color: #4A90E2; }
.bg_secondary { background-color: #fff; }
.text-small { font-size: 10px; }

.error { background-color: #FDE4E1 !important; color: #B10009; }
.error_value { background-color: #FFF !important; color: #B10009; }


`;
