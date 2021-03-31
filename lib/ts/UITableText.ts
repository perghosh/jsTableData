/* Introduction
 * 
 * CUITableText has logic to present information in table where data is stored in CTableData.
 * 
 * - COLUMN-methods: column logic
 * - ELEMENT-methods: access elements in ui table
 * - INPUT-methods: editing methods.
 * - ROW-methods: row logic
 
 
   https://hacks.mozilla.org/category/es6-in-depth/ 
 
 */


import { CTableData, CRowRows, enumMove, IUITableData, tabledata_column, tabledata_position, tabledata_format } from "./TableData.js";
import { edit } from "./TableDataEdit.js";
import { CTableDataTrigger, enumTrigger, enumReason, EventDataTable } from "./TableDataTrigger.js";

const enum enumState {
   HtmlValue   = 0x0001,   // Value in table has a small dom tree and we need to query for the element holding value
   SetDirtyRow = 0x0002,   // When value in row is change, set row to dirty
   SetHistory  = 0x0004,   // Record changes in history
   SetValue    = 0x0008,   // Try to set value if property is found in element.
   SetOneClickActivate = 0x0010,// Activate edits in one click
}

namespace details {
   export type construct = {
      body?: unknown[][],        // table data
      callback_action?: ((sType: string, e: EventDataTable, sSection: string) => boolean) | ((sType: string, e: EventDataTable, sSection: string) => boolean)[],
      callback_create?: ((sType: string, e: EventDataTable, sSection: string) => boolean) | ((sType: string, e: EventDataTable, sSection: string) => boolean)[],
      callback_render?: ((sType: string, e: EventDataTable, sSection: string, oColumn?: tabledata_column ) => boolean) | ((sType: string, e: EventDataTable, sSection: string, oColumn?: tabledata_column) => boolean)[],
      callback_renderer?: details.renderer[],
      create?: boolean,          // create elements for table in constructor
      edit?: boolean,            // enable edit for table
      edits?: edit.CEdits;       // edits component, logic for edit fields used in table
      id?: string,               // id for CUITableText
      max?: number,              // max number of rows shown in table
      name?: string,             // name to find this when stored in collections.
      parent?: HTMLElement,      // parent element in DOM tree
      section?: string[],        // sections to render, default is [ "toolbar", "title", "header", "body", "footer", "statusbar" ]
      separator?: {
         header?: string,
         value?: string,
      },
      settings?: { layout?: string },
      state?: number,            // states on how CUITableData is behaving, check enumState
      style?: {
         header?: string,
         value?: string,
         class_header?: string,
         class_value?: string,
         class_section?: string,
         class_component?: string,
         class_cell_input?: string,
         class_cell_selected?: string,
         class_value_error?: string,
         html_group?: string,             // element name to group sections
         html_header?: string,
         html_cell?: string,
         html_cell_header?: string,
         html_cell_footer?: string,
         html_row?: string | string[],
         html_row_body?: string | string[],                 // html element used to render rows in body
         html_row_body_before?: string | string[],          // html element used when extra rows is added before main row
         html_row_body_after?: string | string[],           // html element used when extra rows is added after main row
         html_row_body_container?: string | string[],       // html element used if body rows are in a container element
         html_value?: string,
         html_section_header?: string,
         html_section_body?: string,
         html_section_footer?: string,
      },
      support_element?: string|HTMLElement,
      table?: CTableData,        // table data object. feeds table with data
      trigger?: CTableDataTrigger,// trigger logic
      width?: {
         max_value_width?: number,// max width in pixels for value
         max_row_width?: number, // max width for row in pixels
      }
   }

   export type renderer = (( e: HTMLElement, value: unknown, aCell: [[number,number],[number,number],tabledata_column] ) => void)
}

export type uitabledata_construct = details.construct;

/*
parent.addEventListener('click', function(e) {
    if(e.target.classList.contains('myclass')) {
        // this code will be executed only when elements with class
        // 'myclass' are clicked on
    }

}); */

/*
 * Naming conventions
 * PascalCase or UpperCamelCase (public): Methods designed to be called from users, similar to public.
 *    Public methods have more error checking and return more information if something goes wrong, they may throw
 * snake_case (protected): Methods used internally, if you know how the object works internally then you could call them. almost like protected methods
 * (underscore) _snake_case (private): these are not designed to be used internally
 * flatcase: getters and setters have flatcase styling. All in lower case letters
 */


/**
 * 
 * 
 * section [section="component"]
 *    section [section="toolbar"]
 *    section [section="header"]
 *       div [type="row"]
 *          span
 *    section [section="body"]
 *       div [row=data_row_index, type="row", line=ui_row_index ,record="1"]
 *          span [c=ui_column_index]
 *    section [section="footer"]
 *       div [row=index, type="row"]
 *          span
 *    section [section="statusbar"]
 * 
 * */
export class CUITableText implements IUITableData {
   m_acallAction: ((sType: string, e: EventDataTable, sSection: string) => boolean)[];// callback array for action hooks, like select cell, values is changing etc.
   m_acallCreate: ((sType: string, e: EventDataTable, sSection: string) => boolean)[];// callback array for hooks used when items in table is created
   m_acallRender: ((sType: string, e: EventDataTable, sSection: string, oColumn: any) => boolean)[];// callback array for hooks used when items are rendered
   m_acallRenderer: details.renderer[];// callback array used to render values, if this is set to column then internal rendering for value is disabled. Array has to match number of columns shown in table
   m_iColumnCount: number;    // Number of columns shown, this may not match number of columns in table data
   m_aColumnFormat: tabledata_format[];
   m_aColumnPhysicalIndex: number[]; // index for column in table data
   m_aColumnPosition: tabledata_position[];
   m_eComponent: HTMLElement; // Element that acts as container to table, sections can exist outside container but default is within
   m_oEdits: edit.CEdits;     // Component that handles edit logic
   m_sId: string;             // Unique id for ui table
   m_aInput: [ number, number, HTMLElement, number, number ]; // data for active input
   m_sName: string;           // name for UI object, this can be used to make it easier to find ui class in collections
   m_iOpenEdit: number;       // number of input elements opened.
   m_aOrder: [ number | string, number ][];// Order for result, if external order than pic order from  data table
   m_eParent: HTMLElement;    // parent element in DOM that owns component
   m_aRowBody: unknown[][];   // values show in table
   m_iRowCount: number;       // Number of rows shown
   m_iRowCountMax: number;    // Max number of rows shown
   m_aRowPhysicalIndex: number[];// array with numbers for row index in table data object. This is to point the physical position for data
   m_oRowRows: CRowRows;      // CRowRows is used to manage the layout for each row i CTableData
   m_aSelected: [ number, number ][]; // Cell that are  selected, [row, column]
   //m_oSettings: { layout?: string };// Various settings for table text
   m_iState: number;          // Holds internal state for UI table.
   m_oTableData: CTableData;  // table source data object used to populate CUITableText
   m_oTableDataTrigger: CTableDataTrigger;// Trigger logic for table
   m_aSection: string[] | [string,HTMLElement][]; // Sections
   m_oStyle: {
      header?: string, value?: string, cell_focus?: string, cell_selected?: string,
      class_header?: string, class_value?: string, class_section?: string, class_component?: string, class_cell_input?: string, class_cell_selected?: string,
      html_header?: string, html_value?: string
   };
   m_eSupportElement: HTMLElement;
   m_aValueError: [ number, number, unknown, unknown ][];// Error values
   m_oWidth: { max_row_width?: number, max_value_width?: number  }

   static s_sWidgetName: string = "uitabletext";
   static s_iIdNext: number = 0;

   /**
    * Default styles
    */
   static s_oStyle = {
      class_component: "",
      class_header: "",
      class_input: "input",
      class_section: "uitabletext",
      class_selected: "selected",
      class_error: "error",
   };

   
   constructor(options: details.construct) {
      const o: details.construct = options || {};

      this.m_acallAction = [];
      if(o.callback_action) this.m_acallAction = Array.isArray(o.callback_action) ? o.callback_action : [ o.callback_action ];

      this.m_acallCreate = [];
      if(o.callback_create) this.m_acallCreate = Array.isArray(o.callback_create) ? o.callback_create : [ o.callback_create ];

      this.m_acallRender = [];
      if(o.callback_render) this.m_acallRender = Array.isArray(o.callback_render) ? o.callback_render : [ o.callback_render ];

      if(o.callback_renderer) this.m_acallRenderer = o.callback_renderer;

      this.m_aRowBody      = o.body || [];
      this.m_iColumnCount  = 0;
      this.m_eComponent    = null;
      this.m_oEdits        = o.edits || null;
      this.m_sId           = o.id || CUITableText.s_sWidgetName + (new Date()).getUTCMilliseconds() + ++CUITableText.s_iIdNext;
      this.m_aInput        = o.edit ? [ -1, -1, null, -1, -1 ] : null;
      this.m_sName         = o.name || "";
      this.m_iOpenEdit     = 0;
      this.m_aOrder        = [];
      this.m_eParent       = o.parent || null;
      this.m_aRowPhysicalIndex = null,
      this.m_iRowCount     = 0;
      this.m_iRowCountMax  = o.max || -1;
      this.m_aSection      = o.section || [ "toolbar", "title", "header", "body", "footer", "statusbar" ]; // sections "header" and "body" are required
      this.m_aSelected     = [];
      this.m_iState        = o.state || 0;
      this.m_oTableData    = o.table || null;
      this.m_oTableDataTrigger = o.trigger || null;

      let oStyle = o.style || {};
      this.m_oStyle = { ...CUITableText.s_oStyle, ...oStyle };
      this.m_aValueError   = [];

/*
      this.m_oStyle = {
         ...{
            header: "border: 1px solid grey;display: inline-block; margin: 1px 2px; overflow: hidden;",
            //value: "border: 1px solid grey;display: inline-block; margin: 1px 2px;",
            value: null,
            cell_focus: null,
            cell_selected: null,
            //cell_selected: "border: 1px solid blue; display: inline-block; margin: 1px 2px; background-color: yellow;",
            cell_input: null,
            //cell_input: "border: 1px solid blue; display: inline-block; margin: 1px 2px; background-color: green;",
            class_header: null,
            class_value: null,
            class_section: null,
            class_component: null,
            class_cell_input: null,
         }, ...o.style
      };
*/
      this.m_oWidth = o.width || {};

      if(o.create !== false) {
         if(this.m_eParent) {
            this.Create();
         }

         if(o.support_element) {
            if(typeof o.support_element === "string") this.m_eSupportElement = this.GetSection(o.support_element);
            else this.m_eSupportElement = o.support_element;
         }

         if(o.edit) {
            if(this.GetSupportElement() !== null) this.INPUTInitialize();       // if edit and support element is set then initialize inputs
            this.set_state(true, enumState.SetDirtyRow);
            this.set_state(true, enumState.SetHistory);
         }
      }
   }

   /**
    * Return id 
    */
   get id() { return this.m_sId; }

   /**
    * Name (set and get methods)
    */
   get name() { return this.m_sName; }
   set name(sName: string) { this.m_sName = sName; }

   /**
    * Get table data object that manages table data logic 
    */
   get data() { return this.m_oTableData; }

   get trigger() { return this.m_oTableDataTrigger; }

   get state() { return this.m_iState; }

   /**
    * Get edits object
    */
   get edits() { return this.m_oEdits; }

   /**
    * Get selected cells
    */
   get selected() { return this.m_aSelected; }


