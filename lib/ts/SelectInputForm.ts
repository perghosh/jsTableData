namespace declare.input_form {
   export type field = {
      alias?: string,   // alias or label name for field
      simple?: string,  // a longer simplified name for field, if placeholder it could be used there
      name?: string,    // field name, same name as in database?
      value?: string,   // value shown in field if any
      title?: string,   // tooltip value
      type?: number,    // number describing type
      typename?: string,// named type
      format?: {
         verify?: string | ((value: string) => boolean), // regex string or method
         convert?: string | ((value: string) => string), // convert logic
         max?: number,     // max number of character
         required?: number // if value is required
      },
      position?: {
         page?: number | string;
         line?: number,
         column?: number,
         align?: number,// aligned value 0 = left, 
         hide?: number, // value isn't shown
         left?: number, // left position
         top?: number,  // top position
         width?: number,// width in pixels 
      }
   }

   export const enum field_type { number = 0x10000, decimal = 0x20000, string = 0x40000, binary = 0x8000, date = 0x100000 }
}

type _field = declare.input_form.field;

class input_form_fields {
   m_aField: declare.input_form.field[];
   constructor(fields?: declare.input_form.field | declare.input_form.field[] ) {
      fields = fields || [];
      this.m_aField = [];
   }

   empty(): boolean { return this.m_aField.length === 0; }

   append(_field: declare.input_form.field | declare.input_form.field[] ): number {
      if(Array.isArray(_field) === true) { this.m_aField = this.m_aField.concat(_field); }
      else { this.m_aField.push(<declare.input_form.field>_field); }

      return this.m_aField.length;
   }

   /**
    * 
    * @param  f 
    */
   get_element(f: declare.input_form.field): string {
      let s = "<div part='field'>", sEnd = "/>";
      if( (<number>f.type & declare.input_form.field_type.string) === declare.input_form.field_type.string) {
         s += "<input type='text'";
      }

      s += `placeholder="${f.simple || f.alias || ""}" title="${f.title || ""}" data-name="${f.name}" value="${f.value || ""}" ${sEnd}</div>`;
      return s;
   }

   get_pages( bSetPage?: boolean ) : (number | string)[]  {
      let a: (number | string)[] = [];

      for(let f of this.m_aField) {
         let page = f?.position?.page || 0;
         if( a.find( p => p === page ) === undefined ) a.push( page );
         if( bSetPage === true && page !== 0 ) { // if page !== 0 then key is found in position
            if( !f?.position ) f.position = {};
            f.position.page = page;
         }
      }

      return a;
   }

   //get_elements() : [number|string,declare.input_form.field][]  {
   get_elements() : Array<[number|string,declare.input_form.field]>  {
      let a: [number|string,declare.input_form.field][] = [];
      return a;

      // TODO: complete this, should return fields sorted in pages prepared to render
   }

   get_html(): string {
      let sHtml = "", f: declare.input_form.field;
      for(f of this.m_aField) {
         sHtml += this.get_element( f );
      }
      return sHtml;
   }
}

type convert_field = (value: unknown) => declare.input_form.field;

const eSelectInputFormTemplate = document.createElement('template');
eSelectInputFormTemplate.innerHTML = `
<style>
   :host { display: block; font-family: sans-serif; }
   input { width: 100%; }
</style>
<div id="plate">
<section id="fields">
</section>
</div>
`;

export class CSelectInputForm extends HTMLElement {
   m_eRoot: ShadowRoot;
   m_eFields: HTMLElement | null;
   m_oIFF: input_form_fields; // field design object, used to render fields

   constructor( fields?: declare.input_form.field | declare.input_form.field[] ) {
      super();
      this.m_eRoot = this.attachShadow({ mode: 'open' });
      this.m_oIFF = new input_form_fields( fields );
      this.m_eRoot.appendChild(eSelectInputFormTemplate.content.cloneNode(true));
      this.m_eFields = this.m_eRoot.getElementById("fields");
   }

   connectedCallback() { this.render(); }

   Append( _field: declare.input_form.field | declare.input_form.field[], convert?: convert_field ) {
      let a: declare.input_form.field[] = <declare.input_form.field[]>_field;
      if( typeof convert === "function" ) {
         if( !Array.isArray( a ) ) a = [a];
         for( let i = 0; i < a.length; i++ ) {
            a[i] = convert( a[i] );
         }
      }
      this.m_oIFF.append( a );
      this.render();
   }

   render() {
      if( !this.m_eFields ) return;
      let s = this.m_oIFF.get_html();   
      this.m_eFields.innerHTML = s;
   }
}

window.customElements.define('select-form', CSelectInputForm);

