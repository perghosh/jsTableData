/*
 
 CEditors is a singleton class with controls use to edit values t, tabledata_columnhat are registered.
 This class should be filled with editors at application initialization.

 - If CDataTable is loaded with data and edit is enabled. Then it will try to create edit controls for each column that are  editable.
   - Creating controls is done with class CEdits
 
 
 */

/// <reference path="TableData.ts" />

import { CTableData, enumMove, tabledata_column} from "./TableData";

export const enum enumInputState {
   Open = 0x0001, 
   Canceled = 0x0002, 
}


namespace details {

   export type construct_edits = {
      support?: HTMLElement,     // element used to work with temporary elements
      table?: CTableData,        // table data object. feeds table with data
   }

   export type construct_edit = {
      edits: edit.CEdits,        // owner edits
      name: string,              // name for edit
      position?: [ number, number ],// current position
      column: tabledata_column,  // column information  
   }

   export type value_stack = 
   [ 
      [number,number],  // position in table data
      [number,number],  // position in UI
      unknown,          // new value
      unknown           // old value
   ];
   
}

export namespace edit {

   //interface IEdit

   /**
    * Singleton class with registered edit controls
    */
   export class CEditors {
      private static _instance: CEditors;

      m_aControl: [ string, CEdit ][];
      private constructor() {
         this.m_aControl = [];
      }
      public static GetInstance() {
         if(!CEditors._instance) CEditors._instance = new CEditors();
         return CEditors._instance;
      }

      Add(sName: string, oEdit: CEdit): void;
      Add(aControl: [ string, CEdit ][]): void;
      Add(_1: any, _2?: any): void {
         if(Array.isArray(_1)) this.m_aControl = _1;
         else {
            this.m_aControl.push([ _1, _2 ]);   
         }
      }

      GetEdit(sName: string) {
         let oEdit = this._get_edit(sName);
         if(oEdit) return oEdit;
         throw `Control for ${sName} was not found`;
      }


      _get_edit(sName: string) {
         let i = this.m_aControl.length;
         while(--i >= 0) {
            if(this.m_aControl[ i ][ 0 ] === sName) return this.m_aControl[ i ][ 1 ];
         }
         return null;
      }
   }

   /**
    * 
    */
   export class CEdits {
      m_oEditActive: CEdit;            // active edit control
      //m_aEdit: [ string, CEdit ][];
      m_aColumn: CEdit[];
      m_aEditControl: { name: string, control: CEdit };
      m_eSupportElement: HTMLElement;  // Element to be used storing elements in edit when not in use
      m_oTableData: CTableData;        // table source data object used to populate CUITableText

      constructor(options?: details.construct_edits) {
         const o: details.construct_edits = options || {};
         this.m_oTableData = o.table || null;
         this.m_eSupportElement = o.support || null;
      }

      /**
       * Get edit item for column
       * @param {number} iColumn index to column, this index should match column in table data
       */
      GetEdit(iColumn: number): edit.CEdit;
      GetEdit(eInput: HTMLElement): edit.CEdit;
      GetEdit(aCell: [number, number]): edit.CEdit;
      GetEdit(_1: any): edit.CEdit {
         if(typeof _1 === "number") return <edit.CEdit>this.m_aColumn[ _1 ];
         else if(_1 instanceof HTMLElement) {
            let i = this.m_aColumn.length;
            while(--i >= 0) {
               let o = <edit.CEdit>this.m_aColumn[ i ];
               if(o && o.Compare(<HTMLElement>_1) === true) return o;
            }
         }
         else if(Array.isArray(_1)) {                                         // try to find edit for relative position [row, column]
            let i = this.m_aColumn.length;
            while(--i >= 0) {
               let o = <edit.CEdit>this.m_aColumn[ i ];
               if(o && o.Compare(<[ number, number ]>_1) === true) return o;
            }
         }

         return null;
      }