   /**
    * Ask if state is on or off. state can be many things
    * @param i
    */
   is_state( i: number ): boolean { return (this.m_iState & i) !== 0; }

   /**
    * 
    * @param _On
    * @param iState
    */
   set_state<T>(_On: T, iState: number) {
      this.m_iState = _On ? this.m_iState | iState : this.m_iState & ~iState;
   }


   update(iType: number): any {
      switch(iType) {
         case enumTrigger.UpdateDataNew: {
            this.Render();
         }
      }
   }


   Create(eParent?: HTMLElement): void {
      let eComponent = this.GetComponent(true);                                // create component in not created

      this.create_sections(eComponent);
      if(eComponent.parentElement === null) {
         this.m_eParent.appendChild(eComponent);
      }
   }

   /** BLOG: children, childNodes and dataset
    * Get root html element for components, create the component element if argument is true and component element isn't found
    * UI root element has three important data attributes.
    * - data-section = "component"
    * - data-id = id for ui item
    * - data-table = id to table data object
    * @param bCreate
    */
   GetComponent( bCreate?: boolean ): HTMLElement {
      if(this.m_eComponent) return this.m_eComponent;

      /*
      let aChildren = this.m_eParent.children;
      let i = aChildren.length;
      while(--i >= 0) {
         let e = <HTMLElement>aChildren[ i ];
         if(e.tagName === "SECTION" && e.dataset.id === this.id && e.dataset.section === "section") return <HTMLElement>e;
      }
      */


      //this._trigger(enumTrigger.BeforeCreate);

      if(bCreate === true) {
         let eComponent = document.createElement("section");
         Object.assign(eComponent.dataset, {section: "component", id: this.id, table: this.data.id }); // set "data-" ids.
         this.m_eComponent = eComponent;

         this._has_create_callback( "afterCreate", {data: this.data, dataUI: this, eElement: eComponent }, "component" );
      }

      return this.m_eComponent;
   }

   /**
    * Element, use this if child elements is to be used. Child elements are added to this
    * @returns {HTMLElement}
    */
   GetSupportElement(): HTMLElement {                                         console.assert(typeof this.m_eComponent === "object", "Support element not created!");
      let e = this.m_eSupportElement || this.GetSection("body", true);
      return e || this.m_eComponent;
   }

   /** BLOG: querySelector
    * Return element for specified section.
    * Section elements are stored in array with section names, when section is created it is also stored. Array works as cache.
    * @param {string} sName name for section, valid names are found in this.m_aSection
    * @param {boolean} [bNoThrow] If true then return null if section isn't found
    * @returns {HTMLElement} Element for section or null if not found
    * @throws {string} string with valid section names
    */
   GetSection(_Name: string | HTMLElement, bNoThrow?: boolean): HTMLElement {
      let sName: string;
      if(typeof _Name !== "string") {
         const e = <HTMLElement>_Name.closest("[data-section]");
         if(e) sName = e.dataset.section;
      }
      else sName = _Name;

      let i = this.m_aSection.length;
      while(--i >= 0) {
         let a = <[string, HTMLElement]>this.m_aSection[ i ];
         if(Array.isArray(a) === true && a[0] === sName) return a[ 1 ];
      }

      if( bNoThrow === true ) return null;
      throw "No section for \"" + sName +"\" valid sections are: " + this.m_aSection.join(" ");
   }

   /**
    * Return row and column for element
    * method are able to return row and col from any section. Returing row and col from body section differs
    * some compare to returning row and col from other sections. Cells in body always has data-c and parent row has data-row.
    * Rows in other sections do not need data-c with column index.
    * @param {HTMLElement} eElement
    * @param {boolean} [bData] Cell index in table data. When hiding columns, index in ui table for 
    * column is not same as index in table data. With his parameter you get index for column in table data.
    * @returns {[ number, number, string ]} row index, column index, section name
    */
   GetRowCol(eElement: HTMLElement, bData?: boolean): [ number, number, string ] {
      let eRow = eElement;
      let eCell = eElement
      while(eRow && eRow.dataset.type !== "row") {         // Find row for element
         eRow = eRow.parentElement;
      }
      if(eRow === null) return null;

      while(eRow && eRow.dataset.row === undefined) {      // Find main row, holds key to row in table data
         eRow = eRow.parentElement;
      }
      if(eRow === null) return null;
      let iR: number = parseInt( eRow.dataset.line, 10 );  // Line in ui table

      let sSection = this.ELEMENTGetSection(eRow).dataset.section;

      let e = eCell;
      while( e && e.dataset.c === undefined && e.isEqualNode( eRow ) === false ) { // find column ? column is always a child to row element
         e = e.parentElement;
      }

      let iC: number = 0;
      if( e.dataset.c ) iC = parseInt( e.dataset.c, 10 );  // found column ?
      else if( sSection !== "body" ) {                     // not in body ?
         e = eCell;
         e = <HTMLElement>e.previousElementSibling;
         while(e) {
            iC++;
            e = <HTMLElement>e.previousElementSibling;
         }
      }
      else return null;

      if(bData === true) {
         iR = this._row_in_data( iR );
         iC = this._column_in_data( iC );  // if column index should represent index in table data. 
      }

      return [ iR, iC, sSection ];
   }

   HideColumn(iColumn, bAdd?: boolean);
   HideColumn(_1?: any, _2?: any): void {
      let bAdd: boolean = false;
      let aColumn: number[];
      if(typeof _1 === "number") {
         _1 = this._column_in_data( _1 );
         aColumn = [ _1 ];
      }
      else if(Array.isArray(_1)) aColumn = _1;

      if(typeof _2 === "boolean") bAdd = _2;

      if(bAdd === false) {
         this.data.COLUMNSetPropertyValue(true, "position.hide", 0);
      }

      aColumn.forEach((iColumn) => {
         this.data.COLUMNSetPropertyValue(iColumn, "position.hide", 1);
      });
   }

   /**
    * Set cell value to CTableData.
    * Setting values to table data has added logic with triggers. 
    * @param _Row Physical index to row in CTableData
    * @param _Column Physical index to column in CTableData
    * @param value Value set to cell
    * @param {EventDataTable} oTriggerData Trigger information for value
    */
   SetCellValue(_Row: any, _Column: any, value?: unknown, oTriggerData?: EventDataTable) {
      let bOk;
      let iRow: number, iColumn: number;  // index for row and column in UI
      const oTrigger = this.trigger;      // Get trigger object with trigger logic
      if(Array.isArray(_Row) && _Row.length === 2) {
         oTriggerData = value;
         value = _Column;
         [ iRow, iColumn ] = _Row;
      }
      else {
         iRow = _Row;
         iColumn = _Column;
      }

      const iDataRow: number = this._row_in_data(iRow), iDataColumn: number = this._column_in_data(iColumn);  // index for row and column in CTableData, its physical position

      const oColumn = this.data.COLUMNGet(iDataColumn);
      if(oTriggerData) {
         oTriggerData.column = oColumn;
         oTriggerData.data = this.data;
         oTriggerData.dataUI = this;
      }

      if( oTrigger ) { 
         bOk = oTrigger.Trigger( enumTrigger.BeforeValidateValue, oTriggerData, oTriggerData.edit.GetValueStack() ); 
         if( bOk === false ) return;
      }
      let _result = CTableData.ValidateValue( value, oColumn );              // validate value

      // if returning array, check for modified value first. If modified then first value in array isn't boolean and first and second value differs.
      if(Array.isArray(_result) && _result[ 0 ] !== false && _result[ 0 ] !== value) { value = _result[ 0 ]; _result = true; }

      if(_result === true || _result[0] === true ) {
         if( this.m_aValueError.length > 0 ) this.RemoveCellError( iRow, iColumn );// remove error for this value if it was set before
         if( oTrigger ) { bOk = oTrigger.Trigger( enumTrigger.BeforeSetValue, oTriggerData, oTriggerData.edit.GetValueStack() ); }

         if( bOk !== false ) {
            if( this.is_state( enumState.SetHistory ) ) this.data.HISTORYPush( iDataRow,iDataColumn ); // add to history
            let aRow = this.m_aRowBody[iRow];
            aRow[iColumn] = value;                                             // Modify value internally
            this.data.CELLSetValue( iDataRow, iDataColumn, value )             // Set value to cell
            if( this.is_state( enumState.SetDirtyRow ) ) this.data.DIRTYSet( iDataRow ); // Set row as dirty
         }

         if( oTrigger ) { bOk = oTrigger.Trigger( enumTrigger.AfterSetValue, oTriggerData, oTriggerData.edit.GetValueStack() ); }
      }
      else {
         if( oTrigger ) { 
            oTriggerData.information = _result;
            bOk = oTrigger.Trigger( enumTrigger.BeforeSetCellError, oTriggerData, oTriggerData.edit.GetValueStack() ); 
            if( bOk === false ) return;
         }

         if(this.SetCellError(iRow, iColumn, value, _result[ 1 ], oTriggerData) === true) {
            this.data.CELLSetValue(iDataRow, iDataColumn, value);
         }
      }
   }



   SetCellError(_Row?: any, _Column?: any, value?: unknown, type?: unknown, oTriggerData?: EventDataTable): boolean {
      let bSetValue = true;
      if(_Row === void 0) {
         this.m_aValueError = [];
         return;
      }

      let iRow: number, iColumn: number;  // index for row and column in UI
      if(Array.isArray(_Row) && _Row.length === 2) {                           // check for [row, column] parameter
         value = _Column;
         [ iRow, iColumn ] = _Row;
      }
      else {
         iRow = _Row;
         iColumn = _Column;
      }

      let aError: [ number, number, unknown, unknown ];
      let bFound = false;
      let i = this.m_aValueError.length;
      while(--i >= 0 && bFound === false) {
         let aError = this.m_aValueError[i];
         if(aError[ 0 ] === iRow && aError[ 1 ] === iColumn) {
            aError[2] = value;
            aError[3] = type;
            bFound = true;
         }
      }

      if(bFound === false) {
         this.m_aValueError.push([ iRow, iColumn, value, type ]);
         aError = this.m_aValueError[this.m_aValueError.length - 1];
      }

      this.render_value_error();

      return bSetValue;
   }

   RemoveCellError(_Row?: any, _Column?: any) {
      let iRow: number, iColumn: number;  // index for row and column in UI
      if(Array.isArray(_Row)) {
         [ iRow, iColumn ] = _Row;
      }
      else {
         iRow = _Row;
         iColumn = _Column;
      }

      let bFound = false;
      let i = this.m_aValueError.length;
      while(--i >= 0 && bFound === false) {
         let aError = this.m_aValueError[i];
         if(aError[ 0 ] === iRow && aError[ 1 ] === iColumn) {
            bFound = true;
            this.m_aValueError.splice( i, 1 );
            break;
         }
      }

      if(bFound) {
         this.render();
      }
   }

   ERRORGet( _Index?: number | [number] ): [ number, number, unknown, unknown ] | [ number, number, unknown, unknown ][] {
      if( _Index === void 0 ) return this.m_aValueError;
      else if( typeof _Index === "number" ) return this.m_aValueError[_Index];
      else if( Array.isArray(_Index) ) {
         let a = [];
         _Index.forEach( (aError) => { a.push(aError); } );
         return a;
      }

      return null;
   }

   /**
    * Set value error
    * @param {[ number, number, unknown, unknown ] | [ number, number, unknown, unknown ][]} aError 
    */
   ERRORSet(aError: [ number, number, unknown, unknown ] | [ number, number, unknown, unknown ][]) {
      if( aError.length && typeof aError[0] === "number") aError = [ <[ number, number, unknown, unknown ] >aError ];
      this.m_aValueError = <[ number, number, unknown, unknown ][]>aError;
   }

