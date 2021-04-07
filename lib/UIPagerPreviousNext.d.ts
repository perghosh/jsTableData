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
        id?: string;
        members?: members;
        parent?: HTMLElement;
        style?: style;
    };
}
export declare class CUIPagerPreviousNext {
    m_acallAction: ((sType: string, e: Event, sSection: string) => boolean)[];
    m_eComponent: HTMLElement;
    m_oMembers: details.members;
    m_sId: string;
    m_eParent: HTMLElement;
    m_oStyle: details.style;
    static s_sWidgetName: string;
    static s_iIdNext: number;
    static s_oStyle: {
        html_button: string;
    };
    constructor(options: details.construct);
    get id(): string;
    get component(): HTMLElement;
    Create(eParent?: HTMLElement, bCreate?: boolean): HTMLElement;
    Render(): void;
    MovePrevious(): void;
    MoveNext(): void;
    Move(iOffset: number): void;
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
