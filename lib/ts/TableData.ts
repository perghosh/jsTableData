export const enum enumFormat {
   Raw      = 0x0001,
   Format   = 0x0002,
   All      = 0x0004,
}

export enum enumReturn {
   Value    = 0,
   Array    = 1,
}



export const enum enumMove {
   validate    = 0,
   left        = 1,
   right       = 2,
   up          = 4,
   down        = 8,
   page_up     = 16,
   page_down   = 32,
   begin       = 64,
   disable     = 128,
   end         = 256,
}

export const enum enumValueType {
   unknown        = 0x00000,
   i1             = 0x10001,
   i1Bool         = 0x10101,
   i2             = 0x10002,
   i4             = 0x10003,
   i8             = 0x10004,
   u1             = 0x10005,
   u2             = 0x10006,
   u4             = 0x10007,
   u8             = 0x10008,
   r4             = 0x3000A,
   r8             = 0x3000B,

   str            = 0x40010, // DEC 262160
   blobstr        = 0x40011, // DEC 262161
   utf8           = 0x40012, // DEC 262162
   ascii          = 0x40013, // DEC 262163
   bin            = 0x80020,
   blob           = 0x80021,
   file           = 0x80022,
   datetime      = 0x100030,
   date          = 0x100031,
   time          = 0x100032,

   group_boolean  = 0x00100,
   group_number   = 0x10000,
   group_real     = 0x20000,
   group_string   = 0x40000,
   group_binary   = 0x80000,
   group_date    = 0x100000,
}

export namespace browser {
   export function AddCSS( sCSS: string ) {
      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = sCSS;
      document.getElementsByTagName('head')[ 0 ].appendChild(style);
   }
}

export interface IUITableData {
   id: string;
   name: string;
   data: CTableData;

   update: ((iType: number) => any);
}


namespace details {
   export type format = {
      convert?: ((value: unknown, aCell: [number, number]) => unknown), // convert logic, external or regex
      const?: number|boolean,// value cannot be corrected. if not set then table data tries to correct value if wrong   
      html?: string|number|boolean,// value is html formated, do not insert as text, use HTML. if string then this is column specific elements.
      max?: number,     // max value for value, if string it is max number of characters, if number it has the max value
      min?:number,      // Same as max but opposite
      pattern?: string|string[], // regex pattern to verify that value is ok
      required?: number,// if value is required
      verify?: string | ((value: string) => boolean), // regex string or method to verify value
   };

   export type type = { 
      group?: string,   // group name for type like "number" , "string"
      type?: number,    // number for type
      name?: string,    // name for type
   };

   export type position = {
      col?: number,     // in what column, this is for input forms
      convert?: ((value: unknown, aCell: [number, number]) => unknown), // convert logic
      hide?: number|boolean,// if true ore one value like 1 or more this columns is hidden
      index?: number,
      page?: number,    // when forms with pages are used, this has the page columns is placed
      row?: number,     // index to row. if table then 0 is same row as main row. negative numbers are above, positive numbers are below. in forms it has the index for row
   };


   /**
    * column type describes each property for columns in table (or form) data
    * */
   export type column = {
      alias?: string,      // alias or label name for field
      edit?: {
         name?: string,    // edit control name used for column
         edit?: boolean|number,// if edit is allowed or not
         element?: boolean|number,// Use existing  element (don't create edit element).
      },
      extra?: any,         // custom data
      format?: details.format,
      id?: string,         // id for column
      list?: [ string | number, string | number ][], // list attached to column
      key?: {
         key?: number,     // if column is key value
         fk?: number,      // if column is a foreign key
      }
      name?: string,       // field name, same name as in database?
      style?: {            // styling for column
         [key: string]: string,
      },
      position?: details.position,
      rule?: {
         no_sort?: boolean,// column is not allowed to be sorted
      },
      simple?: string,     // a longer simplified name for field, if placeholder it could be used there
      state?: {
         sort?: number,    // sort this column before getting result
         sorted?: number,  // column is sorted
      },
      title?: string,      // used for tool tips
      type?: details.type, // type information
      value?: string,      // value shown in field if any or condition default
   }

   export type construct = {
      body?: unknown[][],
      column?: details.column[],
      dirty_row?: number[],
      external?: object;   // external properties, used if you need to attach custom properties
      footer_size?: number,
      header_size?: number,
      id?: string,         // unique id for result
      name?: string,       // name used to identify table data
      page?: number,       // index for active page if any
      trigger?: ((iTrigger: number, iReason: number, _data: any) => boolean)[],
   }
}

export type tabledata_column = details.column;
export type tabledata_format = details.format;
export type tabledata_position = details.position;


/**
 * 
 * */
export class CTableData {
   m_aBody: unknown[][];   // values
   m_aColumn: details.column[];// array with column information for each column in table (or fields if used in form)
   m_aColumnIndex?: number[];// If columns have a different order, this points to column in `m_aColumn` and `m_aBody`.
                             // When this is specified always use it to get to column.
   m_aDirtyRow?: number[]; //  Dirty rows
   m_oExternal: any;       // used to manage external properties. Not used in CTableData
   m_aFooter?: unknown[][];// Footer values, like sticky at bottom if result is presented in table
   m_iFooterSize: number;  // if bottom rows in body is used for something "else"
   m_aHeader?: unknown[][];// Header values, like sticky if result is presented in table
   m_iHeaderSize?: number; // if top rows in body is used for something "else"
   m_aHistory: [number,number,unknown][];// history of modified values
   m_sId: string;          // Unique id for source data 
   m_sName: string;        // Name for source data, may be used to simplify identification
   m_iNextKey: number;     // key counter used to set key to rows. Each row holds a key value
   m_iPage?: number;       // index to active page
   m_aUITable?: [ string, IUITableData][];// UITable objects connected

   static s_iIdNext: number = 0;

   /**
    * Default column options. Changing this will change them globally
    */
   static s_oColumnOptions = {
      alias: null, edit: {}, extra: null, format: {}, id: null, key: {}, name: null, style: {}, position: {}, simple: null, title: null, rule: {}, state: {}, type: {}, value: null
   };

   static s_aJsType: [string,enumValueType][] = [
      ["binary",enumValueType.blob],["boolean",enumValueType.i1Bool],["date",enumValueType.datetime],["number",enumValueType.r8],["string",enumValueType.str]
   ];

   static s_aType: [string,enumValueType][] = [
      ["i1",enumValueType.i1],  ["i1Bool",enumValueType.i1Bool],  ["i2",enumValueType.i2],    ["i4",enumValueType.i4], ["i8",enumValueType.i8],
      ["u1",enumValueType.u1],  ["u2",enumValueType.u2],          ["u4",enumValueType.u4],    ["u8",enumValueType.u8], 
      ["r4",enumValueType.r4],  ["r8",enumValueType.r8],
      ["str",enumValueType.str],["blobstr",enumValueType.blobstr],["utf8",enumValueType.utf8],["ascii",enumValueType.ascii],
      ["bin",enumValueType.bin],["blob",enumValueType.blob],
      ["file",enumValueType.file],
      ["datetime",enumValueType.datetime],["date",enumValueType.date],["time",enumValueType.time]
   ];

   /**
    * Return value type number or type name based on argument
    * @param  {number|string} _T If string then return number for type, if number then return type name
    * @return {number|string} type name or type number
    * @throws {string} information about type if type isn't found
    */
   static GetType( _T: number|string ): number|string {
      const a = CTableData.s_aType;
      let i = a.length;
      if( typeof _T === "string" ) {
         while( --i >= 0 ) { if( _T === a[i][0] ) return a[i][1]; }
      }
      while( --i >= 0 ) { if( _T === a[i][1] ) return a[i][0]; }
      throw "unknown type " + _T.toString() ;
   }


   /**
    * Return internal type number for standard javascript type names
    * @param {string} sType javascript type name
    */
   static GetJSType(_Type: string|number): enumValueType|string {
      let i = CTableData.s_aJsType.length;
      if( typeof _Type === "string" ) {
         while(--i >= 0) {
            const a = CTableData.s_aJsType[i];
            if( a[0] === _Type ) return a[1];
         }

         // try special type
         return CTableData.GetType( _Type.toLowerCase() );
      }
      else {
         while(--i >= 0) {
            const a = CTableData.s_aJsType[i];
            const iGroup: number = ((a[1] & 0xffff0000) & _Type); // type flags
            if( iGroup === 0 ) continue;

            if( _Type !== enumValueType.i1Bool ) return a[0];
            else return "boolean";
         }
      }
      return enumValueType.unknown;
   }

   static ConvertValue(_Value: unknown, eType?: enumValueType ): unknown {
      let _New: unknown;
      if(typeof _Value === "string" && !(eType & enumValueType.group_string) ) {
         if(eType & enumValueType.group_real) _New = parseFloat(_Value);
         else if(eType & enumValueType.group_number) _New = parseInt(_Value, 10);
         else if(eType & enumValueType.group_date) _New = new Date(_Value);
         else if(eType & enumValueType.group_boolean) {
            _New = true;
             switch(_Value.toLowerCase().trim()){
                 case "false": case "off": case "no": case "0": case "": _New = false;
             }
         }
         else _New = undefined;

         return _New;
      }

      return _Value;
   }

   static StripIndex( a: [ string | number, unknown ][]  ): unknown[] {
      let b: unknown[] = [];
      for( let i = 0; i < a.length; i++ ) { b.push( a[i][1] ); }
      return b;
   }

