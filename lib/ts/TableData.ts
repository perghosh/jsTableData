// before = 0x10000000
// after  = 0x

// edit   = 0x010000
// load   = 0x020000
// column = 0x030000

const TRIGGER_BEFORE = 0x10000000;
const TRIGGER_AFTER  = 0x20000000;

export const enum enumTrigger {
   BeforeSetValue     = 0x10010001,
   AfterSetValue      = 0x20010002,
   BeforeSetRange     = 0x10010003,
   AfterSetRange      = 0x20010004,
}

export const enum enumReason {
   Edit = 0x0001,
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
   end         = 128,
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

   str            = 0x40010,
   blobstr        = 0x40011,
   utf8           = 0x40012,
   ascii          = 0x40013,
   bin            = 0x80020,
   blob           = 0x80021,
   file           = 0x80022,
   date          = 0x100030,

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
         convert?: string | ((value: unknown) => string), // convert logic
         max?: number,     // max value for value, if string it is max number of characters, if number it has the max value
         min?:number,      // Same as max but opposite
         required?: number,// if value is required
         verify?: string | ((value: string) => boolean), // regex string or method to verify value
   };


   /**
    * column type describes each property for columns in table (or form) data
    * */
   export type column = {
      alias?: string,      // alias or label name for field
      edit?: {
         name?: string,    // edit control name used for column
         edit?: boolean,   // if edit is allowed or not
      },
      extra?: any,         // custom data
      format?: details.format,

      /*
      format?: {
         convert?: string | ((value: unknown) => string), // convert logic
         max?: number,     // max value for value, if string it is max number of characters, if number it has the max value
         min?:number,      // Same as max but opposite
         required?: number,// if value is required
         verify?: string | ((value: string) => boolean), // regex string or method to verify value
      },
      */
      id?: string,         // id for column
      list?: [ string | number, string | number ][], // list attached to column
      key?: {
         key?: number,     // if column is key value
         fk?: number,      // if column is a foreign key
      }
      name?: string,       // field name, same name as in database?
      style?: {
         [key: string]: string,
         /*
         textAlign?: number | string,// 0 = left, 1 = right, 2 = center, 3 = justify
         color?: string,
         left?: string,    // left offset position
         top?: string,     // top offset position
         */
      },
      position?: {         // position information
         index?: number,
         col?: number,     // in what column, this is for input forms
         hide?: number,    // if true value like 1 or more this columns is hidden
         page?: number,    // when forms with pages are used, this has the page columns is placed
         row?: number,     // index to row. if table then 0 is same row as main row. negative numbers are above, positive numbers are below. in forms it has the index for row
      },
      rule?: {
         no_sort?: boolean,// column is not allowed to be sorted
      },
      simple?: string,     // a longer simplified name for field, if placeholder it could be used there
      state?: {
         sort?: number,    // sort this column before getting result
         sorted?: number,  // column is sorted
      },
      title?: string,      // used for tool tips
      type: {              // number describing type or object with detailed information about type
         group?: string,   // group name for type like "number" , "string"
         type?: number,    // number for type
         name?: string,    // name for type
      },
      value?: string,      // value shown in field if any or condition default
   }

   export type construct = {
      body?: unknown[][],
      column?: details.column[],
      dirty_row?: number[],
      footer_size?: number,
      header_size?: number,
      id?: string,
      page?: number,       // index for active page if any
      trigger?: ((iTrigger: number, iReason: number, _data: any) => boolean)[],
   }
}

/**
 * 
 * */
export class CTableData {
   m_aBody: unknown[][];   // values
   m_acallTrigger: ((iTrigger: number, iReason: number, _data: any) => boolean)[];
   m_aColumn: details.column[];// array with columns (or fields if used in form)
   m_aColumnIndex?: number[];// If columns have a different order, this points to column in `m_aColumn` and `m_aBody`.
                             // When this is specified always use it to get to column.
   m_aDirtyRow?: number[]; //  Dirty rows
   m_aFooter?: unknown[][];// Footer values, like sticky at bottom if result is presented in table
   m_iFooterSize: number;  // if bottom rows in body is used for something "else"
   m_aHeader?: unknown[][];// Header values, like sticky if result is presented in table
   m_iHeaderSize?: number; // if top rows in body is used for something "else"
   m_sId: string;          // Unique id for source data 
   m_iNextKey: number;     // key counter used to set key to rows. Each row holds a key value
   m_iPage?: number;       // index to active page
   m_aUITable?: [ string, IUITableData][];// UITable objects connected