   ERRORGetCount(): number { return this.m_aValueError.length; }


   /** BLOG: firstChild or hasChildNodes to find child nodes. children.length to check elements
    * Render complete table
    * */
   Render( sSection?: string, callback?: ((eSection: HTMLElement, sName: string) => void)): void {
      // return alias and name properties from table data, used for header to column
      if(typeof sSection === "string") {
         if(sSection === "body") {
            this.render_body_restore();
         }

         return;
      }

      let aHeader = <[ string | number, unknown ][]>this.data.COLUMNGetPropertyValue(true, [ "alias", "name" ], (column) => {
         if(column.position.hide) return false;
         return true;
      });

      this.m_aColumnPhysicalIndex = [];
      aHeader.forEach((a:any) => { this.m_aColumnPhysicalIndex.push(a[ 0 ]); });

      this.m_aColumnPosition = [];
      let aPosition: [number,tabledata_position][] = <[number,tabledata_position][] >this.data.COLUMNGetPropertyValue( this.m_aColumnPhysicalIndex, "position" );
      aPosition.forEach( aP => {
         this.m_aColumnPosition.push( aP[1] );
      });

      this.m_aColumnFormat = [];
      let aFormat: [number,tabledata_format][] = <[number,tabledata_format][] >this.data.COLUMNGetPropertyValue( this.m_aColumnPhysicalIndex, "format" );
      aFormat.forEach( aF => {
         this.m_aColumnFormat.push( aF[1] );
      });

      this.m_oRowRows = this.data.GetRowRows();



      this.m_iColumnCount = aHeader.length;                                    // Set total column count
      if( this.m_acallRenderer ) this.COLUMNSetRenderer( this.m_iColumnCount - 1 );// Make sure that array for renders holds as many columns as columns

      const oRowRows = this.m_oRowRows;
      let aHeaderColumns = oRowRows.GetRowColumns();                           // header takes columns from main row
      let a = [];
      for(let i = 0; i < aHeaderColumns.length; i++) {
         a.push( aHeader[ aHeaderColumns[i] ] );
      }
      aHeader = a;


      this.render_header(<[ number, [ string, string ] ][]>aHeader);

      let o: { [key: string]: string|number } = {};
      if( this.m_iRowCountMax >= 0 ) o.max = this.m_iRowCountMax;              // if max rows returned is set

      if(this.m_aInput) { this.m_aInput[ 0 ] = -1; this.m_aInput[ 1 ] = -1; }
      let aBody = this.data.GetData(o);
      this.render_body(aBody, this.create_body(aBody[0]));

      this.render_selected();

      this.INPUTSet();
      if(this.m_aInput && this.m_aInput[0] !== -1) this.render_input();
      if(this.m_aValueError.length) this.render_value_error();
   }

   render() {
      this.create_body()
      this.render_body();
   }

   SetSelected(iRow: number, iColumn: number, bAdd?: boolean): number;
   SetSelected(aCell: [ number, number ], bAdd?: boolean): number;
   SetSelected(aCells: [ number, number ][], bAdd?: boolean): number;
   SetSelected(aFirst: [ number, number ], aLast: [ number, number ], bAdd?: boolean): number;
   SetSelected(_1: any, _2?: any, _3?: any): number {
      let bAdd: boolean = false;
      let bSet = true;
      let aSelect: [ number, number ][] = [];

      if(_1 === void 0) {
         this.m_aSelected = [];
         return 0;
      }

      if(typeof _3 === "boolean") bAdd = _3;
      if(typeof _2 === "boolean") bAdd = _2;

      if(Array.isArray(_2)) {
         if(bAdd === false) this.m_aSelected = [];

         for(let iR: number = _1[ 0 ]; iR <= _2[ 0 ]; iR++) {
            for(let iC: number = _1[ 1 ]; iC <= _2[ 1 ]; iC++) {
               this._set_selected([[iR, iC]], true );
            }
         }
         bSet = false;
      }
      else if(Array.isArray(_1)) {
         if(Array.isArray(_1[ 0 ])) aSelect = _1;
         else aSelect.push(<[ number, number ]>_1);
      }
      else if(typeof _1 === "number" && typeof _2 === "number") aSelect.push([ _1, _2 ]);

      if( bSet ) this._set_selected(aSelect, bAdd);

      return this.m_aSelected.length;
   }

   /**
    * Set sort columns.
    * @param {number | string | [number|string][]} _Sort
    * @param bToggle
    * @param bAdd
    */
   Sort(_Sort?: number | string | [number|string][], bToggle?: boolean, bAdd?: boolean) {
      let aSort = Array.isArray(_Sort) === false ? [ _Sort ] : <[ number | string ][]>_Sort; // if not array then convert to array
      let bOk: boolean;

      const oTrigger = this.trigger;
      if( oTrigger ) { 
         bOk = oTrigger.Trigger(enumTrigger.BeforeSetSort, {iReason: enumReason.Command, dataUI: this }, arguments ); 
         if( bOk === false ) return;
      }


      this.data.COLUMNSetPropertyValue(true, "state.sort", 0);                 // clear sort

      if(_Sort === void 0) { this.m_aOrder = []; return; }                     // clear sort array and return if no sort value

      let aNew: [ number | string, number ][] = [];
      for(let i = 0; i < aSort.length; i++ ) {
         let _Column = aSort[ i ];
         if(typeof _Column === "number") _Column = this._column_in_data( _Column );    // convert to physical index in table data
         let iFind = this.m_aOrder.findIndex((_C) => { return _Column === _C[0]; }) 
         if(iFind === -1) {
            aNew.push([ <number | string>_Column, 1] );
         }
         else {                                                                // is column already sorted, then switch order
            let a = this.m_aOrder[ iFind ];
            a[ 1 ] = -a[ 1 ];
            if(bAdd !== true) { aNew.push(a); }
         }
      }

      if(bAdd === true) this.m_aOrder = this.m_aOrder.concat(aNew);
      else this.m_aOrder = aNew;

      this.m_aOrder.forEach((_Column) => {
         this.data.COLUMNSetPropertyValue(_Column[ 0 ], "state.sort", _Column[ 1 ]);
      })

      if( oTrigger ) { bOk = oTrigger.Trigger( enumTrigger.AfterSetSort, {iReason: enumReason.Command, dataUI: this }, arguments ); }
   }

   Destroy() {
      if(this.m_eComponent) {
         let eComponent = this.m_eComponent;
         this.m_eComponent = null;
         eComponent.parentNode.removeChild(eComponent);
      }
   }

   /**
    * Get number of columns
    * @returns {number} number of visible columns.
    */
   COLUMNGetCount(): number { return this.m_iColumnCount; }

   /**
    * Get column object and index for column in ui table
    * @param {number | string | HTMLElement} _Index
    */
   COLUMNGet(_Index: number | string | HTMLElement): [number, tabledata_column] {
      let iColumn: number;
      if(typeof _Index === "number") {
         iColumn = this._column_in_data( _Index );
      }
      else if(typeof _Index === "string") {
         iColumn = this.data._index( _Index );
      }
      else {
         let aRowCol = this.GetRowCol( _Index );
         if(aRowCol) {
            iColumn = aRowCol[1];
         }
      }

      if( typeof iColumn === "number" && iColumn >= 0 ) return [iColumn, this.data.COLUMNGet( iColumn )];
      return null;
   }


   /**
    * Calculate width for columns
    * @param eSection
    */
   /**
    * Calculate width for columns
    * @param {string} sSectionName section where columns gets width from
    * @param {number|number[]} [_MaxWidth] max width value or width for column if array is sent with numbers
    * @param {number} [iRowCount] number of columns to test width for
    */
   COLUMNCalculateMaxWidth(sSectionName: string, _MaxWidth?: number | number[], iRowCount?: number): number[] {
      let aWidth: number[] = new Array(this.m_iColumnCount);
      aWidth.fill(0);

      let iMaxWidth: number = 0, aMax: number[];
      if(Array.isArray(_MaxWidth)) aMax = _MaxWidth;
      else if(typeof _MaxWidth === "number") iMaxWidth = _MaxWidth;

      let eSection = this.GetSection(sSectionName);
      if(!eSection) return aWidth;                                             // section not found, just return empty array

      let eRow = eSection.firstElementChild;
      while(eRow) {
         let eColumn = <HTMLElement>eRow.firstElementChild;
         let iTo = this.m_iColumnCount;
         for(let i = 0; i < iTo; i++ ) {
            if(aMax) iMaxWidth = aMax[ i ];
            let iWidth: number = <number>eColumn.offsetWidth;
            if(iMaxWidth && iWidth > iMaxWidth) iWidth = iMaxWidth;            // if max width then check for not above

            if(iWidth > aWidth[ i ]) aWidth[ i ] = iWidth;
            eColumn = <HTMLElement>eColumn.nextElementSibling;
         }

         //eRow = eRow.nextElementSibling;
         while( (eRow = eRow.nextElementSibling) !== null && (<HTMLElement>eRow).dataset.record !== "1" );
      }

      return aWidth;
   }

   /**
    * 
    * @param aWidth
    * @param eSection
    */
   COLUMNSetWidth(aWidth: number[], _Section: HTMLElement | string): void {
      let eSection: HTMLElement;
      if(typeof _Section === "string") { eSection = this.GetSection(_Section); }
      else eSection = _Section;
      if(eSection === null) return;
      
      let set_width = (eSection) => {
         let eRow = eSection.firstElementChild;
         while(eRow) {
            let eColumn = <HTMLElement>eRow.firstElementChild;
            let iTo = this.m_iColumnCount;
            for(let i = 0; i < iTo; i++) {
               eColumn.style.width = "" + aWidth[ i ] + "px";
               eColumn = <HTMLElement>eColumn.nextElementSibling;
            }
            eRow = eRow.nextElementSibling;
         }
      };

      let sDisplay = eSection.style.display;
      eSection.style.display = "none";
      set_width(eSection);
      eSection.style.display = sDisplay;
   }

   COLUMNGetRenderer(iIndex: number): details.renderer {
      if( this.m_acallRenderer ) return this.m_acallRenderer[iIndex];
      return null;
   }

   /**
    * Set renderer for column
    * @param {number | string} _Index index to column renderer are set for
    * @param {details.renderer | null } [callback] callback that will render value
    */
   COLUMNSetRenderer(_Index: number | string, callback?: details.renderer | null) {
      let iIndex: number
      if(typeof _Index === "number" ) iIndex = _Index;
      else {
         const i = this.data._index( _Index );                                 console.assert( i !== -1, "no column for: " + _Index );
         iIndex = this._column_in_ui( i );
      }
      if(!this.m_acallRenderer) {
         const iLength = Math.max( this.m_iColumnCount, iIndex + 1 );
         this.m_acallRenderer = new Array(iLength);
      }
      else {
         const iLength = Math.max( this.m_iColumnCount, iIndex + 1 );
         while(this.m_acallRenderer.length < iLength) this.m_acallRenderer.push(null);
      }
      if( callback !== undefined ) this.m_acallRenderer[iIndex] = callback;
   }

   /**
    * Get number of rows displayed in table
    */
   ROWGetCount(): number { return this.m_aRowBody.length; }

