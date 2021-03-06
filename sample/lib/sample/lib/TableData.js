// before = 0x10000000
// after  = 0x
// edit   = 0x010000
// load   = 0x020000
// column = 0x030000
const TRIGGER_BEFORE = 0x10000000;
const TRIGGER_AFTER = 0x20000000;
export var browser;
(function (browser) {
    function AddCSS(sCSS) {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = sCSS;
        document.getElementsByTagName('head')[0].appendChild(style);
    }
    browser.AddCSS = AddCSS;
})(browser || (browser = {}));
/**
 *
 * */
export class CTableData {
    constructor(options) {
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
     * Return value type number or type name based on argument
     * @param  {number|string} _T If string then return number for type, if number then return type name
     * @return {number|string} type name or type number
     * @throws {string} information about type if type isn't found
     */
    static GetType(_T) {
        const a = CTableData.s_aType;
        let i = a.length;
        if (typeof _T === "string") {
            while (--i >= 0) {
                if (_T === a[i][0])
                    return a[i][1];
            }
        }
        while (--i >= 0) {
            if (_T === a[i][1])
                return a[i][0];
        }
        throw "unknown type " + _T.toString();
    }
    /**
     * Return internal type number for standard javascript type names
     * @param {string} sType javascript type name
     */
    static GetJSType(_Type) {
        let i = CTableData.s_aJsType.length;
        if (typeof _Type === "string") {
            while (--i >= 0) {
                const a = CTableData.s_aJsType[i];
                if (a[0] === _Type)
                    return a[1];
            }
        }
        else {
            while (--i >= 0) {
                const a = CTableData.s_aJsType[i];
                const iGroup = ((a[1] & 0xffffff00) & _Type); // type flags
                if (iGroup === 0)
                    continue;
                if (_Type !== 65793 /* i1Bool */)
                    return a[1];
                else
                    return "boolean";
            }
        }
        return 0 /* unknown */;
    }
    static ConvertValue(_Value, eType) {
        let _New;
        if (typeof _Value === "string" && !(eType & 262144 /* group_string */)) {
            if (eType & 131072 /* group_real */)
                _New = parseFloat(_Value);
            else if (eType & 65536 /* group_number */)
                _New = parseInt(_Value, 10);
            else if (eType & 1048576 /* group_date */)
                _New = new Date(_Value);
            else if (eType & 256 /* group_boolean */) {
                _New = true;
                switch (_Value.toLowerCase().trim()) {
                    case "false":
                    case "off":
                    case "no":
                    case "0":
                    case "": _New = false;
                }
            }
            else
                _New = undefined;
            return _New;
        }
        return _Value;
    }
    /**
     * Validate value
     * @param {unknown} _Value value to validate against rules in format
     * @param oFormat
     */
    static ValidateValue(_Value, oFormat, eType) {
        var _a;
        let aError;
        if (oFormat.format) {
            eType = eType || ((_a = oFormat.type) === null || _a === void 0 ? void 0 : _a.type);
            oFormat = oFormat.format;
        }
        if (!eType)
            eType = CTableData.GetJSType(typeof _Value);
        _Value = CTableData.ConvertValue(_Value, eType);
        for (const [sKey, _rule] of Object.entries(oFormat)) {
            switch (sKey) {
                case "max":
                    if (((eType & 262144 /* group_string */) && _Value.length > _rule) ||
                        ((eType & 65536 /* group_number */) && _Value > _rule))
                        aError = [false, sKey];
                    break;
                case "min":
                    if (((eType & 262144 /* group_string */) && _Value.length < _rule) ||
                        ((eType & 65536 /* group_number */) && _Value < _rule))
                        aError = [false, sKey];
                    break;
                case "required":
                    if (_Value === void 0 || _Value === null)
                        aError = [false, sKey];
                    break;
            }
        }
        return aError || true;
    }
    /**
     * Return id
     */
    get id() { return this.m_sId; }
    ReadArray(aData) {
        let iBegin = 1, iEnd = aData.length;
        /*
        let add_column = sName => {
           if(this.COLUMNGet(sName, true) === null) {
              this.COLUMNAppend(sName);
              if(this.ROWGetCount(true) !== 0) this.ROWExpand();
           }
        };
        */
        let aRow = aData[0];
        if (this.COLUMNGetCount() === 0) {
            aRow.forEach((sName) => {
                this.COLUMNAppend(sName);
            });
        }
        let iRow = this.ROWGetCount() + this.m_iHeaderSize;
        let aReturn = this.ROWAppend(iEnd - iBegin);
        // Add to body
        for (let i = iBegin; i < iEnd; i++) {
            aRow = aData[i];
            let iTo = aRow.length;
            let aBodyRow = this.m_aBody[iRow];
            for (let j = 0; j < iTo; j++) {
                aBodyRow[j + 1] = aRow[j];
            }
            iRow++;
        }
    }
    /**
     * Read object data
     * @param aList
     * @returns [number,number] keys to added rows, first key and first and one more than last key for added rows
     */
    ReadObjects(aList) {
        if (Array.isArray(aList) === false)
            aList = [aList];
        if (aList.length === 0)
            return null;
        // get first item
        let oFirst = aList[0];
        if (typeof aList !== "object")
            return null;
        let add_column = sName => {
            if (this.COLUMNGet(sName, true) === null) {
                this.COLUMNAppend(sName);
                if (this.ROWGetCount(true) !== 0)
                    this.ROWExpand();
            }
        };
        let aColumns = Object.keys(oFirst);
        aColumns.forEach((sName) => {
            add_column(sName);
        });
        let iRow = this.ROWGetCount() + this.m_iHeaderSize;
        let iRowCount = aList.length;
        let aReturn = this.ROWAppend(iRowCount);
        aList.forEach((oData) => {
            Object.entries(oData).forEach((a) => {
                let iColumn = this._index(a[0]);
                if (iColumn === -1) {
                    add_column(a[0]);
                    iColumn = this._index(a[0]);
                }
                this.CELLSetValue(iRow, iColumn, a[1]);
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
    UIAppend(_1, _2) {
        if (typeof _1 === "string") {
            console.assert(typeof _2["id"] === "string" && typeof _2["name"] === "string", "No \"id\" or \"name\" get method for UI object - " + _1);
            this.m_aUITable.push([_1, _2]);
        }
        else {
            let s = _1.name || _1.id;
            console.assert(s.length > 0, "No name for added ui table");
            this.m_aUITable.push([s, _1]);
        }
        return this.m_aUITable.length;
    }
    UIGet(_1) {
        if (typeof _1 === "number")
            return this.m_aUITable[_1][1];
        else if (typeof _1 === "string") {
            let i = this.m_aUITable.length;
            while (--i >= 0) {
                if (this.m_aUITable[i][0] === _1)
                    return this.m_aUITable[i][1];
            }
            return null;
        }
        return this.m_aUITable;
    }
    /**
     * Return connected ui object for id
     * @param sId id for ui object. All ui objects need a get method called `id` that returns unique id for it.
     */
    UIGetById(sId) {
        let i = this.m_aUITable.length;
        while (--i >= 0) {
            if (this.m_aUITable[i][1].id === sId)
                return this.m_aUITable[i][1];
        }
        return null;
    }
    UILength() { return this.m_aUITable.length; }
    /**
     * Append columns to table data
     * @param {unknown | unknown[]} _Column column data added to table data. if column is sent as string it is treated as column name
     * @param {((_C: unknown[], _Empty: details.column[]) => details.column[])} [convert] Callback method if column need to reformatting to adapt to table data format
     */
    COLUMNAppend(_Column, convert) {
        let aColumn;
        // check if _Column is string, if string it is treated as a name
        if (typeof _Column === "string") {
            _Column = this._create_column(1, { id: _Column, name: _Column, position: { index: this.COLUMNGetCount() } });
        }
        if (Array.isArray(_Column) === false)
            _Column = [_Column];
        if (convert) {
            let a = convert(_Column, aColumn);
            if (Array.isArray(a))
                aColumn = a;
        }
        else
            aColumn = _Column;
        this.m_aColumn = this.m_aColumn.concat(aColumn);
        return this.m_aColumn.length;
    }
    /**
     * Get column object for index or name
     * @param {number | string} _Index return column object for index or name
     * @param {boolean} [bNull] If true and index to column isn't found then return null. Otherwise undefined behavior if column isn't found
     * @param {boolean} [bRaw] if true then position is exact index for column in table data
     */
    COLUMNGet(_Index, bNull, bRaw) {
        if (bRaw)
            this.m_aColumn[_Index];
        else if (!bNull)
            return this._column(_Index);
        let iIndex = this._index(_Index);
        if (iIndex === -1)
            return null;
        return this.m_aColumn[iIndex];
    }
    /**
     * Count columns and return how many.
     * This can also count column with properties, like how many key columns there are.
     * The property sent is name for object property that is investigated. Some properties have child object so the syntax for finding a key is
     * "key.key". Another sample is to find position and in child object we want page. Then the property name is "position.name".
     * @param {string} [sProperty] property name, if child property remember the format is "property.property"
     * @param {string|number} [_Value] Value to compare with if specified values are counted
     */
    COLUMNGetCount(sProperty, _Value) {
        if (!sProperty)
            return this.m_aColumn.length;
        let [s0, s1] = sProperty.split("."); // format to find property is property_name.property_name because some properties are in child objects
        let iCount = 0;
        let iIndex = this.m_aColumn.length;
        this.m_aColumn.forEach(function (o) {
            let v = o[s0];
            if (s1 && v)
                v = v[s1];
            if (v !== undefined) {
                if (_Value === undefined)
                    iCount++;
                else if (v === _Value)
                    iCount++;
            }
        });
    }
    COLUMNGetPropertyValue(_Index, _Property, _3, _4) {
        let column; // column properties
        let bArray = false; // return property value in array with index to column
        let bAll = false; // return selected property values for all columns if true
        let bRaw = false; // if accessing data without recalculate to physical index
        let callIf; // callback used to check if property is added or not
        let aReturn = [];
        if (typeof _3 === "boolean")
            bRaw = _3;
        else if (typeof _3 === "function")
            callIf = _3;
        if (typeof _4 === "function")
            callIf = _4;
        if (typeof _Index === "boolean" || _Index === void 0) {
            bAll = true;
            bArray = true;
        } // boolean value, then take all columns
        else if (Array.isArray(_Index) === false)
            _Index = [_Index];
        else
            bArray = true;
        let iEnd = bAll ? this.m_aColumn.length : _Index.length;
        for (let i = 0; i < iEnd; i++) {
            let _Position = bAll ? i : _Index[i];
            if (bAll) {
                column = this.m_aColumn[i];
            }
            else {
                if (bRaw)
                    column = this.m_aColumn[_Position];
                else
                    column = this._column(_Position);
            }
            if (Array.isArray(_Property)) {
                let a = [];
                _Property.forEach((s) => {
                    let [s0, s1] = s.split("."); // format to find property is property_name.property_name because some properties are in child objects
                    let v = column[s0];
                    if (s1 && v)
                        v = v[s1];
                    a.push(v);
                });
                if (!callIf)
                    aReturn.push([_Position, a]);
                else if (callIf(column) === true)
                    aReturn.push([_Position, a]);
            }
            else {
                let [s0, s1] = _Property.split("."); // format to find property is property_name.property_name because some properties are in child objects
                let v = column[s0];
                if (s1 && v)
                    v = v[s1];
                if (!callIf)
                    aReturn.push([_Position, v]);
                else if (callIf(column) === true)
                    aReturn.push([_Position, v]);
            }
        }
        if (bArray)
            return aReturn; // return index and value for property in array
        return aReturn[0][1]; // return primitive value for property
    }
    static GetPropertyValue(aSource, _Index, _Property, _Raw) {
        let o;
        let bArray = false;
        let bAll = false;
        let aReturn = [];
        if (typeof _Index === "boolean" || _Index === void 0) {
            bAll = true;
            bArray = true;
        } // boolean value, then take all columns
        else if (Array.isArray(_Index) === false)
            _Index = [_Index];
        else
            bArray = true;
        if (Array.isArray(aSource) === false)
            aSource = [aSource]; // convert to array if object
        let iEnd = bAll ? aSource.length : _Index.length; // items to iterate to extract value
        for (let i = 0; i < iEnd; i++) {
            let _Position = bAll ? i : _Index[i]; // position to get object used to look for value in
            if (bAll) {
                o = aSource[i];
            } // get object from source
            else {
                if (_Raw === true)
                    o = aSource[_Position]; // get object from source
                else
                    o = _Raw(_Position); // get object using callback
            }
            if (Array.isArray(_Property)) {
                let a = [];
                _Property.forEach((s) => {
                    let [s0, s1] = s.split("."); // format to find property is property_name.property_name because some properties are in child objects
                    let v = o[s0];
                    if (s1 && v)
                        v = v[s1];
                    a.push(v);
                });
                aReturn.push([_Position, a]);
            }
            else {
                let [s0, s1] = _Property.split("."); // format to find property is property_name.property_name because some properties are in child objects
                let v = o[s0];
                if (s1 && v)
                    v = v[s1];
                aReturn.push([_Position, v]);
            }
        }
        if (bArray) { // return index and value for property in array
            // More than one value, always return array. If boolean index and it is true then return array
            if ((aReturn.length > 1) || (aReturn.length === 1 && typeof _Index === "boolean" && _Index === true))
                return aReturn;
        }
        return aReturn.length === 1 ? aReturn[0][1] : null; // return primitive value for property
    }
    /**
     * check if property value exists in column properties
     * @param {boolean | number | string | number[] | string[]} _Index index to columns that are checked
     * @param _Property
     * @param _Value
     */
    COLUMNHasPropertyValue(_Index, _Property, _Value) {
        return CTableData.HasPropertyValue(this.m_aColumn, _Index, _Property, _Value);
    }
    static HasPropertyValue(aSource, _2, _Property, _Value) {
        let o;
        let bAll = false;
        let bReturn = false;
        let aIndex;
        if (typeof _2 === "boolean" || _2 === void 0)
            bAll = _2;
        else if (Array.isArray(_2) === false)
            aIndex = [_2];
        else {
            aIndex = _2;
        }
        let compare = (v, a) => {
            if (Array.isArray(a))
                return a.indexOf(v) !== -1;
            if (a === void 0 && v)
                return true;
            else
                return v === a;
        };
        let iEnd = bAll ? aSource.length : _2.length; // items to iterate to extract value
        for (let i = 0; i < iEnd && bReturn === false; i++) { // items to iterate to extract value
            let _Position = bAll ? i : aIndex[i]; // position to get object used to look for value in
            if (bAll) {
                o = aSource[i];
            } // get object from source
            else {
                if (bAll === true)
                    o = aSource[_Position]; // get object from source
                //else o = (<((value: string | number) => any)>_Raw)(_Position);     // get object using callback
            }
            if (Array.isArray(_Property)) {
                let a = [];
                for (let j = 0; j < _Property.length && bReturn === false; j++) {
                    let [s0, s1] = _Property[j].split("."); // format to find property is property_name.property_name because some properties are in child objects
                    let v = o[s0];
                    if (s1 && v)
                        v = v[s1];
                    bReturn = compare(v, _Value);
                }
            }
            else {
                let [s0, s1] = _Property.split("."); // format to find property is property_name.property_name because some properties are in child objects
                let v = o[s0];
                if (s1 && v)
                    v = v[s1];
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
    COLUMNSetPropertyValue(_Index, _Property, _Value, _Raw) {
        let column;
        let bArray = false;
        let bAll = false;
        let _Old = [];
        if (typeof _Index === "boolean" || _Index === void 0) {
            bAll = true;
            bArray = true;
        } // boolean value, then take all columns
        else if (Array.isArray(_Index) === false)
            _Index = [_Index];
        else
            bArray = true;
        let iEnd = bAll ? this.m_aColumn.length : _Index.length;
        for (let i = 0; i < iEnd; i++) {
            let _Position = bAll ? i : _Index[i];
            if (bAll) {
                column = this.m_aColumn[i];
            }
            else {
                if (_Raw === true)
                    column = this.m_aColumn[_Position];
                else
                    column = this._column(_Position);
            }
            if (Array.isArray(_Property)) {
                _Property.forEach((s) => {
                    let [s0, s1] = s.split("."); // format to find property is property_name.property_name because some properties are in child objects
                    if (column.hasOwnProperty(s0) === false) {
                        if (typeof s1 === "string")
                            column[s0] = {};
                    }
                    if (typeof s1 === "string") {
                        _Old.push([_Position, column[s0][s1]]);
                        column[s0][s1] = _Value;
                    }
                    else {
                        _Old.push([_Position, column[s0]]);
                        column[s0] = _Value;
                    }
                });
            }
            else {
                let [s0, s1] = _Property.split("."); // format to find property is property_name.property_name because some properties are in child objects
                if (column.hasOwnProperty(s0) === false) {
                    if (typeof s1 === "string")
                        column[s0] = {};
                }
                if (typeof s1 === "string") {
                    _Old.push([_Position, column[s0][s1]]);
                    column[s0][s1] = _Value;
                }
                else {
                    _Old.push([_Position, column[s0]]);
                    column[s0] = _Value;
                }
            }
        }
        if (bArray)
            return _Old; // return index and value for property in array
        return _Old[1]; // return primitive value for property
    }
    COLUMNSetType(_1, _2) {
        if (typeof _1 === "number")
            _1 = [_1, _2];
        else if (_2 !== undefined && Array.isArray(_1)) {
            let a = [];
            _1.forEach((iColumn) => {
                a.push([iColumn, _2]);
            });
            _1 = a;
        }
        _1.forEach((v, i) => {
            let iColumn = i;
            if (Array.isArray(v)) {
                iColumn = v[0];
                v = v[1];
            }
            let oColumn = this.COLUMNGet(iColumn);
            const s = typeof v;
            if (s !== "object") {
                oColumn.type.group = s;
                oColumn.type.type = CTableData.GetJSType(s);
                if (s === "number")
                    oColumn.style.textAlign = "right";
            }
            else {
                let eType = v.type || 0 /* unknown */;
                if (eType === 0 /* unknown */) {
                    oColumn.type.type = CTableData.GetType(v.name);
                    oColumn.type.name = v.name;
                }
                else if (!v.name) {
                    oColumn.type.name = CTableData.GetType(v.type);
                }
                if (!v.group)
                    oColumn.type.group = CTableData.GetJSType(v.type);
            }
        });
    }
    /**
     * Get value in cell
     * @param  {number} iRow index for row in source array
     * @param  {number|string} _Column index or key to column value
     * @param  {number} [iFormat] if raw value cell value from raw row is returned
     */
    CELLGetValue(iRow, _Column, iFormat) {
        var _a;
        iFormat = iFormat || 2 /* Format */;
        let _V;
        let [iR, iC] = this._get_cell_coords(iRow, _Column, (iFormat & 1 /* Raw */) === 1 /* Raw */); // iR = row index, iC = column index
        let aRow = this.m_aBody[iR];
        if (Array.isArray(aRow[iC])) {
            if (!(4 /* All */ & iFormat))
                _V = aRow[iC][0];
            else
                _V = aRow[iC];
        }
        else {
            _V = aRow[iC];
        }
        if (iFormat & 2 /* Format */) {
            iC--; // decrase column with one because first value is index key for row
            if ((_a = this.m_aColumn[iC].format) === null || _a === void 0 ? void 0 : _a.convert) {
                _V = this.m_aColumn[iC].format.convert(_V, [iR, iC]);
            }
        }
        return _V;
    }
    CELLSetValue(_Row, _Column, value, bRaw) {
        if (Array.isArray(_Row) && _Row.length === 2) {
            bRaw = value;
            value = _Column;
            [_Row, _Column] = _Row;
        }
        if (typeof _Row === "number") {
            let [iR, iC] = this._get_cell_coords(_Row, _Column, bRaw);
            let aRow = this.m_aBody[iR];
            if (aRow[iC] instanceof Array) { // is current value array
                if (Array.isArray(value) == false)
                    aRow[iC][0] = value; // if not value is array, then replace first value in array
                else
                    aRow[iC] = value; // value is array, replace 
            }
            else {
                aRow[iC] = value;
            } // new value to cell
        }
        else if (Array.isArray(_Row) === true) {
            let aRow; // active row
            bRaw = value; // only three arguments, fix raw
            value = _Column; // only three arguments, fix value
            let [iR1, iC1, iR2, iC2] = _Row; // convert to variables
            [iR1, iC1] = this._get_cell_coords(iR1, iC1, bRaw); // get physical positions
            [iR2, iC2] = this._get_cell_coords(iR2, iC2, bRaw); // get physical positions
            if (iR1 > iR2)
                iR2 = [iR1, iR2 = iR1][0];
            if (iC1 > iC2)
                iC2 = [iC1, iC2 = iC1][0];
            for (let iR = iR1; iR <= iR2; iR++) {
                aRow = this.m_aBody[iR];
                for (let iC = iC1; iC <= iC2; iC++) {
                    if (aRow[iC] instanceof Array) {
                        if (Array.isArray(value) == false)
                            aRow[iC][0] = value;
                        else
                            aRow[iC] = value;
                    }
                    else {
                        aRow[iC] = value;
                    }
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
    CELLIsArray(iRow, _Column, bRaw) {
        let [iR, iC] = this._get_cell_coords(iRow, _Column, bRaw); // iR = row index, iC = column index
        let aRow = this.m_aBody[iR];
        if (aRow[iC] instanceof Array)
            return true;
        return false;
    }
    /**
     * Get number of rows in table
     * @param {boolean} [bRaw] if raw then return all rows in internal body, otherwise header and footer rows are subtracted
     */
    ROWGetCount(bRaw) {
        if (bRaw)
            return this.m_aBody.length;
        return this.m_aBody.length - this.m_iHeaderSize - this.m_iFooterSize;
    }
    /**
     * Return internal physical index to row
     * @param iRow key to row that physical index is returned for
     */
    ROWGetRowIndex(iRow) { return this._row(iRow); }
    /**
     * Return values for row in array
     * @param iRow key to row or if bRay it is the physical index
     * @param bRaw if true then access internal row
     */
    ROWGet(iRow, bRaw) {
        if (bRaw !== true)
            iRow = this._row(iRow); // row position in body
        if (iRow === -1)
            return null;
        const aRow = this.m_aBody[iRow];
        if (bRaw === true)
            return aRow;
        let a = [];
        const iTo = aRow.length;
        for (let i = 1; i < iTo; i++) {
            a.push(aRow[i]);
            if (Array.isArray(a[i]))
                a[i] = a[i][0];
        }
        return a;
    }
    /**
     * Append rows to table. Added rows will always add one more compared to number of columns. First rows holds index for row.
     * @param {number | unknown[] | unknown[][]} _Row number of rows, or array of values added to row
     * @param {boolean} [bRaw] if true then add to body without calculating position
     * @returns [number,number] keys to added rows, first key and first and one more than last key for added rows
     */
    ROWAppend(_Row, bRaw) {
        let iFirst = -1;
        _Row = _Row || 1;
        let aRow = [];
        let iColumnCount = this.COLUMNGetCount() + 1; // OBS! One more compared to number of columns, first column is row index value
        if (typeof _Row === "number") {
            for (let i = 0; i < _Row; i++) {
                aRow.push(new Array(iColumnCount));
            }
        }
        else {
            aRow = _Row;
            if (aRow.length === 0)
                return;
            if (Array.isArray(aRow[0]) === false)
                aRow = [aRow];
        }
        if (bRaw || this.m_iFooterSize === 0) {
            iFirst = this.m_iNextKey;
            aRow.forEach((row) => {
                row[0] = this.m_iNextKey++;
            });
            this.m_aBody = this.m_aBody.concat(aRow);
        }
        else {
            let iPosition = this.ROWGetCount(true) - this.m_iFooterSize;
            let iIndex = this.m_aBody.length ? this.m_aBody[iPosition][0] : 0;
            for (let i = 0; i < aRow.length; i++) {
                this.m_aBody.splice(iPosition + i, 0, aRow[i]);
            }
            // Set new indexes
            let iEnd = this.m_aBody.length;
            iFirst = this.m_iNextKey;
            for (let i = iIndex; i < iEnd; i++) {
                this.m_aBody[i][0] = this.m_iNextKey++;
            }
        }
        return [iFirst, this.m_iNextKey];
    }
    /**
     *
     * @param {number} iRow row position  where to insert new rows
     * @param _Row
     * @returns [number,number] keys to added rows, first key and first and one more than last key for added rows
     */
    ROWInsert(iRow, _Row) {
        _Row = _Row || 1; // 1 row is default
        let iFirst = -1;
        let iCount;
        let aRow = [];
        iRow = this._row(iRow); // get row position in body
        let iColumnCount = this.COLUMNGetCount() + 1; // OBS! One more compared to number of columns, first column is row index value
        if (typeof _Row === "number") {
            iCount = _Row;
            for (let i = 0; i < iCount; i++) {
                aRow.push(new Array(iColumnCount));
                iFirst = this.m_iNextKey;
                aRow[aRow.length - 1][0] = this.m_iNextKey++;
            }
        }
        else {
            aRow = _Row;
            if (aRow.length === 0)
                return;
            if (Array.isArray(aRow[0]) === false)
                aRow = [aRow];
            // Prepare rows for insertion
            for (let i = 0; i < aRow.length; i++) {
                let a = aRow[i];
                iFirst = this.m_iNextKey;
                a.unshift(this.m_iNextKey++);
                for (let j = a.length; j < iColumnCount; j++) {
                    a.push(null);
                }
            }
        }
        // Rows are prepared, time to insert
        this.m_aBody.splice(iRow, 0, aRow);
        return [iFirst, this.m_iNextKey];
    }
    ROWRemove(iRow, iLength) {
        iLength = iLength || 1;
        return this.m_aBody.splice(iRow, iLength);
    }
    /**
     * Expands each row in table with 1 or more columns
     * @param {number} iCount number of columns to expand
     * @param {unknown} [_Value] if expanded columns has default value
     */
    ROWExpand(iCount, _Value) {
        iCount = iCount || 1;
        let a = new Array(iCount); // array to append to each row
        if (_Value !== undefined)
            a.fill(_Value); // default value in array
        let i = this.m_aBody.length;
        while (--i >= 0) {
            for (let j = 0; j < a.length; j++)
                this.m_aBody[i].push(a[j]);
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
    GetData(oOptions) {
        let o = oOptions || {};
        let iPage = 0;
        let iTotalRowCount = this.ROWGetCount(true);
        let iBeginRow = this.m_iHeaderSize, iEndRow = iTotalRowCount - this.m_iFooterSize, iSlice = 1; // Important, first column in body is the index for row, default is not to add this column to result
        let aResult = [[], []];
        iBeginRow = o.begin || iBeginRow;
        iEndRow = o.end || iEndRow;
        if (o.max && (iEndRow - iBeginRow) > o.max)
            iEndRow = iBeginRow + o.max; // if max number of rows is set, check total and decrease if above.
        let aBody = this.m_aBody;
        let bSortOrHide = this.COLUMNHasPropertyValue(true, ["state.sort", "position.hide"], [1, -1]);
        let bConvert = this.COLUMNHasPropertyValue(true, "format.convert");
        // Check if sort values is needed
        let aSort = o.sort || [];
        let aHide = o.hide || [];
        if (bSortOrHide === true) {
            if (aSort.length === 0) {
                let a = this.COLUMNGetPropertyValue(true, "state.sort");
                a.forEach((s) => {
                    if (s[1]) {
                        aSort.push([s[0], s[1] === -1 ? true : false, "string"]);
                    }
                });
            }
            if (aHide.length === 0) {
                let a = this.COLUMNGetPropertyValue(true, "position.hide");
                a.forEach((aH) => {
                    aHide.push(aH[1]);
                });
            }
        }
        if (aSort.length) {
            aBody = aBody.slice(0);
            CTableData._sort(aBody, aSort);
        }
        CTableData._get_data(aResult, aBody, iBeginRow, iEndRow, { slice: iSlice, hide: aHide.length === 0 ? null : aHide, table: this });
        return aResult;
    }
    Sort(aBody) {
        let aOrder;
        this.m_aColumn.forEach((oColumn, iIndex) => {
            let bDesc = false;
            if (oColumn.state.sort)
                aOrder.push([iIndex, bDesc, "string"]);
        });
    }
    /**
     * Check if any or selected row is dirty (dirty = values are modified)
     * @param {number} [iIndex] Index to row that is checked if dirty
     * @returns {boolean} true if row is dirty when row is specified, or if no row is specified than returns true if any row is dirty. Otherwise false
     */
    IsDirty(iIndex) {
        if (typeof iIndex === "number") {
            for (let i = 0; i < this.m_aDirtyRow.length; i++) {
                if (this.m_aDirtyRow[i] === iIndex)
                    return true;
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
    ValidateCoords(iR, _C) {
        if (typeof _C === "number") {
            return this._validate_coords(iR, _C);
        }
        else if (typeof _C === "string") {
            if (this._index(_C) === -1)
                return false;
        }
        if (iR >= this.m_aBody.length)
            return false;
        return true;
    }
    /**
     *
     * @param aTrigger
     * @param iReason
     * @param aArgument
     * @param callback
     */
    Trigger(aTrigger, iReason, aArgument, callback) {
        let _trigger = (iTrigger, iReason, aArgument) => {
            let bOk = true;
            for (let i = 0; bOk === true && i < this.m_acallTrigger.length; i++) {
                bOk = this.m_acallTrigger[i](iTrigger, iReason, aArgument);
                if (typeof bOk !== "boolean")
                    bOk = true;
            }
            return bOk;
        };
        let bOk = true;
        ;
        let iTrigger;
        for (let i = 0; bOk === true && i < aTrigger.length; i++) {
            iTrigger = aTrigger[i];
            if ((iTrigger & TRIGGER_BEFORE) === TRIGGER_BEFORE) {
                bOk = _trigger(iTrigger, iReason, aArgument);
            }
        }
        if (bOk === true) {
            callback(aArgument);
        }
        for (let i = 0; bOk === true && i < aTrigger.length; i++) {
            iTrigger = aTrigger[i];
            if ((iTrigger & TRIGGER_AFTER) === TRIGGER_AFTER) {
                bOk = _trigger(iTrigger, iReason, aArgument);
            }
        }
    }
    /**
     *
     * @param iCount
     * @param oColumn
     */
    _create_column(iCount, oColumn) {
        iCount = iCount || 1;
        oColumn = oColumn || {};
        let aColumn = [];
        while (--iCount >= 0) {
            let o = JSON.parse(JSON.stringify(CTableData.s_oColumnOptions));
            aColumn.push(Object.assign(Object.assign({}, o), oColumn));
        }
        return aColumn;
    }
    /**
     * Get column object for index
     * @param {number|string} _Index index to column data returned
     */
    _column(_Index) {
        let iIndex = this._index(_Index);
        if (iIndex >= 0)
            return this.m_aColumn[iIndex];
        throw "Column for " + _Index.toString() + " not found";
    }
    _row(iKey) {
        let a = this.m_aBody;
        const iTo = a.length;
        if (iKey < iTo && a[iKey][0] === iKey)
            return iKey; // optimize: if key matches indexes, then check row for index if same
        for (let i = 0; i < iTo; i++)
            if (a[i][0] === iKey)
                return i;
        return -1;
    }
    /**
     * Return index to column in `m_aColumn` where column information is found
     * @param {number|string} _Index index that is converted to index in `m_aColumnIndex`
     */
    _index(_Index) {
        if (typeof _Index === "number") {
            if (!this.m_aColumnIndex)
                return _Index;
            return this.m_aColumnIndex[_Index];
        }
        else if (typeof _Index === "string") {
            let i = this.m_aColumn.length;
            while (--i >= 0) {
                if (this.m_aColumn[i].id === _Index)
                    return i;
            }
            i = this.m_aColumn.length;
            while (--i >= 0) {
                if (this.m_aColumn[i].name === _Index)
                    return i;
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
    _get_cell_coords(iRow, _Column, bRaw) {
        let iR, iC;
        if (!bRaw) {
            iR = this._row(iRow);
            iC = this._index(_Column) + 1; // First column among rows has index to row
        }
        else {
            iR = iRow;
            iC = _Column; // if raw then _Column has to be a number
        }
        return [iR, iC];
    }
    _validate_coords(iR, iC) {
        if (iR < this.m_aBody.length && iC < this.m_aColumn.length)
            return true;
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
    static _get_data(aResult, aBody, iBegin, iEnd, options) {
        let aIndex;
        let aData;
        if (aResult) {
            aData = aResult[0];
            aIndex = aResult[1];
        }
        else {
            aData = [];
            aIndex = [];
        }
        let aHidden = options.hide || null, aOrder = options.order, aConvert = options.convert, // convert values
        iSlice = options.slice || 1, bAddIndex = options.index || false;
        // if columns are reordered then fix array marking hidden columns
        if (aHidden && aOrder) {
            let a = [];
            aOrder.forEach((iPosition, iIndex) => { a.push(aHidden[iPosition]); });
            aHidden = a;
        }
        let callOrderAndHide = (aModify, aOrder, aHidden) => {
            // How reorder works
            // row = [A,B,C,D,E,F], order = [5,4,3,2,1,0,0,0]
            // create new array
            // loop order array and push value at current index to new array
            // result = [F,E,D,C,B,A,A,A]
            if (aOrder) {
                let a = [];
                aOrder.forEach((iPosition, iIndex) => { a.push(aModify[iPosition]); });
                aModify = a;
            }
            // Remove hidden values, only push those that should be displayed
            // Push values that is to be shown.
            if (aHidden) {
                let a = [];
                aHidden.forEach((iHide, iIndex) => {
                    if (iHide !== 1)
                        a.push(aModify[iIndex]);
                });
                aModify = a;
            }
            return aModify;
        };
        let iAdd = iBegin < iEnd ? 1 : -1;
        for (let iRow = iBegin; iRow !== iEnd; iRow += iAdd) {
            let aRow = aBody[iRow];
            aIndex.push(aRow[0]); // store physical index number to row
            aRow = aRow.slice(iSlice); // create a shallow copy of row
            aRow = callOrderAndHide(aRow, aOrder, aHidden);
            // take first value if array in cell
            aRow.forEach((v, i) => {
                if (Array.isArray(v))
                    aRow[i] = v[0];
            });
            aData.push(aRow);
        }
        // first step, do we need to convert values ?
        if (aConvert) {
            let aCell = [-1, -1];
            let iRowCount = aData.length;
            aConvert = callOrderAndHide(aConvert, aOrder, aHidden);
            for (let iColumn = 0; iColumn < aConvert.length; iColumn++) {
                if (aConvert[iColumn]) {
                    //let iC = options.table ? options.table._index(iColumn) : iColumn;
                    for (let iRow = 0; iRow < iRowCount; iRow++) {
                        let iR = aIndex[iRow];
                        aCell[0] = iR;
                        aCell[1] = iColumn;
                        aData[iRow][iColumn] = aConvert[iColumn](aData[iRow][iColumn], aCell);
                    }
                }
            }
        }
        return [aData, aIndex];
    }
    /**
     *
     * @param aBody
     * @param {[ number, number, number ][]} aOrder [index, order, type][]
     */
    static _sort(aBody, aOrder) {
        if (aBody.length === 0 || aOrder.length === 0)
            return;
        aBody.sort(function (a, b) {
            let iReturn = 0; // if 0 = equal, -1 = less and 1 = greater
            for (let i = 0; i < aOrder.length; i++) {
                let iColumn = aOrder[i][0] + 1; // add one because first is always index for row
                let bDesc = aOrder[i][1];
                let sType = aOrder.length > 2 ? aOrder[i][2] : "string"; // string is default
                let v0 = a[iColumn];
                let v1 = b[iColumn];
                if (Array.isArray(v0))
                    v0 = v0[0];
                if (Array.isArray(v1))
                    v1 = v1[0];
                // v0 and v1 is now prepared to be compared
                let iCompare = 0;
                if (sType === "string") {
                    if (v0 === void 0)
                        v0 = "";
                    else if (typeof v0 !== "string")
                        v0 = v0.toString();
                    else
                        v0 = v0.toLowerCase();
                    if (v1 === void 0)
                        v1 = "";
                    else if (typeof v1 !== "string")
                        v1 = v1.toString();
                    else
                        v1 = v1.toLowerCase();
                    iCompare = v0 < v1 ? -1 : 0;
                    if (iCompare === 0)
                        iCompare = v0 > v1 ? 1 : 0;
                }
                else if (sType === "number") {
                    if (typeof v0 !== "number") {
                        v0 = Number(v0);
                        if (isNaN(v0))
                            v0 = 0;
                    }
                    if (typeof v1 !== "number") {
                        v1 = Number(v1);
                        if (isNaN(v1))
                            v1 = 0;
                        iCompare = v0 < v1 ? -1 : 0;
                        if (iCompare === 0)
                            iCompare = v0 > v1 ? 1 : 0;
                    }
                }
                iReturn = iCompare;
                if (iCompare !== 0) {
                    if (bDesc === true)
                        iReturn = -iCompare;
                    break;
                }
            }
            return iReturn;
        });
    }
}
/**
 * Default column options. Changing this will change them globally
 */
CTableData.s_oColumnOptions = {
    alias: null, edit: {}, extra: null, format: {}, id: null, key: {}, name: null, style: {}, position: {}, simple: null, title: null, rule: {}, state: {}, type: {}, value: null
};
CTableData.s_aJsType = [
    ["number", 196619 /* r8 */], ["string", 262160 /* str */], ["boolean", 65793 /* i1Bool */], ["date", 1048624 /* datetime */], ["binary", 524321 /* blob */]
];
CTableData.s_aType = [
    ["i1", 65537 /* i1 */], ["i1Bool", 65793 /* i1Bool */], ["i2", 65538 /* i2 */], ["i4", 65539 /* i4 */], ["i8", 65540 /* i8 */],
    ["u1", 65541 /* u1 */], ["u2", 65542 /* u2 */], ["u4", 65543 /* u4 */], ["u8", 65544 /* u8 */],
    ["r4", 196618 /* r4 */], ["r8", 196619 /* r8 */],
    ["str", 262160 /* str */], ["blobstr", 262161 /* blobstr */], ["utf8", 262162 /* utf8 */], ["ascii", 262163 /* ascii */],
    ["bin", 524320 /* bin */], ["blob", 524321 /* blob */],
    ["file", 524322 /* file */],
    ["datetime", 1048624 /* datetime */], ["date", 1048625 /* date */], ["time", 1048626 /* time */]
];
// BLOG
// https://marcradziwill.com/blog/mastering-javascript-high-performance/
// https://www.debugbear.com/blog/front-end-javascript-performance
// DOM - https://dev.to/grandemayta/javascript-dom-manipulation-to-improve-performance-459a
// Performance, don't add operations that needs browser to recalculate page until all is done at the end.
// BLOG window.requestIdleCallback()
//# sourceMappingURL=TableData.js.map