      Initialize(bCreate?: boolean, eSupportElement?: HTMLElement): void {                         console.assert(this.data !== null, "No source data, to initialize CTableData is required.")
         this.m_aColumn = [];
         const aEdit = <unknown[]>this.data.COLUMNGetPropertyValue(true, [ "edit.edit", "edit.name", "type.group", "name" ]);

         if( eSupportElement ) this.m_eSupportElement = eSupportElement;
                                                                                                   console.assert(this.m_eSupportElement !== null,"No support element found!");

         //this.m_aEdit = [];
         aEdit.forEach( (a,iIndex) => {
            let [ bEdit, sEditName, sGroup, sName ] = a[1];
            sEditName = sEditName || sGroup;
            if(bEdit !== true || !sEditName) this.m_aColumn.push(null);
            else {
               let oColumn = this.data.COLUMNGet( iIndex, undefined, true );
               let Edit: any = CEditors.GetInstance().GetEdit(sEditName);
               let oEdit = new Edit({ edits: this, name: a[ 2 ], column: oColumn });
               this.m_aColumn.push(oEdit);

               if(bCreate) oEdit.Create(this.m_eSupportElement);
            }
         });
      }

      /**
       * Activate edit for column index or name
       * @param iRow index to row in table data, this is the physical index
       * @param iColumn physical index to column, value  
       * @param eElement
       */
      Activate(iRow: number, iColumn: number, eElement: HTMLElement, bDeactivate?: boolean): boolean;
      Activate(aPosition: [ number, number ], eElement: HTMLElement, bDeactivate?: boolean): boolean;
      Activate(aPositionAndRelative: [ number, number, number, number ], eElement: HTMLElement, bDeactivate?: boolean): boolean;
      Activate(_1: any, _2: any, _3: any, _4?: any): boolean {
         let bDeactivate: boolean;
         let eElement: HTMLElement;
         let iRow: number, iColumn: number, iRowRelative: number, iColumnRelative: number;

         if( Array.isArray(_1) === true ) {
            if(_1.length === 2) { [ iRow, iColumn ] = _1; }
            else { [ iRow, iColumn, iRowRelative, iColumnRelative ] = _1; }
            eElement = _2;
            bDeactivate = _3;
         }
         else {
            iRow = _1;
            iColumn = _2;
            eElement = _3;
            bDeactivate = _4;
         }

         if(bDeactivate === true && this.m_oEditActive) {
            let bOk = this.Deactivate();
            if(bOk === false) return bOk;
         }

         let oEdit = <edit.CEdit>this.m_aColumn[ iColumn ];                                        console.assert(oEdit !== null, `No edit for column index ${iColumn}`);

         oEdit.SetPosition([ iRow, iColumn ], [ iRowRelative, iColumnRelative] );                  // set position in table data and relative for ui control.
         let sValue = <string>this.data.CELLGetValue( iRow, iColumn );
         let oRect = eElement.getBoundingClientRect();
         //oEdit.Show(oRect, sValue);
         oEdit.Open(eElement, sValue, oRect);
         oEdit.SetFocus();
         return true;
      }

      Deactivate( _Column?: boolean|number, callIf?: (( aNewValue: details.value_stack, CEdit ) => boolean) ): boolean {
         let bChange = true;
         let aColumn: edit.CEdit[];
         if(typeof _Column === "number") {
            aColumn.push( this.m_aColumn[_Column] );
         }
         else {
            aColumn = this.m_aColumn;
            if( _Column === false ) bChange = false;
         }

         for(let i = 0; i < aColumn.length; i++) {
            let bDeactivate = true;
            let oEdit = aColumn[i];
            if( !oEdit ) continue;
            if( bChange === true && oEdit.IsModified() === true ) {
               if( callIf && callIf( oEdit.GetValueStack(), oEdit ) === false ) bDeactivate = false;
            }

            if( bDeactivate === true && oEdit.IsOpen() ) oEdit.Close();
            else oEdit.SetClose();
         }

         return true;
      }

      /**
       * Get table data object that manages table data logic 
       */
      get data() { return this.m_oTableData; }
      set data(table: CTableData) { this.m_oTableData = table; }
   }

   /* ********************************************************************** */