   /**
    * Default column options. Changing this will change them globally
    */
   static s_oColumnOptions = {
      alias: null, edit: {}, extra: null, format: {}, id: null, key: {}, name: null, style: {}, position: {}, simple: null, title: null, rule: {}, state: {}, type: {}, value: null
   };

   static s_aJsType: [string,enumValueType][] = [
      ["number",enumValueType.r8],["string",enumValueType.str],["boolean",enumValueType.i1Bool],["date",enumValueType.date]
   ];

   /**
    * Return internal type number for standard javascript type names
    * @param {string} sType javascript type name
    */
   static GetJSType(sType: string): enumValueType {
      let i = CTableData.s_aJsType.length;
      while(--i >= 0) {
         const a = CTableData.s_aJsType[i];
         if( a[0] === sType ) return a[1];
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

   /**
    * Validate value
    * @param {unknown} _Value value to validate against rules in format
    * @param oFormat 
    */
   static ValidateValue( _Value: unknown, oFormat: details.format | details.column, eType?: enumValueType ): boolean|[boolean,(string|string[])?] {
      let aError: [boolean?,string?];

      if((<details.column>oFormat).format) {
         eType = eType || (<details.column>oFormat).type?.type;
         oFormat = (<details.column>oFormat).format;
      }

      if( !eType ) eType = CTableData.GetJSType( typeof _Value );

      _Value = CTableData.ConvertValue( _Value, eType );

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
            case "required" : 
               if( _Value === void 0 || _Value === null ) aError = [false,sKey];
               break;
         }
      }

      return <[boolean,string]>aError || true;
   }



   constructor( options: details.construct ) {
      const o = options || {};

      this.m_aBody = o.body || [];
      this.m_acallTrigger = o.trigger || [];
      this.m_aColumn = o.column || [];
      this.m_aDirtyRow = o.dirty_row || [];
      this.m_iFooterSize = o.footer_size || 0;
      this.m_iHeaderSize = o.header_size || 0;
      this.m_sId = o.id || "id" + (new Date()).getUTCMilliseconds();
      this.m_iNextKey = 0;
      this.m_iPage = o.page || 0;
      this.m_aUITable = [];
   }

   /**
    * Return id 
    */
   get id() { return this.m_sId; }


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
         /*
         if(this.COLUMNGet(sName, true) === null) {
            this.COLUMNAppend(sName);
            if(this.ROWGetCount(true) !== 0) this.ROWExpand();
         }
         */
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

   GetBody() { return this.m_aBody; }

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
    * Append columns to table data
    * @param {unknown | unknown[]} _Column column data added to table data. if column is sent as string it is treated as column name
    * @param {((_C: unknown[], _Empty: details.column[]) => details.column[])} [convert] Callback method if column need to reformatting to adapt to table data format
    */
   COLUMNAppend(_Column: unknown | unknown[], convert?: ((_C: unknown[], _Empty: details.column[]) => details.column[])) : number {
      let aColumn: details.column[];

      // check if _Column is string, if string it is treated as a name
      if(typeof _Column === "string") { _Column = this._create_column(1, { id: _Column, name: _Column, position: { index: this.COLUMNGetCount() } });}

      if(Array.isArray(_Column) === false) _Column = [ _Column ];

      if(convert) {
         let a = convert(<unknown[]>_Column, aColumn);
         if(Array.isArray(a)) aColumn = a;
      }
      else aColumn = <details.column[]>_Column;

      this.m_aColumn = this.m_aColumn.concat(aColumn);

      return this.m_aColumn.length;
   }

