# jsTableData - JavaScript table framework

jsTableData is a JavaScript table framework designed for flexibility and minimize bloat.  
There are lots of components designed to show  tabular data. Why one more?

Most components that manages table data mix design and data. And that makes them a lot harder to customize.  

jsTableData does not mix appearance and data. UI objects use information from `CTableData`. 
There is logic to handle operations that are suitable for table data.

Two more areas can be used, one for managing events and one for editing. Both have multiple objects but are in the files `TableDataTrigger.ts` and `TableDataEdit.ts`


|Sample page|Description|
|-|-|
|[Bootstrap 5 table](https://perghosh.github.io/jsTableData/sample/sampleBootstrap5.html)|Style table with bootstrap 5|
|[Enable editing in Bootstrap 5 table](https://perghosh.github.io/jsTableData/sample/sampleBootstrap5TableEdit.html)|Style table with bootstrap and edit table values|
|[Login form](https://perghosh.github.io/jsTableData/sample/sampleLogin.html)||




