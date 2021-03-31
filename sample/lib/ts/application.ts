import { CUITableText } from "./../../../lib/UITableText.js";
import { edit  } from "./../../../lib/TableDataEdit.js";
import { CRequest, EventRequest } from "./../../../app/ServerRequest.js";
import { CPage } from "./page.js";

//import { CRequest } from "Request"

export class CApplication {
   m_sAlias: string;
   m_oPage: CPage;
   m_sQueriesSet: string;
   m_oEditors: edit.CEditors;
   m_oRequest: CRequest;

   constructor() {
      this.m_oEditors = edit.CEditors.GetInstance();
      // Initialize CRequest for server communication
      this.m_oRequest = new CRequest({
         callback: CApplication.CallbackServer,
         folder: "rSelect",
         methods: { SYSTEM_Init: "l10", SYSTEM_GetUserData: "s03", SYSTEM_GetCountry: "s08", SCRIPT_Run: "f60", REPORT_Pdf: "r02" },
         url: "http://127.0.0.1:8882/jq.srf?"
         //url: "http://goorep.se:1001/changelog/jq.srf?"
         //url: "http://localhost:8080/so/jq.srf?"
      });

      this.m_sAlias = "guest";
      this.m_oPage = new CPage(this);
      this.m_sQueriesSet = "vote";
   }

   get alias() { return this.m_sAlias; }
   get request() { return this.m_oRequest; }
   get session() { return this.m_oRequest.session; }
   get page() { return this.m_oPage; }
   get queries_set() { return this.m_sQueriesSet; }
   set queries_set(s) { this.m_sQueriesSet = s; }

   /**
      * Initialize objects in CApplication for use.
      */
   Initialize() {
      let oEditors = this.m_oEditors;
      oEditors.Add("string", edit.CEditInput);
      oEditors.Add("password", edit.CEditPassword);
      oEditors.Add("text", edit.CEditTextarea);
      oEditors.Add("number", edit.CEditNumber);
      oEditors.Add("checkbox", edit.CEditCheckbox);

      this.m_oRequest.Get("SYSTEM_Init|SYSTEM_GetCountry|SYSTEM_GetUserData", { name: this.alias, flags: "ip" });
   }

   /**
      * Initialize page information, user is verified and it is tome to collect information needed to render page markup
      */
   InitializePage() {
      this.page.QUERYGetLogin();
      this.page.QUERYGetPollList();
   }

   OnResponse(eSection, sMethod) {
      let aItem = eSection.getElementsByTagName('item');
      for(let i = 0; i < aItem.length; i++) {
         let eItem = aItem[ i ];
         const sName = eItem.getAttribute("name");
         this.page.ProcessResponse(eItem, sName);

      }
   }

/*
   Logon() {
      let TDLogon = this.GetColumnData("logon"); //
      let TTLogon = TDLogon.UIGet(0); //
      let aError = TTLogon.ERRORGetCount() ? TTLogon.ERRORGet() : TTLogon.ROWValidate(0);
      if(Array.isArray(aError) && TTLogon.ERRORGetCount() === 0) TTLogon.ERRORSet(aError);


      if(Array.isArray(aError)) {
         aError.forEach((aError, iIndex) => {
            let eCell = TTLogon.ELEMENTGetCell(aError);
            if(eCell) {
               let eError = eCell.querySelector("[data-error]");
               eError.innerHTML = PAGE_GetErrorDescription(aError[ 3 ]);
               eError.style.display = "block";
            }
         });
      }

   }

   RunVote() {
      alert("vote");
   }
   */

   static CallbackServer(eSection: Element, sMethod: string, e: EventRequest) {
      let get_text = (eSection, sName) => {
         let e = eSection.querySelector(sName);
         if(e) return e.textContent;
         return null;
      };

      let oApplication = (<any>window).app;

      var sError = eSection.getAttribute("error");
      if(sError === "1") {
         let sError = eSection.textContent;
         throw sError;
      }
      else if(sMethod === "SCRIPT_Run") {
         const sComponent = get_text(eSection, "component");
         const sFile = get_text(eSection, "file");
         const sHint = get_text(eSection, "hint");
         oApplication.OnResponse(eSection, sMethod);
      }
      else if(sMethod === "SYSTEM_GetUserData") {
         if(oApplication.queries_set) {
            let request = oApplication.request;
            let oCommand = { command: "load_if_not_found", set: "vote" };
            request.Get("SCRIPT_Run", { file: "queriesset.lua", json: request.GetJson(oCommand) });
         }
         else {
            oApplication.InitializePage();
         }
      }
   }
} // class CApplication