   /**
    * Get indexes to new rows in table. New rows has the index -1 set to it, it do not exist in table data source and therefore no matching row
    */
   ROWGetIndexForNew(): number[] { 
      let a: number[] = [];
      let aIndex = this.m_aRowPhysicalIndex;
      let iTo = aIndex.length;
      for(let i = 0; i < iTo; i++) {
         if( aIndex[i] === -1 ) a.push(i);
      }
      return a;
   }

   /**
    * Return values for row in body
    * @param iRow key to row or if bRay it is the physical index
    */
   ROWGet(iRow: number): unknown[] {
      return this.m_aRowBody[ iRow ];
   }

   ROWInsert(iRow: number,_Row?: number | unknown[] | unknown[][]): unknown[][] {
      _Row = _Row || 1;                                     // 1 row is default
      let iCount: number;
      let aRow: unknown[][] = [];
      let aIndex: number[] = [];
      let iColumnCount = this.COLUMNGetCount();

      if(typeof _Row === "number") {
         iCount = _Row;
         for(let i = 0; i < iCount; i++) {
            aRow.push(new Array(iColumnCount));
         }
      }
      else {
         aRow = <unknown[][]>_Row;
         if(aRow.length === 0) return;

         if(Array.isArray(aRow[ 0 ]) === false) aRow = [ aRow ];
         // Prepare rows for insertion
         for(let i = 0; i < aRow.length; i++) {
            let a = aRow[ i ];
            for(let j = a.length; j < iColumnCount; j++) { a.push(null); }
         }
      }

      let i = iCount;
      while( --i >= 0 ) { aIndex.push(-1); }

      // Rows are prepared, time to insert
      this.m_aRowBody.splice(iRow, 0, ...aRow);
      this.m_aRowPhysicalIndex.splice(iRow, 0, ...aIndex);  // Add row index for new rows, these are negative because data do not exist in CTableData
      return aRow;
   }

   ROWValidate( _Row: number | number[] ) : boolean | [ number, number, unknown, unknown ][] {
      let aError: [ number, number, unknown, unknown ][] = [];
      if(typeof _Row === "number") _Row = [ _Row ];
      for(let i = 0; i < _Row.length; i++) {
         const iRow = _Row[i];

         let aRow = this.data.ROWGet( iRow );
         aRow.forEach((_Value, iIndex) => {
            let oColumn = this.data.COLUMNGet( iIndex, false, true );
            let _result = CTableData.ValidateValue( _Value, oColumn );
            if(Array.isArray(_result) === true && _result[0] === false) {      // if error then add it to array with found error values
               let iColumn = this._column_in_ui( iIndex );
               aError.push([ iRow, iColumn, _Value, _result[1] ] );
            }
         });
      }

      return aError.length ? aError : true;
   }



   /**
    * Get parent section element for element sent as argument
    * @param {HTMLElement} eElement element that sections is returned for.
    */
   ELEMENTGetSection(eElement: HTMLElement): HTMLElement {
      while(eElement && eElement.dataset.section === undefined ) {
         eElement = eElement.parentElement;
      }
      if(eElement) return eElement;
      throw "null section, have table been redrawn?";
   }

   /**
    * Tries to get specified row from section. This is done by lookin for elements with the attribute
    * data-record="1". The data-record marks the main row element for each row in table data.
    * @param  {number}             iRow     index for row element returned
    * @param  {string|HTMLElement} _Section section row is looked for
    * @return {HTMLElement}                 row element for specified row if found
    */
   ELEMENTGetRow(iRow: number, _Section?: string|HTMLElement): HTMLElement | [HTMLElement,NodeList] {
      _Section = _Section || "body";
      let eSection = typeof _Section === "string"? this.GetSection(_Section) : _Section;
      let i = iRow;
      let eRow = eSection.firstElementChild;                                   // Position at row

      if( (<HTMLElement>eRow).dataset.record !== "1" ) i++;                     // no row ?
      while(--i >= 0 && eRow) {
         if( (<HTMLElement>eRow).dataset.record !== "1" ) i++;                  // no row ?
         eRow = eRow.nextElementSibling;
      }

      if( (<HTMLElement>eRow).dataset.type !== "row" ) {
         return [<HTMLElement>eRow, eRow.querySelectorAll('[data-type="row"]')];
      }

      return <HTMLElement>eRow;
   }

   /**
    * Return html element for cell
    * @param {[ number, number ]} aRow array with two numbers, row and column index
    * @param {string} [sSection] section cell is returned from
    *//**
    * 
    * @param {nibmer} iRow index for row where cell is located
    * @param {number} iColumn index for column to cell
    * @param {string} [sSection] section cell is returned from
    */
   ELEMENTGetCell(aRow: [ number, number ], sSection?: string): HTMLElement;
   ELEMENTGetCell(iRow: number, iColumn: number, sSection?: string): HTMLElement;
   ELEMENTGetCell(_1: any, _2?: any, _3?: string): HTMLElement {
      let iRow: number, iColumn: number, sSection: string;
      if(typeof _2 === "number") { iColumn = _2; iRow = _1; }
      else if(typeof _2 === "string") sSection = _2;

      if(Array.isArray(_1)) { [ iRow, iColumn ] = _1; }
      sSection = sSection || "body";


      let eSection = this.GetSection(sSection);
      let _Cell = this.ELEMENTGetRow( iRow, eSection );
      if( Array.isArray( _Cell ) === false ) {
         _Cell = <HTMLElement>(<HTMLElement>_Cell).firstElementChild;
         let i = iColumn;
         while(--i >= 0 && _Cell) _Cell = <HTMLElement>(<HTMLElement>_Cell).nextElementSibling;
         return <HTMLElement>_Cell;
      }

      // Find row where cell is found
      const aRow = _Cell[1];
      let i = aRow.length;
      const  sCIndex = "C" + iColumn + ",";
      while( --i >= 0 ) {
         const sColumns = aRow[i].dataset.c_row;
         if( sColumns && sColumns.indexOf( sCIndex ) !== -1  ) {               // found row where column is?
            _Cell = aRow[i].querySelector('[data-c="'+iColumn+'"]');
            return <HTMLElement>_Cell;
         }
      }
                                                            console.assert(false, "You are trying to reach a cell [row: "+iRow+", col:"+iColumn+"] that do not exist in row.")
      return null;
   }

   /**
    * Return value element in cell. Get value element in cell if cell has generated dom tree inside
    * @param {HTMLElement} e Cell element
    * @returns {HTMLElement} element to value or null if not found
    */
   ELEMENTGetCellValue( e: HTMLElement ): HTMLElement {
      if(e && (this.is_state(enumState.HtmlValue) || e.firstElementChild) ) {
         e = e.querySelector("[data-value]") || e;
      }
      return e;
   }


   /**
    * Create input controls
    * @param {boolean} bCreate If true then edit controls is created for columns that are editable
    *//**
    * Initialize (or reinitialize) edit logic for UITableText
    * @param {CTableData} [oTableData] Table data used to initialize edit controls with
    * @param {boolean} [bCreate] if elements is created for edit controls
    */
   INPUTInitialize(bCreate?: boolean): void
   INPUTInitialize(oTableData?: CTableData, bCreate?: boolean): void;
   INPUTInitialize(_1?: any, _2?: any): void {
      const bCreate: boolean = typeof _1 === "boolean" ? _1 : _2 || true;       // default is to create
      if(typeof _1 === "object" || _1 === void 0) {
         let oTableData = _1 || this.data;
         if(!this.m_oEdits) this.m_oEdits = new edit.CEdits({ table: oTableData });
         else this.m_oEdits.data = this.data;
      }
      
      this.m_oEdits.Initialize(bCreate, bCreate ? this.GetSupportElement() : null);
   }

   /**
    * Set active input cell. Only one input cell can be active at any time.
    * @param {number} iR row index in ui
    * @param {number} iC column index in ui
    *//**
    * Set active input cell. Only one input cell can be active at any time.
    * @param {[ number, number]} aRC array with first position is row index and second position is column index
    *//**
    * Calling INPUTSet with no parameter will try to update input position from position in table data
    */
   INPUTSet(iR: number, iC: number): void;
   INPUTSet(aRC: [ number, number] ): void;
   INPUTSet(): void;
   INPUTSet(_1?: any, iC?: number): void {
      if(Array.isArray(_1)) {
         iC = _1[ 1 ]; // set column first because when setting row the array is destroyed
         _1 = _1[ 0 ];
      }
      else if(_1 === undefined) {
         if( !this.m_aInput || this.m_aInput[3] === -1 ) return;              // if no input or if row in table data is -1 then no active input and just skip this.

         const iR = this._row_in_ui(this.m_aInput[ 3 ]);
         if(iR === -1) { this.m_aInput = null; return;  }

         this.m_aInput[ 0 ] = iR
         this.m_aInput[ 1 ] = this._column_in_ui( this.m_aInput[4] );
         this.m_aInput[ 2 ] = this.ELEMENTGetCell( <[number,number]><unknown>this.m_aInput );
         return;
      }

      const a: [ number, number, HTMLElement, number, number ] = [_1, iC, this.ELEMENTGetCell(_1, iC), this._row_in_data(_1), this._column_in_data(iC) ];

      let oTD: EventDataTable;
      const oTrigger = this.trigger;                                           // Get trigger object with trigger logic
      if( oTrigger ) { 
         oTD = this._get_triggerdata();
         oTD.eElement = a[2];
         oTD.iEvent = enumTrigger.BeforeSelect;
         oTD.information = a;
         const bOk = oTrigger.Trigger( enumTrigger.BeforeSelect, oTD, a ); 
         if( bOk === false ) return;
      }

      this.m_aInput = a;

      if( oTrigger ) { 
         oTD.iEvent = enumTrigger.AfterSelect;
         oTrigger.Trigger( enumTrigger.AfterSelect, oTD, a ); 
      }
   }

   INPUTMove(e: enumMove, bRender?: boolean) {
      let [ iR, iC ] = this.m_aInput;

      if(e < enumMove.page_up) {
         switch(e) {
            case enumMove.left: iC--; break;
            case enumMove.right: iC++; break;
            case enumMove.up: iR--; break;
            case enumMove.down: iR++; break;
         }
      }
      else {
         if(e === enumMove.begin) { iC = 0; iR = 0; }
         else if(e === enumMove.end) { iC = this.m_iColumnCount - 1; iR = this.m_iRowCount - 1; }
         else if(e === enumMove.page_up) { iR -= this.m_iRowCount; }
         else if(e === enumMove.page_down) { iR += this.m_iRowCount; }
      }

      if(iC < 0) iC = 0;
      else if(iC >= this.m_iColumnCount) iC = this.m_iColumnCount - 1;

      if(iR < 0) iR = 0;
      else if(iR >= this.m_iRowCount) iR = this.m_iRowCount - 1;

      //let eElement = this.ELEMENTGetCell(iR,iC);
      //this.m_aInput = [ iR, iC, eElement ];
      if( e !== enumMove.validate ) this.INPUTSet( iR, iC );

      if(bRender === true) this.Render("body");
   }

   /*
   INPUTActivate() {
      let iRow = this._row_in_data(this.m_aInput[ 0 ]);
      let iColumn = this._column_in_data(this.m_aInput[ 1 ]);
      this.edits.Activate(iRow, iColumn, this.m_aInput[ 2 ]);
   }
   */