   /**
    *
    */
   export class CEdit {
      m_eElement: HTMLElement;
      m_sName: string;                  // Control name
      m_oEdits: CEdits;                 // Owning edit manager
      m_sOldParentPosition: string      // save old position value
      m_iState: number;                 // input state
      m_aPosition: [ number, number ];  // Physical position in table data
      m_aPositionRelative: [ number, number ];// Relative position in ui element
      m_oColumn: tabledata_column;      // Column information from table data

      constructor(o: details.construct_edit) {
         this.m_oEdits = o.edits;       // set container (CEdits)
         this.m_sName = o.name;         // name for edit control
         this.m_iState = 0;
         this.m_aPosition = o.position || [ -1, -1 ];
         this.m_oColumn = o.column;
      }

      get element(): HTMLElement { return this.m_eElement; }
      get column(): tabledata_column { return this.m_oColumn; }

      SetPosition(aPosition: [ number, number ], aPositionRelative?: [ number, number ]) {
         this.m_aPosition = aPosition;
         if(Array.isArray(aPositionRelative)) this.m_aPositionRelative = aPositionRelative;
      }

      Create(sTagName: string, eParent: HTMLElement): HTMLElement;
      Create(eParent: HTMLElement): HTMLElement;
      Create(sTagName: string, eParent: HTMLElement): HTMLElement;
      Create(_1?: any, _2?: any): any {
         if(typeof _1 === "string" && _2) {
            this.m_eElement = document.createElement(_1);
            Object.assign(this.m_eElement.style, { display: "none", position: "absolute", boxSizing: "border-box" });
            this.m_eElement.dataset.input = "1";
            <HTMLElement>_2.appendChild(this.m_eElement);
            this.SetListener();
         }
         return this.m_eElement;
      }

      SetListener() {
         this.m_eElement.addEventListener("keydown", (e) => {
            if( e.key === "Escape" ) {
               let eFocus = <HTMLElement>this.m_eElement.closest("[tabIndex]");
               this.m_iState |= enumInputState.Canceled;
               this.m_oEdits.Deactivate(false);
               if( eFocus ) eFocus.focus();
            }
         });
      }


      Compare(e: HTMLElement): boolean;
      Compare(aRelative: [number, number]): boolean;
      Compare(_1: any): boolean {
         if(_1 instanceof HTMLElement) {
            if(this.m_eElement && this.m_eElement.isSameNode(_1)) return true;
            return false;
         }
         else if(Array.isArray(_1) && this.m_aPositionRelative) {
            return (_1[ 0 ] === this.m_aPositionRelative[ 0 ] && _1[ 1 ] === this.m_aPositionRelative[ 1 ]);
         }
      }

      Open( eParent: HTMLElement, sValue?: string, oPosition?: DOMRect) {
         if( oPosition ) {
            this.m_eElement.style.width = "100%";
            this.m_eElement.style.top = "0px";
            this.m_eElement.style.left = "0px";
            this.m_eElement.style.height = "100%";

            this.m_sOldParentPosition = eParent.style.position;
            eParent.style.position = "relative";
         }

         this.SetValue( sValue );

         eParent.appendChild( this.m_eElement );
         this.m_eElement.style.display = "inline-block";
         this.m_iState = enumInputState.Open;
      }

      GetPosition(): [ number, number ] { return this.m_aPosition; }
      GetPositionRelative(): [ number, number ] { return this.m_aPositionRelative; }

      GetValue(): string|unknown { return ""; }
      GetValueStack(): details.value_stack { return null; }

      SetValue(_value: any) { }
      IsModified(): boolean { return false; }
      IsOpen(): boolean { return (this.m_iState & enumInputState.Open) === enumInputState.Open; }
      IsMoveKey(i: number): boolean {
         if( i === 9 || i === 13) return true;
         return false;
      }

      SetClose(): void { this.m_iState &= ~enumInputState.Open; }
      SetFocus(): void { this.m_eElement.focus(); }

      Close(eSupport?: HTMLElement) {
         this.m_eElement.parentElement.style.position = this.m_sOldParentPosition;
         this.m_eElement.style.display = "none";
         this.SetClose();
         if( eSupport ) eSupport.appendChild( this.m_eElement );
      }

