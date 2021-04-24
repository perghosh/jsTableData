Scaling
--

Presenting data in a SVG box where each pixel i specified with x,y coordinates. If data numbers presented do not match
coordinates for the SVG box, you will need to scale numbers.

D3 has functionality for this in th `d3.scale` object.

```js
   let options = {
      edit: true,                               // enable events for selecting table cells
      parent: eRoot,                            // container
      section: [ "toolbar", "table.header", "table.body" ],// sections to create
      table: oTD,                               // source data
      style: oStyle,                            // styling
      trigger: oTrigger,                        // set trigger object, this will enable triggers for the search table
      callback_render: ( sType: string, e: EventDataTable, sSection: string, oColumn: any ) => {
         if( sType === "beforeInput" ) {
            let eTR = e.eElement.closest("tr");
            let eTable = eTR.closest("table");

            eTable.querySelectorAll("tr").forEach( e => e.classList.remove("selected") );

            eTR.classList.add("selected");
            return false;
         }
      }
   };

   let oTT = new CUITableText(options);
   oTD.UIAppend(oTT);
```