   /**
    * Activate input fields or field for selected row or cell.
    * If cell doesn't have the edit property set it can be edited and no activation is done for that cell
    * @param {number} iRow Row number where input is activated
    * @param {number | number[]} [_Column] Column where inputs are activated, if no column than all inputs for selected row is activated
    */
   INPUTActivate(_Row?: number|boolean, _Column?: number | number[], bInput?: boolean) {
      let iRow: number;
      if( typeof _Row === "boolean") {
         bInput = _Row;
         _Row = void 0;
      }
      if(_Row === void 0) {
         iRow = this.m_aInput[0];
         _Column = this.m_aInput[1];
      }
      else if( typeof _Row === "number") iRow = _Row;

      let aColumn: number[] = [];
      if(_Column === void 0) {                                                 // No column then activate complete row
         let aValue = <unknown[]>this.data.COLUMNGetPropertyValue(true, "edit.edit", (C) => { return C?.edit?.edit === true; }); // get editable columns
         aValue.forEach(aIndex => { aColumn.push(this._column_in_ui(aIndex[ 0 ])); });// convert column in table data to column in table text and add to array.
      }

      let iDataRow: number = this._row_in_data(iRow);
      
      let iColumn: number;
      if(typeof _Column === "number") {
         iColumn = _Column;
         aColumn = [ _Column ];
      }

      aColumn.forEach(iC => {
         let iDataColumn = this._column_in_data(iC);
         let oEdit = this.m_oEdits.GetEdit(iDataColumn);
         if(oEdit !== null) {
            let eCell = this.ELEMENTGetCell(iRow, iC);
            if(this.is_state(enumState.HtmlValue) || eCell.firstElementChild) {
               let e = eCell.matches("[data-value]") || eCell.querySelector("[data-value]");// try to find element with attribute data-value
               eCell = <HTMLElement>e || eCell;
            }
            this.m_oEdits.Activate([ iDataRow, iDataColumn, iRow, iC], eCell);
            this.m_iOpenEdit++;                                                // One more edit open
         }
      });
      
      if(bInput === true) this.INPUTSet( iRow, iColumn );
   }

   INPUTDeactivate(_Row?: number|boolean, _Column?: number | number[]): number {
      let iCount = 0;
      if(_Row === void 0) {

      }

      if(this.m_oEdits) {
         if( _Row === false ) this.m_oEdits.Deactivate( false );
         iCount = this.m_oEdits.Deactivate();
         if( iCount !== -1 ) this.m_iOpenEdit = 0;                             // Edit controls closed, set to 0
      }

      return iCount;
   }

   // 
   // Element creation and render methods ---------------------------------------------------------
   //

   /**
    * Render header for table
    * @param aHeader
    */
   render_header(aHeader: [ number, [ string, string ] ][]): HTMLElement {
      let eSection = this.GetSection("header", true);
      if( !eSection ) return null;

      this.create_header(aHeader);
      if( !eSection ) return null;

      let bCall = this._has_render_callback( "askHeaderValue", "header" );

      let eRow = <HTMLElement>eSection.firstElementChild;
      eRow.dataset.row = "0";
      eRow.dataset.line = "0";
      if( eRow.dataset.type !== "row" ) {
         eRow = eRow.querySelector('[data-type="row"]');    console.assert( eRow !== null, "No row element for header cells." ); 
      }
      let eSpan: HTMLElement = <HTMLElement>eRow.firstElementChild;
      const iCount = aHeader.length;
      for( let i = 0; i < iCount; i++ ) {
         const aName = aHeader[i][1];

         if( bCall ) { 
            let bRender = true;
            for(let j = 0; j < this.m_acallRender.length; j++) {
               let b = this.m_acallRender[j].call(this, "beforeHeaderValue", aName, eSpan, this.data.COLUMNGet( this._column_in_data( i ) ) );
               if( b === false ) bRender = false;
            }
            if( bRender === false ) continue;
         }

         if( eSpan ) {
            eSpan.innerText = aName[ 0 ] || aName[ 1 ];    // alias or name
            eSpan.title = eSpan.innerText;
            eSpan.dataset.c = aHeader[i][0].toString();    // set column index
            if( bCall ) this.m_acallRender.forEach((call) => { call.call(this, "afterHeaderValue", aName, eSpan, this.data.COLUMNGet( this._column_in_data( i ) ) ); });
            eSpan = <HTMLElement>eSpan.nextElementSibling;
         }

      }

      return eSection;
   }


   /**
    * Render body, body is where values from table are shown
    * @param {[ unknown[][], number[] ]} aResult Result is a two array values in array. First is 
    *        result and second is index to physical row in result.
    */
   render_body(aResult?: [ unknown[][], number[] ], eSection?: HTMLElement);
   render_body(bUpdate: boolean, eSection?: HTMLElement)
   render_body(_1: any, eSection?: HTMLElement ) {
      eSection = eSection || this.GetSection("body");
      let aResult: [ unknown[][], number[] ];
      //let sClass: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "class_value") || "";
      let aStyle = <unknown[]>this.data.COLUMNGetPropertyValue(this.m_aColumnPhysicalIndex, "style"); // position data for columns
      const bSetValue = this.is_state( enumState.SetValue );                    // If try to set value for html element, when you have INPUT elements in column.

      if( Array.isArray( _1 ) ) {
         aResult = <[ unknown[][], number[] ]>_1;
         this.SetCellError();                                                  // clear errors
         this.m_aRowBody = aResult[ 0 ];                                       // keep body data
         this.m_aRowPhysicalIndex = aResult[ 1 ];                              // keep index to rows
      }

      if(eSection === null) return;
      let bCall = this._has_render_callback( "askCellValue", "body" );

      let eRow = <HTMLElement>eSection.firstElementChild;
      if( eRow === null ) return;
      if(eRow.dataset.record !== "1") {
         while( (eRow = <HTMLElement>eRow.nextElementSibling) !== null && (<HTMLElement>eRow).dataset.record !== "1" ); console.assert(eRow !== null, "No rows to render body")
      }

      const oRowRows = this.m_oRowRows;

      this.m_aRowBody.forEach((aRow, iIndex: number) => {
         let iRow = this.m_aRowPhysicalIndex[ iIndex ], s, o;
         let eR = eRow;                                    // eRow is the main row, but row could hold many child rows with values
         eR.dataset.row = iRow.toString();
         eR.dataset.line = iIndex.toString();
         for(let iR = 0; iR < oRowRows.length; iR++ ) {

            if(eR.dataset.type !== "row") {
               eR = eR.querySelector('[data-i="' + iR.toString() + '"]'); console.assert(eR !== null, "No row element for column cells.");
            }
            else { // rows is not places in a container, just go to next or previous row to get rows for record
               const iRowElement = parseInt(eR.dataset.i, 10);
               if(iRowElement !== iR) {                                        // are we not at the same row as current row in CRowRows ?
                  if(iR < iRowElement) {                                       // do we have rows inserted before main record row ?  (iRowElement for record is then over 0)
                     while((eR = <HTMLElement>eR.previousElementSibling) !== null && (<HTMLElement>eR).dataset.i !== iR.toString());
                  }
                  else {
                     while((eR = <HTMLElement>eR.nextElementSibling) !== null && (<HTMLElement>eR).dataset.i !== iR.toString());
                  }
               }
            }

            const aColumn = oRowRows.GetRowColumns( iR );
            let eColumn: HTMLElement = <HTMLElement>eR.firstElementChild;
            const iTo = aColumn.length;
            for(let i = 0; i < iTo; i++) {
            //aColumn.forEach(iC => { 
               const iC = aColumn[i];                                          // index to column in table data
               let e = this.ELEMENTGetCellValue(eColumn);                      // get cell value element
               let sValue = aRow[ iC ];                                        // value for active cell
               const oColumn = this.data.COLUMNGet( this._column_in_data( i ) );
               const callRenderer = this.COLUMNGetRenderer( i );               // get renderer for cell if custom rendering

               if( bCall ) { 
                  let bRender = true;
                  for(let j = 0; j < this.m_acallRender.length; j++) {
                     let b = this.m_acallRender[j].call(this, "beforeCellValue", sValue, eColumn, oColumn );
                     if( b === false ) bRender = false;
                  }
                  if( bRender === false ) continue;
               }

               if(Object.keys(aStyle[ iC ][1]).length > 0) Object.assign(e.style, aStyle[ iC ][1]);

               if( bSetValue === false ) {
                  if(callRenderer) {
                     callRenderer.call( this, e, sValue, [[iIndex, i],[iRow,iC], oColumn] );// custom render for column
                  }
                  else if(sValue !== null && sValue != void 0) e.innerText = sValue.toString();
                  else if( e.hasAttribute("value") === false ) e.innerText = " ";
               }
               else {
                  if(callRenderer) {
                     callRenderer.call( this, e, sValue, [[iIndex, i],[iRow,iC], oColumn] );// custom render for column
                  }
                  else if(sValue !== null && sValue != void 0) {
                     if("value" in e) { (<HTMLElement>e).setAttribute("value", sValue.toString()); }
                     else e.innerText = sValue.toString();
                  }
                  else if( e.hasAttribute("value") === false ) e.innerText = " ";
               }

               if(bCall) this.m_acallRender.forEach((call) => { call.call(this, "afterCellValue", sValue, eColumn, oColumn); });

               eColumn = <HTMLElement>eColumn.nextElementSibling;
            }
         } 

         while( (eRow = <HTMLElement>eRow.nextElementSibling) !== null && (<HTMLElement>eRow).dataset.record !== "1" ); // go to next sibling root row
      });

      /*
      this.m_aRowBody.forEach((aRow, iIndex: number) => {
         let iRow = this.m_aRowPhysicalIndex[ iIndex ], s, o;
         let eR = eRow;                                    // eRow is the main row, but row could hold many child rows with values
         eR.dataset.row = iRow.toString();
         if( eR.dataset.type !== "row" ) {
            eR = eR.querySelector('[data-type="row"]');     console.assert( eR !== null, "No row element for column cells." ); 
         }
         let eColumn: HTMLElement = <HTMLElement>eR.firstElementChild;
         for(var i = 0; i < this.m_iColumnCount; i++) {
            // const oColumn = this.data.COLUMNGet( this._column_in_data( i ) );
            const oPosition = this.m_aColumnPosition[ i ];
            let sValue = aRow[ i ];
            if( bCall ) { 
               let bRender = true;
               for(let j = 0; j < this.m_acallRender.length; j++) {
                  let b = this.m_acallRender[j].call(this, "beforeCellValue", sValue, eColumn, oPosition );
                  if( b === false ) bRender = false;
               }
               if( bRender === false ) continue;
            }
            
            if( !oPosition.row ) {                                              // place value on record row ?
               let e = this.ELEMENTGetCellValue(eColumn);                       // get cell value element
               if(sClass) e.classList.add(sClass);                              //
               if(Object.keys(aStyle[ i ][1]).length > 0) Object.assign(e.style, aStyle[ i ][1]);

               if( bSetValue === false ) {
                  if(sValue !== null && sValue != void 0) e.innerText = sValue.toString();
                  else if( e.hasAttribute("value") === false ) e.innerText = " ";
               }
               else {
                  if(sValue !== null && sValue != void 0) {
                     if("value" in e) { (<HTMLElement>e).setAttribute("value", sValue.toString()); }
                     else e.innerText = sValue.toString();
                  }
                  else if( e.hasAttribute("value") === false ) e.innerText = " ";
               }

               if(bCall) this.m_acallRender.forEach((call) => { call.call(this, "afterCellValue", sValue, eColumn, oPosition); });
               eColumn = <HTMLElement>eColumn.nextElementSibling;                 // next column element in row
            }

         }
         while( (eRow = <HTMLElement>eRow.nextElementSibling) !== null && (<HTMLElement>eRow).dataset.record !== "1" ); // go to next sibling root row
      });
      */
      return eSection;
   }

