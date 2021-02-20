import { CTableData, IUITableData, tabledata_column } from "./TableData.js";
import { edit } from "./TableDataEdit.js";

// before = 0x10000000
// after  = 0x

// edit   = 0x010000
// load   = 0x020000
// column = 0x030000


var ResizeObserver: any;

export const enum enumReason {
   Edit = 0x0001,
   Browser = 0x0002,
}

/**
 * Triggers - constant number to know the event type.
 */
export const enum enumTrigger {
   BEGIN = 0,
   Unknown_ = 0,
   BeforeCreate_ = 1,
   AfterCreate_,
   BeforeLoadNew_,
   AfterLoadNew_,
   BeforeLoad_,
   AfterLoad_,
   BeforeValidateValue_,
   BeforeSetValue_,
   AfterSetValue_,
   BeforeSetRange_,
   AfterSetRange_,
   BeforeSetRow_,
   AfterSetRow_,
   BeforeRemoveRow_,
   AfterRemoveRow_,

   OnSetValueError_,
   OnResize_,

   UpdateDataNew,
   UpdateData,
   UpdateRowNew,
   UpdateRowDelete,
   UpdateRow,
   UpdateCell,
   LAST_EVENT,                                                                 // Last event

   MASK = 0xffff,
   TRIGGER_BEFORE       = 0x10000,
   TRIGGER_AFTER        = 0x20000,
   TRIGGER_ON           = 0x40000,

   BeforeCreate         = TRIGGER_BEFORE + BeforeCreate_,
   AfterCreate          = TRIGGER_BEFORE + AfterCreate_,
   BeforeLoadNew        = TRIGGER_BEFORE + BeforeLoadNew_,
   AfterLoadNew         = TRIGGER_BEFORE + AfterLoadNew_,
   BeforeLoad           = TRIGGER_BEFORE + BeforeLoad_,
   AfterLoad            = TRIGGER_BEFORE + AfterLoad_,
   BeforeValidateValue  = TRIGGER_BEFORE + BeforeValidateValue_,
   BeforeSetValue       = TRIGGER_BEFORE + BeforeSetValue_,
   AfterSetValue        = TRIGGER_AFTER  + AfterSetValue_,
   BeforeSetRange       = TRIGGER_BEFORE + BeforeSetRange_,
   AfterSetRange        = TRIGGER_AFTER  + AfterSetRange_,
   BeforeSetRow         = TRIGGER_BEFORE + BeforeSetRow_,
   AfterSetRow          = TRIGGER_AFTER  + AfterSetRow_,
   BeforeRemoveRow      = TRIGGER_BEFORE + BeforeRemoveRow_,
   AfterRemoveRow       = TRIGGER_AFTER  + AfterRemoveRow_,

   OnSetValueError      = TRIGGER_ON     + OnSetValueError_,
   OnResize             = TRIGGER_ON     + OnResize_,
}

/**
 * Event object for events sent from ui table data items
 * 
 */
export type EventDataTable = {
   column?: tabledata_column,  // column information
   data?: CTableData,          // table data object
   dataUI?: IUITableData,      // ui table data object
   iEvent?: number,            // event number
   iEventAll?: number,         // all event data
   edit?: edit.CEdit,          // Edit control
   eElement?: HTMLElement,     // if elements is involved in event
   iReason?: number,           // reason for event
}


namespace details {
   export type construct = {
      table?: CTableData,        // table data object. feeds table with data
      trigger?: ((e: EventDataTable, data: any) => boolean) | ((e: EventDataTable, data: any) => boolean)[],
   }
}


export class CTableDataTrigger {
   m_acallTrigger: ((e: EventDataTable, _data: any) => boolean)[];
   m_aTrigger: boolean[];     // Triggers that are disabled
   m_oTableData: CTableData;  // table source data object used to populate CUITableText
   m_oRS: any;                // ResizeObserver (TODO: add interface for resize observer for typescript)

   /**
    * Each trigger has a type and that is a number. With `s_aTriggerName` trigger numbers can set a name for each event.
    */
   static s_aTriggerName: string[] = [];

