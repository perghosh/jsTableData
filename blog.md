Data attributes generated in table body markup
--

- `data-type="row"` = Marks that we have a table row. Not found this attribute means that this element do not contain row data and is skipped
- `data-r="0"` = Row in rendered as multiple rows, then data-r is used to know the internal row index for rows in main row
- `data-c_row="C0,C1,"` = Columns found as childes for current row
- `data-i="0"` = Level index is for when row has multiple elements to get what current level from root element for row
- `data-row="27"` = Physical index to row in row data
- `data-line="27"` = Row key value for row in CTableData. Always use this value to access raw data in CTableData for row in browser table

- `data-c="0"` = Elements with column values, marks index for column data is taken from

_Sample markup for table row with two columns. Each row use `div` as row element and column values is rendered in `span`_
```html
<div data-type="row" data-r="0" data-c_row="C0,C1," data-i="0" data-record="1" data-row="27" data-line="27">
   <span data-c="0">10406</span>
   <span data-c="1">allocation </span>
</div>
```