   /**
    * Validate value
    * @param {unknown} _Value value to validate against rules in format
    * @param oFormat 
    */
   static ValidateValue( _Value: unknown, oFormat: details.format | details.column, eType?: enumValueType ): boolean | [boolean|unknown,(string|string[]|unknown)?] {
      let aError: [boolean?,string?];

      if((<details.column>oFormat).format) {
         eType = eType || (<details.column>oFormat).type?.type;
         oFormat = (<details.column>oFormat).format;
      }

      if( !eType ) eType = <number>CTableData.GetJSType( typeof _Value );

      const _Old = _Value;
      if(!(<details.format>oFormat).const) {
         _Value = CTableData.ConvertValue(_Value, eType);
      }

      for(const [sKey, _rule] of Object.entries(oFormat)) {
         switch(sKey) {
            case "max":
               if( 
                  ((eType & enumValueType.group_string) && (<string>_Value).length > _rule) ||
                  ((eType & enumValueType.group_number) && _Value > _rule)
               ) aError = [false,sKey];
               break;
            case "min": 
               if( 
                  ((eType & enumValueType.group_string) && (<string>_Value).length < _rule) ||
                  ((eType & enumValueType.group_number) && _Value < _rule)
               ) aError = [false,sKey];
               break;
            case "pattern" :
               let a = _rule;
               if( !Array.isArray(a) ) a = [a];
               for(let i = 0; i < a.length; i++) {
                  if((new RegExp(a[ i ], 'g')).test(_Value.toString()) === false) { aError = [ false, sKey ]; break; }
               }
               break;
            case "required" : 
               if( _Value === void 0 || _Value === null || _Value === "" ) aError = [false,sKey];
               break;
         }
      }

      if( !aError && _Value !== _Old ) return [_Value, _Old];
      return <[boolean,string]>aError || true;
   }



   constructor( options?: details.construct ) {
      const o = options || {};

      this.m_aBody = o.body || [];
      this.m_aColumn = o.column || [];
      this.m_aDirtyRow = o.dirty_row || [];
      this.m_oExternal = o.external || {};
      this.m_iFooterSize = o.footer_size || 0;
      this.m_iHeaderSize = o.header_size || 0;
      this.m_aHistory = [];
      this.m_sId = o.id || "id" + ++CTableData.s_iIdNext;
      this.m_sName = o.name || this.m_sId;
      this.m_iNextKey = 0;
      this.m_iPage = o.page || 0;
      this.m_aUITable = [];
   }

   /**
    * Return id 
    */
   get id() { return this.m_sId; }

   /**
    * access external object
    */
   get external() { return this.m_oExternal; }


   /**
    * Return raw body of data. Only use this if you know how table data works internally
    */
   get body() { return this.m_aBody; }

   /**
    * Return array with rows and if specified another array with row numbers
    * @param oOptions
    * @param {number} [oOptions.begin] index to start row where to  begin to collect internal data
    */
   GetData(oOptions?: { begin?: number, end?: number, max?: number, page?: number, sort?: [ number, boolean, string?][], hide?: number[] }): [ unknown[][], number[] ] {
      let o = oOptions || {};
      let iPage = 0;
      let iTotalRowCount = this.ROWGetCount(true);

      let iBeginRow = this.m_iHeaderSize,
         iEndRow = iTotalRowCount - this.m_iFooterSize,
         iSlice = 1; // Important, first column in body is the index for row, default is not to add this column to result
      let aResult: [ unknown[][], number[] ] = [[],[]];

      iBeginRow = o.begin || iBeginRow;
      iEndRow = o.end || iEndRow;

      if(o.max && (iEndRow - iBeginRow) > o.max) iEndRow = iBeginRow + o.max;  // if max number of rows is set, check total and decrease if above.

      let aBody: unknown[][] = this.m_aBody;

      let bSortOrHide = this.COLUMNHasPropertyValue(true, [ "state.sort", "position.hide" ], [ true, 1, -1 ]);
      let bConvert = this.COLUMNHasPropertyValue(true, "position.convert");

      // Check if sort values is needed
      let aSort: [ number, boolean, string?][] = o.sort || [];
      let aHide: number[] = o.hide || [];

      if(bSortOrHide === true) {
         if(aSort.length === 0 ) {
            let a = <[ number, [ number, number ] ][]>this.COLUMNGetPropertyValue(true, ["state.sort", "type.type"]);
            a.forEach((aC) => {
               const v = aC[ 1 ][0];
               if(v === 1 || v === -1) {
                  let sGrouptype = CTableData.GetJSType( aC[1][1] );
                  if( typeof sGrouptype === "number" ) sGrouptype = "string";  // group name for type not found, set to string as default
                  aSort.push([ aC[ 0 ], aC[1][0] === -1 ? true : false, sGrouptype ]);
               }
            });
         }

         if(aHide.length === 0) {
            let a = <[ number, number ][]>this.COLUMNGetPropertyValue(true, "position.hide");
            a.forEach((aH) => {
               aHide.push(aH[1]);
            });
         }
      }


      if(aSort.length) {
         aBody = aBody.slice(0);
         CTableData._sort(aBody, aSort);
      }


      let oGetOptions: any = { slice: iSlice, hide: aHide.length === 0 ? null : aHide, table: this };
      if(bConvert) { oGetOptions.convert = CTableData.StripIndex( <[ string | number, unknown ][]>this.COLUMNGetPropertyValue(true, "position.convert") ); }

      CTableData._get_data(aResult, aBody, iBeginRow, iEndRow, oGetOptions);

      return aResult;
   }

   /**
    * Wrapper method to get values from selected column, uses `GetData` to collect values
    * @param {number} iColumn index to column
    * @param oOptions
    */
   GetColumnData( iColumn: number, oOptions?: { begin?: number, end?: number, max?: number, page?: number, sort?: [ number, boolean, string?][], hide?: number[] } ): unknown[] {
      let a: unknown[] = [];
      let aResult = this.GetData( oOptions );
      aResult[ 0 ].forEach(row => { a.push( row[iColumn] ) });
      return a;
   }

   GetDataForKeys(aKey?: number[], aColumn?: number[]): unknown[][] {
      aKey = aKey || this.m_aDirtyRow; // default is dirty keys
      // aColumn = aColumn || implement columns from properties
      let aData = CTableData._get_data_for_keys( aKey, this.m_aBody, aColumn );

      return aData;
   }


   /**
    * Compare values in cell or cells identified by row and column or range
    * @param  {number} iRow key for row in source array, if row is -1 then count found values in all rows for column
    * @param  {number|string} _Column index or column name to column value is set to
    * @param  {unknown} value value set to cell
    * @param  {boolean} bRaw if raw value cell value from raw row is set
    */
   CountValue(aRange: [ iR: number, _C: string | number ], value: unknown, iReturn?: enumReturn ): number | number[];
   CountValue(iRow: number, _Column: string | number, value: unknown, bRaw?: boolean): number | number[];
   CountValue(aRange: [ iR: number, _C: string | number ], value: unknown, bRaw?: boolean): number | number[];
   CountValue(aRange: [ iR1: number, _C1: string | number, iR2: number, _C2: string | number ], value: unknown, bRaw?: boolean): number | number[];
   CountValue(_Row: any, _Column: any, value?: unknown, bRaw?: boolean|number, iReturn?: enumReturn ): number | number[] {
      if(typeof bRaw === "number") { iReturn = bRaw; bRaw = undefined; }      // if bRaw is a number then this is the return value type

      const compare = (a, b): number => {
         if( typeof b === "function" ) return b( a );
         return a === b ? 1 : 0;
      }

      let iCount = 0, iRow = _Row, iColumn: number|string;
      if(Array.isArray(_Row) && _Row.length === 2) {
         [ iRow, iColumn ] = _Row;
         if(iRow === -1) {
            _Row = [ 0, iColumn, this.ROWGetCount() - 1, iColumn ];
         }
         bRaw = <boolean>value;
         value = _Column;
         if(typeof bRaw === "number") { iReturn = bRaw; bRaw = undefined; }    // if bRaw is a number then this is the return value type
      }
      else { iColumn = _Column; }

      let aFind: number[] = iReturn ? [] : null;

      if(typeof _Row === "number") {
         let [ iR, iC ] = this._get_cell_coords(iRow, iColumn, <boolean>bRaw);
         let aRow: unknown[] = this.m_aBody[ iR ];

         if(aRow[ iC ] instanceof Array) { // is current value array
            if(Array.isArray(value) == false) iCount += compare( aRow[ iC ][ 0 ], value ); 
            else iCount += compare( aRow[ iC ], value );
         }
         else { iCount += compare( aRow[ iC ], value); } 

         if( iReturn && iCount === 1 ) aFind.push( <number>aRow[0] );          // value found? then push row key to find array
      }
      else if(Array.isArray(_Row) === true) {
         let aRow: unknown[]; // active row
         let [ iR1, iC1, iR2, iC2 ] = _Row;                    // convert to variables
         [ iR1, iC1 ] = this._get_cell_coords(iR1, iC1, <boolean>bRaw); // get physical positions
         [ iR2, iC2 ] = this._get_cell_coords(iR2, iC2, <boolean>bRaw); // get physical positions
         if(iR1 > iR2) iR2 = [ iR1, iR2 = iR1 ][ 0 ];
         if(iC1 > iC2) iC2 = [ iC1, iC2 = iC1 ][ 0 ];

         for(let iR = iR1; iR <= iR2; iR++) {
            const iSaveCount = iCount;
            if( bRaw ) aRow = this.m_aBody[ iR ];
            else aRow = this.m_aBody[ this._row( iR ) ];
            for(let iC = iC1; iC <= iC2; iC++) {
               if(aRow[ iC ] instanceof Array) {
                  if(Array.isArray(value) == false) iCount += compare( aRow[ iC ][ 0 ], value );
                  else iCount += compare( aRow[ iC ],  value );
               }
               else { iCount += compare( aRow[ iC ], value ); }
            }

            if( iReturn && iCount > iSaveCount ) aFind.push( <number>aRow[0] );// value found? then push row key to find array
         }
      }

      if( iReturn === enumReturn.Array ) return aFind;
      return iCount;
   }


   /**
    * Insert column to table. Adds column information and cell/cells at position in rows
    * @param {number|string} _WhereColumn
    * @param {unknown|unknown[]} [_Value] value or array of value inserted at position
    * @param {number} [iCount] Number of columns inserted, default is 1
    */
   InsertColumn(_WhereColumn: number|string, _Value?:unknown|unknown[], iCount?: number): details.column[] {
      iCount = iCount || 1;
      this.ROWExpand( iCount, _Value, _WhereColumn );
      return this.COLUMNInsert( _WhereColumn, iCount );
   }