      Destroy() {
         if(this.m_eElement) this.m_eElement.remove();
         this.m_eElement = null;
      }
   }

   export class CEditInput extends CEdit {
      m_sOldValue: string;
      constructor(o: details.construct_edit) {
         super(o);
         this.m_sOldValue = "";
      }

      Create(_1: any): HTMLInputElement {
         let eParent: HTMLElement = _1;
         let e: HTMLInputElement = <HTMLInputElement>super.Create("INPUT", eParent);
         e.type = "text";

         return e;
      }

      GetValue(): string {
         let _value = (<HTMLInputElement>this.m_eElement).value;
         return _value;
      }

      GetValueStack(): details.value_stack { return [ this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }

      SetPosition(aPosition: [ number, number ], aPositionRelative?: [ number, number ]): void {
         super.SetPosition(aPosition, aPositionRelative);
      }

      SetValue(_Value: unknown) {
         if(typeof _Value === "number" ) _Value = _Value.toString();
         if(typeof _Value !== "string" ) {
            if(_Value === null) _Value = "";
            else if( typeof _Value === "number" || typeof _Value === "object" ) _Value = _Value.toString();
            if(typeof _Value !== "string") _Value = "";
         }

         this.m_sOldValue = <string>_Value;
         (<HTMLInputElement>this.m_eElement).value = <string>_Value;
      }

      IsModified(): boolean {
         if( this.m_iState & enumInputState.Canceled ) return false;
         let _value = (<HTMLInputElement>this.m_eElement).value;
         return this.m_sOldValue !== _value;
      }
   }

   export class CEditNumber extends CEdit {
      m_sOldValue: string;
      constructor(o: details.construct_edit) {
         super(o);
         this.m_sOldValue = "";
      }

      Create(_1: any): HTMLInputElement {
         let eParent: HTMLElement = _1;
         let e: HTMLInputElement = <HTMLInputElement>super.Create("INPUT", eParent);
         e.type = "text";
         e.pattern = "[0-9]+([\\.,][0-9]+)?";
         return e;
      }

      //Compare(e: HTMLElement): boolean { return super.Compare(e); }

      GetValue(): string {
         let _value = (<HTMLInputElement>this.m_eElement).value;
         return _value;
      }

      GetValueStack(): details.value_stack { return [ this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }

      SetPosition(aPosition: [ number, number ], aPositionRelative?: [ number, number ]): void {
         super.SetPosition(aPosition, aPositionRelative);
      }

      SetValue(_Value: unknown) {
         if(typeof _Value === "number" ) _Value = _Value.toString();
         if(typeof _Value !== "string" ) {
            if(_Value === null) _Value = "";
            else if( typeof _Value === "number" || typeof _Value === "object" ) _Value = _Value.toString();
            if(typeof _Value !== "string") _Value = "";
         }

         this.m_sOldValue = <string>_Value;
         (<HTMLInputElement>this.m_eElement).value = <string>_Value;
      }

      IsModified(): boolean {
         let _value = (<HTMLInputElement>this.m_eElement).value;
         return this.m_sOldValue !== _value;
      }
   }

   export class CEditPassword extends CEdit {
      m_sOldValue: string;
      constructor(o: details.construct_edit) {
         super(o);
         this.m_sOldValue = "";
      }

      Create(_1: any): HTMLInputElement {
         let eParent: HTMLElement = _1;
         let e: HTMLInputElement = <HTMLInputElement>super.Create("INPUT", eParent);
         e.type = "password";
         return e;
      }

      GetValue(): string {
         let _value = (<HTMLInputElement>this.m_eElement).value;
         return _value;
      }

      GetValueStack(): details.value_stack { return [ this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }

      SetPosition(aPosition: [ number, number ], aPositionRelative?: [ number, number ]): void {
         super.SetPosition(aPosition, aPositionRelative);
      }

      SetValue(_Value: unknown) {
         if(typeof _Value === "number" ) _Value = _Value.toString();
         if(typeof _Value !== "string" ) {
            if(_Value === null) _Value = "";
            else if( typeof _Value === "number" || typeof _Value === "object" ) _Value = _Value.toString();
            if(typeof _Value !== "string") _Value = "";
         }

         this.m_sOldValue = <string>_Value;
         (<HTMLInputElement>this.m_eElement).value = <string>_Value;
      }

      IsModified(): boolean {
         let _value = (<HTMLInputElement>this.m_eElement).value;
         return this.m_sOldValue !== _value;
      }
   }