   /**
    * Restore states for each cell in body.
    * If there are changes to cells in body. new cells are selected, there are errors etc. Classes that marks
    * the state for each cell needs to be updated. This method do not change any value in cell but restore
    * cell states to display active state for each cell.
    */
   render_body_restore() {
      //let _Selected: string | string[] = 
      let aClass: string[] = [];
      let a = <string | string[]>CTableData.GetPropertyValue(this.m_oStyle, false, "class_cell_input") 
      if( a ) {
         if( typeof a === "string" ) aClass.push( a );
         else aClass.push(...a);
      }

      a = <string | string[]>CTableData.GetPropertyValue(this.m_oStyle, false, "class_selected") 
      if( a ) {
         if( typeof a === "string" ) aClass.push( a );
         else aClass.push(...a);
      }

      let eSection = this.GetSection("body", true);
      if( eSection === null ) return;
      let eRow = <HTMLElement>eSection.firstElementChild;
      
      while(eRow && (<HTMLElement>eRow).dataset.record === "1") {
         let aRow = [eRow];
         if( eRow.dataset.type !== "row" ) {
            aRow = <HTMLElement[]><unknown>eRow.querySelectorAll('[data-type="row"]');  
         }

         aRow.forEach( eR => {
            let eColumn: HTMLElement = <HTMLElement>eR.firstElementChild;
            while(eColumn) {
               let e = this.ELEMENTGetCellValue(eColumn);
               aClass.forEach(s => { e.classList.remove(s); });

               eColumn = <HTMLElement>eColumn.nextElementSibling;
            }
         });

         eRow = <HTMLElement>eRow.nextElementSibling;
      }

      this.render_selected();
      if(this.m_aValueError.length) this.render_value_error();
      if(this.m_aInput) this.render_input();

      return;
   }


   /**
    * Render value in cell. Cell value is taken from table data
    * @param {number | number[]} _Row Index to row or array with index for row and column
    * @param {number} [iColumn] Index to column. if `_Row` is array then iColumn isn't used
    */
   render_value(_Row: number | number[], iColumn?: number) {
      if(Array.isArray(_Row)) [ _Row, iColumn ] = _Row;
      let sClass: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "class_value") || "";
      let eElement = this.ELEMENTGetCellValue( this.ELEMENTGetCell(_Row, iColumn) );

      let sValue = this.data.CELLGetValue(this._row_in_data(_Row), this._column_in_data(iColumn));

      let bValue = false;
      const s = eElement.tagName;
      if(s === "INPUT" || s === "TEXTAREA" || s === "METER") bValue = true;

      const callRenderer = this.COLUMNGetRenderer( iColumn );

