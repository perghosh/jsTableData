/*
 
 CEditors is a singleton class with controls use to edit values that are registered.
 This class should be filled with editors at application initialization.

 - If CDataTable is loaded with data and edit is enabled. Then it will try to create edit controls for each column that are  editable.
   - Creating controls is done with class CEdits
 
 
 */
export var edit;
(function (edit) {
    //interface IEdit
    /**
     * Singleton class with registered edit controls
     */
    class CEditors {
        constructor() {
            this.m_aControl = [];
        }
        static GetInstance() {
            if (!CEditors._instance)
                CEditors._instance = new CEditors();
            return CEditors._instance;
        }
        Add(_1, _2) {
            if (Array.isArray(_1))
                this.m_aControl = _1;
            else {
                this.m_aControl.push([_1, _2]);
            }
        }
        GetEdit(sName) {
            let oEdit = this._get_edit(sName);
            if (oEdit)
                return oEdit;
            throw `Control for ${sName} was not found`;
        }
        _get_edit(sName) {
            let i = this.m_aControl.length;
            while (--i >= 0) {
                if (this.m_aControl[i][0] === sName)
                    return this.m_aControl[i][1];
            }
            return null;
        }
    }
    edit.CEditors = CEditors;
    /**
     *
     */
    class CEdits {
        constructor(options) {
            const o = options || {};
            this.m_oTableData = o.table || null;
            this.m_eSupportElement = o.support || null;
        }
        GetEdit(_1) {
            if (typeof _1 === "number")
                return this.m_aColumn[_1];
            else if (_1 instanceof HTMLElement) {
                let i = this.m_aColumn.length;
                while (--i >= 0) {
                    let o = this.m_aColumn[i];
                    if (o && o.Compare(_1) === true)
                        return o;
                }
            }
            else if (Array.isArray(_1)) { // try to find edit for relative position [row, column]
                let i = this.m_aColumn.length;
                while (--i >= 0) {
                    let o = this.m_aColumn[i];
                    if (o && o.Compare(_1) === true)
                        return o;
                }
            }
            return null;
        }
        Initialize(bCreate, eSupportElement) {
            console.assert(this.data !== null, "No source data, to initialize CTableData is required.");
            this.m_aColumn = [];
            const aEdit = this.data.COLUMNGetPropertyValue(true, ["edit.edit", "edit.name", "type.group", "name"]);
            if (eSupportElement)
                this.m_eSupportElement = eSupportElement;
            console.assert(this.m_eSupportElement !== null, "No support element found!");
            //this.m_aEdit = [];
            aEdit.forEach(a => {
                let [bEdit, sEditName, sGroup, sName] = a[1];
                sEditName = sEditName || sGroup;
                if (bEdit !== true || !sEditName)
                    this.m_aColumn.push(null);
                else {
                    let Edit = CEditors.GetInstance().GetEdit(sEditName);
                    let oEdit = new Edit({ edits: this, name: a[2] });
                    this.m_aColumn.push(oEdit);
                    if (bCreate)
                        oEdit.Create(this.m_eSupportElement);
                }
            });
        }
        Activate(_1, _2, _3, _4) {
            let bDeactivate;
            let eElement;
            let iRow, iColumn, iRowRelative, iColumnRelative;
            if (Array.isArray(_1) === true) {
                if (_1.length === 2) {
                    [iRow, iColumn] = _1;
                }
                else {
                    [iRow, iColumn, iRowRelative, iColumnRelative] = _1;
                }
                eElement = _2;
                bDeactivate = _3;
            }
            else {
                iRow = _1;
                iColumn = _2;
                eElement = _3;
                bDeactivate = _4;
            }
            if (bDeactivate === true && this.m_oEditActive) {
                let bOk = this.Deactivate();
                if (bOk === false)
                    return bOk;
            }
            let oEdit = this.m_aColumn[iColumn];
            console.assert(oEdit !== null, `No edit for column index ${iColumn}`);
            oEdit.SetPosition([iRow, iColumn], [iRowRelative, iColumnRelative]); // set position in table data and relative for ui control.
            let sValue = this.data.CELLGetValue(iRow, iColumn);
            let oRect = eElement.getBoundingClientRect();
            //oEdit.Show(oRect, sValue);
            oEdit.Open(eElement, sValue, oRect);
            oEdit.SetFocus();
            return true;
        }
        Deactivate(iColumn, callIf) {
            let aColumn;
            if (typeof iColumn === "number") {
                aColumn.push(this.m_aColumn[iColumn]);
            }
            else {
                aColumn = this.m_aColumn;
            }
            for (let i = 0; i < aColumn.length; i++) {
                let bDeactivate = true;
                let oEdit = aColumn[i];
                if (!oEdit)
                    continue;
                if (oEdit.IsModified() === true) {
                    if (callIf && callIf(oEdit.GetValueStack(), oEdit) === false)
                        bDeactivate = false;
                }
                if (bDeactivate === true && oEdit.IsOpen())
                    oEdit.Close();
            }
            return true;
        }
        /**
         * Get table data object that manages table data logic
         */
        get data() { return this.m_oTableData; }
        set data(table) { this.m_oTableData = table; }
    }
    edit.CEdits = CEdits;
    /* ********************************************************************** */
    /**
     *
     */
    class CEdit {
        constructor(o) {
            this.m_oEdits = o.edits; // set container (CEdits)
            this.m_sName = o.name; // name for edit control
            this.m_bOpen = false;
            this.m_aPosition = o.position || [-1, -1];
        }
        get element() { return this.m_eElement; }
        SetPosition(aPosition, aPositionRelative) {
            this.m_aPosition = aPosition;
            if (Array.isArray(aPositionRelative))
                this.m_aPositionRelative = aPositionRelative;
        }
        Create(_1, _2) {
            if (typeof _1 === "string" && _2) {
                this.m_eElement = document.createElement(_1);
                Object.assign(this.m_eElement.style, { display: "none", position: "absolute", boxSizing: "border-box" });
                this.m_eElement.dataset.input = "1";
                _2.appendChild(this.m_eElement);
            }
            return this.m_eElement;
        }
        Compare(_1) {
            if (_1 instanceof HTMLElement) {
                if (this.m_eElement && this.m_eElement.isSameNode(_1))
                    return true;
                return false;
            }
            else if (Array.isArray(_1) && this.m_aPositionRelative) {
                return (_1[0] === this.m_aPositionRelative[0] && _1[1] === this.m_aPositionRelative[1]);
            }
        }
        Open(eParent, sValue, oPosition) {
            if (oPosition) {
                //this.m_eElement.style.top = "" + oPosition.top + "px";
                //this.m_eElement.style.left = "" + oPosition.left + "px";
                //this.m_eElement.style.width = "" + oPosition.width + "px";
                this.m_eElement.style.width = "100%";
                this.m_eElement.style.top = "0px";
                this.m_eElement.style.left = "0px";
                //this.m_eElement.style.height = "" + (oPosition.height - 2) + "px";
                this.m_eElement.style.height = "100%";
                eParent.style.position = "relative";
            }
            this.SetValue(sValue);
            eParent.appendChild(this.m_eElement);
            this.m_eElement.style.display = "inline-block";
            this.m_bOpen = true;
        }
        GetPosition() { return this.m_aPosition; }
        GetPositionRelative() { return this.m_aPositionRelative; }
        GetValue() { return ""; }
        GetValueStack() { return null; }
        SetValue(_value) { }
        IsModified() { return false; }
        IsOpen() { return this.m_bOpen; }
        IsMoveKey(i) {
            if (i === 9 || i === 13)
                return true;
            return false;
        }
        SetFocus() { this.m_eElement.focus(); }
        Close(eSupport) {
            this.m_eElement.style.display = "none";
            this.m_bOpen = false;
            if (eSupport)
                eSupport.appendChild(this.m_eElement);
        }
        Destroy() {
            if (this.m_eElement)
                this.m_eElement.remove();
            this.m_eElement = null;
        }
    }
    edit.CEdit = CEdit;
    class CEditInput extends CEdit {
        constructor(o) {
            super(o);
            this.m_sOldValue = "";
        }
        Create(_1) {
            let eParent = _1;
            let e = super.Create("INPUT", eParent);
            e.type = "text";
            return e;
        }
        GetValue() {
            let _value = this.m_eElement.value;
            return _value;
        }
        GetValueStack() { return [this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }
        SetPosition(aPosition, aPositionRelative) {
            super.SetPosition(aPosition, aPositionRelative);
        }
        SetValue(_Value) {
            if (typeof _Value === "number")
                _Value = _Value.toString();
            if (typeof _Value !== "string") {
                if (_Value === null)
                    _Value = "";
                else if (typeof _Value === "number" || typeof _Value === "object")
                    _Value = _Value.toString();
                if (typeof _Value !== "string")
                    _Value = "";
            }
            this.m_sOldValue = _Value;
            this.m_eElement.value = _Value;
        }
        IsModified() {
            let _value = this.m_eElement.value;
            return this.m_sOldValue !== _value;
        }
    }
    edit.CEditInput = CEditInput;
    class CEditNumber extends CEdit {
        constructor(o) {
            super(o);
            this.m_sOldValue = "";
        }
        Create(_1) {
            let eParent = _1;
            let e = super.Create("INPUT", eParent);
            e.type = "text";
            e.pattern = "[0-9]+([\\.,][0-9]+)?";
            return e;
        }
        //Compare(e: HTMLElement): boolean { return super.Compare(e); }
        GetValue() {
            let _value = this.m_eElement.value;
            return _value;
        }
        GetValueStack() { return [this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }
        SetPosition(aPosition, aPositionRelative) {
            super.SetPosition(aPosition, aPositionRelative);
        }
        SetValue(_Value) {
            if (typeof _Value === "number")
                _Value = _Value.toString();
            if (typeof _Value !== "string") {
                if (_Value === null)
                    _Value = "";
                else if (typeof _Value === "number" || typeof _Value === "object")
                    _Value = _Value.toString();
                if (typeof _Value !== "string")
                    _Value = "";
            }
            this.m_sOldValue = _Value;
            this.m_eElement.value = _Value;
        }
        IsModified() {
            let _value = this.m_eElement.value;
            return this.m_sOldValue !== _value;
        }
    }
    edit.CEditNumber = CEditNumber;
    class CEditPassword extends CEdit {
        constructor(o) {
            super(o);
            this.m_sOldValue = "";
        }
        Create(_1) {
            let eParent = _1;
            let e = super.Create("INPUT", eParent);
            e.type = "password";
            return e;
        }
        GetValue() {
            let _value = this.m_eElement.value;
            return _value;
        }
        GetValueStack() { return [this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }
        SetPosition(aPosition, aPositionRelative) {
            super.SetPosition(aPosition, aPositionRelative);
        }
        SetValue(_Value) {
            if (typeof _Value === "number")
                _Value = _Value.toString();
            if (typeof _Value !== "string") {
                if (_Value === null)
                    _Value = "";
                else if (typeof _Value === "number" || typeof _Value === "object")
                    _Value = _Value.toString();
                if (typeof _Value !== "string")
                    _Value = "";
            }
            this.m_sOldValue = _Value;
            this.m_eElement.value = _Value;
        }
        IsModified() {
            let _value = this.m_eElement.value;
            return this.m_sOldValue !== _value;
        }
    }
    edit.CEditPassword = CEditPassword;
})(edit || (edit = {}));