   export class CEditCheckbox extends CEdit {
      m_sOldValue: string;
      constructor(o: details.construct_edit) {
         super(o);
         this.m_sOldValue = "";
      }

      Create(_1: any): HTMLInputElement {
         let eParent: HTMLElement = _1;
         let e = <HTMLInputElement>document.createElement("INPUT");
         Object.assign(e.style, { display: "none" });
         e.dataset.input = "1";
         eParent.appendChild(e);
         e.type = "checkbox";
         e.value = "1";
         this.m_eElement = e;
         return e;
      }

      Open( eParent: HTMLElement, sValue?: string, oPosition?: DOMRect) {
         this.SetValue( sValue );

         eParent.appendChild( this.m_eElement );
         this.m_eElement.style.display = "inline";
         this.m_iState = enumInputState.Open;
      }

      GetValue(): string {
         let _value = (<HTMLInputElement>this.m_eElement).value;
         return _value;
      }

      GetValueStack(): details.value_stack { return [ this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }

      SetPosition(aPosition: [ number, number ], aPositionRelative?: [ number, number ]): void {
         super.SetPosition(aPosition, aPositionRelative);
      }

      SetValue(_Value: unknown) {
         if(typeof _Value === "number" ) _Value = _Value.toString();
         if(typeof _Value !== "string" ) {
            if(_Value === null) _Value = "";
            else if( typeof _Value === "number" || typeof _Value === "object" ) _Value = _Value.toString();
            if(typeof _Value !== "string") _Value = "";
         }

         this.m_sOldValue = <string>_Value;
         (<HTMLInputElement>this.m_eElement).value = <string>_Value;
      }

      IsModified(): boolean {
         let _value = (<HTMLInputElement>this.m_eElement).value;
         return this.m_sOldValue !== _value;
      }
   }

   export class CEditSelect extends CEdit {
      m_OldValue: unknown;
      constructor(o: details.construct_edit) {
         super(o);
         this.m_OldValue = null;
      }

      Create(_1: any): HTMLSelectElement {
         let eParent: HTMLElement = _1;
         let e = <HTMLSelectElement>super.Create("SELECT", eParent);

         // create options for select
         let aList = this.column.list;
         aList.forEach( (a,i) => {
            let eO = document.createElement("option");
            eO.value = a[0].toString();
            eO.text = a[1].toString();
            e.appendChild( eO );
         });

         Object.assign(e.style, { display: "none" });
         e.dataset.input = "1";
         eParent.appendChild(e);
         this.m_eElement = e;
         return e;
      }

      GetValue(): string|unknown {
         if( (<HTMLSelectElement>this.m_eElement).selectedIndex === -1 ) return null;
         let _text = (<HTMLSelectElement>this.m_eElement).options[(<HTMLSelectElement>this.m_eElement).selectedIndex].text;
         let _value = (<HTMLSelectElement>this.m_eElement).value;
         return [_text, _value];
      }

      GetValueStack(): details.value_stack { return [ this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_OldValue]; }

      SetPosition(aPosition: [ number, number ], aPositionRelative?: [ number, number ]): void {
         super.SetPosition(aPosition, aPositionRelative);
      }

      SetValue(_Value: unknown) {
         if(typeof _Value === "number" ) _Value = _Value.toString();
         if(typeof _Value !== "string" ) {
            if(_Value === null) _Value = "";
            else if( typeof _Value === "number" || typeof _Value === "object" ) _Value = _Value.toString();
            if(typeof _Value !== "string") _Value = "";
         }

         this.m_OldValue = _Value;
         (<HTMLInputElement>this.m_eElement).value = <string>_Value;
      }

      IsModified(): boolean {
         let _value = (<HTMLSelectElement>this.m_eElement).value;
         return this.m_OldValue !== _value;
      }

   }


}