   /**
    * Get column object for index or name
    * @param {number | string} _Index return column object for index or name
    * @param {boolean} [bNull] If true and index to column isn't found then return null. Otherwise undefined behavior if column isn't found 
    * @param {boolean} [bRaw] if true then position is exact index for column in table data
    */
   COLUMNGet(_Index: number | string, bNull?: boolean, bRaw?: boolean): details.column {
      if(!bNull) return this._column(_Index);

      let iIndex = this._index(_Index);
      if(iIndex === -1) return null;

      return this.m_aColumn[ iIndex ];      
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
   COLUMNHasPropertyValue(_Index: boolean | number | string | number[] | string[], _Property: string | string[], _Value: unknown | unknown[]): boolean {
      return CTableData.HasPropertyValue(this.m_aColumn, <any>_Index, _Property, _Value);
   }


   static HasPropertyValue(aSource: any, bAll: boolean, _Property: string | string[], _Value: unknown | unknown[]): boolean;
   static HasPropertyValue(aSource: any, _Index: number | string, _Property: string | string[], _Value: unknown | unknown[]): boolean;
   static HasPropertyValue(aSource: any, aIndex: number[] | string[], _Property: string | string[], _Value: unknown | unknown[]): boolean;
   static HasPropertyValue(aSource: any, _2: any, _Property: any, _Value: unknown | unknown[] ): boolean {
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
         return v === a;
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
            bReturn = compare(v, _Value);
         }
      }