   /**
    * Read array information into table data. If table is empty the default is to create columns and
    * names for each column are taken from first row.
    * @param {unknown[][]} aData array with rows where each row is an array of values
    * @param {object} oOptions configure reading
    * @param {number} [oOptions.begin] start row, where to begin reading data, if not set then start from second row (first is column names)
    * @param {number} [oOptions.end] end row, where to stop reading data, if not set then it reads all rows from aData
    */
   ReadArray(aData: unknown[][], oOptions?: {begin?: number, end?: number}) {
      oOptions = oOptions || {};
      let iBegin = typeof oOptions.begin === "number" ? oOptions.begin : 1,
         iEnd = typeof oOptions.end === "number" ? oOptions.end : aData.length;

      /*
      let add_column = sName => {
         if(this.COLUMNGet(sName, true) === null) {
            this.COLUMNAppend(sName);
            if(this.ROWGetCount(true) !== 0) this.ROWExpand();
         }
      };
      */

      let aRow: unknown[] = aData[0];

      if(this.COLUMNGetCount() === 0) {
         aRow.forEach((sName) => { 
            this.COLUMNAppend(sName);
         });
      }


      let iRow = this.ROWGetCount() + this.m_iHeaderSize;
      let aReturn = this.ROWAppend(iEnd - iBegin);

      // Add to body
      for(let i = iBegin; i < iEnd; i++) {
         aRow = aData[i];
         let iTo = aRow.length;
         let aBodyRow = this.m_aBody[iRow];
         for( let j = 0; j < iTo; j++ ) {  
            aBodyRow[j+1] = aRow[j];
         }

         iRow++;
      }
   }


   /**
    * Read object data
    * @param aList
    * @returns [number,number] keys to added rows, first key and first and one more than last key for added rows
    */
   ReadObjects(aList: object[]): [ number, number ] {
      if(Array.isArray(aList) === false) aList = [ aList ];
      if(aList.length === 0) return null;

      // get first item
      let oFirst = aList[ 0 ];
      if(typeof aList !== "object") return null;

      let add_column = sName => {
         if(this.COLUMNGet(sName, true) === null) {
            this.COLUMNAppend(sName);
            if(this.ROWGetCount(true) !== 0) this.ROWExpand();
         }
      };

      let aColumns = Object.keys(oFirst);
      aColumns.forEach((sName: string) => {
         add_column(sName);
      });

      let iRow = this.ROWGetCount() + this.m_iHeaderSize;
      let iRowCount = aList.length;
      let aReturn = this.ROWAppend(iRowCount);

      aList.forEach((oData) => {
         Object.entries(oData).forEach((a) => {
            let iColumn = this._index(a[ 0 ]);
            if(iColumn === -1) {
               add_column(a[ 0 ]);
               iColumn = this._index(a[ 0 ]);
            }
            this.CELLSetValue(iRow, iColumn, a[ 1 ]);
         });
         iRow++;
      });

      return aReturn;
   }

   /**
    * @param  {number[]} [aMatch] Recalculate column positions
    * Return `CRowRows` object that has raw data on how to design row values.
    */
   
   GetRowRows( aMatch?: number[] ): CRowRows {
      let aRows = this._collect_row_design();
      let oRR = new CRowRows(aRows);
      if( aMatch ) oRR.OffsetColumns( aMatch );
      return oRR;
   }

   Sort( aBody: unknown[][] ) {
      let aOrder: [ number, boolean, string ][];
      
      this.m_aColumn.forEach((oColumn, iIndex) => {
         let bDesc: boolean = false;
         if( oColumn.state.sort ) aOrder.push( [iIndex, bDesc, "string"] );
      });
   }

   /**
    * Check if any or selected row is dirty (dirty = values are modified)
    * @param {number} [iIndex] Index to row that is checked if dirty
    * @returns {boolean} true if row is dirty when row is specified, or if no row is specified than returns true if any row is dirty. Otherwise false
    */
   IsDirty(iIndex?: number): boolean {
      if(typeof iIndex === "number") {
         for(let i = 0; i < this.m_aDirtyRow.length; i++) {
            if(this.m_aDirtyRow[ i ] === iIndex) return true;
         }
         return false;
      }
      return this.m_aDirtyRow.length > 0;
   }

   /**
    * Validate cords to be within table bounds
    * @param iR
    * @param _C
    */
   ValidateCoords(iR: number, _C: number | string): boolean {
      if(typeof _C === "number") {
         return this._validate_coords(iR, _C);
      }
      else if(typeof _C === "string") {
         if(this._index(_C) === -1) return false;
      }

      if(iR >= this.m_aBody.length) return false;
      return true;
   }


   /**
    * Clear internal data, everything that is data related that is.
    */
   ClearData() {
      this.m_aBody = [];
      this.m_aColumn = [];
      this.m_aDirtyRow = [];
      this.m_iFooterSize = 0;
      this.m_iHeaderSize = 0;
      this.m_iNextKey = 0;
      this.m_iPage = 0;
   }



   /**
    * Append user interface object that is using data from table data
    * @param oUI object that is added, it has to have getters for "id" and "name" values, these are used to get UI from table data
    */
   UIAppend(oUI: object): number;
   /**
    * Append user interface object that is using data from table data
    * @param sName
    * @param oUI object that is added, it has to have getters for "id" and "name" values, these are used to get UI from table data
    */
   UIAppend(sName: string, oUI: object): number;
   UIAppend(_1: any, _2?: any): number {                                       
      if(typeof _1 === "string") {                                             console.assert(typeof _2["id"] === "string" && typeof _2["name"] === "string", "No \"id\" or \"name\" get method for UI object - " + _1 );
         this.m_aUITable.push([ _1, _2 ]);
      }
      else {
         let s: string = _1.name || _1.id;                                     console.assert(s.length > 0, "No name for added ui table");
         this.m_aUITable.push([ s, _1 ]);
      }
      return this.m_aUITable.length;
   }

   /**
    * Get ui object for name, this is the name associated with object in internal list
    * @param sName
    */
   UIGet(iIndex: number): object;
   UIGet(sName: string): object;
   UIGet(): [ string, object ][];
   UIGet(_1?: string | number): object | [ string, object ][] {
      if(typeof _1 === "number") return this.m_aUITable[ _1 ][ 1 ]
      else if(typeof _1 === "string") {
         let i = this.m_aUITable.length;
         while(--i >= 0) {
            if(this.m_aUITable[ i ][ 0 ] === _1) return this.m_aUITable[ i ][ 1 ];
         }
         return null;
      }

      return this.m_aUITable;
   }

   /**
    * Return connected ui object for id
    * @param sId id for ui object. All ui objects need a get method called `id` that returns unique id for it.
    */
   UIGetById(sId: string): object | [ string, object ][] {
      let i = this.m_aUITable.length;
      while(--i >= 0) {
         if(this.m_aUITable[ i ][ 1 ].id === sId) return this.m_aUITable[ i ][ 1 ];
      }
      return null;
   }

   UILength(): number { return this.m_aUITable.length; }


   /**
    * Append column or columns to table data
    * @param {unknown | unknown[]} _Column column data added to table data. if column is sent as string it is treated as column name
    * @param {((_C: unknown[], _Empty: details.column[]) => details.column[])} [callConvert] Callback method if column need to reformatting to adapt to table data format
    */
   COLUMNAppend(_Column: unknown | unknown[], callConvert?: ((_C: unknown[], _Empty: details.column[]) => details.column[])) : number {
      let aColumn: details.column[];

      // check if _Column is string, if string it is treated as a name
      if(typeof _Column === "string") { 
         aColumn = this._create_column(1, { id: _Column, name: _Column, position: { index: this.COLUMNGetCount() } });
      }
      else if(typeof _Column === "number") {
         aColumn = this._create_column(_Column);
      }
      else if(Array.isArray(_Column) === true) {
         for(let i = 0; i < (<unknown[]>_Column).length; i++) {
            if(typeof _Column[ i ] === "string") { _Column[i] = this._create_column(1, { id: _Column[i], name: _Column[i], position: { index: this.COLUMNGetCount() } })[0]; }
            else { _Column[i] = this._create_column(1, _Column[i] )[0]; }
         }
         aColumn = <details.column[]>_Column;
      }
      else if(Array.isArray(_Column) === false) _Column = [ _Column ];

      if(callConvert) {
         let a = callConvert(<unknown[]>_Column, aColumn);
         if(Array.isArray(a)) aColumn = a;
      }

      this.m_aColumn = this.m_aColumn.concat(aColumn);

      return this.m_aColumn.length;
   }

   /**
    * Insert column or columns at specified position
    * @param {number | string} _WhereColumn Where columns are inserted
    * @param {number} [iCount] number of columns inserted at position
    * @param {boolean} [bRaw] if true then position is exact index for column in table data
    */
   COLUMNInsert(_WhereColumn: number | string, iCount?: number, bRaw?: boolean): details.column[] {
      iCount = iCount || 1;
      const iWhere = bRaw !== true ? this._index( _WhereColumn ) : <number>_WhereColumn;
      let aColumn: details.column[] = this._create_column(iCount);
      this.m_aColumn.splice( iWhere, 0, ...aColumn );
      aColumn = [];
      for(let i = 0; i < iCount; i++) {
         aColumn.push( this.m_aColumn[i + iWhere] );
      }

      return aColumn;
   }

   /**
    * Get column object for index or name
    * @param {number | string} _Index return column object for index or name
    * @param {boolean} [bNull] If true and index to column isn't found then return null. Otherwise undefined behavior if column isn't found 
    * @param {boolean} [bRaw] if true then position is exact index for column in table data
    */
   COLUMNGet(_Index: number | string, bNull?: boolean, bRaw?: boolean): details.column {
      if( bRaw ) return this.m_aColumn[ <number>_Index ];
      else if(!bNull) return this._column(_Index);

      let iIndex = this._index(_Index);
      if(iIndex === -1) return null;

      return this.m_aColumn[ iIndex ];      
   }

   /**
    * Update matching index for objects that uses table data based on property values that marks columns as hidden or disabled
    */
   COLUMNUpdatePositionIndex() {
      let iIndex = 0;
      this.m_aColumn.forEach((c,i) => { 
         if( c.position.hide ) c.position.index = -1;
         else {
            c.position.index = iIndex;
            iIndex++;
         }
      });
   }

