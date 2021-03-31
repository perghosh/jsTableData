import { edit } from "UITableText";
import { CRequest } from "Request";
import { CPage } from "page";
export declare class CApplication {
    m_sAlias: string;
    m_oPage: CPage;
    m_sQueriesSet: string;
    m_oEditors: edit.CEditors;
    m_oRequest: CRequest;
    constructor();
    get alias(): string;
    get request(): any;
    get session(): any;
    get page(): CPage;
    get queries_set(): string;
    set queries_set(s: string);
    /**
       * Initialize objects in CApplication for use.
       */
    Initialize(): void;
    /**
       * Initialize page information, user is verified and it is tome to collect information needed to render page markup
       */
    InitializePage(): void;
    OnResponse(eSection: any, sMethod: any): void;
    Logon(): void;
    RunVote(): void;
    static CallbackServer(eSection: any, sMethod: any, oEvent: any): void;
}
