
import { CTableData, CRowRows, enumMove, enumFormat, IUITableData, tabledata_column, tabledata_position, tabledata_format } from "./TableData.js";


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
      callback_action?: ((sType: string, e: Event, sSection: string) => boolean) | ((sType: string, e: Event, sSection: string) => boolean)[],
      create?: boolean,          // create elements for pager
      id?: string,               // id for CUIPagerPreviousNext
      members?: members,
      parent?: HTMLElement,      // parent element in DOM tree
      style?: style,
   }
}


export class CUIPagerPreviousNext {
   m_acallAction: ((sType: string, e: Event, sSection: string) => boolean)[];// callback array for action hooks, like select cell, values is changing etc.
   m_eComponent: HTMLElement; // Root element for pager
   m_oMembers: details.members;
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


      this.m_sId        = o.id || CUIPagerPreviousNext.s_sWidgetName + (new Date()).getUTCMilliseconds() + ++CUIPagerPreviousNext.s_iIdNext;
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

   get id() { return this.m_sId; }
   get component() { return this.m_eComponent; }

   Create(eParent?: HTMLElement, bCreate?: boolean): HTMLElement {
      eParent = eParent || this.m_eParent;
      let eComponent = document.createElement("section");
      Object.assign(eComponent.dataset, {section: "component", id: this.id });
      eComponent.className = CUIPagerPreviousNext.s_sWidgetName;
      eParent.appendChild( eComponent ); 
      if( !this.m_eComponent ) this.m_eComponent = eComponent;

      if( bCreate !== false ) {
         this.create( eComponent );
      }

      return eComponent;
   }

   Render() {

   }

   MovePrevious() {
      this.Move( -1 );
   }


   MoveNext() {
      this.Move( 1 );
   }

   Move( iOffset: number ) {
      let iPage = this.m_oMembers.page + iOffset;
      if( iPage < 0 ) iPage = 0;
      if( iPage === this.m_oMembers.page ) return;

      this.m_oMembers.page = iPage

      if(this.m_acallAction && this.m_acallAction.length > 0) {
         let i = 0, iTo = this.m_acallAction.length;
         let callback = this.m_acallAction[ i ];
         while(i++ < iTo) {
            let bResult = callback.call(this, "move" );
            if(bResult === false) return;
         }
      }
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
         self._on_action("click", eEvent, "previous");
      });

      
      e = add_button( sHtml, sStyle, sClass, "next" );
      eComponent.appendChild(e);
      e.addEventListener("click", (eEvent: MouseEvent) => {
         self._on_action("click", eEvent, "next");
      });
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
   }


}