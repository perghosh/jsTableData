# jsTableData - JavaScript table framework

jsTableData is a JavaScript table framework designed for flexibility and minimize bloat.  

Most components that manages table data, mix design and data. And that makes them a lot harder to customize.  

jsTableData do not mix design and data. UI objects use information from [`CTableData`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/TableData.ts). 

#### Important files
- [`TableData.ts`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/TableData.ts) has source data logic 
- Edit table data uses edit objects from [`TableDataEdit.ts`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/TableDataEdit.ts).
- Triggers are found in [`TableDataTrigger.ts`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/TableDataTrigger.ts)

#### UI objects
- [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts) is a flexible table renderer

### Demo
|Sample page|Description|
|-|-|
|[Enable editing in Bootstrap 5 table](https://perghosh.github.io/jsTableData/sample/sampleBootstrap5TableEdit.html)|Style table with bootstrap and edit table values with [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts)|
|[Login form](https://perghosh.github.io/jsTableData/sample/sampleLogin.html)|Sample login form using [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts)|
|[UIKit table with movie list and editing](https://perghosh.github.io/jsTableData/sample/sampleUIKit_play.html)|Style table with UIKit and create input  elements in all cells. Works with [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts)|
|[Simple Bootstrap 5 table](https://perghosh.github.io/jsTableData/sample/sampleBootstrap5Table.html)|Style table with bootstrap 5 with [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts)|



Development samples
- [Six tables from same source](https://perghosh.github.io/jsTableData/sample/sampleStyleTableText.html) 


### Customize components from popular frameworks
*Bootstrap table*
![sample showing bootstrap table using jsTableData](https://perghosh.github.io/jsTableData/images/bootstrap_table.png)

*Login page using [`CUITableText`](https://github.com/perghosh/jsTableData/blob/main/lib/ts/UITableText.ts)*
![sample showing bootstrap table using jsTableData](https://perghosh.github.io/jsTableData/images/login.png)




