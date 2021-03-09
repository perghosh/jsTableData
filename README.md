# jsTableData - JavaScript table framework

jsTableData is a JavaScript table library designed to manage and render table data using existing css frameworks.

### Demo
|Sample page|Description|
|:-|:-|
|[Table with two rows for each data row, values are shown on hover](https://perghosh.github.io/jsTableData/sample/sampleAdvancedExtraRow.html)|Advanced sample table, expand row on hover. Edit, sorting and keyboard navigation.|
|[Enable editing in Bootstrap 5 table](https://perghosh.github.io/jsTableData/sample/sampleBootstrap5TableEdit.html)|Style table with bootstrap and edit table values with [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts)|
|[Login form](https://perghosh.github.io/jsTableData/sample/sampleLogin.html)|Sample login form using [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts)|
|[Bulma is used to to create online voting](https://perghosh.github.io/jsTableData/sample/sampleVote.html)|Style table with Bulma and using custom renderer. [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts)|
|[UIKit table with movie list and editing](https://perghosh.github.io/jsTableData/sample/sampleUIKit_play.html)|Style table with UIKit and create input  elements in all cells. Works with [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts)|
|[Simple Bootstrap 5 table](https://perghosh.github.io/jsTableData/sample/sampleBootstrap5Table.html)|Style table with bootstrap 5 with [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts)|



### How
Most components that manages table data, mix design and data. And that makes them a lot harder to customize.  
jsTableData do not mix UI and data. Separating data and UI makes it easier to use existing css code or quickly modify design.
However, one line is not enough to include in page. To configure table with existing css designs will need some code.
The benefits come when you need to adapt for advanced customizations.



## Docs
[Documentation, how to configure is found here](http://goorep.se:1001/changelog/report/rSelect/PAGE_result.htm?alias=guest&set=api&rows=25&query=Book+pages&$$TArticleBook1.ArticleBookK=7140&link=[["9F1E006D78894848838A0970E2FF0BE9zoom"%2C"Object1"%2C7140]%2C["9F60D5FEDE8E41CC986C10147F0AD2F7zoom"%2C"TArticleBook1"%2C7140]%2C["71C91DEE3C5A4FDC8EC1114C7C18033Bzoom"%2C"TArticleBook1"%2C7140]])


### Important files
- [`TableData.ts`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/TableData.ts) has source data logic 
- Edit table data uses edit objects from [`TableDataEdit.ts`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/TableDataEdit.ts).
- Triggers are found in [`TableDataTrigger.ts`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/TableDataTrigger.ts)

### UI objects
- [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts) is a flexible table renderer


Development samples
- [Six tables from same source](https://perghosh.github.io/jsTableData/sample/sampleStyleTableText.html) 


### Customize components from popular frameworks
*Bootstrap table*
![sample showing bootstrap table using jsTableData](https://perghosh.github.io/jsTableData/images/bootstrap_table.png)

*Login page using [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts)*
![sample showing bootstrap table using jsTableData](https://perghosh.github.io/jsTableData/images/login.png)