   /**
    * Count columns and return how many.
    * This can also count column with properties, like how many key columns there are.
    * The property sent is name for object property that is investigated. Some properties have child object so the syntax for finding a key is
    * "key.key". Another sample is to find position and in child object we want page. Then the property name is "position.name".
    * @param {string} [sProperty] property name, if child property remember the format is "property.property"
    * @param {string|number} [_Value] Value to compare with if specified values are counted
    */
   COLUMNGetCount( sProperty?: string, _Value?: string | number ): number {
      if(!sProperty) return this.m_aColumn.length;
      let [s0, s1] = sProperty.split("."); // format to find property is property_name.property_name because some properties are in child objects
      let iCount = 0;
      let iIndex = this.m_aColumn.length;
      this.m_aColumn.forEach(function(o: details.column) {
         let v = o[ s0 ];
         if(s1 && v) v = v[ s1 ];
         if(v !== undefined) {
            if(_Value === undefined) iCount++;
            else if(v === _Value) iCount++;
         }
      });
   }


   /**
    * Returns selected property value from column or columns.
    * Each column holds a number of property values. With this function you can get any of them.
    * @param {boolean}  _Index if true return property value for all columns in array
    * @param {number}   _Index index to column property is returned for, property is returned as value
    * @param {string}   _Index id or name to column property is returned for, property is returned as value
    * @param {number[]} _Index index array to columns properties is returned for, property for columns is returned as array
    * @param {string[]} _Index id or name array to columns properties is returned for, property for columns is returned as array
    * @param {string} _Property property name, if child property remember the format is "property.property"
    * @param {string[]} _Property property names, return multiple properties
    * @param {boolean} [bRaw] Index for column will use direct index in internal column array.
    */
   COLUMNGetPropertyValue(_Index: boolean | number | string | number[] | string[], _Property: string | string[], bRaw?: boolean): unknown | [ string | number, unknown ][];
   COLUMNGetPropertyValue(_Index: boolean | number | string | number[] | string[], _Property: string | string[], bRaw: boolean, callIf: ((column: details.column) => boolean) ): unknown | [ string | number, unknown ][];
   COLUMNGetPropertyValue(_Index: boolean | number | string | number[] | string[], _Property: string | string[], callIf: ((column: details.column) => boolean)): unknown | [ string | number, unknown ][];
   COLUMNGetPropertyValue(_Index: boolean | number | string | number[] | string[], _Property: string | string[], _3?: any, _4?: any ): unknown | [ string | number, unknown ][] {
      let column: details.column;// column properties
      let bArray = false;        // return property value in array with index to column
      let bAll = false;          // return selected property values for all columns if true
      let bRaw = false;          // if accessing data without recalculate to physical index
      let callIf: ((column: details.column) => boolean); // callback used to check if property is added or not
      let aReturn: [ string | number, unknown ][] = [];

      if(typeof _3 === "boolean") bRaw = _3;
      else if(typeof _3 === "function") callIf = _3;
      if(typeof _4 === "function") callIf = _4;

      if(typeof _Index === "boolean" || _Index === void 0) { bAll = true; bArray = true; } // boolean value, then take all columns
      else if(Array.isArray(_Index) === false) (<unknown[]>_Index) = [ (<string | number>_Index) ];
      else bArray = true;

      let iEnd = bAll ? this.m_aColumn.length : (<unknown[]>_Index).length;
      for(let i = 0; i < iEnd; i++) {
         let _Position: string | number = bAll ? i : _Index[i];
         if(bAll) { column = this.m_aColumn[ i ]; }
         else {
            if(bRaw) column = this.m_aColumn[ _Position ];
            else column = this._column(_Position);
         }

         if(Array.isArray(_Property)) {
            let a = [];
            _Property.forEach((s) => {
               let [ s0, s1 ] = s.split("."); // format to find property is property_name.property_name because some properties are in child objects
               let v = column[ s0 ];
               if(s1 && v) v = v[ s1 ];
               a.push(v);
            });
            
            if(!callIf) aReturn.push([ _Position, a ]);
            else if(callIf(column) === true) aReturn.push([ _Position, a ]);

         }
         else {
            let [ s0, s1 ] = _Property.split("."); // format to find property is property_name.property_name because some properties are in child objects
            let v = column[ s0 ];
            if(s1 && v) v = v[ s1 ];

            if(!callIf) aReturn.push([ _Position, v ]);
            else if(callIf(column) === true) aReturn.push([ _Position, v ]);
         }
      }

      if(bArray) return aReturn;                                               // return index and value for property in array

      return aReturn[ 0 ][ 1 ];                                                // return primitive value for property
   }

   COLUMNGetIndexForPropertyValue(sProperty: string, _Value?: unknown ): number[] {
      let aReturn: number[] = [];

      let [ s0, s1 ] = sProperty.split(".");

      this.m_aColumn.forEach((c, i) => {
         if( 
            (s1 && c[s0][s1] === _Value) ||
             (c[s0] === _Value)
          ) {
            const iIndex = this._index_in_ui( i );
            if( iIndex >= 0 ) aReturn.push( iIndex );
         }
      });

      return aReturn;
   }

   static GetPropertyValue(aSource: any, _Index: boolean | number | string | number[] | string[], _Property: string | string[], _Raw?: boolean | ((value: string|number) => any) ): unknown | [ string | number, unknown ][] {
      let o: any;
      let bArray = false;
      let bAll = false;
      let aReturn: [ string | number, unknown ][] = [];

      if(typeof _Index === "boolean" || _Index === void 0) { bAll = true; bArray = true; } // boolean value, then take all columns
      else if(Array.isArray(_Index) === false) (<unknown[]>_Index) = [ (<string | number>_Index) ];
      else bArray = true;

      if(Array.isArray(aSource) === false) aSource = [ aSource ];              // convert to array if object
      let iEnd = bAll ? aSource.length : (<unknown[]>_Index).length;           // items to iterate to extract value
      for(let i = 0; i < iEnd; i++) {
         let _Position: string | number = bAll ? i : _Index[ i ];              // position to get object used to look for value in
         if(bAll) { o = aSource[ i ]; }                                        // get object from source
         else {
            if(_Raw === true) o = aSource[ _Position ];                        // get object from source
            else o = (<((value: string | number) => any)>_Raw)(_Position);     // get object using callback
         }

         if(Array.isArray(_Property)) {
            let a = [];
            _Property.forEach((s) => {
               let [ s0, s1 ] = s.split("."); // format to find property is property_name.property_name because some properties are in child objects
               let v = o[ s0 ];
               if(s1 && v) v = v[ s1 ];
               a.push(v);
            });
            aReturn.push([ _Position, a ]);
         }
         else {
            let [ s0, s1 ] = _Property.split("."); // format to find property is property_name.property_name because some properties are in child objects
            let v = o[ s0 ];
            if(s1 && v) v = v[ s1 ];

            aReturn.push([ _Position, v ]);
         }
      }

      if(bArray) {                                                             // return index and value for property in array
         // More than one value, always return array. If boolean index and it is true then return array
         if((aReturn.length > 1) || (aReturn.length === 1 && typeof _Index === "boolean" && _Index === true)) return aReturn;
      }

      return aReturn.length === 1 ? aReturn[ 0 ][ 1 ] : null;                  // return primitive value for property
   }


   /**
    * check if property value exists in column properties
    * @param {boolean | number | string | number[] | string[]} _Index index to columns that are checked
    * @param _Property
    * @param _Value
    */
   COLUMNHasPropertyValue(_Index: boolean | number | string | number[] | string[], _Property: string | string[], _Value?: unknown | unknown[]): boolean {
      return CTableData.HasPropertyValue(this.m_aColumn, <any>_Index, _Property, _Value);
   }


   static HasPropertyValue(aSource: any, bAll: boolean, _Property: string | string[], _Value?: unknown | unknown[]): boolean;
   static HasPropertyValue(aSource: any, _Index: number | string, _Property: string | string[], _Value?: unknown | unknown[]): boolean;
   static HasPropertyValue(aSource: any, aIndex: number[] | string[], _Property: string | string[], _Value?: unknown | unknown[]): boolean;
   static HasPropertyValue(aSource: any, _2: any, _Property: any, _Value?: unknown | unknown[] ): boolean {
      let o: any;
      let bAll = false;
      let bReturn: boolean = false;
      let aIndex: (number | string)[];

      if(typeof _2 === "boolean" || _2 === void 0) bAll = _2;
      else if(Array.isArray(_2) === false) aIndex = [ _2 ];
      else {
         aIndex = _2;
      }

      let compare = (v, a: unknown | unknown[]): boolean =>  {
         if(Array.isArray(a)) return a.indexOf(v) !== -1;
         if( a === void 0 && v) return true;
         else return v === a;
      };


      let iEnd: number = bAll ? aSource.length : (<unknown[]>_2).length;       // items to iterate to extract value
      for(let i: number = 0; i < iEnd && bReturn === false; i++) {             // items to iterate to extract value
         let _Position: string | number = bAll ? i : aIndex[ i ];              // position to get object used to look for value in
         if(bAll) { o = aSource[ i ]; }                                        // get object from source
         else {
            if(bAll === true) o = aSource[ _Position ];                        // get object from source
            //else o = (<((value: string | number) => any)>_Raw)(_Position);     // get object using callback
         }

         if(Array.isArray(_Property)) {
            let a = [];
            for(let j = 0; j < _Property.length && bReturn === false; j++) {
               let [ s0, s1 ] = _Property[j].split(".");                      // format to find property is property_name.property_name because some properties are in child objects
               let v = o[ s0 ];
               if(s1 && v) v = v[ s1 ];
               bReturn = compare(v, _Value);
            }
         }
         else {
            let [ s0, s1 ] = _Property.split("."); // format to find property is property_name.property_name because some properties are in child objects
            let v = o[ s0 ];
            if(s1 && v) v = v[ s1 ];
            if( v !== undefined ) bReturn = compare(v, _Value);
         }
      }

      return bReturn;
   }