      if(callRenderer) {
         const iDataColumn = this._column_in_data(iColumn);
         const oColumn = this.data.COLUMNGet( this._column_in_data( iDataColumn ) );
         callRenderer.call( this, eElement, sValue, [[_Row, iColumn],[this._row_in_data(_Row),iDataColumn], oColumn] );// custom render for column
      }
      else if(sValue !== null && sValue != void 0) {
         if(bValue) { (<HTMLElement>eElement).setAttribute("value", sValue.toString()); }
         else eElement.innerText = sValue.toString();
      }
      else {
         const s = eElement.tagName;
         if(bValue) { (<HTMLElement>eElement).setAttribute("value", ""); }
         else eElement.innerText = " ";
      }
   }

   /**
    * Render selected cell or cells
    * @param {[number,number][]} [aSelected] Cells to select or if not specified then internal selected cell if any is rendered as selected.
    */
   render_selected(aSelected?: [number,number][]) {
      aSelected = aSelected || this.selected;
      if(aSelected.length === 0) return;

      let sStyle: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "cell_selected") || "";      // style
      let sClass: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "class_cell_selected") || "";// class

      aSelected.forEach((a) => {
         let e = this.ELEMENTGetCell(a);
         if(e) {
            if(sStyle) e.style.cssText = sStyle;
            if(sClass) e.className = sClass;
         }
      });
   }

   render_input(): void {
      this.INPUTMove(enumMove.validate);

      let sClass: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "class_cell_input") || <string>CTableData.GetPropertyValue(this.m_oStyle, false, "class_selected");


      if(sClass) {
         this.ELEMENTGetCellValue( this.m_aInput[ 2 ] ).classList.add(sClass);
      }

   }

   render_value_error( aValueError?: [ number, number, unknown, unknown ] | [ number, number, unknown, unknown ][] ) {
      let oColumn: tabledata_column;
      if(Array.isArray(aValueError)) {
         if( Array.isArray( aValueError[ 0 ] ) === false ) aValueError = <[ number, number, unknown, unknown ][]>[ aValueError ];
      }
      else aValueError = this.m_aValueError;
      const iErrorLLength = aValueError.length;
      let sClass: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "class_error");// cell class for error
      let sClassValue: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "class_value_error");// value class for error
      if(sClass || sClassValue) {

         let bCall = this._has_render_callback( "askErrorValue", "body" );     // ask for external render calls

         let aClass = sClass ? sClass.split(" ") : null;
         let aClassValue = sClassValue ? sClassValue.split(" ") : null;
         for(let i = 0; i < iErrorLLength; i++) {
            let bRender = true;
            const aError = <[ number, number ]><unknown>aValueError[ i ];
            let eCell = this.ELEMENTGetCell(aError, "body" );

            if(bCall) {                                                        // external rendering ?
               oColumn = this.data.COLUMNGet( this._column_in_data( aError[ 1 ] ) );
               for(let j = 0; j < this.m_acallRender.length; j++) {
                  let b = this.m_acallRender[j].call(this, "beforeErrorValue", aError, eCell, oColumn );
                  if( b === false ) bRender = false;
               }
               if( bRender === false ) continue;
            }

            if(sClass && eCell.classList.contains(aClass[ 0 ]) === false) {    // compare if first class in array is set to element
               //eCell.className += " " + sClass;
               eCell.className = (eCell.className + " " + sClass).trim();

            }

            if(aClassValue && this.is_state(enumState.HtmlValue)) {
               let e = this.ELEMENTGetCellValue(eCell);
               if(e && e.classList.contains(aClassValue[ 0 ]) === false) {
                  e.className = (e.className + " " + sClassValue).trim();
               }
            }

            // external rendering?
            if( bCall ) this.m_acallRender.forEach((call) => { call.call(this, "afterErrorValue", aError, eCell, oColumn ); });
         }
      }
   }



   /**
    * Creates section elements for parts used by `CUITableText`.
    * Sections rendered are found in member m_aSection
    * @param {HTMLElement} [eComponent] Container section
    */
   create_sections(eComponent?: HTMLElement): HTMLElement {
      eComponent = eComponent || this.m_eComponent;

      let self = this;

      // local function used to append sections
      let append_section = (eComponent: HTMLElement, sName: string, sClass: string): [string, HTMLElement] => {
         let eParent = eComponent;
         let aSection = sName.split(".");                                      // if section name is split with . then it is grouped, name before . creates div group
         if(aSection.length === 2) {                                           // found group name ?
            let sHtmlGroup: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "html_group") || "div";
            let aGroup = sHtmlGroup.split("."), sClass;
            if( aGroup.length > 1 ) { sHtmlGroup = aGroup[0]; sClass = aGroup[1]; } // found class name in group element?
            sName = aSection[ 1 ];
            let sGroup = aSection[ 0 ];                                        // get group name
            let eGroup = <HTMLElement>eComponent.querySelector(sHtmlGroup + "[data-group='" + sGroup + "']");
            if(eGroup === null) {                                              // is group not created ?
               eGroup = document.createElement(sHtmlGroup);
               if( sClass ) eGroup.className = sClass;
               eGroup.dataset.group = sGroup;
               eParent.appendChild(eGroup);                                    // add group to parent
            }
            eParent = eGroup;                                                  // group is parent to section
         }

         let _HtmlSection: string|string[] = "section";                        // default section element name is "section"
         switch(sName) {
            case "header": _HtmlSection = <string|string[]>CTableData.GetPropertyValue(this.m_oStyle, false, "html_section_header") || _HtmlSection; break;
            case "body": _HtmlSection = <string|string[]>CTableData.GetPropertyValue(this.m_oStyle, false, "html_section_body") || _HtmlSection; break;
            case "footer": _HtmlSection = <string|string[]>CTableData.GetPropertyValue(this.m_oStyle, false, "html_section_footer") || _HtmlSection; break;
         }

         const aSectionElement = this._create_section( _HtmlSection, sName );
         let eSection = aSectionElement[1];
//         let eSection = document.createElement(sHtmlSection);                  // create section
//         eSection.dataset.section = sName;                                     // set section name, used to access section
//         eSection.dataset.widget = CUITableText.s_sWidgetName;
         
         if(sName === "body") eSection.tabIndex = -1;                          // tab index on body to enable keyboard movement

         let a = sClass.split(" ");
         a.push(CUITableText.s_sWidgetName + "-" + sName);
         eSection.classList.add( ...a );

         // configure event listeners
         eSection.addEventListener("click", (e: MouseEvent) => {
            let eSink: HTMLElement = <HTMLElement>e.currentTarget;
            while(eSink && eSink.tagName !== "SECTION" && eSink.dataset.widget !== CUITableText.s_sWidgetName) eSink = eSink.parentElement;
            if(!eSink) return;

            self._on_action("click", e, eSink.dataset.section);
         });

         if(sName === "body") {                                                // body section has more event listeners
            // configure event listeners
            eSection.addEventListener("keydown", (e: KeyboardEvent) => {
               let eSink: HTMLElement;
               if( (<any>e.target).tagName === "INPUT" || (<any>e.target).tagName === "TEXTAREA") {
                  let oEdit = this.m_oEdits.GetEdit( (<HTMLElement>e.target) );// try to get edit object for edit element
                  if(!oEdit || oEdit.IsMoveKey(e.keyCode) === false) { return; }
                  eSink = self.m_aInput[2];
               }
               else eSink = <HTMLElement>e.currentTarget;

               while(eSink && eSink.dataset.section === undefined && eSink.dataset.widget !== CUITableText.s_sWidgetName) eSink = eSink.parentElement;
               if(!eSink) return;

               self._on_action("keydown", e, eSink.dataset.section);
            }, true);

            eSection.addEventListener("focus", (e: FocusEvent) => {
               let eElement =  <HTMLElement>e.srcElement; 

               if(eElement.tagName === "INPUT") {
                  const a = this.GetRowCol( eElement );
                  if( this.m_aInput[0] === a[0] && this.m_aInput[1] === a[1] ) return;              // no need to set input if same as active input

                  let oEdit = this.m_oEdits.GetEdit( eElement );// try to get edit object for edit element

                  if( oEdit ) self.INPUTSet( oEdit.GetPositionRelative() );
               }

               let eSink: HTMLElement = <HTMLElement>e.currentTarget;
               while(eSink && eSink.dataset.section === undefined && eSink.dataset.widget !== CUITableText.s_sWidgetName) eSink = eSink.parentElement;
               if(!eSink) return;

               self._on_action("focus", e, eSink.dataset.section);
            }, true);

            eSection.addEventListener("focusout", (e: FocusEvent) => {
               let eSink: HTMLElement = <HTMLElement>e.currentTarget;
               while(eSink && eSink.dataset.section === undefined && eSink.dataset.widget !== CUITableText.s_sWidgetName) eSink = eSink.parentElement;
               if(!eSink) return;

               self._on_action("focusout", e, eSink.dataset.section);
            });

            // configure event listeners
            eSection.addEventListener("dblclick", (e: MouseEvent) => {
               let eSink: HTMLElement = <HTMLElement>e.currentTarget;
               while(eSink && eSink.dataset.section === undefined && eSink.dataset.widget !== CUITableText.s_sWidgetName) eSink = eSink.parentElement;
               if(!eSink) return;

               self._on_action("dblclick", e, eSink.dataset.section);
            });

            eSection.addEventListener("change", (e: Event) => {
               let eSink: HTMLElement;
               if( (<any>e.target).tagName === "INPUT" || (<any>e.target).tagName === "SELECT") {
                  let oEdit = this.m_oEdits.GetEdit( (<HTMLElement>e.target) );// try to get edit object for edit element
                  if(oEdit && (<HTMLElement>e.target).matches("[data-commit]")) {
                     oEdit.SetValue( e.target );
                     if(oEdit.IsModified()) {
                        let _Value = oEdit.GetValue( true );
                        this.SetCellValue(oEdit.GetPositionRelative(), _Value, { iReason: enumReason.Edit, edit: oEdit, eElement: <HTMLElement>e.target, browser_event: "change" });
                     }
                  }
               }
               else eSink = <HTMLElement>e.currentTarget;

               while(eSink && eSink.dataset.section === undefined && eSink.dataset.widget !== CUITableText.s_sWidgetName) eSink = eSink.parentElement;
               if(!eSink) return;

               self._on_action("change", e, eSink.dataset.section);
            }, true);

         }

         let bOk = this._has_create_callback("afterCreate", {data: this.data, dataUI: this, eElement: eSection }, sName );
         if( bOk !== false ) eParent.appendChild(eSection);

         return [sName, eSection];
      };

      let sClass: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "class_section") || CUITableText.s_sWidgetName;

      // Create elements for sections that do not have elements stored
      for(let i = 0; i < this.m_aSection.length; i++) {
         let _Name = this.m_aSection[ i ];
         if(typeof _Name === "string") { this.m_aSection[ i ] = append_section(eComponent, _Name, sClass); }
      }



      return eComponent;
   }

   /**
    * Create header element with columns
    * @param aHeader
    */
   create_header(aHeader: [ number, [ string, string ] ][], callback?: ((eSpan: HTMLElement, sSection: string) => void)): HTMLElement {
      let eSection = this.GetSection("header", true);
      if(eSection === null) return null;

      eSection.innerHTML = "";                                                 // clear section

      let sClass: string;
      let iCount = aHeader.length;
      let _HtmlRow = <string|string[]>CTableData.GetPropertyValue(this.m_oStyle, false, "html_row_header") || <string>CTableData.GetPropertyValue(this.m_oStyle, false, "html_row") || "div";
      let sStyle: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "header") || "";
      let sHtml: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "html_cell_header");
      if(!sHtml) sHtml = "span";
      else {
         let a = sHtml.split(".");
         if(a.length > 1) [ sHtml, sClass ] = a;
      }
      
      let aRow = this._create_row( _HtmlRow );
      aHeader.forEach((a, i) => {
         let eSpan = document.createElement(sHtml);
         eSpan.style.cssText = sStyle;
         if(sClass) eSpan.className = sClass;
         aRow[1].appendChild(eSpan);
      });

      eSection.appendChild(aRow[0]);
      return eSection;
   }

   /**
    * Create body, body is the section that displays values from table data. Tables are shown as rows with vales for each value in table
    * @param {unknown[][]} aBody value data that elements are created for
    */
   create_body(aBody?: unknown[][]): HTMLElement {
      aBody = aBody || this.m_aRowBody;      
      let eSection = this.GetSection("body", true);
      if(eSection === null) return null;
      eSection.innerHTML = "";                                                 // clear body
      this.m_iRowCount = aBody.length;                                         // set number of rows in body
      if(this.m_iRowCount === 0) return eSection;                              // no rows, just skip  creation

      let sClass: string;
      let sStyle: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "value") || null;
      let _HtmlRow = <string|string[]>CTableData.GetPropertyValue(this.m_oStyle, false, "html_row_body") || <string>CTableData.GetPropertyValue(this.m_oStyle, false, "html_row") || "div";
      let _HtmlBefore = <string|string[]>CTableData.GetPropertyValue(this.m_oStyle, false, "html_row_body_before") || _HtmlRow;
      let _HtmlAfter = <string|string[]>CTableData.GetPropertyValue(this.m_oStyle, false, "html_row_body_after") || _HtmlRow;
      let _HtmlContainer = <string|string[]>CTableData.GetPropertyValue(this.m_oStyle, false, "html_row_body_container"); // if row is more than one row this could be used to group rows within container element
      let sHtmlCell: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "html_cell") || "span"; // span is default for cell
      let sHtmlValue: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "html_value");
      if( typeof sHtmlValue === "string" ) sHtmlValue = sHtmlValue.trim();
      this.set_state( sHtmlValue, enumState.HtmlValue );                       // set state if cell is a dom tree or not
      if(!sHtmlCell) sHtmlCell = "span";                                       // span is default element for values
      if( sHtmlCell.indexOf(".") !== -1 ) {
         let a = sHtmlCell.split(".");
         if(a.length > 1) [ sHtmlCell, sClass ] = a;                           // element for value, this can be element name and class if format is in "element_name.class_names" like "span.value".
      }

      let set_row_attr = (eRow: HTMLElement, iRow: number, aColumn: number[], sCell: string, sValue: string, sStyle: string, sClass: string ) => {
         eRow.dataset.r = iRow.toString();
         eRow.dataset.c_row = "C" + aColumn.join(",C") + ",";

         aColumn.forEach((i,j) => { 
            if( i === undefined ) i = j;
            let e = document.createElement(sHtmlCell);
            e.dataset.c = i.toString();
            const oFormat = this.m_aColumnFormat[i];
            if( typeof oFormat.html === "string" ) e.innerHTML = oFormat.html;
            else if( sHtmlValue ) e.innerHTML = sHtmlValue;
            if(sStyle) e.style.cssText = sStyle;
            eRow.appendChild( e );
         });
      };


      // ## oRowRows is a temporary CRowRows object used to make it easier to create the markup tree for row in browser
      const oRowRows = this.m_oRowRows || this.data.GetRowRows();              // get temporary CRowRows object, do not store this. Works only as CTableData isn't modified

      let eFragment = document.createDocumentFragment();                       // fragment used to collect markup that is added to table, markup is cloned into page
      let eContainer: HTMLElement | DocumentFragment;
      let aRowMain = this._create_row( _HtmlRow );
      let aContainer: [HTMLElement, HTMLElement];
      if(_HtmlContainer) {
         aContainer = this._create_container( _HtmlContainer );
         eContainer = aContainer[1];
         eFragment.appendChild( aContainer[0] );
      }
      else { eContainer = eFragment; }                                         // rows without container, set container to fragment

      let iLevelIndex = 0;
      const aRowLevel = oRowRows.GetRowLevel();

      while( aRowLevel[ iLevelIndex ] < 0 ) {                                  // rows before main row
         let aRow = this._create_row( _HtmlBefore );
         oRowRows.SetRowElement( iLevelIndex, aRow[1] );
         set_row_attr( aRow[1], aRowLevel[ iLevelIndex ], oRowRows.GetRowColumns(iLevelIndex), sHtmlCell, sHtmlValue, sStyle, sClass );
         aRow[1].dataset.i = iLevelIndex.toString();
         iLevelIndex++;
      }

      oRowRows.SetRowElement( iLevelIndex, aRowMain[1] );                      // main row
      set_row_attr( aRowMain[1], aRowLevel[ iLevelIndex ], oRowRows.GetRowColumns(iLevelIndex), sHtmlCell, sHtmlValue, sStyle, sClass );
      aRowMain[1].dataset.i = iLevelIndex.toString();
      iLevelIndex++;

      if(aRowLevel[ iLevelIndex ] > 0) {                                       // rows after main row
         let aRow = this._create_row( _HtmlAfter );
         oRowRows.SetRowElement( iLevelIndex, aRow[1] );
         set_row_attr( aRow[1], aRowLevel[ iLevelIndex ], oRowRows.GetRowColumns(iLevelIndex), sHtmlCell, sHtmlValue, sStyle, sClass );
         aRow[1].dataset.i = iLevelIndex.toString();
         iLevelIndex++;
      }

      // ## Build row tree
      if(!aContainer) {                                                        // no container ?
         aContainer = [null, eSection];                                        // if no container, then section will be container for all rows. This is used when row exists in html tables
         aRowMain[1].dataset.record = "1";                                     // Set main row to record when no container element is used
      }

      // Connect rows with container
      let iTo = oRowRows.length;
      for(let i = 0; i < iTo; i++) {
         eContainer.appendChild( oRowRows.GetRowElement( i ) );
      }

      // Create rows by cloning them into body
      for( let i = 0; i < this.m_iRowCount; i++) {
         eSection.appendChild( eFragment.cloneNode(true) );
      }

      return eSection;
   }

   /**
    * Create container for each row or row "row-tree" of elements from string or array with strings
    * @param {string | string[]} aContainer element names for  row tree
    */
   _create_container( aContainer: string | string[] ): [HTMLElement, HTMLElement] {
      if( !Array.isArray( aContainer ) ) aContainer = [aContainer];
      let eRoot: HTMLElement = null, eRow: HTMLElement, eParent: HTMLElement;
      for( let i = 0; i < aContainer.length; i++ ) {
         const sRow = aContainer[i].trim();
         if( sRow[0] === "<" ) {                            // markup template ?

         }
         const a = aContainer[i].split(".");
         eRow = document.createElement(a[0]);
         if( eParent ) eParent.appendChild( eRow );
         if( a.length > 1 ) { eRow.className = a[1]; }

         if( eRoot === null ) {
            eRoot = eRow;
         }
         eParent = eRow;
      }

      eRoot.dataset.record = "1";
      return [eRoot,eRow];
   }


   /**
    * Create row or row "row-tree" of elements from string or array with strings
    * @param {string | string[]} aRow element names for row tree
    */
   _create_row( aRow: string | string[] ): [HTMLElement, HTMLElement] {
      if( !Array.isArray( aRow ) ) aRow = [aRow];
      let eRoot: HTMLElement = null, eRow: HTMLElement, eParent: HTMLElement;
      for( let i = 0; i < aRow.length; i++ ) {
         const a = aRow[i].split(".");
         eRow = document.createElement(a[0]);
         if( eParent ) eParent.appendChild( eRow );
         if( a.length > 1 ) { eRow.className = a[1]; }

         if( eRoot === null ) {
            eRoot = eRow;
         }
         eParent = eRow;
      }

      eRow.dataset.type = "row";
      return [eRoot,eRow];
   }

   /**
    * Types of row layouts that are managed
    * 1: <main row>
    *      <extra>
    *        <extra>
    *          <column row>
    *          
    * 2: <main row><columns ...
    *    <extra row><columns ...
    *    
    * If extra  rows are placed in same tree as the main row then first item in `aRow` has a number
    * that is used to walk main tree to get parent for extra row.
    * @param aRow
    * @param oPosition
    */
   _create_row_extra( aRow: string | (number|string)[], oPosition: tabledata_position, aRows: [HTMLElement, HTMLElement][] ): [number, HTMLElement, HTMLElement] {
      const eRecordRoot: HTMLElement = aRows[0][1];   // main record element row
      if( !Array.isArray( aRow ) ) aRow = [aRow];
      let eRoot: HTMLElement = null, eRow: HTMLElement, eParent: HTMLElement;
      for( let i = 0; i < aRow.length; i++ ) {
         const row = aRow[i];
         if(typeof row === "number") {                                        // travel root tree to generate row?
            eParent = eRoot || eRecordRoot;
            let j = row;
            while( --j >= 0 ) {
               eParent = <HTMLElement>eParent.firstElementChild;               console.assert( eParent !== null, "Parent error, make sure correct number of parent exists: total = " + row + ", failed at: " + (j+1) );
            }
         }
         else {
            const a = row.split(".");
            eRow = document.createElement(a[ 0 ]);
            if(eParent) eParent.appendChild(eRow);
            if(a.length > 1) { eRow.className = a[ 1 ]; }

            if(eRoot === null) {
               eRoot = eRow;
            }
            eParent = eRow;
         }
      }

      eRow.dataset.type = "row";                                               // set "data-type"
      eRow.dataset.position_row = oPosition.row.toString();                    // set "data-position_row"
      return [oPosition.row, eRoot, eRow];
   }

