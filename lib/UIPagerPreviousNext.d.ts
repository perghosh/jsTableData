import { IUITableData } from "./TableData.js";
import { CDispatch, DispatchMessage } from "./Dispatch.js";
declare namespace details {
    type members = {
        page?: number;
        page_count?: number;
        page_max_count?: number;
    };
    type style = {
        html_button?: string;
    };
    type construct = {
        callback_action?: ((sType: string, e: Event, sSection: string) => boolean) | ((sType: string, e: Event, sSection: string) => boolean)[];
        create?: boolean;
        dispatch?: CDispatch;
        id?: string;
        members?: members;
        name?: string;
        parent?: HTMLElement;
        style?: style;
    };
}
export declare class CUIPagerPreviousNext implements IUITableData {
    m_acallAction: ((sType: string, e: Event, sSection: string) => boolean)[];
    m_eComponent: HTMLElement;
    m_oDispatch: CDispatch;
    m_oMembers: details.members;
    m_sName: string;
    m_sId: string;
    m_eParent: HTMLElement;
    m_oStyle: details.style;
    static s_sWidgetName: string;
    static s_iIdNext: number;
    static s_oStyle: {
        html_button: string;
    };
    constructor(options: details.construct);
    get dispatch(): CDispatch;
    set dispatch(oDispatch: CDispatch);
    get name(): string;
    get id(): string;
    get component(): HTMLElement;
    Create(eParent?: HTMLElement, bCreate?: boolean): HTMLElement;
    Render(): void;
    MovePrevious(): void;
    MoveNext(): void;
    Move(iOffset: number, sCommand: string): void;
    /**
     * General update method where operation depends on the iType value
     * @param iType
     */
    update(iType: number): any;
    /**
     *
     * @param oMessage
     * @param sender
     */
    on(oMessage: DispatchMessage, sender: IUITableData): void;
    create(eComponent?: HTMLElement): void;
    /**
     * Handle element events for ui table text. Events from elements calls this method that will dispatch it.
     * @param {string} sType event name
     * @param {Event} e event data
     * @param {string} sSection section name, table text has container elements with a name (section name)
     */
    private _on_action;
}
export {};