   /**
    * Set property value for column
    * @param {boolean|number|string|number[]} _Index index or name for column that you want to set
    * @param {string | string[]} _Property property name, if child property remember the format is "property.property"
    * @param {unknown} _Value value set to property, if array then each array value are matched to column setting multiple column properties
    * @param {boolean} [bRaw] Index for column will use direct index in internal column array.
    * @returns {unknown} old property value
    */
   COLUMNSetPropertyValue(_Index: boolean | number | string | number[] | string[], _Property: string | string[], _Value: unknown, _Raw?: boolean): unknown | unknown[] {
      let column: details.column;
      let bArray = false;
      let bAll = false;
      let _Old: [ number | string, unknown][] = [];

      if(typeof _Index === "boolean" || _Index === void 0) { bAll = true; bArray = true; } // boolean value, then take all columns
      else if(Array.isArray(_Index) === false) (<unknown[]>_Index) = [ (<string | number>_Index) ];
      else bArray = true;

      let iEnd = bAll ? this.m_aColumn.length : (<unknown[]>_Index).length;
      for(let i = 0; i < iEnd; i++) {
         let _Position: string | number = bAll ? i : _Index[ i ];
         if(bAll) { column = this.m_aColumn[ i ]; }
         else {
            if(_Raw === true) column = this.m_aColumn[ _Position ];
            else column = this._column(_Position);
         }                                                  console.assert( column !== undefined, "No column for position: " + _Position.toString() );

         if(Array.isArray(_Property)) {
            _Property.forEach((s,i) => {
               let [ s0, s1 ] = s.split("."); // format to find property is property_name.property_name because some properties are in child objects
               
               if(column.hasOwnProperty(s0) === false) {
                  if(typeof s1 === "string") column[ s0 ] = {};
               }
               if(typeof s1 === "string") {
                  _Old.push([_Position,column[ s0 ][ s1 ]]);
                  if( !Array.isArray(_Value) ) column[ s0 ][ s1 ] = _Value;
                  else column[ s0 ][ s1 ] = _Value[i];
               }
               else {
                  _Old.push([ _Position, column[ s0 ] ]);
                  if(!Array.isArray(_Value) || bArray === false) {
                     if( typeof _Value === "object" && !Array.isArray(_Value) && _Value !== null ) Object.assign( column[ s0 ], _Value );
                     else column[ s0 ] = _Value;
                  }
                  else column[ s0 ] = _Value[i];
               }
            });
         }
         else {
            let [ s0, s1 ] = _Property.split("."); // format to find property is property_name.property_name because some properties are in child objects

            if(column.hasOwnProperty(s0) === false) {
               if(typeof s1 === "string") column[ s0 ] = {};
            }
            if(typeof s1 === "string") {
               _Old.push([ _Position, column[ s0 ][ s1 ] ]);
               if(!Array.isArray(_Value) || bArray === false) {
                  if( typeof _Value === "object" && !Array.isArray(_Value) && _Value !== null ) Object.assign( column[ s0 ][ s1 ], _Value );
                  else column[ s0 ][ s1 ] = _Value;
               }
               else column[ s0 ][ s1 ] = _Value[i];
            }
            else {
               _Old.push([ _Position, column[ s0 ] ]);
               if(!Array.isArray(_Value) || bArray === false) {
                  if( typeof _Value === "object" && !Array.isArray(_Value) && _Value !== null ) Object.assign( column[ s0 ], _Value );
                  else column[ s0 ] = _Value;
               }
               else column[ s0 ] = _Value[i];
            }
         }
      }

      if(bArray) return _Old;                                                  // return index and value for property in array

      return _Old[ 1 ];                                                        // return primitive value for property
   }


   /**
    * Set property value for item or items in array
    * @param {TYPE[]} aTarget index or name for column that you want to set
    * @param {boolean|number|string|number[]} _Index index or name for column that you want to set
    * @param {string | string[]} _Property property name, if child property remember the format is "property.property"
    * @param {unknown} _Value value set to property, if array then each array value are matched to column setting multiple column properties
    * @param {boolean} [bRaw] Index for column will use direct index in internal column array.
    * @returns {unknown} old property value
    */
   static SetPropertyValue<TYPE>(aTarget: TYPE[], _Index: boolean | number | number[] | string[], _Property: string | string[], _Value: unknown): unknown | unknown[] {
      let column: TYPE;
      let bArray = false;
      let bAll = false;
      let _Old: [ number | string, unknown][] = [];

      if(typeof _Index === "boolean" || _Index === void 0) { bAll = true; bArray = true; } // boolean value, then take all columns
      else if(Array.isArray(_Index) === false) (<unknown[]>_Index) = [ (<string | number>_Index) ];
      else bArray = true;

      let iEnd = bAll ? aTarget.length : (<unknown[]>_Index).length;
      for(let i = 0; i < iEnd; i++) {
         let iPosition: number = bAll ? i : _Index[ i ];
         if(bAll) { column = aTarget[ i ]; }
         else {
            column = aTarget[ iPosition ];
         }

         if(Array.isArray(_Property)) {
            _Property.forEach((s,i) => {
               let [ s0, s1 ] = s.split("."); // format to find property is property_name.property_name because some properties are in child objects
               
               if(column.hasOwnProperty(s0) === false) {
                  if(typeof s1 === "string") column[ s0 ] = {};
               }
               if(typeof s1 === "string") {
                  _Old.push([iPosition,column[ s0 ][ s1 ]]);
                  if( !Array.isArray(_Value) ) column[ s0 ][ s1 ] = _Value;
                  else column[ s0 ][ s1 ] = _Value[i];
               }
               else {
                  _Old.push([ iPosition, column[ s0 ] ]);
                  if(!Array.isArray(_Value) || bArray === false) {
                     if( typeof _Value === "object" && !Array.isArray(_Value) && _Value !== null ) Object.assign( column[ s0 ], _Value );
                     else column[ s0 ] = _Value;
                  }
                  else column[ s0 ] = _Value[i];
               }
            });
         }
         else {
            let [ s0, s1 ] = _Property.split("."); // format to find property is property_name.property_name because some properties are in child objects

            if(column.hasOwnProperty(s0) === false) {
               if(typeof s1 === "string") column[ s0 ] = {};
            }
            if(typeof s1 === "string") {
               _Old.push([ iPosition, column[ s0 ][ s1 ] ]);
               if(!Array.isArray(_Value) || bArray === false) {
                  if( typeof _Value === "object" && !Array.isArray(_Value) && _Value !== null ) Object.assign( column[ s0 ][ s1 ], _Value );
                  else column[ s0 ][ s1 ] = _Value;
               }
               else column[ s0 ][ s1 ] = _Value[i];
            }
            else {
               _Old.push([ iPosition, column[ s0 ] ]);
               if(!Array.isArray(_Value) || bArray === false) {
                  if( typeof _Value === "object" && !Array.isArray(_Value) && _Value !== null ) Object.assign( column[ s0 ], _Value );
                  else column[ s0 ] = _Value;
               }
               else column[ s0 ] = _Value[i];
            }
         }
      }

      if(bArray) return _Old;                                                  // return index and value for property in array

      return _Old[ 1 ];                                                        // return primitive value for property
   }


   /**
    * Set type for columns based on value types in array:
    * Remember to take array with values that match number of values in each row.
    * @param aType array with values that types are extracted from
    *//**
    * Set type for specified column
    * @param {number} iIndex index to column type is set to
    * @param {unknown|details.type} _Type Column type, if single value function tries to figure out what type it is
    */
   COLUMNSetType(aType: unknown[]);
   COLUMNSetType(iIndex: number, _Type: unknown|details.type);
   COLUMNSetType(sName: string, _Type: unknown|details.type);
   COLUMNSetType(_1: any, _2?: any) {
      if( typeof _1 === "number" ) _1 = [[this._index(_1), _2]];
      else if( typeof _1 === "string" ) _1 = [[this._index(_1), _2]];
      else if(_2 !== undefined && Array.isArray(_1)) {
         let a: any = [];
         _1.forEach((iColumn) => { 
            a.push( [iColumn, _2] );
         });
         _1 = a;
      }

      _1.forEach((v: unknown, i: number) => {
         let iColumn = i;
         if(Array.isArray(v)) {
            iColumn = v[0];
            v = v[1];
         }

         let oColumn = this.COLUMNGet(iColumn);
         if( oColumn ) {
            const s = typeof v;                                                // parameter type
            if( s === "string" ) {                                             // set column type with javascript type name
               oColumn.type.group = s;
               oColumn.type.type = <number>CTableData.GetJSType(s);
               if(v === "number") oColumn.style.textAlign = "right";
            }
            else if(s !== "object") {
               oColumn.type.group = s;
               oColumn.type.type = <number>CTableData.GetJSType(s);
               if(s === "number") oColumn.style.textAlign = "right";
            }
            else {
               let eType: enumValueType = (<details.type>v).type || enumValueType.unknown;
               if(eType === enumValueType.unknown) {
                  oColumn.type.type = <number>CTableData.GetType( (<details.type>v).name );
                  oColumn.type.name = (<details.type>v).name;
               }
               else if( !(<details.type>v).name ) {
                  oColumn.type.name = <string>CTableData.GetType( (<details.type>v).type );
               }

               if( !(<details.type>v).group ) oColumn.type.group = <string>CTableData.GetJSType( (<details.type>v).type );
            }
         }
      });
   }

   /**
    * Get value in cell
    * @param  {number} iRow index for row in source array
    * @param  {number|string} _Column index or key to column value
    * @param  {number} [iFormat] if raw value cell value from raw row is returned
    */
   CELLGetValue(iRow: number, _Column: string | number, iFormat?: number) {
      iFormat = iFormat || enumFormat.Format;
      let _V: unknown;
      let [ iR, iC ] = this._get_cell_coords(iRow, _Column, (iFormat & enumFormat.Raw) === enumFormat.Raw); // iR = row index, iC = column index
      let aRow: unknown[] = this.m_aBody[ iR ];

      if(Array.isArray(  aRow[ iC ] ) ) {
         if( !(enumFormat.All &iFormat) ) _V = aRow[ iC ][ 0 ];
         else _V = aRow[ iC ];
      }
      else { _V = aRow[ iC ]; }

      if( iFormat & enumFormat.Format ) {
         iC--; // decrease column with one because first value is index key for row
         if( this.m_aColumn[iC].position?.convert ) {
            _V = this.m_aColumn[iC].position.convert( _V, [iR,iC] );
         }
      }

      return _V;
   }


