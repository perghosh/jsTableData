import { CTableData } from "./../../../lib/TableData.js";
import { CUITableText } from "./../../../lib/UITableText.js";
export class CPage {
    // ## One single poll can have one or more quetions. Each questionis has one or more answers. 
    // ## When poll is selected page gets information about each question in poll and render information 
    // ## for each question in poll. QUESTION_STATE has states to know in what type of information that is needed.
    // State for each question in poll
    // NO_RESULT = no information about question, need to get it from server
    // WAITING_FOR_RESULT = waits for result from server about poll question
    // RESULT_DELIVERED = Result about question is returned from server
    // VOTE_READY_TO_SEND = Vote is ready to send to server, voter has selected answers
    constructor(oApplication) {
        this.m_oApplication = oApplication; // application object
        this.m_iActivePoll = -1; // active poll id shown in page. This is the key to post i TPoll
        this.m_aQuestion = []; // [iKey,bResult,iState,CTableData] iKey(0) = key to question, bResult(1) = result is beeing proccesed, iState(2) = state question is in, CTableData(3) = table data object for question
        // iState = check QUESTION_STATE
        this.m_sViewMode = "vote"; // In what mode selected poll is. "vote" = enable voting for voter, "count" = view vote count for selected poll
        this.QUESTION_STATE = { NO_RESULT: 0, WAITING_FOR_RESULT: 1, RESULT_DELIVERED: 2, VOTE_READY_TO_SEND: 3 };
    }
    get app() { return this.m_oApplication; } // get application object
    get view_mode() { return this.m_sViewMode; }
    set view_mode(sMode) {
        console.assert(sMode === "vote" || sMode === "count", "Invalid view mode: " + sMode);
        this.m_sViewMode = sMode;
    }
    /**
     *
     * @param iActivePoll
     * @param sName
     */
    SetActivePoll(iActivePoll, sName) {
        this.CloseQuestions();
        if (typeof iActivePoll === "number") { // new poll key ?
            this.m_iActivePoll = iActivePoll;
            if (this.m_iActivePoll > 0) {
                this.view_mode = "vote";
                this.QUERYGetPollOverview(this.m_iActivePoll, sName);
            }
        }
        else {
            this.QUERYGetPollQuestions(this.m_iActivePoll);
        }
    }
    CloseQuestions() {
        this.m_aQuestion = []; // clear state and items with poll informaiton
        document.getElementById("idPollQuestionList").innerHTML = "";
    }
    /**
     * Is Poll ready to send  to server to register vote for voter?
     * @returns {boolean} true if questions are ready to be sent to server, false if not
     */
    IsReadyToVote(bUpdateVoteButton) {
        let iOkCount = 0;
        this.m_aQuestion.forEach(a => {
            const oTD = a[3]; // table data object
            if (oTD.external.ready === true)
                iOkCount++;
        });
        const bReady = this.m_aQuestion.length === iOkCount;
        if (bUpdateVoteButton === true) {
            let e = document.getElementById("idPollQuestionList").querySelector('[data-section="vote"]').querySelector("button");
            if (bReady)
                e.removeAttribute("disabled");
            else
                e.setAttribute("disabled", true);
        }
        return bReady;
    }
    /**
     * Collect information about what voter has selected and sent that to server to register vote
     */
    SendVote() {
        console.assert(this.IsReadyToVote(), "Trying to send vote to server but vote isn't ready to be sent.");
        let aValue = [];
        this.m_aQuestion.forEach(a => {
            const oTD = a[3]; // index 3 in array holds table data
            const aRow = oTD.CountValue([-1, 1], 1, 1);
            aRow.forEach(iRowKey => {
                aValue.push({ index: 2, value: oTD.CELLGetValue(iRowKey, 0) }); // column with index 2 has foreign key to answer
            });
        });
        let oQuery = new CQuery({
            header: [{ name: "PollK", value: this.m_iActivePoll }],
            values: aValue
        });
        let oDocument = (new DOMParser()).parseFromString("<document/>", "text/xml");
        oQuery.HEADERGetXml({ document: true }, oDocument);
        aValue.forEach((_value, i) => {
            oQuery.values = _value;
            oQuery.VALUEGetXml({ index: i, values: "row", document: true }, oDocument);
        });
        const sXml = (new XMLSerializer()).serializeToString(oDocument);
        let oCommand = { command: "add_rows", query: "poll_vote", set: "vote", table: "TPollVote1" };
        let request = this.app.request;
        request.Get("SCRIPT_Run", { file: "PAGE_result_edit.lua", json: request.GetJson(oCommand) }, sXml);
    }
    ProcessResponse(sName, eItem) {
        let oResult = JSON.parse(eItem.textContent);
        switch (sName) {
            case "result":
                {
                    const sQueryName = oResult.name;
                    if (sQueryName === "login") {
                        this.RESULTCreateLogin("idTopSection", oResult.table.header);
                    }
                    else if (sQueryName === "poll_list") {
                        this.RESULTCreatePollList("idPollList", oResult);
                    }
                    else if (sQueryName === "poll_overview") {
                        this.RESULTCreatePollOverview("idPollOverview", oResult);
                    }
                    else if (sQueryName === "poll_question_list") {
                        this.RESULTCreateQuestionPanel("idPollQuestionList", oResult);
                    }
                    else if (sQueryName === "poll_answer") {
                        this.RESULTCreateVote("idPollQuestionList", oResult);
                        this.QUERYGetNextQuestion();
                    }
                    else if (sQueryName === "poll_answer_count") {
                        this.RESULTCreateVoteCount("idPollQuestionList", oResult);
                        this.QUERYGetNextQuestion();
                    }
                }
                break;
            case "load_if_not_found":
                window.app.InitializePage();
                break;
            case "message":
                const sType = oResult.type;
                if (sType === "add_rows") {
                    const sQueryName = oResult.name;
                    if (sQueryName === "poll_vote") {
                        this.view_mode = "count";
                        this.SetActivePoll();
                    }
                }
                break;
        }
    }
    /**
     * Get login information for voter. query = login
     */
    QUERYGetLogin() {
        let request = this.app.request;
        let oCommand = { command: "get_result", query: "login", set: "vote", count: 1, format: 1, start: 0 };
        request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) });
    }
    /**
     * Get active polls. query = poll_list
     */
    QUERYGetPollList() {
        let request = this.app.request;
        let oCommand = { command: "get_result", query: "poll_list", set: "vote", count: 100, format: 1, start: 0 };
        request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) });
    }
    /**
     * Get information about selected poll. query = poll_overview
     */
    QUERYGetPollOverview(iPoll, sSimple) {
        let request = this.app.request;
        let oQuery = new CQuery({
            conditions: [{ table: "TPoll1", id: "PollK", value: iPoll, simple: sSimple }]
        });
        let sXml = oQuery.CONDITIONGetXml();
        let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "poll_overview", set: "vote", count: 50, format: 1, start: 0 };
        request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
    }
    /**
     * Get questions for selected poll. query = poll_question_list
     */
    QUERYGetPollQuestions(iPoll) {
        iPoll = iPoll || this.m_iActivePoll;
        let request = this.app.request;
        let oQuery = new CQuery({
            conditions: [{ table: "TPoll1", id: "PollK", value: iPoll }]
        });
        let sXml = oQuery.CONDITIONGetXml();
        let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "poll_question_list", set: "vote", count: 50, format: 1, start: 0 };
        request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
    }
    /**
     * Get vote options for question in poll. query = poll_answer
     */
    QUERYGetNextQuestion() {
        let iQuestion;
        for (let i = 0; i < this.m_aQuestion.length; i++) {
            let a = this.m_aQuestion[i];
            if (a[1] === false) {
                iQuestion = a[0];
                a[1] = true;
                a[2] = this.QUESTION_STATE.WAITING_FOR_RESULT;
                break;
            }
        }
        if (iQuestion !== undefined) {
            let request = this.app.request;
            let oQuery = new CQuery({
                conditions: [{ table: "TPollQuestion1", id: "PollQuestionK", value: iQuestion }]
            });
            let sXml = oQuery.CONDITIONGetXml();
            let sQuery = "poll_answer";
            if (this.view_mode === "count")
                sQuery = "poll_answer_count";
            let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: sQuery, set: "vote", count: 50, format: 1, start: 0 };
            request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
        }
    }
    QUERYGetQuestion(iQuestion) {
        let request = this.app.request;
        let oQuery = new CQuery({
            conditions: [{ table: "TPollQuestion1", id: "PollQuestionK", value: iPoll, simple: "Vilket parti får din röst om det var riksdagsval idag?" }]
        });
        let sXml = oQuery.CONDITIONGetXml();
        let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "poll_answer", set: "vote", count: 50, format: 1, start: 0 };
        request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
    }
    // #region LOGIN
    /****************************************************************** LOGIN
     * Create login section
     * @param eRoot
     * @param aHeader
     */
    RESULTCreateLogin(eRoot, aHeader) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        let TDLogin = new CTableData();
        CPage.ReadColumnInformationFromHeader(TDLogin, aHeader, (iIndex, oColumn, oTD) => {
            if (oColumn.key === 1) {
                oTD.COLUMNSetPropertyValue(iIndex, "position.hide", true);
            }
            else {
                oTD.COLUMNSetPropertyValue(iIndex, "edit.name", oColumn.group_name);
                oTD.COLUMNSetPropertyValue(iIndex, "edit.edit", true);
            }
        });
        TDLogin.ROWAppend(1);
        let oStyle = {
            class_section: "uitabletext_login", class_value_error: "error_value",
            html_value: `
<div style='border-bottom: 1px dotted var(--gd-white); padding: 0.5em 1em;'>
<div style='display: flex; align-items: stretch;'>
<span data-label='1' style='padding: 0px 1em 0px 0px; text-align: right; width: 120px;'></span>
<span data-value='1' style='flex-grow: 1; padding: 0px 2px; box-sizing: border-box; background-color: var(--gd-gray);'></span>
</div>
<div data-description='1'></div>
<div class='error-message' data-error='1' style="display: none; margin-left: 120px; text-align:right;"></div>
</div>
`
        };
        let options = {
            parent: eRoot,
            section: ["title", "body", "statusbar", "footer"],
            style: oStyle,
            table: TDLogin,
            name: "login",
            edit: 1,
            state: 0x0008,
            callback_render: (sType, _value, eElement, oColumn) => {
                if (sType === "afterCellValue") {
                    let eLabel = eElement.querySelector("[data-label]");
                    eLabel.innerText = oColumn.alias;
                }
            }
        };
        let TTLogin = new CUITableText(options);
        TDLogin.UIAppend(TTLogin);
        TTLogin.Render();
        // ## GITHUB logo
        /*
        let eTitle = TTLogin.GetSection("title");
        eTitle.innerHTML = `<div style="height: 80px;">
  <div style="max-width: 80px; position: absolute; top: 0px; right: 0px; opacity: 0.5;">
  <a href="https://github.com/perghosh/jsTableData" class="uk-navbar-item uk-logo" style="display: block; vertical-align: middle;">
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="margin:  10px; height: 60px;"><title>GitHub repository</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
  </a>
  </div></div>`;
  */
        // ## Button to logon
        let eFooter = TTLogin.GetSection("footer");
        eFooter.innerHTML = `<div><button class='button is-white is-rounded' style='display: inline-block; margin-top: 1em; width: 200px;' disabled>Logga in</button></div>`;
        eFooter.querySelector("button").addEventListener("click", (e) => {
            this.Logon();
        });
        TTLogin.GetSection("body").focus(); // set focus to body for login values
    }
    /**
     * Create dropdown with active polls
     * @param {string|HTMLElement} eRoot id or string to parent element for select list
     * @param oResult data to populate list
     */
    RESULTCreatePollList(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        let oTD = new CTableData({ id: oResult.id, name: oResult.name });
        const aHeader = oResult.table.header;
        CPage.ReadColumnInformationFromHeader(oTD, aHeader);
        oTD.ReadArray(oResult.table.body, { begin: 0 });
        let aBody = oTD.GetData();
        if (aBody[0].length) {
            let aData = aBody[0];
            let aKey = aBody[1];
            let eList = document.getElementById("idPollList");
            let eSelect = document.createElement("select");
            let eOption = document.createElement("option");
            eSelect.appendChild(eOption);
            eSelect.className = "has-text-weight-bold";
            aData.forEach((a, i) => {
                eOption = document.createElement("option");
                eOption.value = a[0];
                let sText = a[1];
                const sTitle = sText;
                if (sText.length > 50)
                    sText = sText.substring(0, 48) + "..";
                eOption.innerText = sText;
                eOption.setAttribute("title", sTitle);
                eSelect.appendChild(eOption);
            });
            eList.appendChild(eSelect);
            eList.addEventListener('change', e => {
                let iPoll = parseInt(e.srcElement.value, 10);
                if (isNaN(iPoll))
                    this.SetActivePoll(-1);
                else {
                    let sName = e.srcElement.options[e.srcElement.selectedIndex].text;
                    this.SetActivePoll(iPoll, sName);
                }
            });
        }
    }
    /**
     * result for selected poll
     * If data is found then get questions for poll
     * @param {string|HTMLElement} eRoot
     * @param oResult
     */
    RESULTCreatePollOverview(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        let oTD = new CTableData({ id: oResult.id, name: oResult.name });
        oTD.ReadArray(oResult.table.body, { begin: 0 });
        const sName = oTD.CELLGetValue(0, 1);
        const sDescription = oTD.CELLGetValue(0, 2);
        const iCount = oTD.CELLGetValue(0, 3);
        if (iCount > 0) {
            // ## Generate title for poll
            let eTitle = eRoot.querySelector("[data-title]");
            eTitle.textContent = sName;
            let eDescription = eRoot.querySelector("[data-description]");
            if (eDescription)
                eDescription.textContent = sDescription || "";
            let eCount = eRoot.querySelector("[data-count]");
            if (eCount)
                eCount.textContent = iCount.toString();
            this.QUERYGetPollQuestions(this.m_iActivePoll);
        }
    }
    /**
     * Create panels for each question that belongs to current selected poll
     * @param {string|HTMLElement} eRoot
     * @param oResult
     */
    RESULTCreateQuestionPanel(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        // ## Create section where questions are placed
        let eQuestion = eRoot.querySelector('[data-section="question"]');
        if (!eQuestion) {
            eQuestion = document.createElement("div");
            eQuestion.dataset.section = "question";
            eRoot.appendChild(eQuestion);
        }
        if (this.view_mode === "vote") {
            // ## Create section for vote button
            let eVote = eRoot.querySelector('[data-section="vote"]');
            if (!eVote) {
                eVote = document.createElement("div");
                eVote.dataset.section = "vote";
                eRoot.appendChild(eVote);
                eVote.innerHTML = `<button class='button is-white is-rounded is-primary is-large' style='width: 300px;'>RÖSTA</button>`;
            }
            let eButtonVote = eVote.querySelector("button");
            eButtonVote.setAttribute("disabled", true);
            eButtonVote.addEventListener("click", e => {
                this.SendVote();
            });
        }
        let oTD = new CTableData({ id: oResult.id, name: oResult.name });
        oTD.ReadArray(oResult.table.body, { begin: 0 });
        let aBody = oTD.GetData()[0];
        aBody.forEach((aRow, i) => {
            const iPollIndex = i + 1;
            this.m_aQuestion.push([aRow[0], false, this.QUESTION_STATE.NO_RESULT, null]);
            let eSection = document.createElement("section");
            eSection.dataset.question = aRow[0].toString();
            const sName = aRow[1];
            eSection.className = "block section";
            eSection.innerHTML = `<header class="title is-3">${iPollIndex}: ${sName}</header><article class="block"></article>`;
            eQuestion.appendChild(eSection);
        });
        this.QUERYGetNextQuestion();
    }
    /**
     * Create vote for poll question. Creates markup for possible answers to poll question
     */
    RESULTCreateVote(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        // ## Find key for first waiting question
        let iQuestion;
        let aQuestion;
        for (let i = 0; i < this.m_aQuestion.length; i++) {
            aQuestion = this.m_aQuestion[i];
            if (aQuestion[2] === this.QUESTION_STATE.WAITING_FOR_RESULT) { // is question WAITING_FOR_RESULT for answers from server?
                iQuestion = aQuestion[0];
                aQuestion[2] = this.QUESTION_STATE.RESULT_DELIVERED; // change state to delivered
                break;
            }
        }
        console.assert(iQuestion !== undefined, "Question for poll not found!");
        // ## Find container element to question
        let eSection = eRoot.querySelector(`section[data-question="${iQuestion}"]`);
        let eArticle = eSection.querySelector("article");
        let TDVote = new CTableData({ id: oResult.id, name: oResult.name, external: { max: 1, min: 1 } });
        aQuestion[3] = TDVote;
        const aHeader = oResult.table.header;
        CPage.ReadColumnInformationFromHeader(TDVote, aHeader, (iIndex, oColumn, oTD) => {
            if (oColumn.key === 1) {
                oTD.COLUMNSetPropertyValue(iIndex, "position.hide", true);
            }
        });
        TDVote.ReadArray(oResult.table.body, { begin: 0 });
        let aColumn = TDVote.InsertColumn(1, 0, 1);
        CTableData.SetPropertyValue(aColumn, true, "id", "check");
        CTableData.SetPropertyValue(aColumn, true, "alias", "Röst");
        CTableData.SetPropertyValue(aColumn, true, "edit.name", "checkbox");
        CTableData.SetPropertyValue(aColumn, true, "edit.edit", true);
        CTableData.SetPropertyValue(aColumn, true, "edit.element", 1);
        TDVote.COLUMNUpdatePositionIndex();
        let oStyle = {
            html_group: "table.table",
            html_row: "tr",
            html_cell_header: "th",
            html_cell: "td",
            html_section_header: "thead",
            html_section_body: "tbody",
            html_section_footer: "tfoot",
        };
        let oTrigger = new CTableDataTrigger({ table: TDVote, trigger: CPage.CallbackVote });
        let options = {
            parent: eArticle,
            section: ["title", "table.header", "table.body", "footer"],
            table: TDVote,
            name: "vote",
            style: oStyle,
            edit: 1,
            state: 0x0011,
            trigger: oTrigger,
        };
        let TTVote = new CUITableText(options);
        TDVote.UIAppend(TTVote);
        TTVote.COLUMNSetRenderer(0, (e, v, a) => {
            let eCheck = e.querySelector("div");
            let sChecked = "";
            if (v === "1" || v === 1)
                sChecked = "checked";
            let eDiv = document.createElement("div");
            eDiv.innerHTML = `
<label class="vote-check" data-style="rounded" data-color="green" data-size="lg">
<input ${sChecked} type="checkbox" data-value="1" data-commit="1" value="1">
<span class="toggle">
<span class="switch"></span>
</span>
</label>`;
            e.appendChild(eDiv);
        });
        TTVote.Render();
        let eFooter = TTVote.GetSection("footer");
        eFooter.innerHTML = `<div>
<span data-info="data" style='display: inline-block; margin-left: 3em;'></span>
<span data-info="xml" style='display: inline-block; margin-left: 3em;'></span>
</div>`;
    }
    /**
     * Create markup showing vote count on each answer for poll question
     */
    RESULTCreateVoteCount(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        // ## Find key for first waiting question
        let iQuestion;
        let aQuestion;
        for (let i = 0; i < this.m_aQuestion.length; i++) {
            aQuestion = this.m_aQuestion[i];
            if (aQuestion[2] === this.QUESTION_STATE.WAITING_FOR_RESULT) { // is question WAITING_FOR_RESULT for answers from server?
                iQuestion = aQuestion[0];
                aQuestion[2] = this.QUESTION_STATE.RESULT_DELIVERED; // change state to delivered
                break;
            }
        }
        console.assert(iQuestion !== undefined, "Question for poll not found!");
        // ## Find container element to question
        let eSection = eRoot.querySelector(`section[data-question="${iQuestion}"]`);
        let eArticle = eSection.querySelector("article");
        let TDVote = new CTableData({ id: oResult.id, name: oResult.name });
        aQuestion[3] = TDVote;
        const aHeader = oResult.table.header;
        CPage.ReadColumnInformationFromHeader(TDVote, aHeader, (iIndex, oColumn, oTD) => {
            if (oColumn.key === 1) {
                oTD.COLUMNSetPropertyValue(iIndex, "position.hide", true);
            }
        });
        TDVote.ReadArray(oResult.table.body, { begin: 0 });
        TDVote.COLUMNSetType(TDVote.ROWGet(1));
        TDVote.COLUMNUpdatePositionIndex();
        let oStyle = {
            html_group: "table.table",
            html_row: "tr",
            html_cell_header: "th",
            html_cell: "td",
            html_section_header: "thead",
            html_section_body: "tbody",
            html_section_footer: "tfoot",
        };
        let oTrigger = new CTableDataTrigger({ table: TDVote, trigger: CPage.CallbackVote });
        let options = {
            parent: eArticle,
            section: ["title", "table.header", "table.body", "footer"],
            table: TDVote,
            name: "vote",
            style: oStyle,
            trigger: oTrigger,
        };
        let TTVote = new CUITableText(options);
        TDVote.UIAppend(TTVote);
        TTVote.Render();
    }
    /**
     * Read column information from result header to columns in CTableData
     * @param {CTableData} oTD table data object that is configured from  aHeader
     * @param {object[]} aHeader header object in array
     * @param {string} aHeader[].id id for column
     * @param {string} aHeader[].name column name
     * @param {string} aHeader[].simple simple name for column
     * @param {string} aHeader[].select_type_name type name for column value
     */
    static ReadColumnInformationFromHeader(oTD, aHeader, callback) {
        const iColumnCount = aHeader.length;
        oTD.COLUMNAppend(iColumnCount);
        for (let i = 0; i < iColumnCount; i++) {
            const o = aHeader[i];
            oTD.COLUMNSetPropertyValue(i, "id", o.id);
            oTD.COLUMNSetPropertyValue(i, "name", o.name);
            oTD.COLUMNSetPropertyValue(i, "alias", o.simple);
            oTD.COLUMNSetType(i, o.select_type_name);
            if (callback)
                callback(i, o, oTD);
        }
    }
    /**
     * Callback for action events from ui table
     * @param oEventData
     * @param {any} v value differs based on event sent
     */
    static CallbackVote(oEventData, v) {
        let sName = CTableDataTrigger.GetTriggerName(oEventData.iEvent);
        console.log(sName);
        switch (sName) {
            case "AfterSetValue":
                {
                    let oTD = oEventData.data;
                    let oTT = oEventData.dataUI;
                    let eFooter = oTT.GetSection("footer");
                    let eError = eFooter.querySelector("[data-error]");
                    let iCount = oTD.CountValue([-1, 1], 1);
                    const iMax = oTD.external.max;
                    if (typeof iMax === "number") { // found max property ? Then this is 
                        if (iMax < iCount) {
                            oTD.external.error = true;
                            if (!eError) {
                                let eDiv = document.createElement("div");
                                eDiv.className = "has-text-danger has-text-weight-bold";
                                eDiv.dataset.error = "1";
                                eFooter.appendChild(eDiv);
                                eError = eDiv;
                            }
                            eError.innerText = `Max antal val = ${iMax}, du har valt ${iCount}`;
                        }
                        else {
                            oTD.external.error = false;
                            if (eError)
                                eError.innerText = "";
                        }
                        if (iCount >= oTD.external.min && iCount <= oTD.external.max)
                            oTD.external.ready = true;
                        else
                            oTD.external.ready = false;
                        window.app.page.IsReadyToVote(true); // Update vote button
                    }
                }
                break;
        }
    }
}
