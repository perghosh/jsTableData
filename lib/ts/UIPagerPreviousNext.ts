
import { CTableData, CRowRows, enumMove, enumFormat, IUITableData, tabledata_column, tabledata_position, tabledata_format } from "./TableData.js";
import { CTableDataTrigger, enumTrigger, enumReason, EventDataTable } from "./TableDataTrigger.js";
import { CDispatch, DispatchMessage, IDispatch } from "./Dispatch.js";


namespace details {
   export type members = {
      page?: number,        // active page
      page_count?: number,  // items in active page
      page_max_count?: number,// max count in each page
   }

   export type style = {
      html_button?: string,
   }

   export type construct = {
      callback_action?: ((sType: string, e: EventDataTable) => boolean) | ((sType: string, e: EventDataTable) => boolean)[],
      create?: boolean,          // create elements for pager
      dispatch?: CDispatch,      // dispatcher (not needed)
      id?: string,               // id for CUIPagerPreviousNext
      members?: members,
      name?: string,             // name for object
      parent?: HTMLElement,      // parent element in DOM tree
      style?: style,
   }
}


export class CUIPagerPreviousNext implements IUITableData {
   m_acallAction: ((sType: string, e: EventDataTable) => boolean)[];// callback array for action hooks, like select cell, values is changing etc.
   m_eComponent: HTMLElement; // Root element for pager
   m_oDispatch: CDispatch;    // dispatch object
   m_oMembers: details.members;
   m_sName: string;           // class name
   m_sId: string;             // Unique id for ui pager
   m_eParent: HTMLElement;    // Parent element in DOM that owns component
   m_oStyle: details.style;

   static s_sWidgetName: string = "uipagerpreviousnext";
   static s_iIdNext: number = 0;
   static s_oStyle = {
      html_button: "button"
   };


   constructor( options: details.construct ) {
      const o = options || {};

      this.m_acallAction = [];
      if(o.callback_action) this.m_acallAction = Array.isArray(o.callback_action) ? o.callback_action : [ o.callback_action ];


      this.m_oDispatch  = o.dispatch || null;
      this.m_sId        = o.id || CUIPagerPreviousNext.s_sWidgetName + (new Date()).getUTCMilliseconds() + ++CUIPagerPreviousNext.s_iIdNext;
      this.m_sName      = o.name || CUIPagerPreviousNext.s_sWidgetName;
      this.m_oMembers   =  { page: 0, page_count: 0, page_max_count: 10 };
      this.m_eParent    = o.parent || null;

      Object.assign(this.m_oMembers, o.members || {});
      this.m_oStyle     = {};
      Object.assign(this.m_oStyle, CUIPagerPreviousNext.s_oStyle, o.style || {});

      if(o.create !== false) {
         if(this.m_eParent) {
            this.Create();
         }
      }
   }

   get component() { return this.m_eComponent; }
   get dispatch() { return this.m_oDispatch; }
   set dispatch( oDispatch: CDispatch ) { this.m_oDispatch = oDispatch; }
   get id() { return this.m_sId; }
   get members() { return this.m_oMembers; }
   get name() { return this.m_sName; }

   Create(eParent?: HTMLElement, bCreate?: boolean): HTMLElement {
      eParent = eParent || this.m_eParent;
      let eComponent = document.createElement("section");
      Object.assign(eComponent.dataset, {section: "component", id: this.id });
      eComponent.className = CUIPagerPreviousNext.s_sWidgetName;
      eParent.appendChild( eComponent ); 
      if( !this.m_eComponent ) this.m_eComponent = eComponent;

      if( bCreate !== false ) {
         this.create( eComponent );
         this.render();
      }

      return eComponent;
   }

   Render() {
      this.render();
   }

   MovePrevious() {
      this.Move( -1, "move.previous" );
   }


   MoveNext() {
      this.Move( 1, "move.next" );
   }

   Move( iOffset: number, sCommand: string ) {
      let iPage = this.m_oMembers.page + iOffset;
      if( iPage < 0 ) iPage = 0;
      if( iPage === this.m_oMembers.page ) return;

      if( this.dispatch ) {
         let aResult = this.dispatch.NotifyConnected(this, { command: sCommand, data: { page: this.m_oMembers.page, trigger: enumTrigger.BeforeSetValue } });

         if( CDispatch.IsCancel( aResult ) === true ) return;
      }

      this.m_oMembers.page = iPage

      if(this.m_acallAction && this.m_acallAction.length > 0) {
         let i = 0, iTo = this.m_acallAction.length;
         let callback = this.m_acallAction[ i ];
         while(i++ < iTo) {
            let bResult = callback.call(this, sCommand );
            if(bResult === false) return;
         }
      }

      if( this.dispatch ) {
         this.dispatch.NotifyConnected(this, { command: sCommand, data: { page: this.m_oMembers.page, trigger: enumTrigger.AfterSetValue } });
      }
   }

