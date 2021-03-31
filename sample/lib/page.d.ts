import { CTableData } from "./../../../lib/TableData.js";
import { CApplication } from "application";
export declare class CPage {
    m_oApplication: CApplication;
    m_iActivePoll: number;
    m_aQuestion: [number, boolean, number, CTableData][];
    m_sViewMode: string;
    QUESTION_STATE: any;
    get app(): CApplication;
    constructor(oApplication: any);
    get view_mode(): string;
    set view_mode(sMode: string);
    /**
     *
     * @param iActivePoll
     * @param sName
     */
    SetActivePoll(iActivePoll: any, sName: any): void;
    CloseQuestions(): void;
    /**
     * Is Poll ready to send  to server to register vote for voter?
     * @returns {boolean} true if questions are ready to be sent to server, false if not
     */
    IsReadyToVote(bUpdateVoteButton: any): boolean;
    /**
     * Collect information about what voter has selected and sent that to server to register vote
     */
    SendVote(): void;
    ProcessResponse(sName: any, eItem: any): void;
    /**
     * Get login information for voter. query = login
     */
    QUERYGetLogin(): void;
    /**
     * Get active polls. query = poll_list
     */
    QUERYGetPollList(): void;
    /**
     * Get information about selected poll. query = poll_overview
     */
    QUERYGetPollOverview(iPoll: any, sSimple: any): void;
    /**
     * Get questions for selected poll. query = poll_question_list
     */
    QUERYGetPollQuestions(iPoll: any): void;
    /**
     * Get vote options for question in poll. query = poll_answer
     */
    QUERYGetNextQuestion(): void;
    QUERYGetQuestion(iQuestion: any): void;
    /****************************************************************** LOGIN
     * Create login section
     * @param eRoot
     * @param aHeader
     */
    RESULTCreateLogin(eRoot: any, aHeader: any): void;
    /**
     * Create dropdown with active polls
     * @param {string|HTMLElement} eRoot id or string to parent element for select list
     * @param oResult data to populate list
     */
    RESULTCreatePollList(eRoot: any, oResult: any): void;
    /**
     * result for selected poll
     * If data is found then get questions for poll
     * @param {string|HTMLElement} eRoot
     * @param oResult
     */
    RESULTCreatePollOverview(eRoot: any, oResult: any): void;
    /**
     * Create panels for each question that belongs to current selected poll
     * @param {string|HTMLElement} eRoot
     * @param oResult
     */
    RESULTCreateQuestionPanel(eRoot: any, oResult: any): void;
    /**
     * Create vote for poll question. Creates markup for possible answers to poll question
     */
    RESULTCreateVote(eRoot: any, oResult: any): void;
    /**
     * Create markup showing vote count on each answer for poll question
     */
    RESULTCreateVoteCount(eRoot: any, oResult: any): void;
    /**
     * Read column information from result header to columns in CTableData
     * @param {CTableData} oTD table data object that is configured from  aHeader
     * @param {object[]} aHeader header object in array
     * @param {string} aHeader[].id id for column
     * @param {string} aHeader[].name column name
     * @param {string} aHeader[].simple simple name for column
     * @param {string} aHeader[].select_type_name type name for column value
     */
    static ReadColumnInformationFromHeader(oTD: any, aHeader: any, callback: any): void;
    /**
     * Callback for action events from ui table
     * @param oEventData
     * @param {any} v value differs based on event sent
     */
    static CallbackVote(oEventData: any, v: any): void;
}