   /**
    * Set value in cell
    * @param  {number} iRow key for row in source array
    * @param  {number|string} _Column index or column name to column value is set to
    * @param  {unknown} value value set to cell
    * @param  {boolean} bRaw if raw value cell value from raw row is set
    */
   CELLSetValue(iRow: number, _Column: string | number, value: unknown, bRaw?: boolean): void;
   CELLSetValue(aRange: [ iR: number, _C: string | number ], value: unknown, bRaw?: boolean): void;
   CELLSetValue(aRange: [ iR1: number, _C1: string | number, iR2: number, _C2: string | number ], value: unknown, bRaw?: boolean): void;

   CELLSetValue(_Row: any, _Column: any, value?: unknown, bRaw?: boolean) {
      if(Array.isArray(_Row) && _Row.length === 2) {
         bRaw = <boolean>value;
         value = _Column;
         [ _Row, _Column ] = _Row;
      }

      if(typeof _Row === "number") {
         let [ iR, iC ] = this._get_cell_coords(_Row, _Column, bRaw);
         let aRow: unknown[] = this.m_aBody[ iR ];

         if(aRow[ iC ] instanceof Array) { // is current value array
            if(Array.isArray(value) == false) aRow[ iC ][ 0 ] = value; // if not value is array, then replace first value in array
            else aRow[ iC ] = value; // value is array, replace 
         }
         else { aRow[ iC ] = value; } // new value to cell
      }
      else if(Array.isArray(_Row) === true) {
         let aRow: unknown[]; // active row
         bRaw = <boolean>value; // only three arguments, fix raw
         value = _Column; // only three arguments, fix value
         let [ iR1, iC1, iR2, iC2 ] = _Row;                    // convert to variables
         [ iR1, iC1 ] = this._get_cell_coords(iR1, iC1, bRaw); // get physical positions
         [ iR2, iC2 ] = this._get_cell_coords(iR2, iC2, bRaw); // get physical positions
         if(iR1 > iR2) iR2 = [ iR1, iR2 = iR1 ][ 0 ];
         if(iC1 > iC2) iC2 = [ iC1, iC2 = iC1 ][ 0 ];

         for(let iR = iR1; iR <= iR2; iR++) {
            aRow = this.m_aBody[ iR ];
            for(let iC = iC1; iC <= iC2; iC++) {
               if(aRow[ iC ] instanceof Array) {
                  if(Array.isArray(value) == false) aRow[ iC ][ 0 ] = value;
                  else aRow[ iC ] = value;
               }
               else { aRow[ iC ] = value; }
            }
         }
      }
   }


   /**
    * Is value in cell array or a primitive, if array then this return true
    * @param  {number} iRow key for row in source array
    * @param  {number|string} _Column index or name for column where value is checked for array value
    * @param  {boolean} bRaw if raw then iRow access index in internal source array (not row key)
    */
   CELLIsArray(iRow: number, _Column: string | number, bRaw?: boolean): boolean {
      let [ iR, iC ] = this._get_cell_coords(iRow, _Column, bRaw); // iR = row index, iC = column index
      let aRow: unknown[] = this.m_aBody[ iR ];
      if(aRow[ iC ] instanceof Array) return true;
      return false;
   }


   /**
    * Get number of rows in table
    * @param {boolean} [bRaw] if raw then return all rows in internal body, otherwise header and footer rows are subtracted
    */
   ROWGetCount(bRaw?: boolean): number {
      if(bRaw) return this.m_aBody.length;

      return this.m_aBody.length - this.m_iHeaderSize - this.m_iFooterSize;
   }

   /**
    * Return internal physical index to row
    * @param iRow key to row that physical index is returned for
    */
   ROWGetRowIndex(iRow: number): number { return this._row(iRow); }

   /**
    * Return values for row as array
    * @param iRow key to row or if bRay it is the physical index
    * @param bRaw if true then access internal row
    */
   ROWGet(iRow: number, bRaw?: boolean): unknown[] {
      if( bRaw !== true ) iRow = this._row(iRow); // row position in body
      if(iRow === -1) return null;
      const aRow = this.m_aBody[ iRow ];
      if(bRaw === true) return aRow;

      let a = [];
      const iTo = aRow.length;
      for(let i = 1; i < iTo; i++) {
         a.push(aRow[ i ]);
         if(Array.isArray(a[ i ])) a[ i ] = a[ i ][ 0 ];
      }
      return a;
   }

   /**
    * Set values to cells in row. Using this you need to know the internal data. No checking is done
    * @param {number} iRow Index to row where column values are set
    * @param {unknown} [_Value] Value set to row cells
    * @param {boolean} [bRaw] if raw position in internal data is used, if not true then `iRow` is the row index
    */
   ROWSet(iRow: number, _Value?: unknown, bRaw?: boolean ): void;
   ROWSet(iRow: number, aValue: unknown[], bRaw?: boolean ): void;
   ROWSet(iRow: number, _2?: any, bRaw?: boolean ): void {
      if( bRaw !== true ) iRow = this._row(iRow); // row position in body
      let aRow = this.m_aBody[ iRow ];
      if(Array.isArray(_2) === false) {
         let v = _2;
         if( v === undefined ) v = null;
         let i = aRow.length;
         while(--i >= 1) { // first value in row is the row key, do not modify that value
            if( Array.isArray( aRow[i] ) === false ) aRow[i] = v
            else aRow[i][0] = v;
         }
      }
      else {
         let a = _2;
         let iTo = Math.min( (aRow.length - 1), a.length );                   // first value in row is key to record, subtract to get then real value length
         for(let i = 0; i < iTo; i++) {
            if( a[i] === undefined ) continue;                                // skip undefined values
            const iR = i + 1;
            if( Array.isArray( aRow[iR] ) === false ) aRow[iR] = a[i];
            else aRow[iR][0] = aRow[iR] = a[i];
         }
      }
   }

   /**
    * Append rows to table. Added rows will always add one more compared to number of columns. First rows holds index number for row.
    * @param {number | unknown[] | unknown[][]} _Row number of rows, or array of values added to row
    * @param {boolean} [bRaw] if true then add to body without calculating position
    * @returns [number,number] keys to added rows, first key and first and one more than last key for added rows
    */
   ROWAppend(_Row?: number | unknown[] | unknown[][], bRaw?: boolean): [ number, number ] {
      let iFirst: number = -1;
      _Row = _Row || 1;
      let aRow: unknown[][] = [];
      let iColumnCount = this.COLUMNGetCount() + 1; // OBS! One more compared to number of columns, first column is row index value
      if(typeof _Row === "number") {
         for(let i = 0; i < _Row; i++) { aRow.push(new Array(iColumnCount)); }
      }
      else {
         aRow = <unknown[][]>_Row;
         if(aRow.length === 0) return;
         if(Array.isArray(aRow[ 0 ]) === false) { (<unknown[]><unknown>aRow).unshift(-1); aRow = [ aRow ]; }
      }

      if(bRaw || this.m_iFooterSize === 0) {
         iFirst = this.m_iNextKey;
         aRow.forEach((row) => {
            row[0] = this.m_iNextKey++;
         });
         this.m_aBody = this.m_aBody.concat(aRow);
      }
      else {
         let iPosition = this.ROWGetCount(true) - this.m_iFooterSize;
         let iIndex: number = this.m_aBody.length ? <number>this.m_aBody[ iPosition ][ 0 ] : 0;
         for(let i = 0; i < aRow.length; i++) {
            this.m_aBody.splice(iPosition + i, 0, aRow[i]);
         }

         // Set new indexes
         let iEnd = this.m_aBody.length;
         iFirst = this.m_iNextKey;
         for(let i = iIndex; i < iEnd; i++) { this.m_aBody[ i ][ 0 ] = this.m_iNextKey++;  }
      }

      return [ iFirst, this.m_iNextKey ];
   }

   /**
    * 
    * @param {number} iRow row position  where to insert new rows
    * @param _Row
    * @returns [number,number] keys to added rows, first key and first and one more than last key for added rows
    */
   ROWInsert(iRow: number, _Row?: number | unknown[] | unknown[][]): [ number, number ] {
      _Row = _Row || 1;                                                        // 1 row is default
      let iFirst: number = -1;
      let iCount: number;
      let aRow: unknown[][] = [];
      iRow = this._row(iRow); // get row position in body
      let iColumnCount = this.COLUMNGetCount() + 1; // OBS! One more compared to number of columns, first column is row index value

      if(typeof _Row === "number") {
         iCount = _Row;
         for(let i = 0; i < iCount; i++) {
            aRow.push(new Array(iColumnCount));
            iFirst = this.m_iNextKey;
            aRow[ aRow.length - 1 ][ 0 ] = this.m_iNextKey++;
         }
      }
      else {
         aRow = <unknown[][]>_Row;
         if(aRow.length === 0) return;

         if(Array.isArray(aRow[ 0 ]) === false) { aRow = [ aRow ]; }
         // Prepare rows for insertion
         for(let i = 0; i < aRow.length; i++) {
            let a = aRow[ i ];
            iFirst = this.m_iNextKey;
            a.unshift(this.m_iNextKey++);
            for(let j = a.length; j < iColumnCount; j++) { a.push(null); }
         }
      }

      // Rows are prepared, time to insert
      this.m_aBody.splice(iRow, 0, aRow);
      return [ iFirst, this.m_iNextKey ];
   }

   ROWRemove(iRow: number, iLength?: number): unknown[] {
      iLength = iLength || 1;         
      return this.m_aBody.splice(iRow, iLength);
   }