/*
 * Row attributes
 * data-type = row : all rows that has columns. If getting row from clicked element this is the first element to search for
 * data-record = main row for record. this is the root for complete row in result
 * data-position_row = position.row
 */

   /**
    * Create row or row "row-tree" of elements from string or array with strings
    * @param {string | string[]} aRow element names for  row tree
    */
   _create_section( aSection: string | string[], sName: string ): [HTMLElement, HTMLElement] {
      if( !Array.isArray( aSection ) ) aSection = [aSection];
      let eRoot: HTMLElement = null, eSection: HTMLElement, eParent: HTMLElement;
      for( let i = 0; i < aSection.length; i++ ) {
         const a = aSection[i].split(".");
         eSection = document.createElement(a[0]);
         if( eParent ) eParent.appendChild( eSection );
         if( a.length > 1 ) { eSection.className = a[1]; }

         if( eRoot === null ) {
            eRoot = eSection;
            eRoot.dataset.root = "1";
         }
         eRoot = eSection;
         eRoot.dataset.widget = CUITableText.s_sWidgetName;
      }

      eSection.dataset.section = sName;
      return [eRoot,eSection];
   }


   _has_create_callback(sName, v: EventDataTable, sSection, call?: ((sType: string, v: any, e: HTMLElement) => boolean)): boolean {
      let a = call ? [call] : this.m_acallCreate;
      let bCall = a !== undefined;
      if(bCall) {
         for(let i = 0; i < a.length; i++) {
            let b = a[i].call(this, sName, v, sSection );
            if( b === false ) bCall = false;
         }
      }
      return bCall;
   }


   _has_render_callback(sName, sSection): boolean {
      let bCall = this.m_acallRender !== undefined;
      if(bCall) {
         for(let i = 0; i < this.m_acallRender.length; i++) {
            let b = this.m_acallRender[i].call(this, sName, sSection );
            if( b === false ) bCall = false;
         }
      }
      return bCall;
   }

   /**
    * Handle element events for ui table text. Events from elements calls this method that will dispatch it.
    * @param {string} sType event name
    * @param {Event} e event data
    * @param {string} sSection section name, table text has container elements with a name (section name)
    */
   private _on_action(sType: string, e: Event, sSection: string) {
      if(this.m_acallAction && this.m_acallAction.length > 0) {
         let i = 0, iTo = this.m_acallAction.length;
         let callback = this.m_acallAction[ i ];
         while(i++ < iTo) {
            let bResult = callback.call(this, sType, e, sSection);
            if(bResult === false) return;
         }
      }

      if(sSection === "header") {
         //this.GetRowCol(<HTMLElement>e.srcElement);

      }
      else if(sSection === "body") {
         if(sType === "click") {
            let aCell: [ number, number, unknown ] = this.GetRowCol(<HTMLElement>e.srcElement);
            if(aCell && this.m_aInput && (aCell[ 0 ] !== this.m_aInput[ 0 ] || aCell[ 1 ] !== this.m_aInput[ 1 ])) {
               this.INPUTSet( <[number,number]><unknown>aCell );
               this.INPUTMove(enumMove.validate, true);
               if(this.is_state(enumState.SetOneClickActivate)) {              // is state set to activate 
                  if( this.INPUTDeactivate() !== -1 ) {
                     this.INPUTActivate();
                  }
               }
            }
         }
         //if(this.m_aInput = [ iR, iC, eElement ];)
         /*
         if(sType === "click" && this.m_aInput) {                             // if input, then position input on clicked cell
            let aCell: [ number, number, unknown ] = this.GetRowCol(<HTMLElement>e.srcElement);
            let aI = this.m_aInput;
            if(aCell && (aCell[ 0 ] !== aI[ 0 ] || aCell[ 1 ] !== aI[ 1 ])) {
               aCell[ 2 ] = this.ELEMENTGetCell(aCell[ 0 ], aCell[ 1 ]);
               this.m_aInput = <[ number, number, HTMLElement ]>aCell;
               this.Render("body");
            }
            else {
               // TODO: Open edit
            }
         }
         */
         else if(sType === "keydown" && this.m_aInput) {
            let eMove: enumMove;
            if((<KeyboardEvent>e).keyCode === 9) {
               eMove = (<KeyboardEvent>e).shiftKey === true ? enumMove.left : enumMove.right;
               e.preventDefault();
            }
            else if( (<KeyboardEvent>e).keyCode === 13 || (<KeyboardEvent>e).keyCode === 39) {
               eMove = enumMove.right;
            }
            else if((<KeyboardEvent>e).keyCode === 37) eMove = enumMove.left;
            else if((<KeyboardEvent>e).keyCode === 38) eMove = enumMove.up;
            else if((<KeyboardEvent>e).keyCode === 40) eMove = enumMove.down;
            else if((<KeyboardEvent>e).keyCode === 36) eMove = enumMove.begin;
            else if((<KeyboardEvent>e).keyCode === 35) eMove = enumMove.end;
            else if((<KeyboardEvent>e).keyCode === 33) eMove = enumMove.page_up;
            else if((<KeyboardEvent>e).keyCode === 34) eMove = enumMove.page_down;
            else if((<KeyboardEvent>e).keyCode === 27) eMove = enumMove.disable;
            if(eMove) { 
               if(this.m_iOpenEdit > 0) {                                    // any open edit elements?
                  let oEdit = this.edits.GetEdit(<HTMLElement>e.srcElement) || this.edits.GetEdit(<[ number, number ]><unknown>this.m_aInput);
                  if(oEdit && oEdit.IsModified() === true) {                               // Is value modified
                     let bOk: boolean = true;
                     let _Value = oEdit.GetValue( true );
                     this.SetCellValue(oEdit.GetPositionRelative(), _Value, { iReason: enumReason.Edit, edit: oEdit, eElement: <HTMLElement>e.srcElement, browser_event: sType });
                  }

                  if(eMove == enumMove.disable) this.INPUTDeactivate(false);
                  else {
                     this.INPUTDeactivate();                                    // close all edits
                  }
                  
                  if(oEdit) this.render_value(oEdit.GetPositionRelative());
                  this.GetSection("body").focus({ preventScroll: true });       // Set focus to body, closing edit elements will make it loose focus
                  this.INPUTMove(eMove, true);

                  if(this.is_state(enumState.SetOneClickActivate)) {            // is state set to activate 
                     this.INPUTActivate();
                  }
               }
               else {
                  this.INPUTMove(eMove, true);
               }
               //this.INPUTActivate();   NOTE: acitvate or not activate edit on move keys?                   
            }
            else if(this.m_oEdits && (<KeyboardEvent>e).keyCode >= 32) {       // space and above
               let oEdit = this.m_oEdits.GetEdit(this._column_in_data(this.m_aInput[1]));// Get edit for column (second value in input array)
               if(oEdit !== null) {
                  if(oEdit.IsOpen() === false) {
                     if( this.INPUTDeactivate() !== -1 ) {
                        this.INPUTActivate();
                     }
                  }
               }
            }
         }
         else if(sType === "dblclick" && this.m_aInput) {                      // open editor if any on double click
            if( this.INPUTDeactivate() !== -1 ) {
               this.INPUTActivate();
            }
         }
         else if(sType === "focus") {
            if(this.m_aInput ) {
               const a = this.GetRowCol( <HTMLElement>e.srcElement );
               if(a && (a[ 1 ] != this.m_aInput[ 1 ] || a[ 0 ] != this.m_aInput[ 0 ])) {
                  let oEdit = this.edits.GetEdit(<[number,number]><unknown>this.m_aInput);
                  if(oEdit && oEdit.IsModified() === true) {
                     let _Value = oEdit.GetValue();
                     this.SetCellValue(oEdit.GetPositionRelative(), _Value, { iReason: enumReason.Edit, edit: oEdit, eElement: <HTMLElement>e.srcElement, browser_event: sType });
                     this.render_value(oEdit.GetPositionRelative());
                  }
                  this.INPUTDeactivate();
                  this.INPUTActivate( a[0], a[1], true );
               }
            }
            
         }
         else if(sType === "focusout") {
            if((<HTMLElement>e.srcElement).dataset.input === "1" || (<HTMLElement>e.srcElement).matches("[data-value]")) {
               let oEdit = this.edits.GetEdit(<HTMLElement>e.srcElement) || this.edits.GetEdit(<[number,number]><unknown>this.m_aInput);
               if(oEdit && oEdit.IsModified() === true) {                               // Is value modified
                  let bOk: boolean = true;
                  let _Value = oEdit.GetValue();
                  this.SetCellValue( oEdit.GetPositionRelative(), _Value, {iReason: enumReason.Edit,edit:oEdit, eElement: <HTMLElement>e.srcElement, browser_event: sType } );
                  this.INPUTDeactivate()
                  this.render_value(oEdit.GetPositionRelative());
               }
            }
         }
      }
   }


   /**
    * Return index to physical position in table data. This is needed if operations based on data is executed
    * @param iIndex
    */
   private _column_in_data(iIndex: number): number { return this.m_aColumnPhysicalIndex[ iIndex ]; }
   /**
    * Get column position in table, this position can differ from the position in  table data
    * @param iIndex
    */
   private _column_in_ui(iIndex: number): number {
      let i = this.m_aColumnPhysicalIndex.length;
      while(--i >= 0) {
         if(this.m_aColumnPhysicalIndex[ i ] === iIndex) return i;
      }
      return -1;
   }

   private _get_triggerdata(): EventDataTable {
      let o: EventDataTable = { dataUI: this, data: this.data };
      return o;
   }

   private _set_selected(aSelect: [ number, number ][], bAdd: boolean): void {
      if(bAdd === true) { this.m_aSelected = [].concat(this.m_aSelected, aSelect); }
      else this.m_aSelected = aSelect;
   }

   private _row_in_data(iIndex: number) { return this.m_aRowPhysicalIndex[ iIndex ]; }
   private _row_in_ui(iDataIndex: number) { 
      let i = this.m_aRowPhysicalIndex.length;
      while( --i >= 0 ) {
         if( this.m_aRowPhysicalIndex[i] === iDataIndex ) return i;
      }
                                                                               console.assert(false,"no ui row for data row");
      return -1;
   }

   private _trigger(_Trigger: number | number[]) {
      let oTrigger = this.trigger;
      if(oTrigger) {

      }
   }

}