   /**
    * General update method where operation depends on the iType value
    * @param iType
    */
   update(iType: number): any {
      switch(iType) {
         case enumTrigger.UpdateDataNew: {
            this.Render();
         }
      }
   }

   /**
    * 
    * @param oMessage
    * @param sender
    */
   on(oMessage: DispatchMessage, sender: IUITableData) {
      const [sCommand, sType] = oMessage.command.split(".");
      switch( sCommand ) {
         case "update" : {
            const data = oMessage?.data;
            let o = this.m_oMembers;
            o.page_max_count = data.max || o.page_max_count;
            o.page_count = data.count || o.page_count;

            if( typeof data.start === "number" ) {
               o.page = Math.floor( data.start / data.max );
            }

            this.Render();
         }
         break;
      }
   }

   render( eComponent?: HTMLElement ) {
      eComponent = eComponent || this.m_eComponent;

      let bRender = this._action( "render.button", null, EVT => {
         EVT.eElement = eComponent;
      });

      if( bRender === false ) return;


      let ePrevious = eComponent.querySelector('[data-type="previous"]');
      let eNext = eComponent.querySelector('[data-type="next"]');
   }

   create( eComponent?: HTMLElement ) {
      eComponent = eComponent || this.m_eComponent;
      let sClass: string;
      let sHtml: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "html_button");
      let sStyle: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "style_button") || "";
      if(!sHtml) sHtml = "button";
      else {
         let a = sHtml.split(".");
         if(a.length > 1) [ sHtml, sClass ] = a;
      }

      let self = this;

      let add_button = function( sHtml: string, sStyle: string, sClass: string, sType: string ): HTMLElement {
         let e = <HTMLElement>document.createElement(sHtml);
         if(sStyle) e.style.cssText = sStyle; 
         if(sClass) e.className = sClass;     
         e.dataset.type = sType;
         return e;
      }

      let e = add_button( sHtml, sStyle, sClass, "previous" );
      eComponent.appendChild(e);
      e.addEventListener("click", (eEvent: MouseEvent) => {
         if( self._on_action("click", eEvent, "move.previous") !== false ) this.MovePrevious();
      });

      
      e = add_button( sHtml, sStyle, sClass, "next" );
      eComponent.appendChild(e);
      e.addEventListener("click", (eEvent: MouseEvent) => {
         if( self._on_action("click", eEvent, "move.next") !== false ) this.MoveNext();
      });
   }

   /**
    * Call action callbacks
    * @param  {string}  sType Type of action
    * @param  {Event}   e        event data if any
    * @return {unknown} if false then disable default action
    */
   private _action(sType: string, e: Event, call?: (( EVT: EventDataTable ) => void) ): unknown {
      if(this.m_acallAction && this.m_acallAction.length > 0) {
         let EVT = this._get_triggerdata();
         EVT.eEvent = e;
         EVT.eElement = this.m_eComponent;
         if( call ) call( EVT );
         let i = 0, iTo = this.m_acallAction.length;
         let callback = this.m_acallAction[ i ];
         while(i++ < iTo) {
            let bResult = callback.call(this, sType, EVT);
            if(bResult === false) return false;
         }
      }
   }


   /**
    * Handle element events for ui table text. Events from elements calls this method that will dispatch it.
    * @param {string} sType event name
    * @param {Event} e event data
    * @param {string} sSection section name, table text has container elements with a name (section name)
    */
   private _on_action(sType: string, e: Event, sCommand: string): void | unknown {
      if(this.m_acallAction && this.m_acallAction.length > 0) {
         let i = 0, iTo = this.m_acallAction.length;
         let callback = this.m_acallAction[ i ];
         while(i++ < iTo) {
            let bResult = callback.call(this, sType, e, sCommand);
            if(bResult === false) return false;
         }
      }
   }

   private _get_triggerdata(): EventDataTable {
      let o: EventDataTable = { dataUI: this };
      return o;
   }


}