   static GetTriggerNumber(sName: string) {
      const a = CTableDataTrigger.s_aTriggerName;
      let i = a.length;
      while(--i >= 0) {
         if(a[ i ] === sName) return i;
      }
      return -1;
   }

   static GetTriggerName(iTrigger: number): string {
      return CTableDataTrigger.s_aTriggerName[ iTrigger & enumTrigger.MASK ];
   }


   static SetTriggerName(aName: string[] | [ number, string ][]) {
      if( CTableDataTrigger.s_aTriggerName.length === 0 ) CTableDataTrigger.s_aTriggerName = new Array( enumTrigger.LAST_EVENT );
      if(Array.isArray(aName[ 0 ])) {
         let i = aName.length;
         while( --i >= 0) CTableDataTrigger.s_aTriggerName[ aName[i][0] ] = aName[i][1];
      }
      else {
         let i = aName.length;
         while( --i >= 0) CTableDataTrigger.s_aTriggerName[ i ] = <string>aName[i];
      }
   }

   constructor(options: details.construct) {
      const o: details.construct = options || {};

      this.m_oTableData = o.table || null;

      this.m_aTrigger = (new Array(enumTrigger.LAST_EVENT)).fill(true);
      this.m_acallTrigger = [];
      if(o.trigger) this.m_acallTrigger = Array.isArray(o.trigger) ? o.trigger : [ o.trigger ];

      this.m_oRS = null;
   }

   /**
    * Get table data object that manages table data logic 
    */
   get data() { return this.m_oTableData; }


   Call(aTrigger: number[]): number[] {
      let aCall: number[] = [];
      aTrigger.forEach(iTrigger => {
         if(this.m_aTrigger[ iTrigger & enumTrigger.MASK ]) aCall.push( iTrigger );
      });
      return aCall;
   }

   Enable(_Trigger: number | number[], bEnable: boolean) {
      if(Array.isArray(_Trigger) === false) _Trigger = [ <number>_Trigger ];
      (<number[]>_Trigger).forEach(i => {
         this.m_aTrigger[ i & enumTrigger.MASK ] = bEnable;
      });
   }

   /**
    * 
    * @param aTrigger
    * @param iReason
    * @param aArgument
    * @param callback
    */
   Trigger(iTrigger: number, e: EventDataTable, aArgument: any | any[], callback?: (any) => any): boolean;
   Trigger(aTrigger: number[], e: EventDataTable, aArgument: any | any[], callback?: (any) => any): boolean;
   Trigger(_1: any, e: EventDataTable, aArgument: any | any[], callback?: (any) => any): boolean {
      let aTrigger: number[] = Array.isArray(_1) ? _1 : [ _1 ];
      e = this._event(e);

      let _trigger = (iTrigger: number, e: EventDataTable, aArgument: any[]): boolean => {
         let bOk: boolean = true;
         e.iEvent = iTrigger & enumTrigger.MASK;
         e.iEventAll = iTrigger;
         for(let i = 0; bOk === true && i < this.m_acallTrigger.length; i++) {
            // bOk = this.m_acallTrigger[ i ].call(this.data, iTrigger & enumTrigger.MASK, iReason, aArgument);
            bOk = this.m_acallTrigger[ i ].call(this.data, e, aArgument);
            if(typeof bOk !== "boolean") bOk = true;

         }
         return bOk;
      };

      let bOk: boolean = true;
      let iTrigger: number;

      if(callback === void 0) {
         for(let i = 0; bOk === true && i < aTrigger.length; i++) {
            iTrigger = aTrigger[ i ];
            bOk = _trigger(iTrigger, e, aArgument);
         }
      }
      else {
         for(let i = 0; bOk === true && i < aTrigger.length; i++) {
            iTrigger = aTrigger[ i ];
            if((iTrigger & enumTrigger.TRIGGER_BEFORE) === enumTrigger.TRIGGER_BEFORE) {
               bOk = _trigger(iTrigger, e, aArgument);
            }
         }

         if(bOk === true && callback) {
            callback(aArgument);
         }

         for(let i = 0; bOk === true && i < aTrigger.length; i++) {
            iTrigger = aTrigger[ i ];
            if((iTrigger & enumTrigger.TRIGGER_AFTER) === enumTrigger.TRIGGER_AFTER) {
               bOk = _trigger(iTrigger, e, aArgument);
            }
         }
      }
      return bOk;
   }