   /**
    * Expands each row in table with 1 or more columns
    * @param {number} iCount number of columns to expand
    * @param {unknown} [_Value] if expanded columns has default value
    * @param {number|string} [_Where] position in row where new values are inserted
    */
   ROWExpand(iCount?: number, _Value?: unknown, _Where?: number|string ): void {
      iCount = iCount || 1;
      let a = new Array(iCount); // array to append to each row
      if(_Value !== undefined) a.fill(_Value); // default value in array
      let i = this.m_aBody.length;
      if( _Where === undefined ) {
         while(--i >= 0) {
            for(let j = 0; j < a.length; j++) this.m_aBody[ i ].push(a[ j ]);
         }
      }
      else {
         const iWhere = this._index(_Where) + 1;                              // remember to add 1 because first value is internal key value for row
         while(--i >= 0) {
            let aRow = this.m_aBody[ i ];
            if( iCount === 1 ) aRow.splice( iWhere, 0, _Value );
            else aRow.splice( iWhere, 0, ...a );
         }
      }
   }

   /**
    * Set row as dirty (dirty = modified)
    * @param iKey key to row that is set as dirty
    * @returns number of dirty rows
    */
   DIRTYSet(iKey: number): number {
      let i = this.m_aDirtyRow.length;
      while(--i >= 0) {
         if(iKey === this.m_aDirtyRow[i]) return;
      }
      this.m_aDirtyRow.push(iKey);
      return this.m_aDirtyRow.length;
   }

   DIRTYRemove(iKey: number): void {
      let i = this.m_aDirtyRow.length;
      while(--i >= 0) {
         if(iKey === this.m_aDirtyRow[ i ]) { this.m_aDirtyRow.splice(i, 1); break; }
      }
   }

   HISTORYPush(_Row: number | [number,number|string], _Column: string | number) {
      let iRow: number, iR: number, iC: number;

      if(Array.isArray(_Row)) {
         iRow = _Row[0];
         _Column = _Row[1];
      }
      else iRow = _Row;

      iR = this._row( iRow );
      iC = this._index(_Column);

      this.m_aHistory.push( [iRow , iC, this.m_aBody[iR][iC] ] );             // Add to history
   }

   HISTORYPop(_1?: any, _2?: any): boolean {
      let aHistory = this.m_aHistory;
      if( aHistory.length === 0 ) return false;

      let iC: number = null;
      if( _2 !== undefined ) iC = this._index( _2 );
      let a: [number,number,unknown];

      if(_1 === undefined) {
         a = aHistory.pop();
      }
      else {
         let i = aHistory.length;
         while(--i >= 0) {
            a = aHistory[i];
            if(_1 === a[ 0 ] && (iC === null || iC === a[ 1 ])) {
               a = aHistory.splice( i, 1 )[0];
               break;
            }
         }
         if( i < 0 ) return false;
      }

      const iR = this._row( a[0] );
      
      this.m_aBody[iR][a[1]] = a[2]; // restore value   

      return true;
   }


   /**
    * Convert data to XML
    * @param {unknown[][]} aBody data that is converted to XML
    * @param oOptions
    * @param {number} [oOptions.insert] array with column indexes that is added to xml, indexes are physical indexes
    * @param doc
    */
   XMLGetData(aBody: unknown[][], 
      oOptions: { insert?: number[], columns?: details.column[], values?: string, value?: string }, 
      doc?: XMLDocument 
   ): XMLDocument {
      oOptions = oOptions || {};
      doc = doc || (new DOMParser()).parseFromString("<document/>", "text/xml");
      let xml = doc.documentElement;
      const sValues = oOptions.values || "values";
      const sValue = oOptions.value || "value";

      let aColumn = oOptions.columns || this.m_aColumn;

      const iRowKey = 1;
      const iRowCount = aBody.length;
      const iColumnCount = aBody[0].length;

      let aPass: boolean[];
      if(oOptions.insert) {
         aPass = new Array( iColumnCount );
         aPass.fill(false);
         oOptions.insert.forEach( iIndex => aPass[iIndex] = true );
      }


      for(let iRow = 0; iRow < iRowCount; iRow++) {
         const aRow = aBody[iRow];
         let eValues = xml.appendChild( doc.createElement( sValues ) );
         eValues.setAttribute( "index", iRow.toString() );
         let iColumn = 0
         if(iRowKey === 1) {
            iColumn++;
            eValues.setAttribute( "row", aRow[0].toString() );
         }

         for(; iColumn < iColumnCount; iColumn++) {
            const i = iColumn - iRowKey;
            if( aPass && aPass[i] === false ) continue;
            const v = aRow[iColumn];                                          // get value in row, iColumn has the current row position (remember that first is internal row key)
            const oC = aColumn[i];                                            // get matching column
            let eValue = eValues.appendChild( doc.createElement( sValue ) );

            eValue.setAttribute( "col", i.toString() );
            if( oC.name ) eValue.setAttribute( "name", oC.name );

            eValue.appendChild( doc.createTextNode( v.toString() ) );
         }
      }

      return doc;
   }



   /**
    * 
    * @param aTrigger
    * @param iReason
    * @param aArgument
    * @param callback
    */
   /*
   Trigger(aTrigger: number[], iReason: number, aArgument: any[], callback: (any) => any) {
      let _trigger = (iTrigger: number, iReason: number, aArgument: any[]): boolean => {
         let bOk: boolean = true;
         for(let i = 0; bOk === true && i < this.m_acallTrigger.length; i++) {
            bOk = this.m_acallTrigger[ i ](iTrigger, iReason, aArgument);
            if(typeof bOk !== "boolean") bOk = true;
            
         }
         return bOk;
      };

      let bOk: boolean = true;;
      let iTrigger: number;

      for(let i = 0; bOk === true && i < aTrigger.length; i++) {
         iTrigger = aTrigger[ i ];
         if((iTrigger & TRIGGER_BEFORE) === TRIGGER_BEFORE) {
            bOk = _trigger(iTrigger, iReason, aArgument);
         }
      }

      if(bOk === true) {
         callback(aArgument);
      }

      for(let i = 0; bOk === true && i < aTrigger.length; i++) {
         iTrigger = aTrigger[ i ];
         if((iTrigger & TRIGGER_AFTER) === TRIGGER_AFTER) {
            bOk = _trigger(iTrigger, iReason, aArgument);
         }
      }
   }
   */

   /**
    * 
    * @param iCount
    * @param oColumn
    */
   _create_column(iCount?: number, oColumn?: details.column | object): details.column[] {
      iCount = iCount || 1;
      oColumn = oColumn || {};
      let aColumn: details.column[] = [];
      while(--iCount >= 0) {
         let o = JSON.parse(JSON.stringify(CTableData.s_oColumnOptions));
         aColumn.push({ ...o, ...oColumn });
      }
      return aColumn;
   }

   /**
    * Get column object for index
    * @param {number|string} _Index index to column data returned
    */
   _column(_Index: number | string): details.column {
      let iIndex = this._index( _Index );
      if( iIndex >= 0 ) return this.m_aColumn[iIndex];
      throw "Column for " + _Index.toString() + " not found";
   }

   _row(iKey: number): number {
      let a = this.m_aBody;
      const iTo: number = a.length;
      if(iKey < iTo && a[ iKey ][ 0 ] === iKey) return iKey;                   // optimize: if key matches indexes, then check row for index if same
      for(let i = 0; i < iTo; i++) if(a[ i ][ 0 ] === iKey) return i;
      return -1;
   }

   /**
    * Return index to column in `m_aColumn` where column information is found
    * @param {number|string} _Index index that is converted to index in `m_aColumnIndex`
    */
   _index( _Index: number|string ): number {
      if(typeof _Index === "number") {
         if(!this.m_aColumnIndex) return _Index;
         return this.m_aColumnIndex[_Index];
      }
      else if(typeof _Index === "string") {
         let i = this.m_aColumn.length;
         while(--i >= 0) {
            if(this.m_aColumn[ i ].id === _Index) return i;
         }
         i = this.m_aColumn.length;
         while(--i >= 0) {
            if( this.m_aColumn[i].name === _Index ) return i;
         }
      }

      return -1;
   }

   /**
    * Return (ui) index from raw column index. UI index is index for object that uses table data to store data
    * @param iIndex raw column index in `m_aColumn`
    */
   _index_in_ui(iIndex: number): number {
      if(!this.m_aColumnIndex) return iIndex;
      let i = this.m_aColumnIndex.length;
      while(--i >= 0) {
         if(this.m_aColumnIndex[ i ] === iIndex) return i;
      }
      return -1;
   }

   /**
    * Get physical coordinates for cell in body data
    * @param iRow key for row in source array
    * @param  {number|string} _Column index or key to column value
    * @param bRaw {boolean} if raw value cell value from raw row is returned
    */
   _get_cell_coords(iRow: number, _Column: string | number, bRaw?: boolean): [ number, number ] {
      let iR: number, iC: number;
      if(!bRaw) {
         iR = this._row( iRow );
         iC = this._index(_Column) + 1; // First column among rows has index to row
      }
      else {
         iR = iRow;
         iC = <number>_Column; // if raw then _Column has to be a number
      }

      return [ iR, iC ];
   }

   _validate_coords(iR: number, iC: number): boolean {
      if(iR < this.m_aBody.length && iC < this.m_aColumn.length) return true;
      return false;
   }

