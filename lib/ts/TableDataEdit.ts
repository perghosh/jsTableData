/*
 
 CEditors is a singleton class with controls use to edit values that are registered.
 This class should be filled with editors at application initialization.

 - If CDataTable is loaded with data and edit is enabled. Then it will try to create edit controls for each column that are  editable.
   - Creating controls is done with class CEdits
 
 
 */



import { CTableData, enumMove } from "./TableData.js";

namespace details {
   export type construct_edits = {
      support?: HTMLElement,     // element used to work with temporary elements
      table?: CTableData,        // table data object. feeds table with data
   }

   export type construct_edit = {
      edits: edit.CEdits,        // owner edits
      name: string,              // name for edit
      position?: [ number, number ],// current position
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
         aEdit.forEach(a => {
            let [ bEdit, sEditName, sGroup, sName ] = a[1];
            sEditName = sEditName || sGroup;
            if(bEdit !== true || !sEditName) this.m_aColumn.push(null);
            else {
               let Edit: any = CEditors.GetInstance().GetEdit(sEditName);
               let oEdit = new Edit({ edits: this, name: a[ 2 ]});
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

      Deactivate( iColumn?: number, callIf?: (( aNewValue: details.value_stack, CEdit ) => boolean) ): boolean {
         let aColumn: edit.CEdit[];
         if(typeof iColumn === "number") {
            aColumn.push( this.m_aColumn[iColumn] );
         }
         else {
            aColumn = this.m_aColumn;
         }

         for(let i = 0; i < aColumn.length; i++) {
            let bDeactivate = true;
            let oEdit = aColumn[i];
            if( !oEdit ) continue;
            if(oEdit.IsModified() === true) {
               if( callIf && callIf( oEdit.GetValueStack(), oEdit ) === false ) bDeactivate = false;
            }

            if( bDeactivate === true && oEdit.IsOpen() ) oEdit.Close();
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
      m_bOpen: boolean;                 // True if edit control is open (visible)
      m_aPosition: [ number, number ];
      m_aPositionRelative: [ number, number ];

      constructor(o: details.construct_edit) {
         this.m_oEdits = o.edits;       // set container (CEdits)
         this.m_sName = o.name;         // name for edit control
         this.m_bOpen = false;
         this.m_aPosition = o.position || [ -1, -1 ];
      }

      get element(): HTMLElement { return this.m_eElement; }

      SetPosition(aPosition: [ number, number ], aPositionRelative?: [ number, number ]) {
         this.m_aPosition = aPosition;
         if(Array.isArray(aPositionRelative)) this.m_aPositionRelative = aPositionRelative;
      }

      Create(sTagName: string, eParent: HTMLElement): HTMLElement;
      Create(eParent: HTMLElement): HTMLInputElement;
      Create(sTagName: string, eParent: HTMLElement): HTMLInputElement;
      Create(_1?: any, _2?: any): any {
         if(typeof _1 === "string" && _2) {
            this.m_eElement = document.createElement(_1);
            Object.assign(this.m_eElement.style, { display: "none", position: "absolute", boxSizing: "border-box" });
            this.m_eElement.dataset.input = "1";
            <HTMLElement>_2.appendChild(this.m_eElement);
         }
         return this.m_eElement;
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

         this.SetValue( sValue );

         eParent.appendChild( this.m_eElement );
         this.m_eElement.style.display = "inline-block";
         this.m_bOpen = true;
      }

      GetPosition(): [ number, number ] { return this.m_aPosition; }
      GetPositionRelative(): [ number, number ] { return this.m_aPositionRelative; }

      GetValue(): string { return ""; }
      GetValueStack(): details.value_stack { return null; }

      SetValue(_value: any) { }
      IsModified(): boolean { return false; }
      IsOpen(): boolean { return this.m_bOpen; }
      IsMoveKey(i: number): boolean {
         if( i === 9 || i === 13) return true;
         return false;
      }

      SetFocus(): void { this.m_eElement.focus(); }

      Close(eSupport?: HTMLElement) {
         this.m_eElement.style.display = "none";
         this.m_bOpen = false;
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


}