   /**
    * 
    * @param aTrigger
    * @param iReason
    * @param _Argument
    */
   TriggerOn(aTrigger: number[], e: EventDataTable, _Argument: any | any[]): boolean {
      e = this._event(e);

      let bOk: boolean = true;
      let iTrigger: number;
      let _trigger = (iTrigger: number, e: EventDataTable, aArgument: any[]): boolean => {
         let bOk: boolean = true;
         e.iEvent = iTrigger & enumTrigger.MASK;
         e.iEventAll = iTrigger;
         for(let i = 0; bOk === true && i < this.m_acallTrigger.length; i++) {
            bOk = this.m_acallTrigger[ i ].call(this.data, e, aArgument);
            if(typeof bOk !== "boolean") bOk = true;

         }
         return bOk;
      };

      for(let i = 0; bOk === true && i < aTrigger.length; i++) {
         iTrigger = aTrigger[ i ];
         bOk = _trigger(iTrigger, e, _Argument);
      }

      return bOk;
   }

   TriggerUpdate(iTrigger) {
      const aUITable: [ string, IUITableData ][] = <[ string, IUITableData ][]>this.data.UIGet();
      aUITable.forEach((a: [ string, IUITableData ]) => {
         a[ 1 ].update(iTrigger);
      });

   }


   /**
    * Set value to table data
    * @param {EventDataTable} e event data
    * @param {any[]} aArgument data sent to callbacks
    * @param _Row row where value is to update
    * @param _Column column value is that is updated
    * @param value value set
    * @param bRaw if row and column index is exact position in table data (no calculation is done to get posotion)
    */
   CELLSetValue(e: EventDataTable, aArgument: any[], _Row: any, _Column: any, value?: unknown, bRaw?: boolean) {
      let bReturn: boolean;
      bReturn = this.Trigger(this.Call([ enumTrigger.BeforeSetValue, enumTrigger.AfterSetValue ]), e, aArgument,
      () => {
         this.data.CELLSetValue(_Row, _Column, value, bRaw);
      });

      return bReturn;
   }

   ObserveResize(_1: any, bAdd?: boolean) {
      if(typeof bAdd !== "boolean") bAdd = true;
      if(!this.m_oRS) {
         this.m_oRS = new (<any>window).ResizeObserver((aE, oRS) => {
            let e = this._event({ iReason: enumReason.Browser });
            for(let _e of aE) {
               this.TriggerOn(this.Call([ enumTrigger.OnResize ]), e, _e);
            }
         });
      }

      if(_1 instanceof HTMLElement) {
         if(bAdd) this.m_oRS.observe(_1);
         else this.m_oRS.unobserve( _1 );
      }
   }

   /**
    * Get ui objects connected to root element.
    * @param eRoot
    * @param bDeep
    */
   GetUIObjectsFromElement(eRoot: HTMLElement, bDeep?: boolean): unknown[] {
      let aUI: unknown[]
      bDeep = bDeep || false;
      const sId = this.data.id;
      if(bDeep === false) {
         var aChildren = eRoot.children;
         let i = aChildren.length;
         while(--i >= 0) {
            let e = <HTMLElement>aChildren[ i ];
            if(e.dataset.table === sId) {
               let oUI = this.data.UIGetById(e.dataset.id);
               if(oUI) aUI.push( oUI );
            }
         }
      }

      return aUI;
   }

   private _event(e?: EventDataTable) {
      e = e || {};
      e.data = e.data || this.data;
      e.iEvent = e.iEvent || e.iEventAll & enumTrigger.MASK;
      return e;
   }
}