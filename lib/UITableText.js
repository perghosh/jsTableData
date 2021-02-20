/* Introduction
 *
 * CUITableText has logic to present information in table where data is stored in CTableData.
 *
 * - COLUMN-methods: column logic
 * - ELEMENT-methods: access elements in ui table
 * - INPUT-methods: editing methods.
 * - ROW-methods: row logic
 
 
 
 
 */
import { CTableData } from "./TableData.js";
import { edit } from "./TableDataEdit.js";
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
 *       div [row=index, type="row"]
 *          span
 *    section [section="footer"]
 *       div [row=index, type="row"]
 *          span
 *    section [section="statusbar"]
 *
 * */
export class CUITableText {
    constructor(options) {
        const o = options || {};
        this.m_acallAction = [];
        if (o.callback_action)
            this.m_acallAction = Array.isArray(o.callback_action) ? o.callback_action : [o.callback_action];
        this.m_acallCreate = [];
        if (o.callback_create)
            this.m_acallCreate = Array.isArray(o.callback_create) ? o.callback_create : [o.callback_create];
        this.m_acallRender = [];
        if (o.callback_render)
            this.m_acallRender = Array.isArray(o.callback_render) ? o.callback_render : [o.callback_render];
        this.m_aRowBody = o.body || [];
        this.m_iColumnCount = 0;
        this.m_eComponent = null;
        this.m_oEdits = o.edits || null;
        this.m_sId = o.id || CUITableText.s_sWidgetName + (new Date()).getUTCMilliseconds() + ++CUITableText.s_iIdNext;
        this.m_aInput = o.edit ? [-1, -1, null] : null;
        this.m_sName = o.name || "";
        this.m_iOpenEdit = 0;
        this.m_aOrder = [];
        this.m_eParent = o.parent || null;
        this.m_aRowPhysicalIndex = null,
            this.m_iRowCount = 0;
        this.m_iRowCountMax = o.max || -1;
        this.m_aSection = o.section || ["toolbar", "title", "header", "body", "footer", "statusbar"]; // sections "header" and "body" are required
        this.m_aSelected = [];
        this.m_iState = 0;
        this.m_oTableData = o.table || null;
        this.m_oTableDataTrigger = o.trigger || null;
        let oStyle = o.style || {};
        this.m_oStyle = { ...CUITableText.s_oStyle, ...oStyle };
        this.m_aValueError = [];
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
        if (o.create !== false) {
            if (this.m_eParent) {
                this.Create();
            }
            if (o.support_element) {
                if (typeof o.support_element === "string")
                    this.m_eSupportElement = this.GetSection(o.support_element);
                else
                    this.m_eSupportElement = o.support_element;
            }
            if (o.edit) {
                if (this.GetSupportElement() !== null)
                    this.INPUTInitialize(); // if edit and support element is set then initialize inputs
                this.set_state(true, 2 /* SetDirtyRow */);
                this.set_state(true, 4 /* SetHistory */);
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
    set name(sName) { this.m_sName = sName; }
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
    is_state(i) { return (this.m_iState & i) !== 0; }
    /**
     *
     * @param _On
     * @param iState
     */
    set_state(_On, iState) {
        this.m_iState = _On ? this.m_iState | iState : this.m_iState & ~iState;
    }
    update(iType) {
        switch (iType) {
            case 18 /* UpdateDataNew */: {
                this.Render();
            }
        }
    }
    Create(callback, eParent) {
        let eComponent = this.GetComponent(true); // create component in not created
        this.create_sections(eComponent, callback);
        if (eComponent.parentElement === null) {
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
    GetComponent(bCreate) {
        if (this.m_eComponent)
            return this.m_eComponent;
        /*
        let aChildren = this.m_eParent.children;
        let i = aChildren.length;
        while(--i >= 0) {
           let e = <HTMLElement>aChildren[ i ];
           if(e.tagName === "SECTION" && e.dataset.id === this.id && e.dataset.section === "section") return <HTMLElement>e;
        }
        */
        //this._trigger(enumTrigger.BeforeCreate);
        if (bCreate === true) {
            let eComponent = document.createElement("section");
            Object.assign(eComponent.dataset, { section: "component", id: this.id, table: this.data.id }); // set "data-" ids.
            this.m_eComponent = eComponent;
            this._has_create_callback("afterCreate", { data: this.data, dataUI: this, eElement: eComponent }, "component");
        }
        return this.m_eComponent;
    }
    /**
     * Element, use this if child elements is to be used. Child elements are added to this
     * @returns {HTMLElement}
     */
    GetSupportElement() {
        console.assert(typeof this.m_eComponent === "object", "Support element not created!");
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
    GetSection(_Name, bNoThrow) {
        let sName;
        if (typeof _Name !== "string") {
            const e = _Name.closest("[data-section]");
            if (e)
                sName = e.dataset.section;
        }
        else
            sName = _Name;
        let i = this.m_aSection.length;
        while (--i >= 0) {
            let a = this.m_aSection[i];
            if (Array.isArray(a) === true && a[0] === sName)
                return a[1];
        }
        if (bNoThrow === true)
            return null;
        throw "No section for \"" + sName + "\" valid sections are: " + this.m_aSection.join(" ");
    }
    /**
     * Return row and column for element
     * @param {HTMLElement} eElement
     * @param {boolean} [bData] Cell index in table data. When hiding columns, index in ui table for
     * column is not same as index in table data. With his parameter you get index for column in table data.
     * @returns {[ number, number, string ]} row index, column index, section name
     */
    GetRowCol(eElement, bData) {
        let eRow = eElement;
        let eCell = eElement;
        while (eRow && eRow.dataset.type !== "row") {
            eCell = eRow;
            eRow = eRow.parentElement;
        }
        if (eRow === null)
            return null;
        let iR = 0;
        let e = eRow.previousElementSibling;
        while (e) {
            iR++;
            e = e.previousElementSibling;
        }
        //let iR = (eRow.dataset.row) ? parseInt(eRow.dataset.row, 10) : 0;
        let iC = 0;
        e = eCell.previousElementSibling;
        while (e) {
            iC++;
            e = e.previousElementSibling;
        }
        e = this.ELEMENTGetSection(eRow);
        if (bData === true)
            iC = this._column_in_data(iC); // if column index should represent index in table data. 
        return [iR, iC, e.dataset.section];
    }
    HideColumn(_1, _2) {
        let bAdd = false;
        let aColumn;
        if (typeof _1 === "number") {
            _1 = this._column_in_data(_1);
            aColumn = [_1];
        }
        else if (Array.isArray(_1))
            aColumn = _1;
        if (typeof _2 === "boolean")
            bAdd = _2;
        if (bAdd === false) {
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
    SetCellValue(_Row, _Column, value, oTriggerData) {
        let bOk;
        let iRow, iColumn; // index for row and column in UI
        const oTrigger = this.trigger; // Get trigger object with trigger logic
        if (Array.isArray(_Row) && _Row.length === 2) {
            oTriggerData = value;
            value = _Column;
            [iRow, iColumn] = _Row;
        }
        else {
            iRow = _Row;
            iColumn = _Column;
        }
        const iDataRow = this._row_in_data(iRow), iDataColumn = this._column_in_data(iColumn); // index for row and column in CTableData, its physical position
        const oColumn = this.data.COLUMNGet(iDataColumn);
        if (oTriggerData) {
            oTriggerData.column = oColumn;
            oTriggerData.data = this.data;
            oTriggerData.dataUI = this;
        }
        if (oTrigger) {
            bOk = oTrigger.Trigger(65543 /* BeforeValidateValue */, oTriggerData, oTriggerData.edit.GetValueStack());
            if (bOk === false)
                return;
        }
        const _result = CTableData.ValidateValue(value, oColumn); // validate value
        if (_result === true || _result[0] === true) {
            if (this.m_aValueError.length > 0)
                this.RemoveCellError(iRow, iColumn); // remove error for this value if it was set before
            if (oTrigger) {
                bOk = oTrigger.Trigger(65544 /* BeforeSetValue */, oTriggerData, oTriggerData.edit.GetValueStack());
            }
            if (bOk !== false) {
                if (this.is_state(4 /* SetHistory */))
                    this.data.HISTORYPush(iDataRow, iDataColumn); // add to history
                let aRow = this.m_aRowBody[iRow];
                aRow[iColumn] = value; // Modify value internally
                this.data.CELLSetValue(iDataRow, iDataColumn, value); // Set value to cell
                if (this.is_state(2 /* SetDirtyRow */))
                    this.data.DIRTYSet(iDataRow); // Set row as dirty
            }
            if (oTrigger) {
                bOk = oTrigger.Trigger(131081 /* AfterSetValue */, oTriggerData, oTriggerData.edit.GetValueStack());
            }
        }
        else {
            if (this.SetCellError(iRow, iColumn, value, _result[1], oTriggerData) === true) {
                this.data.CELLSetValue(iDataRow, iDataColumn, value);
            }
        }
    }
    SetCellError(_Row, _Column, value, type, oTriggerData) {
        let bSetValue = true;
        if (_Row === void 0) {
            this.m_aValueError = [];
            return;
        }
        const oTrigger = this.trigger; // Get trigger object with trigger logic
        let iRow, iColumn; // index for row and column in UI
        if (Array.isArray(_Row) && _Row.length === 2) { // check for [row, column] parameter
            value = _Column;
            [iRow, iColumn] = _Row;
        }
        else {
            iRow = _Row;
            iColumn = _Column;
        }
        let aError;
        let bFound = false;
        let i = this.m_aValueError.length;
        while (--i >= 0 && bFound === false) {
            let aError = this.m_aValueError[i];
            if (aError[0] === iRow && aError[1] === iColumn) {
                aError[2] = value;
                aError[3] = type;
                bFound = true;
            }
        }
        if (bFound === false) {
            this.m_aValueError.push([iRow, iColumn, value, type]);
            aError = this.m_aValueError[this.m_aValueError.length - 1];
        }
        if (oTrigger) {
            let bRender = oTrigger.Trigger(262160 /* OnSetValueError */, oTriggerData, aError);
            if (bRender !== false && bFound === false)
                this.render_value_error();
        }
        return bSetValue;
    }
    RemoveCellError(_Row, _Column) {
        let iRow, iColumn; // index for row and column in UI
        if (Array.isArray(_Row)) {
            [iRow, iColumn] = _Row;
        }
        else {
            iRow = _Row;
            iColumn = _Column;
        }
        let bFound = false;
        let i = this.m_aValueError.length;
        while (--i >= 0 && bFound === false) {
            let aError = this.m_aValueError[i];
            if (aError[0] === iRow && aError[1] === iColumn) {
                bFound = true;
                this.m_aValueError.splice(i, 1);
                break;
            }
        }
        if (bFound) {
            this.render();
        }
    }
    ERRORGet(_Index) {
        if (_Index === void 0)
            return this.m_aValueError;
        else if (typeof _Index === "number")
            return this.m_aValueError[_Index];
        else if (Array.isArray(_Index)) {
            let a = [];
            _Index.forEach((aError) => { a.push(aError); });
            return a;
        }
        return null;
    }
    /**
     * Set value error
     * @param {[ number, number, unknown, unknown ] | [ number, number, unknown, unknown ][]} aError
     */
    ERRORSet(aError) {
        if (aError.length && typeof aError[0] === "number")
            aError = [aError];
        this.m_aValueError = aError;
    }
    ERRORGetCount() { return this.m_aValueError.length; }
    /** BLOG: firstChild or hasChildNodes to find child nodes. children.length to check elements
     * Render complete table
     * */
    Render(sSection, callback) {
        // return alias and name properties from table data, used for header to column
        if (typeof sSection === "string") {
            if (sSection === "body") {
                this.render_body(true);
            }
            return;
        }
        let aHeader = this.data.COLUMNGetPropertyValue(true, ["alias", "name"], (column) => {
            if (column.position.hide === 1)
                return false;
            return true;
        });
        this.m_aColumnPhysicalIndex = [];
        aHeader.forEach((a) => { this.m_aColumnPhysicalIndex.push(a[0]); });
        this.m_iColumnCount = aHeader.length; // Set total column count
        this.render_header(aHeader);
        let o = {};
        if (this.m_iRowCountMax >= 0)
            o.max = this.m_iRowCountMax; // if max rows returned is set
        let aBody = this.data.GetData(o);
        this.render_body(aBody, this.create_body(aBody[0]));
        this.render_selected();
        if (this.m_aInput)
            this.render_input();
        if (this.m_aValueError.length)
            this.render_value_error();
    }
    render() {
        this.create_body();
        this.render_body();
    }
    SetSelected(_1, _2, _3) {
        let bAdd = false;
        let bSet = true;
        let aSelect = [];
        if (_1 === void 0) {
            this.m_aSelected = [];
            return 0;
        }
        if (typeof _3 === "boolean")
            bAdd = _3;
        if (typeof _2 === "boolean")
            bAdd = _2;
        if (Array.isArray(_2)) {
            if (bAdd === false)
                this.m_aSelected = [];
            for (let iR = _1[0]; iR <= _2[0]; iR++) {
                for (let iC = _1[1]; iC <= _2[1]; iC++) {
                    this._set_selected([[iR, iC]], true);
                }
            }
            bSet = false;
        }
        else if (Array.isArray(_1)) {
            if (Array.isArray(_1[0]))
                aSelect = _1;
            else
                aSelect.push(_1);
        }
        else if (typeof _1 === "number" && typeof _2 === "number")
            aSelect.push([_1, _2]);
        if (bSet)
            this._set_selected(aSelect, bAdd);
        return this.m_aSelected.length;
    }
    /**
     * Set sort columns.
     * @param {number | string | [number|string][]} _Sort
     * @param bToggle
     * @param bAdd
     */
    Sort(_Sort, bToggle, bAdd) {
        let aSort = Array.isArray(_Sort) === false ? [_Sort] : _Sort; // if not array then convert to array
        this.data.COLUMNSetPropertyValue(true, "state.sort", 0); // clear sort
        if (_Sort === void 0) {
            this.m_aOrder = [];
            return;
        } // clear sort array and return if no sort value
        let aNew = [];
        for (let i = 0; i < aSort.length; i++) {
            let _Column = aSort[i];
            if (typeof _Column === "number")
                _Column = this._column_in_data(_Column); // convert to physical index in table data
            let iFind = this.m_aOrder.findIndex((_C) => { return _Column === _C[0]; });
            if (iFind === -1) {
                aNew.push([_Column, 1]);
            }
            else { // is column already sorted, then switch order
                let a = this.m_aOrder[iFind];
                a[1] = -a[1];
                if (bAdd !== true) {
                    aNew.push(a);
                }
            }
        }
        if (bAdd === true)
            this.m_aOrder = this.m_aOrder.concat(aNew);
        else
            this.m_aOrder = aNew;
        this.m_aOrder.forEach((_Column) => {
            this.data.COLUMNSetPropertyValue(_Column[0], "state.sort", _Column[1]);
        });
    }
    Destroy() {
        if (this.m_eComponent) {
            let eComponent = this.m_eComponent;
            this.m_eComponent = null;
            eComponent.parentNode.removeChild(eComponent);
        }
    }
    /**
     * Get number of columns
     * @returns {number} number of visible columns.
     */
    COLUMNGetCount() { return this.m_iColumnCount; }
    /**
     * Get column object and index for column in ui table
     * @param {number | string | HTMLElement} _Index
     */
    COLUMNGet(_Index) {
        let iColumn;
        if (typeof _Index === "number") {
            iColumn = this._column_in_data(_Index);
        }
        else if (typeof _Index === "string") {
            iColumn = this.data._index(_Index);
        }
        else {
            let aRowCol = this.GetRowCol(_Index);
            if (aRowCol) {
                iColumn = aRowCol[1];
            }
        }
        if (typeof iColumn === "number" && iColumn >= 0)
            return [iColumn, this.data.COLUMNGet(iColumn)];
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
    COLUMNCalculateMaxWidth(sSectionName, _MaxWidth, iRowCount) {
        let aWidth = new Array(this.m_iColumnCount);
        aWidth.fill(0);
        let iMaxWidth = 0, aMax;
        if (Array.isArray(_MaxWidth))
            aMax = _MaxWidth;
        else if (typeof _MaxWidth === "number")
            iMaxWidth = _MaxWidth;
        let eSection = this.GetSection(sSectionName);
        if (!eSection)
            return aWidth; // section not found, just return empty array
        let eRow = eSection.firstElementChild;
        while (eRow) {
            let eColumn = eRow.firstElementChild;
            let iTo = this.m_iColumnCount;
            for (let i = 0; i < iTo; i++) {
                if (aMax)
                    iMaxWidth = aMax[i];
                let iWidth = eColumn.offsetWidth;
                if (iMaxWidth && iWidth > iMaxWidth)
                    iWidth = iMaxWidth; // if max width then check for not above
                if (iWidth > aWidth[i])
                    aWidth[i] = iWidth;
                eColumn = eColumn.nextElementSibling;
            }
            eRow = eRow.nextElementSibling;
        }
        return aWidth;
    }
    /**
     *
     * @param aWidth
     * @param eSection
     */
    COLUMNSetWidth(aWidth, _Section) {
        let eSection;
        if (typeof _Section === "string") {
            eSection = this.GetSection(_Section);
        }
        else
            eSection = _Section;
        if (eSection === null)
            return;
        let set_width = (eSection) => {
            let eRow = eSection.firstElementChild;
            while (eRow) {
                let eColumn = eRow.firstElementChild;
                let iTo = this.m_iColumnCount;
                for (let i = 0; i < iTo; i++) {
                    eColumn.style.width = "" + aWidth[i] + "px";
                    eColumn = eColumn.nextElementSibling;
                }
                eRow = eRow.nextElementSibling;
            }
        };
        let sDisplay = eSection.style.display;
        eSection.style.display = "none";
        set_width(eSection);
        eSection.style.display = sDisplay;
    }
    /**
     * Get number of rows displayed in table
     */
    ROWGetCount() { return this.m_aRowBody.length; }
    /**
     * Get indexes to new rows in table. New rows has the index -1 set to it, it do not exist in table data source and therefore no matching row
     */
    ROWGetIndexForNew() {
        let a = [];
        let aIndex = this.m_aRowPhysicalIndex;
        let iTo = aIndex.length;
        for (let i = 0; i < iTo; i++) {
            if (aIndex[i] === -1)
                a.push(i);
        }
        return a;
    }
    /**
     * Return values for row in body
     * @param iRow key to row or if bRay it is the physical index
     */
    ROWGet(iRow) {
        return this.m_aRowBody[iRow];
    }
    ROWInsert(iRow, _Row) {
        _Row = _Row || 1; // 1 row is default
        let iCount;
        let aRow = [];
        let aIndex = [];
        let iColumnCount = this.COLUMNGetCount();
        if (typeof _Row === "number") {
            iCount = _Row;
            for (let i = 0; i < iCount; i++) {
                aRow.push(new Array(iColumnCount));
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
                for (let j = a.length; j < iColumnCount; j++) {
                    a.push(null);
                }
            }
        }
        let i = iCount;
        while (--i >= 0) {
            aIndex.push(-1);
        }
        // Rows are prepared, time to insert
        this.m_aRowBody.splice(iRow, 0, ...aRow);
        this.m_aRowPhysicalIndex.splice(iRow, 0, ...aIndex); // Add row index for new rows, these are negative because data do not exist in CTableData
        return aRow;
    }
    ROWValidate(_Row) {
        let aError = [];
        if (typeof _Row === "number")
            _Row = [_Row];
        for (let i = 0; i < _Row.length; i++) {
            const iRow = _Row[i];
            let aRow = this.data.ROWGet(iRow);
            aRow.forEach((_Value, iIndex) => {
                let oColumn = this.data.COLUMNGet(iIndex, false, true);
                let _result = CTableData.ValidateValue(_Value, oColumn);
                if (Array.isArray(_result) === true && _result[0] === false) { // if error then add it to array with found error values
                    let iColumn = this._column_in_ui(iIndex);
                    aError.push([iRow, iColumn, _Value, _result[1]]);
                }
            });
        }
        return aError.length ? aError : true;
    }
    /**
     * Get parent section element for element sent as argument
     * @param {HTMLElement} eElement element that sections is returned for.
     */
    ELEMENTGetSection(eElement) {
        while (eElement && eElement.tagName !== "SECTION" && eElement.getAttribute("data-section") === null) {
            eElement = eElement.parentElement;
        }
        if (eElement)
            return eElement;
        throw "null section, have table been redrawn?";
    }
    ELEMENTGetRow(iRow, _Section) {
        _Section = _Section || "body";
        let eSection = typeof _Section === "string" ? this.GetSection(_Section) : _Section;
        let i = iRow;
        let eRow = eSection.firstElementChild; // Position at row
        if (eRow.dataset.type !== "row")
            i++; // no row ?
        while (--i >= 0 && eRow) {
            if (eRow.dataset.type !== "row")
                i++; // no row ?
            eRow = eRow.nextElementSibling;
        }
        return eRow;
    }
    ELEMENTGetCell(_1, _2, _3) {
        let iRow, iColumn, sSection;
        if (typeof _2 === "number") {
            iColumn = _2;
            iRow = _1;
        }
        else if (typeof _2 === "string")
            sSection = _2;
        if (Array.isArray(_1)) {
            [iRow, iColumn] = _1;
        }
        sSection = sSection || "body";
        let eSection = this.GetSection(sSection);
        let eCell = this.ELEMENTGetRow(iRow, eSection);
        /*
        let eCell = eSection.firstElementChild;                                  // Position at row
  
        let i = iRow;
        while(--i >= 0 && eCell) {
           if( (<HTMLElement>eCell).dataset.type !== "row" ) i++;                // no row ?
           eCell = eCell.nextElementSibling;
        }
        */
        if (eCell) {
            eCell = eCell.firstElementChild;
            let i = iColumn;
            while (--i >= 0 && eCell)
                eCell = eCell.nextElementSibling;
        }
        return eCell;
    }
    /**
     * Return value element in cell. Get value element in cell if cell has generated dom tree inside
     * @param {HTMLElement} e Cell element
     * @returns {HTMLElement} element to value or null if not found
     */
    ELEMENTGetCellValue(e) {
        if (this.is_state(1 /* HtmlValue */) && e) {
            e = e.querySelector("[data-value]");
        }
        return e;
    }
    INPUTInitialize(_1, _2) {
        const bCreate = typeof _1 === "boolean" ? _1 : _2 || true; // default is to create
        if (typeof _1 === "object" || _1 === void 0) {
            let oTableData = _1 || this.data;
            if (!this.m_oEdits)
                this.m_oEdits = new edit.CEdits({ table: oTableData });
            else
                this.m_oEdits.data = this.data;
        }
        this.m_oEdits.Initialize(bCreate, bCreate ? this.GetSupportElement() : null);
    }
    INPUTSet(_1, iC) {
        if (Array.isArray(_1)) {
            iC = _1[0];
            _1 = _1[0];
        }
        this.m_aInput = [_1, iC, this.ELEMENTGetCell(_1, iC)];
    }
    INPUTMove(e, bRender) {
        let [iR, iC] = this.m_aInput;
        if (e < 16 /* page_up */) {
            switch (e) {
                case 1 /* left */:
                    iC--;
                    break;
                case 2 /* right */:
                    iC++;
                    break;
                case 4 /* up */:
                    iR--;
                    break;
                case 8 /* down */:
                    iR++;
                    break;
            }
        }
        else {
            if (e === 64 /* begin */) {
                iC = 0;
                iR = 0;
            }
            else if (e === 256 /* end */) {
                iC = this.m_iColumnCount - 1;
                iR = this.m_iRowCount - 1;
            }
            else if (e === 16 /* page_up */) {
                iR -= this.m_iRowCount;
            }
            else if (e === 32 /* page_down */) {
                iR += this.m_iRowCount;
            }
        }
        if (iC < 0)
            iC = 0;
        else if (iC >= this.m_iColumnCount)
            iC = this.m_iColumnCount - 1;
        if (iR < 0)
            iR = 0;
        else if (iR >= this.m_iRowCount)
            iR = this.m_iRowCount - 1;
        let eElement = this.ELEMENTGetCell(iR, iC);
        this.m_aInput = [iR, iC, eElement];
        if (bRender === true)
            this.Render("body");
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
    INPUTActivate(iRow, _Column, bInput) {
        if (iRow === void 0) {
            iRow = this.m_aInput[0];
            _Column = this.m_aInput[1];
        }
        let aColumn = [];
        if (_Column === void 0) { // No column then activate complete row
            let aValue = this.data.COLUMNGetPropertyValue(true, "edit.edit", (C) => { return C?.edit?.edit === true; }); // get editable columns
            aValue.forEach(aIndex => { aColumn.push(this._column_in_ui(aIndex[0])); }); // convert column in table data to column in table text and add to array.
        }
        let iDataRow = this._row_in_data(iRow);
        let iColumn;
        if (typeof _Column === "number") {
            iColumn = _Column;
            aColumn = [_Column];
        }
        aColumn.forEach(iC => {
            let iDataColumn = this._column_in_data(iC);
            let oEdit = this.m_oEdits.GetEdit(iDataColumn);
            if (oEdit !== null) {
                let eCell = this.ELEMENTGetCell(iRow, iC);
                if (this.is_state(1 /* HtmlValue */)) {
                    let e = eCell.matches("[data-edit]") || eCell.querySelector("[data-edit]"); // try to find element with attribute data_edit
                    if (!e)
                        e = eCell.querySelector("[data-value]"); // no data-edit, then take data-value
                    eCell = e || eCell;
                }
                this.m_oEdits.Activate([iDataRow, iDataColumn, iRow, iC], eCell);
                this.m_iOpenEdit++; // One more edit open
            }
        });
        if (bInput === true)
            this.INPUTSet(iRow, iColumn);
    }
    INPUTDeactivate(_Row, _Column) {
        let bOk = true;
        if (_Row === void 0) {
        }
        if (this.m_oEdits) {
            if (_Row === false)
                this.m_oEdits.Deactivate(false);
            bOk = this.m_oEdits.Deactivate();
            if (bOk === true)
                this.m_iOpenEdit = 0; // Edit controls closed, set to 0
        }
        return bOk;
    }
    // 
    // Element creation and render methods ---------------------------------------------------------
    //
    /**
     * Render header for table
     * @param aHeader
     */
    render_header(aHeader) {
        let eSection = this.create_header(aHeader);
        if (!eSection)
            return null;
        let bCall = this._has_render_callback("askHeaderValue", "header");
        let eRow = eSection.firstElementChild;
        let eSpan = eRow.firstElementChild;
        const iCount = aHeader.length;
        for (let i = 0; i < iCount; i++) {
            const aName = aHeader[i][1];
            if (bCall) {
                let bRender = true;
                for (let j = 0; j < this.m_acallRender.length; j++) {
                    let b = this.m_acallRender[j].call(this, "beforeHeaderValue", aName, eSpan, this.data.COLUMNGet(this._column_in_data(i)));
                    if (b === false)
                        bRender = false;
                }
                if (bRender === false)
                    continue;
            }
            if (eSpan) {
                eSpan.innerText = aName[0] || aName[1]; // alias or name
                eSpan.title = eSpan.innerText;
                if (bCall)
                    this.m_acallRender.forEach((call) => { call.call(this, "afterHeaderValue", aName, eSpan, this.data.COLUMNGet(this._column_in_data(i))); });
                eSpan = eSpan.nextElementSibling;
            }
        }
        return eSection;
    }
    render_body(_1, eSection) {
        eSection = eSection || this.GetSection("body");
        let aResult;
        let sClass = CTableData.GetPropertyValue(this.m_oStyle, false, "class_value") || "";
        let aStyle = this.data.COLUMNGetPropertyValue(this.m_aColumnPhysicalIndex, "style"); // position data for columns
        if (typeof _1 === "boolean") {
            let eSection = this.GetSection("body", true);
            if (eSection === null)
                return;
            let eRow = eSection.firstElementChild;
            while (eRow) {
                let eColumn = eRow.firstElementChild;
                while (eColumn) {
                    let e = this.ELEMENTGetCellValue(eColumn);
                    e.className = sClass || "";
                    eColumn = eColumn.nextElementSibling;
                }
                eRow = eRow.nextElementSibling;
            }
            this.render_selected();
            if (this.m_aValueError.length)
                this.render_value_error();
            if (this.m_aInput)
                this.render_input();
            return;
        }
        if (Array.isArray(_1)) {
            aResult = _1;
            this.SetCellError(); // clear errors
            this.m_aRowBody = aResult[0]; // keep body data
            this.m_aRowPhysicalIndex = aResult[1]; // keep index to rows
        }
        if (eSection === null)
            return;
        let bCall = this._has_render_callback("askCellValue", "body");
        let eRow = eSection.firstElementChild;
        this.m_aRowBody.forEach((aRow, iIndex) => {
            let iRow = this.m_aRowPhysicalIndex[iIndex], s, o;
            eRow.dataset.row = iRow.toString();
            let eColumn = eRow.firstElementChild;
            for (var i = 0; i < this.m_iColumnCount; i++) {
                let sValue = aRow[i];
                if (bCall) {
                    let bRender = true;
                    for (let j = 0; j < this.m_acallRender.length; j++) {
                        let b = this.m_acallRender[j].call(this, "beforeCellValue", sValue, eColumn, this.data.COLUMNGet(this._column_in_data(i)));
                        if (b === false)
                            bRender = false;
                    }
                    if (bRender === false)
                        continue;
                }
                let e = this.ELEMENTGetCellValue(eColumn); // get cell value element
                if (sClass)
                    e.classList.add(sClass); //
                if (Object.keys(aStyle[i][1]).length > 0)
                    Object.assign(e.style, aStyle[i][1]);
                if (sValue !== null && sValue != void 0)
                    e.innerText = sValue.toString();
                else
                    e.innerText = " ";
                if (bCall)
                    this.m_acallRender.forEach((call) => { call.call(this, "afterCellValue", sValue, eColumn, this.data.COLUMNGet(this._column_in_data(i))); });
                eColumn = eColumn.nextElementSibling; // next column element in row
            }
            eRow = eRow.nextElementSibling;
        });
        return eSection;
    }
    /**
     * Render value in cell. Cell value is taken from table data
     * @param {number | number[]} _Row Index to row or array with index for row and column
     * @param {number} [iColumn] Index to column. if `_Row` is array then iColumn isn't used
     */
    render_value(_Row, iColumn) {
        if (Array.isArray(_Row))
            [_Row, iColumn] = _Row;
        let sClass = CTableData.GetPropertyValue(this.m_oStyle, false, "class_value") || "";
        let eElement = this.ELEMENTGetCellValue(this.ELEMENTGetCell(_Row, iColumn));
        let sValue = this.data.CELLGetValue(this._row_in_data(_Row), this._column_in_data(iColumn));
        if (sValue !== null && sValue != void 0)
            eElement.innerText = sValue.toString();
        else
            eElement.innerText = " ";
    }
    render_selected(aSelected) {
        aSelected = aSelected || this.selected;
        if (aSelected.length === 0)
            return;
        let sStyle = CTableData.GetPropertyValue(this.m_oStyle, false, "cell_selected") || ""; // style
        let sClass = CTableData.GetPropertyValue(this.m_oStyle, false, "class_cell_selected") || ""; // class
        aSelected.forEach((a) => {
            let e = this.ELEMENTGetCell(a);
            if (e) {
                if (sStyle)
                    e.style.cssText = sStyle;
                if (sClass)
                    e.className = sClass;
            }
        });
    }
    render_input() {
        this.INPUTMove(0 /* validate */);
        let sClass = CTableData.GetPropertyValue(this.m_oStyle, false, "class_cell_input") || CTableData.GetPropertyValue(this.m_oStyle, false, "class_selected");
        if (sClass) {
            this.ELEMENTGetCellValue(this.m_aInput[2]).classList.add(sClass);
        }
    }
    render_value_error(aValueError) {
        if (Array.isArray(aValueError)) {
            if (Array.isArray(aValueError[0]) === false)
                aValueError = [aValueError];
        }
        else
            aValueError = this.m_aValueError;
        const iErrorLLength = aValueError.length;
        let sClass = CTableData.GetPropertyValue(this.m_oStyle, false, "class_error"); // cell class for error
        let sClassValue = CTableData.GetPropertyValue(this.m_oStyle, false, "class_value_error"); // value class for error
        if (sClass || sClassValue) {
            let aClass = sClass ? sClass.split(" ") : null;
            let aClassValue = sClassValue ? sClassValue.split(" ") : null;
            for (let i = 0; i < iErrorLLength; i++) {
                let eCell = this.ELEMENTGetCell(aValueError[i], "body");
                if (sClass && eCell.classList.contains(aClass[0]) === false) { // compare if first class in array is set to element
                    //eCell.className += " " + sClass;
                    eCell.className = (eCell.className + " " + sClass).trim();
                }
                if (aClassValue && this.is_state(1 /* HtmlValue */)) {
                    let e = this.ELEMENTGetCellValue(eCell);
                    if (e && e.classList.contains(aClassValue[0]) === false) {
                        e.className = (e.className + " " + sClassValue).trim();
                    }
                }
            }
        }
    }
    /**
     * Creates section elements for parts used by `CUITableText`.
     * Sections rendered are found in member m_aSection
     * @param {HTMLElement} [eComponent] Container section
     * @param {(eSection: HTMLElement, sName: string) => boolean )} [callback] method called when element is created. if false is returned then section isn't added to component
     */
    create_sections(eComponent, callback) {
        eComponent = eComponent || this.m_eComponent;
        let self = this;
        // local function used to append sections
        let append_section = (eComponent, sName, sClass) => {
            let eParent = eComponent;
            let aSection = sName.split("."); // if section name is split with . then it is grouped, name before . creates div group
            if (aSection.length === 2) { // found group name ?
                let sHtmlGroup = CTableData.GetPropertyValue(this.m_oStyle, false, "html_group") || "div";
                let aGroup = sHtmlGroup.split("."), sClass;
                if (aGroup.length > 1) {
                    sHtmlGroup = aGroup[0];
                    sClass = aGroup[1];
                } // found class name in group element?
                sName = aSection[1];
                let sGroup = aSection[0]; // get group name
                let eGroup = eComponent.querySelector(sHtmlGroup + "[data-group='" + sGroup + "']");
                if (eGroup === null) { // is group not created ?
                    eGroup = document.createElement(sHtmlGroup);
                    if (sClass)
                        eGroup.className = sClass;
                    eGroup.dataset.group = sGroup;
                    eParent.appendChild(eGroup); // add group to parent
                }
                eParent = eGroup; // group is parent to section
            }
            let sHtmlSection = "section";
            switch (sName) {
                case "header":
                    sHtmlSection = CTableData.GetPropertyValue(this.m_oStyle, false, "html_section_header") || sHtmlSection;
                    break;
                case "body":
                    sHtmlSection = CTableData.GetPropertyValue(this.m_oStyle, false, "html_section_body") || sHtmlSection;
                    break;
                case "footer":
                    sHtmlSection = CTableData.GetPropertyValue(this.m_oStyle, false, "html_section_footer") || sHtmlSection;
                    break;
            }
            let eSection = document.createElement(sHtmlSection); // create section
            eSection.dataset.section = sName; // set section name, used to access section
            eSection.dataset.widget = CUITableText.s_sWidgetName;
            if (sName === "body")
                eSection.tabIndex = -1; // tab index on body to enable keyboard movement
            let a = sClass.split(" ");
            a.push(CUITableText.s_sWidgetName + "-" + sName);
            eSection.classList.add(...a);
            // configure event listeners
            eSection.addEventListener("click", (e) => {
                let eSink = e.currentTarget;
                while (eSink && eSink.tagName !== "SECTION" && eSink.dataset.widget !== CUITableText.s_sWidgetName)
                    eSink = eSink.parentElement;
                if (!eSink)
                    return;
                self._on_action("click", e, eSink.dataset.section);
            });
            if (sName === "body") { // body section has more event listeners
                // configure event listeners
                eSection.addEventListener("keydown", (e) => {
                    let eSink;
                    if (e.target.tagName === "INPUT") {
                        let oEdit = this.m_oEdits.GetEdit(e.target); // try to get edit object for edit element
                        if (oEdit.IsMoveKey(e.keyCode) === false) {
                            return;
                        }
                        eSink = self.m_aInput[2];
                    }
                    else
                        eSink = e.currentTarget;
                    while (eSink && eSink.tagName !== "SECTION" && eSink.dataset.widget !== CUITableText.s_sWidgetName)
                        eSink = eSink.parentElement;
                    if (!eSink)
                        return;
                    self._on_action("keydown", e, eSink.dataset.section);
                }, true);
                eSection.addEventListener("focus", (e) => {
                    let eElement = e.srcElement;
                    if (eElement.tagName === "input") {
                        let oEdit = this.m_oEdits.GetEdit(eElement); // try to get edit object for edit element
                        if (oEdit)
                            self.INPUTSet(oEdit.GetPositionRelative());
                    }
                    let eSink = e.currentTarget;
                    while (eSink && eSink.tagName !== "SECTION" && eSink.dataset.widget !== CUITableText.s_sWidgetName)
                        eSink = eSink.parentElement;
                    if (!eSink)
                        return;
                    self._on_action("focus", e, eSink.dataset.section);
                }, true);
                eSection.addEventListener("focusout", (e) => {
                    let eSink = e.currentTarget;
                    while (eSink && eSink.tagName !== "SECTION" && eSink.dataset.widget !== CUITableText.s_sWidgetName)
                        eSink = eSink.parentElement;
                    if (!eSink)
                        return;
                    self._on_action("focusout", e, eSink.dataset.section);
                });
                // configure event listeners
                eSection.addEventListener("dblclick", (e) => {
                    let eSink = e.currentTarget;
                    while (eSink && eSink.tagName !== "SECTION" && eSink.dataset.widget !== CUITableText.s_sWidgetName)
                        eSink = eSink.parentElement;
                    if (!eSink)
                        return;
                    self._on_action("dblclick", e, eSink.dataset.section);
                });
            }
            let bOk = this._has_create_callback("afterCreate", { data: this.data, dataUI: this, eElement: eSection }, sName);
            if (bOk !== false)
                eParent.appendChild(eSection);
            return [sName, eSection];
        };
        let sClass = CTableData.GetPropertyValue(this.m_oStyle, false, "class_section") || CUITableText.s_sWidgetName;
        // Create elements for sections that do not have elements stored
        for (let i = 0; i < this.m_aSection.length; i++) {
            let _Name = this.m_aSection[i];
            if (typeof _Name === "string") {
                this.m_aSection[i] = append_section(eComponent, _Name, sClass);
            }
        }
        return eComponent;
    }
    /**
     * Create header element with columns
     * @param aHeader
     */
    create_header(aHeader, callback) {
        let eSection = this.GetSection("header", true);
        if (eSection === null)
            return null;
        eSection.innerHTML = ""; // clear section
        let sClass;
        let iCount = aHeader.length;
        let sHtmlRow = CTableData.GetPropertyValue(this.m_oStyle, false, "html_row") || "div";
        let sStyle = CTableData.GetPropertyValue(this.m_oStyle, false, "header") || "";
        let sHtml = CTableData.GetPropertyValue(this.m_oStyle, false, "html_cell_header");
        if (!sHtml)
            sHtml = "span";
        else {
            let a = sHtml.split(".");
            if (a.length > 1)
                [sHtml, sClass] = a;
        }
        let eRow = document.createElement(sHtmlRow);
        eRow.dataset.type = "row"; // "row" for header
        let iDiv = iCount;
        aHeader.forEach((a, i) => {
            let eSpan = document.createElement(sHtml);
            eSpan.style.cssText = sStyle;
            if (sClass)
                eSpan.className = sClass;
            eRow.appendChild(eSpan);
            if (eSpan)
                eRow.appendChild(eSpan);
        });
        eSection.appendChild(eRow);
        return eSection;
    }
    /**
     * Create body, body is the section that displays values from table data. Tables are shown as rows with vales for each value in table
     * @param {unknown[][]} aBody value data that elements are created for
     */
    create_body(aBody) {
        aBody = aBody || this.m_aRowBody;
        let eSection = this.GetSection("body", true);
        if (eSection === null)
            return null;
        eSection.innerHTML = ""; // clear body
        this.m_iRowCount = aBody.length; // set number of rows in body
        if (this.m_iRowCount === 0)
            return eSection; // no rows, just skip  creation
        let sClass;
        let sStyle = CTableData.GetPropertyValue(this.m_oStyle, false, "value") || null;
        let sHtmlRow = CTableData.GetPropertyValue(this.m_oStyle, false, "html_row") || "div";
        let sHtmlCell = CTableData.GetPropertyValue(this.m_oStyle, false, "html_cell") || "span"; // span is default for cell
        let sHtmlValue = CTableData.GetPropertyValue(this.m_oStyle, false, "html_value");
        if (typeof sHtmlValue === "string")
            sHtmlValue = sHtmlValue.trim();
        this.set_state(sHtmlValue, 1 /* HtmlValue */); // set state if cell is a dom tree or not
        if (!sHtmlCell)
            sHtmlCell = "span"; // span is default element for values
        if (sHtmlCell.indexOf(".") !== -1) {
            let a = sHtmlCell.split(".");
            if (a.length > 1)
                [sHtmlCell, sClass] = a; // element for value, this can be element name and class if format is in "element_name.class_names" like "span.value".
        }
        let aColumns = aBody[0]; // first row
        let eRow = document.createElement(sHtmlRow);
        eRow.dataset.type = "row"; // "row" for body
        let i = aColumns.length;
        while (--i >= 0) {
            let eSpan = document.createElement(sHtmlCell);
            if (sHtmlValue)
                eSpan.innerHTML = sHtmlValue;
            if (sStyle)
                eSpan.style.cssText = sStyle;
            if (sClass)
                eSpan.className = sClass;
            eRow.appendChild(eSpan);
        }
        // create rows for each value
        for (i = 0; i < this.m_iRowCount; i++) {
            eSection.appendChild(eRow.cloneNode(true));
        }
        return eSection;
    }
    _has_create_callback(sName, v, sSection, call) {
        let a = call ? [call] : this.m_acallCreate;
        let bCall = a !== undefined;
        if (bCall) {
            for (let i = 0; i < a.length; i++) {
                let b = a[i].call(this, sName, v, sSection);
                if (b === false)
                    bCall = false;
            }
        }
        return bCall;
    }
    _has_render_callback(sName, sSection) {
        let bCall = this.m_acallRender !== undefined;
        if (bCall) {
            for (let i = 0; i < this.m_acallRender.length; i++) {
                let b = this.m_acallRender[i].call(this, sName, sSection);
                if (b === false)
                    bCall = false;
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
    _on_action(sType, e, sSection) {
        if (this.m_acallAction && this.m_acallAction.length > 0) {
            let i = 0, iTo = this.m_acallAction.length;
            let callback = this.m_acallAction[i];
            while (i++ < iTo) {
                let bResult = callback.call(this, sType, e, sSection);
                if (bResult === false)
                    return;
            }
        }
        if (sSection === "header") {
            //this.GetRowCol(<HTMLElement>e.srcElement);
        }
        else if (sSection === "body") {
            if (sType === "click") {
                let aCell = this.GetRowCol(e.srcElement);
                if (aCell && this.m_aInput && (aCell[0] !== this.m_aInput[0] || aCell[1] !== this.m_aInput[1])) {
                    this.m_aInput = aCell;
                    this.INPUTMove(0 /* validate */, true);
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
            else if (sType === "keydown" && this.m_aInput) {
                let eMove;
                if (e.keyCode === 9) {
                    eMove = e.shiftKey === true ? 1 /* left */ : 2 /* right */;
                    e.preventDefault();
                }
                else if (e.keyCode === 13 || e.keyCode === 39) {
                    eMove = 2 /* right */;
                }
                else if (e.keyCode === 37)
                    eMove = 1 /* left */;
                else if (e.keyCode === 38)
                    eMove = 4 /* up */;
                else if (e.keyCode === 40)
                    eMove = 8 /* down */;
                else if (e.keyCode === 36)
                    eMove = 64 /* begin */;
                else if (e.keyCode === 35)
                    eMove = 256 /* end */;
                else if (e.keyCode === 33)
                    eMove = 16 /* page_up */;
                else if (e.keyCode === 34)
                    eMove = 32 /* page_down */;
                else if (e.keyCode === 27)
                    eMove = 128 /* disable */;
                if (eMove) {
                    if (this.m_iOpenEdit > 0) { // any open edit elements?
                        if (eMove == 128 /* disable */)
                            this.INPUTDeactivate(false);
                        else
                            this.INPUTDeactivate(); // close all edits
                        this.GetSection("body").focus({ preventScroll: true }); // Set focus to body, closing edit elements will make it loose focus
                    }
                    this.INPUTMove(eMove, true);
                }
                else if (this.m_oEdits && e.keyCode >= 32) { // space and above
                    let oEdit = this.m_oEdits.GetEdit(this._column_in_data(this.m_aInput[1])); // Get edit for column (second value in input array)
                    if (oEdit !== null) {
                        if (oEdit.IsOpen() === false) {
                            if (this.INPUTDeactivate() === true) {
                                this.INPUTActivate();
                            }
                        }
                        //console.log("ACTIVATE!!!!!!");
                    }
                }
            }
            else if (sType === "dblclick" && this.m_aInput) { // open editor if any on double click
                if (this.INPUTDeactivate() === true) {
                    this.INPUTActivate();
                }
            }
            else if (sType === "focus") {
            }
            else if (sType === "focusout") {
                if (e.srcElement.dataset.input === "1") {
                    let oEdit = this.edits.GetEdit(e.srcElement);
                    if (oEdit.IsModified() === true) { // Is value modified
                        let bOk = true;
                        let _Value = oEdit.GetValue();
                        this.INPUTDeactivate();
                        this.SetCellValue(oEdit.GetPositionRelative(), _Value, { iReason: 1 /* Edit */, edit: oEdit, eElement: e.srcElement });
                        //                  if(!this.trigger) this.SetCellValue(oEdit.GetPosition(), oEdit.GetValue(), undefined, { iReason: enumReason.Edit,edit:oEdit));
                        //                  else this.trigger.CELLSetValue({ iReason: enumReason.Edit, dataUI: this }, oEdit.GetValueStack(), oEdit.GetPosition(), oEdit.GetValue());
                        /*
                                          if(!this.trigger) this.data.CELLSetValue(oEdit.GetPosition(), oEdit.GetValue());
                                          else this.trigger.CELLSetValue({ iReason: enumReason.Edit, dataUI: this }, oEdit.GetValueStack(), oEdit.GetPosition(), oEdit.GetValue());
                        */
                        if (bOk)
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
    _column_in_data(iIndex) { return this.m_aColumnPhysicalIndex[iIndex]; }
    /**
     * Get column position in table, this position can differ from the position in  table data
     * @param iIndex
     */
    _column_in_ui(iIndex) {
        let i = this.m_aColumnPhysicalIndex.length;
        while (--i >= 0) {
            if (this.m_aColumnPhysicalIndex[i] === iIndex)
                return i;
        }
        return -1;
    }
    _set_selected(aSelect, bAdd) {
        if (bAdd === true) {
            this.m_aSelected = [].concat(this.m_aSelected, aSelect);
        }
        else
            this.m_aSelected = aSelect;
    }
    _row_in_data(iIndex) { return this.m_aRowPhysicalIndex[iIndex]; }
    _row_in_ui(iDataIndex) {
        let i = this.m_aRowPhysicalIndex.length;
        while (--i >= 0) {
            if (this.m_aRowPhysicalIndex[i] === iDataIndex)
                return i;
        }
        console.assert(false, "no ui row for data row");
        return -1;
    }
    _trigger(_Trigger) {
        let oTrigger = this.trigger;
        if (oTrigger) {
        }
    }
}
CUITableText.s_sWidgetName = "uitabletext";
CUITableText.s_iIdNext = 0;
/**
 * Default styles
 */
CUITableText.s_oStyle = {
    class_component: "component",
    class_header: "header",
    class_input: "input",
    class_section: "uitabletext section",
    class_selected: "selected",
    class_value: "value",
    class_error: "error",
};