      return bReturn;
   }

   /**
    * Set property value for column
    * @param {boolean|number|string|number[]} _Index index or name for column that you want to set
    * @param {string | string[]} _Property property name, if child property remember the format is "property.property"
    * @param {unknown} _Value value set to property
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
         }

         if(Array.isArray(_Property)) {
            _Property.forEach((s) => {
               let [ s0, s1 ] = s.split("."); // format to find property is property_name.property_name because some properties are in child objects
               
               if(column.hasOwnProperty(s0) === false) {
                  if(typeof s1 === "string") column[ s0 ] = {};
               }
               if(typeof s1 === "string") {
                  _Old.push([_Position,column[ s0 ][ s1 ]]);
                  column[ s0 ][ s1 ] = _Value;
               }
               else {
                  _Old.push([ _Position, column[ s0 ] ]);
                  column[ s0 ] = _Value;
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
               column[ s0 ][ s1 ] = _Value;
            }
            else {
               _Old.push([ _Position, column[ s0 ] ]);
               column[ s0 ] = _Value;
            }
         }
      }

      if(bArray) return _Old;                                                  // return index and value for property in array

      return _Old[ 1 ];                                                        // return primitive value for property
   }

   /**
    * Set type for columns based on value types in array
    * @param aType array with values that types are extracted from
    */
   COLUMNSetType(aType: unknown[]) {
      aType.forEach((v: unknown, i: number) => {
         let oColumn = this.COLUMNGet(i);
         const s = typeof v;
         oColumn.type.group = s;
         oColumn.type.type = CTableData.GetJSType( s );
         if( s === "number" ) oColumn.style.textAlign = "right";
      });
   }

   /**
    * Get value in cell
    * @param  {number} iRow index for row in source array
    * @param  {number|string} _Column index or key to column value
    * @param  bRaw {boolean} if raw value cell value from raw row is returned
    */
   CELLGetValue(iRow: number, _Column: string | number, bRaw?: boolean) {
      let _V: unknown;
      let [ iR, iC ] = this._get_cell_coords(iRow, _Column, bRaw); // iR = row index, iC = column index
      let aRow: unknown[] = this.m_aBody[ iR ];

      if(aRow[ iC ] instanceof Array) {
         _V = aRow[ iC ][ 0 ];
      }
      else { _V = aRow[ iC ]; }
      return _V;
   }


   /**
    * Set value in cell
    * @param  {number} iRow index for row in source array
    * @param  {number|string} _Column index or key to column value
    * @param  value {variant} value set to cell
    * @param  bRaw {boolean} if raw value cell value from raw row is returned
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
    * @param  {number} iRow index for row in source array
    * @param  {number|string} _Column index or key to column value
    * @param  bRaw {boolean} if raw value cell value from raw row is returned
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
    * Return values for row in array
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
    * Append rows to table. Added rows will always add one more compared to number of columns. First rows holds index for row.
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
         if(Array.isArray(aRow[ 0 ]) === false) aRow = [ aRow ];
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

         if(Array.isArray(aRow[ 0 ]) === false) aRow = [ aRow ];
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
    */
   ROWExpand(iCount?: number, _Value?: unknown): void {
      iCount = iCount || 1;
      let a = new Array(iCount); // array to append to each row
      if(_Value !== undefined) a.fill(_Value); // default value in array
      let i = this.m_aBody.length;
      while(--i >= 0) {
         for(let j = 0; j < a.length; j++) this.m_aBody[ i ].push(a[j]);
      }
   }

   
   /**
    * Return row for index
    * @param iRow index to row
    * @param bRaw use physical index and don't copy row
    */
   /*
   GetRow(_Row: number, bRaw?: boolean): unknown[] {
      let aRow: unknown[];

      let iRow = <number>_Row;
      iRow += this.m_iHeaderSize;
      aRow = this.m_aBody[ iRow ];

      if(!bRaw) {
         Array.from(aRow);
         aRow.shift();
      }

      return aRow;
   }
   */


   /**
    * Return array with rows and if specified another array with row numbers
    * @param oOptions
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

      let bSortOrHide = this.COLUMNHasPropertyValue(true, [ "state.sort", "position.hide" ], [ 1, -1 ]);

      // Check if sort values is needed
      let aSort: [ number, boolean, string?][] = o.sort || [];
      let aHide: number[] = o.hide || [];

      if(bSortOrHide === true) {
         if(aSort.length === 0) {
            let a = <[ number, number ][]>this.COLUMNGetPropertyValue(true, "state.sort");
            a.forEach((s) => {
               if(s[ 1 ]) {
                  aSort.push([ s[ 0 ], s[ 1 ] === -1 ? true : false, "string" ]);
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


      CTableData._get_data(aResult, aBody, iBeginRow, iEndRow, { slice: iSlice, hide: aHide.length === 0 ? null : aHide });

      return aResult;
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
    * 
    * @param aTrigger
    * @param iReason
    * @param aArgument
    * @param callback
    */
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
         iSlice = options.slice || 1,
         bAddIndex = options.index || false;

      // if columns are reordered then fix array marking hidden columns
      if(aHidden && aOrder) {
         let a = [];
         aOrder.forEach((iPosition, iIndex) => { a.push(aHidden[ iPosition ]); });
         aHidden = a;
      }

      let iAdd = iBegin < iEnd ? 1 : -1;
      for(let iRow = iBegin; iRow !== iEnd; iRow += iAdd) {
         let aRow = aBody[ iRow ];

         aIndex.push(<number>aRow[ 0 ]); // store physical index to row
         aRow = aRow.slice(iSlice);


         // How reorder works
         // row = [A,B,C,D,E,F], order = [5,4,3,2,1,0,0,0]
         // create new array
         // loop order array and push value at current index to new array
         // result = [F,E,D,C,B,A,A,A]
         if(aOrder) {
            let a = [];
            aOrder.forEach((iPosition, iIndex) => { a.push(aRow[ iPosition ]); })
            aRow = a;
         }

         // Remove hidden values, only push those that should be displayed
         // Push values that is to be shown.
         if(aHidden) {
            let a = [];
            aHidden.forEach((iHide, iIndex) => { if(iHide !== 1) a.push(aRow[ iIndex ]); })
            aRow = a;
         }

         // take first value if array in cell
         aRow.forEach((v, i) => { if(Array.isArray(v)) aRow[ i ] = v[ 0 ]; });

         aData.push(aRow);
      }

      return [ aData, aIndex ];
   }


   /**
    * 
    * @param aBody
    * @param {[ number, number, number ][]} aOrder [index, order, type][]
    */
   static _sort(aBody: unknown[][], aOrder: [ number, boolean, string? ][]): void {
      if(aBody.length === 0 || aOrder.length === 0) return;

      aBody.sort(function(a, b) {
         let iReturn = 0;  // if 0 = equal, -1 = less and 1 = greater
         for(let i: number = 0; i < aOrder.length; i++) {
            let iColumn = aOrder[ i ][ 0 ] + 1; // add one because first is always index for row
            let bDesc = aOrder[ i ][ 1 ];
            let sType = aOrder.length > 2 ? aOrder[ i ][ 2 ] : "string";       // string is default
            let v0 = a[ iColumn ];
            let v1 = b[ iColumn ];

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

                  iCompare = v0 < v1 ? -1 : 0;
                  if(iCompare === 0) iCompare = v0 > v1 ? 1 : 0;
               }
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



}

// BLOG
// https://marcradziwill.com/blog/mastering-javascript-high-performance/
// https://www.debugbear.com/blog/front-end-javascript-performance
// DOM - https://dev.to/grandemayta/javascript-dom-manipulation-to-improve-performance-459a
// Performance, don't add operations that needs browser to recalculate page until all is done at the end.
// BLOG window.requestIdleCallback()