   /**
    * 
    * @param {[ unknown[][], number[] ]} aResult Result is returned in array. Format is the table data in first array slot as array and row indexes in second array slot
    * @param {unknown[][]} aBody Body data where result data is taken from
    * @param {number} iBegin From row
    * @param {number} iEnd To row
    * @param options
    */
   static _get_data(aResult: [ unknown[][], number[] ], aBody: unknown[][], iBegin, iEnd,
      options: {
         table?: CTableData,
         convert?: ((value: unknown, aCell: [number, number]) => string)[],
         hide?: number[],
         index?: boolean,
         order?: number[],
         slice?: number
      }): unknown[][] | [ unknown[][], number[] ] {
      let aIndex: number[];
      let aData: unknown[][];
      if(aResult) {
         aData = aResult[ 0 ];
         aIndex = aResult[ 1 ];
      }
      else {
         aData = [];
         aIndex = [];
      }

      let aHidden = options.hide || null,
         aOrder = options.order,
         aConvert = options.convert,   // convert values
         iSlice = options.slice || 1,
         bAddIndex = options.index || false;

      // if columns are reordered then fix array marking hidden columns
      if(aHidden && aOrder) {
         let a = [];
         aOrder.forEach((iPosition, iIndex) => { a.push(aHidden[ iPosition ]); });
         aHidden = a;
      }

      let callOrderAndHide = (aModify: unknown[], aOrder: number[], aHidden: number[]): unknown[] => {
         // How reorder works
         // row = [A,B,C,D,E,F], order = [5,4,3,2,1,0,0,0]
         // create new array
         // loop order array and push value at current index to new array
         // result = [F,E,D,C,B,A,A,A]
         if(aOrder) {
            let a = [];
            aOrder.forEach((iPosition, iIndex) => { a.push(aModify[ iPosition ]); })
            aModify = a;
         }

         // Remove hidden values, only push those that should be displayed
         // Push values that is to be shown.
         if(aHidden) {
            let a = [];
            aHidden.forEach((_H, i) => { if(!_H) a.push(aModify[ i ]); })
            aModify = a;
         }
         return aModify;
      };

      let iAdd = iBegin < iEnd ? 1 : -1;
      for(let iRow = iBegin; iRow !== iEnd; iRow += iAdd) {
         let aRow = aBody[ iRow ];

         aIndex.push(<number>aRow[ 0 ]); // store physical index number to row
         aRow = aRow.slice(iSlice); // create a shallow copy of row

         aRow = callOrderAndHide( aRow, aOrder, aHidden );

         // take first value if array in cell
         aRow.forEach((v, i) => { if(Array.isArray(v)) aRow[ i ] = v[ 0 ]; });

         aData.push(aRow);
      }

      // first step, do we need to convert values ?
      if(aConvert) {
         let aCell: [number,number] = [-1,-1];
         let iRowCount = aData.length;
         aConvert = <((value: unknown, aCell: [number, number]) => string)[]>callOrderAndHide( aConvert, aOrder, aHidden );

         for(let iColumn = 0; iColumn < aConvert.length; iColumn++) {
            if(aConvert[ iColumn ]) {
               //let iC = options.table ? options.table._index(iColumn) : iColumn;
               for(let iRow = 0; iRow < iRowCount; iRow++) {
                  let iR = aIndex[iRow];
                  aCell[0] = iR; 
                  aCell[1] = iColumn; 
                  aData[iRow][iColumn] = aConvert[iColumn]( aData[iRow][iColumn], aCell );
               }
            }
         }
      }

      return [ aData, aIndex ];
   }

   /**
    * Extract data from internal body based on row keys
    * @param aKey array of row keys for rows to extract
    * @param aBody body having data to extract from
    * @param aColumn if specific columns are taken, with aColumn it is possible to select columns to extract
    */
   static _get_data_for_keys(aKey: number[], aBody: unknown[][], aColumn?: number[]): unknown[][] {

      let aReturn: unknown[][] = [];

      let get_row = (iKey: number, aBody: unknown[][]): unknown[] => {
         let aRow: unknown[];
         if(iKey < aBody.length && aBody[ iKey ][ 0 ] === iKey) aRow = aBody[ iKey ];
         else {
            let i = aBody.length;
            while(--i >= 0) {
               if(aBody[ i ][ 0 ] === iKey) { aRow = aBody[ i ]; break; }
            }
         }
         return aRow;
      }

      aKey.forEach((iKey) => { 
         let aRow = get_row( iKey, aBody );
         if(aRow) {
            let a: unknown[] = [];
            aRow.forEach((v) => {
               if( Array.isArray(v) ) a.push( v[0] );
               else a.push(v);
            });
            aReturn.push(a);
         }
      });

      return aReturn;
   }


   /**
    * 
    * @param aBody
    * @param {[ number, number, number ][]} aOrder [index, order, type][]
    */
   static _sort(aBody: unknown[][], aOrder: [ number, boolean, string? ][]): void {
      if(aBody.length === 0 || aOrder.length === 0) return;

      aBody.sort(function(x, y) {
         let iReturn = 0;  // if 0 = equal, -1 = less and 1 = greater
         for(let i: number = 0; i < aOrder.length; i++) {
            let a = aOrder[i];
            let iColumn = a[ 0 ] + 1; // add one because first is always index for row
            let bDesc = a[ 1 ];
            let sType = a.length > 2 ? a[ 2 ] : "string";       // string is default
            let v0 = x[ iColumn ];
            let v1 = y[ iColumn ];

            if(Array.isArray(v0)) v0 = v0[ 0 ];
            if(Array.isArray(v1)) v1 = v1[ 0 ];

            // v0 and v1 is now prepared to be compared
            let iCompare = 0;

            if(sType === "string") {
               if(v0 === void 0) v0 = "";
               else if(typeof v0 !== "string") v0 = v0.toString();
               else v0 = (<string>v0).toLowerCase();
               if(v1 === void 0) v1 = "";
               else if(typeof v1 !== "string") v1 = v1.toString();
               else v1 = (<string>v1).toLowerCase();

               iCompare = v0 < v1 ? -1 : 0;
               if(iCompare === 0) iCompare = v0 > v1 ? 1 : 0;
            }
            else if(sType === "number") {
               if(typeof v0 !== "number") {
                  v0 = Number(v0);
                  if(isNaN(<number>v0)) v0 = 0;
               }
               if(typeof v1 !== "number") {
                  v1 = Number(v1);
                  if(isNaN(<number>v1)) v1 = 0;
               }
               iCompare = v0 < v1 ? -1 : 0;
               if(iCompare === 0) iCompare = v0 > v1 ? 1 : 0;
            }

            iReturn = iCompare;
            if(iCompare !== 0) {
               if(bDesc === true ) iReturn = -iCompare;
               break;
            }
         }
         return iReturn;
      });
   }


   /**
    * Generate information how fields are placed. the position.row and position.hide column properties
    * are checked and based on those information about where field is placed is generated.
    */
   _collect_row_design(): [ [number,number,HTMLElement], number[] ][] {
      let aRow: [ [number,number,HTMLElement], number[] ][] = [ [ [0,0,null], [] ] ];// array used to collect information for each row, format described [ [row index, row priority ], [column indexes...] ] 

      let i = this.m_aColumn.length;

      this.m_aColumn.forEach((oC, iIndex) => {
         const position = oC.position;
         let iColumn = typeof position.index === "number" ? position.index : iIndex;
         if(position.row) {                                                    //  is field not placed in main row ?
            let bPushed = false;
            let i = aRow.length;
            while(--i >= 0) {
               if(position.row === aRow[ i ][ 0 ][ 0 ]) {                      // compare to row index in [ [row index, row priority ], [column indexes...] ]
                  aRow[0][1].push( iColumn  );                                 // push column to row
                  bPushed = true;
               }
            }

            if(bPushed === false) {                                            // row wasn't found, add it
               aRow.push( [ [position.row, 1, null], [iColumn] ] );
            }
         }
         else if(!position.hide) {
            aRow[0][1].push( iColumn );                                        // aRow[0] always has the main row
         }
      });


      // row design is now collected, time to sort it if it contains more than one row (no need to sort if only one).
      if(aRow.length > 0) {
         aRow.sort( (a,b) => {
            return a[0][0] - b[0][0];                                          // sort based on row index.
         });
      }

      return aRow;
   }
}

/**
 * CRowRows is used to collect information about the layout for each row in CTableData.
 * This is important when component working with CTableData needs to render
 * */
export class CRowRows {
   m_aRows: [ [number,number,HTMLElement], number[] ][]; // array used to collect information for each row, format described [ [row index, row level ], [column indexes...] ] 
   constructor( aRows: [ [number,number,HTMLElement], number[] ][] ) {
      this.m_aRows = aRows;
   }

   /**
    * Return number of rows that is needed to generate for one record(row) in table
    */
   get length(): number { return this.m_aRows.length; }

   GetRowLevel(iIndex?: number): number | number[] {
      if( typeof iIndex === "number") return this.m_aRows[iIndex][0][1];

      let a: number[] = [];
      for(let i = 0; i < this.m_aRows.length; i++) { a.push(<number>this.GetRowLevel(i)); }
      return a;
   }

   /**
    * Return row element for index
    * @param {number} iIndex index to row element is returned for
    */
   GetRowElement(iIndex: number): HTMLElement {
      return this.m_aRows[iIndex][0][2];
   }

   /**
    * Return column indexes for row, these are relative positioned indexes from CTableData and should
    * match position for component that uses it
    * @param {number} [iIndex] index for row. if row isn't specified then return columns for row 0 which is the main row.
    */
   GetRowColumns(iIndex?: number): number[] {
      if( typeof iIndex === "number" ) return this.m_aRows[iIndex][1];
      for(let i = 0; i < this.m_aRows.length; i++) {
         if( this.m_aRows[i][0][1] === 0 ) return this.m_aRows[i][1];
      }                                                                        console.assert(false,"columns not found in CRowRows, check code");
      return null;
   }

   /**
    * Set root element for row
    * @param {number} iIndex index for row element is set
    * @param {HTMLElement} eRow root element for row
    */
   SetRowElement(iIndex: number, eRow: HTMLElement) {
      this.m_aRows[iIndex][0][2] = eRow;
   }


   /**
    * When columns are collected they get the position.index value. If that value hasn't been modified to ignore hidden columns this method can be used to recalculate column indexes
    * @param {number[]} aMatch array that has the physical position index for column in table data in array position where value is presentedO
    */
   OffsetColumns( aMatch: number[] ) {
      for( var i = 0; i < this.m_aRows.length; i++ ) {
         let aColumns: number[] = this.m_aRows[i][1];

         for( let j = 0; j < aColumns.length; j++ ) {
            const iPhysical = aColumns[j];
            const iRelative = aMatch.findIndex( v => v === iPhysical );
            aColumns[j] = iRelative;
         }
      }
   }
   

}


// BLOG
// https://marcradziwill.com/blog/mastering-javascript-high-performance/
// https://www.debugbear.com/blog/front-end-javascript-performance
// DOM - https://dev.to/grandemayta/javascript-dom-manipulation-to-improve-performance-459a
// Performance, don't add operations that needs browser to recalculate page until all is done at the end.
// BLOG window.requestIdleCallback()
