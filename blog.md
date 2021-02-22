CUITableText Edit setup
--

`CUITableText` use `CEdits` to hold edit controls for each column that are editable. These columns can be generated automatically in constructor if `CTableData` is sent. `CUITableText` checks properties for each column in `CTableData` and creates  edit controls for columns that are set to edit.
If `CTableData` isn't set or if `CTableData` is changed, edit controls need to be initialized or updated.

```js
// register edit controls
let eEditors = edit.CEditors.GetInstance();
eEditors.Add("string", edit.CEditInput); // register control for string values
eEditors.Add("number", edit.CEditNumber); // register control for number


let oTable = new CTableData();
oTable.ReadObjects(json_data); // read some data
oTable.COLUMNSetPropertyValue([ 1, 2, 3, 4, 5, 6 ], "edit.edit", true); // set editable columns
table.COLUMNSetPropertyValue([ 1, 2, 3, 4, 5, 6 ], [ "edit.name", "type.group" ], "string"); // set type of edit control for column, here it is "string"
// edit options set to true will create one internal CEdits object, this CEdits 
// object holds controls for columns that are editable.
let oTableText = new CUITableText({edit: true, parent: document.getElementById("idParentTableElement"), table: oTable});
oTableText.INPUTInitialize(true); // Create edit controls for editable columns
oTableText.INPUTActivate(4, 3);   // open edit on row 4 and column 3
oTableText.INPUTActivate(4);      // Open all edits on row 4
```


```ts
let oTableData = new CTableData();                                             // new table data object

// trigger logic, this will enable triggering callbacks
let oTrigger = new CTableDataTrigger({ table: oTableData, trigger: CALLBACK_TableData }); // create trigger object and set  callback to events for table data

let eContainer = document.getElementById("idTableCointainer");

let options = {
   parent: eContainer,
   section: [ "toolbar", "title", "table.header", "table.body", "table.footer", "statusbar" ],
   table: oTableData,
   name: "test-data",
   trigger: oTrigger,   // set trigger to get trigger events from CUITableText
};

let oTableText = new CUITableText(options);
oTableData.ReadObjects(aAddresses);
oTrigger.Trigger( CTableDataTrigger.GetTriggerNumber("AfterLoadNew") );        // Execute trigger called "AfterLoadNew"
```

.. header:: _Enable edit for all columns in table_
```ts
let TDSampleData = new CTableData();
TDSampleData.ReadArray(aTable); // read data from array, first row has column names as default
TDSampleData.COLUMNSetPropertyValue(true, "edit.edit", true);// enable edit for all columns
```



Create a voter system in Selection
==

Voter table
--

We need a table to have something to work with. In this voter sample we start with a voter table.  
The voter table holds information about each person that are able to vote. All tables is created in `vote` schema.  
*schema in database is like a namespace, used to avoid name collisions*.

```sql
-- Create namespace if it isn't created
IF NOT EXISTS (SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'vote' )
BEGIN
    EXEC sp_executesql N'CREATE SCHEMA "vote";';
END

CREATE TABLE vote.TVoter (
	VoterK BIGINT IDENTITY(1,1) PRIMARY KEY NONCLUSTERED
   ,FIp VARCHAR(100)    -- Active ip
   ,FName NVARCHAR(100) -- User name
   ,FAlias NVARCHAR(100)-- Alias for user
   ,FMail NVARCHAR(100) -- Mail address for user
   ,FLastVote DATETIME  -- Last time user voted
   ,FDeleted SMALLINT DEFAULT 0 -- If voter is deleted, like old
);
```

Running this script in database (SQL server in this sample) will create one voter table. But the table is empty.  
We need to fill table with data

Script Voter table
--

Selection want information about how to work with the database that it is connected to. Information
about the database can be read from XML db scripts. The script informs selection about the database rules.

Selection are able to scan a database without a script. When this is done internal rules, how the database
is designed to work is undetected. The voter table in this sample could have been scanned. In this simple script
it just maps each field. But no database is designed like this.


```xml
<TABLETEMPLATE ID="vote.voter">
   <FIELD NAME="FIp" ALIAS="Ip" TYPE="STR" MAX="100" CONDITION="1" EDIT="1"/>
   <FIELD NAME="FName" ALIAS="Name" TYPE="STR" MAX="100" CONDITION="1" EDIT="1" />
   <FIELD NAME="FAlias" ALIAS="Alias" TYPE="STR" MAX="100" CONDITION="1" EDIT="1" />
   <FIELD NAME="FMail" ALIAS="Mail" MAX="100" TYPE="STR" CONDITION="1" EDIT="1" />
   <FIELD NAME="FLastVote" ALIAS="LastVote" TYPE="DATE" CONDITION="1" EDIT="1">
   <FIELD NAME="FDeleted" ALIAS="Deleted" TYPE="I2" CONDITION="1" EDIT="1" />
</TABLETEMPLATE>

<TABLE PREFIX="TVoter1" NAME="TVoter" ALIAS="TVoter1" SIMPLENAME="~TVoter TVoter">
   <FIELD NAME="VoterK" ALIAS="ID" TYPE="I4" CONDITION="1" KEY="1" />
   <USETABLETEMPLATE ID="vote.voter" />
</TABLE>
```
<br>

*Describing element FIELD and attributes in FIELD**
```xml
<FIELD NAME="FIp" ALIAS="Ip" TYPE="STR" MAX="100" CONDITION="1" EDIT="1"/>
```
- `FIELD` element informs that this is a field with visible data for user.
  - `NAME` attribute in `FIELD` has the database name for field. `NAME` value is required.
  - `ALIAS` attribute has the named column, this is what user will see. If `ALIAS` isn't set then the field name is displayed.
  - `TYPE` is the value type for `FIELD`, type is required.
  - `CONDITION` is set to 1 and that informs selection that field value can be used as query condition.
  - `EDIT` is set to 1 and when this is set selection allow the field to be modified/edit.

<details>
<summary>Complete script, this is enough for selection to display information from voter table</summary>
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<SELECTION
   NAME="sample_vote" DBID="sample_vote" DBSIMPLEID="sample_vote" KEY="sample_vote_001" OWNER="[vote]." VERSION="1"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="../../select.xsd">

   <TABLETEMPLATE ID="vote.voter">
      <FIELD NAME="FIp" ALIAS="FIp" TYPE="STR" MAX="100" CONDITION="1" EDIT="1"/>
      <FIELD NAME="FName" ALIAS="FName" TYPE="STR" MAX="100" CONDITION="1" EDIT="1" />
      <FIELD NAME="FAlias" ALIAS="FAlias" TYPE="STR" MAX="100" CONDITION="1" EDIT="1" />
      <FIELD NAME="FMail" ALIAS="FMail" MAX="100" TYPE="STR" CONDITION="1" EDIT="1" />
      <FIELD NAME="FLastVote" ALIAS="FLastVote" TYPE="ODATE" EDIT="1">
         <FORMULA CODE="GD1">date.datetimetext( float(@this) + 2 )</FORMULA>
         <EXPRESSION>CAST( [$T].[$F] AS float )</EXPRESSION>
      </FIELD>
      <CONDITION NAME="FLastVote" SIMPLENAME="~TVoterFLastVote FLastVote" TYPE="ODATE" DEFAULT="$${date.datetimetext( date.offsethour( 0 ) )}">
         <EXPRESSION>FLOOR( CAST([$T].[$F] AS FLOAT) ) $_operator FLOOR($_value-2)</EXPRESSION>
      </CONDITION>
      <FIELD NAME="FDeleted" ALIAS="FDeleted" TYPE="I2" CONDITION="1" EDIT="1" />
   </TABLETEMPLATE>

   <TABLE PREFIX="TVoter1" NAME="TVoter" ALIAS="TVoter1" SIMPLENAME="~TVoter TVoter">
      <FIELD NAME="VoterK" ALIAS="VoterK" TYPE="I4" CONDITION="1" KEY="1" />
      <USETABLETEMPLATE ID="vote.voter" />
   </TABLE>
</SELECTION>
```
</details>

Databases have more than one table, they have many tables that can relate to each other, hence the name  Relational Database.
Relational Databases hare very good at combining data from different tables. This is very important working with information.

### Normalization (uniqueness) of information.
Normalize information is very important. It is important for arrangement of data, avoid errors in data and make it easy to work with data.
This tutorial is not about database design but creating databases it is very important to know what they solve and why. For example, if a database
have redundant data (duplicate data) it can be designed better.  

In this tutorial we want to create more tables to manage votes.  
- `TPoll` is a table that has poll information, what polls voter can vote about
- `TPollQuestion` are questions in the poll, one poll can have one or more questions
- `TPollAnswer` is selectable answers for the poll, these answers is what voters selects when they vote
- `TPollVote` is where votes are stored, when the voter votes, this table register the vote from voter.

<details>
<summary>SQL code to create these tables in SQL Server</summary

```sql
CREATE TABLE vote.TPoll (
   PollK BIGINT IDENTITY(1,1) PRIMARY KEY NONCLUSTERED
   ,FName NVARCHAR(500)     -- Name for poll
   ,FDescription NVARCHAR(MAX)-- Describe poll
   ,FBegin DATETIME         -- begin date, when poll starts
   ,FEnd DATETIME           -- end date, when poll ends
);
```

```sql
CREATE TABLE vote.TPollQuestion (
   PollQuestionK BIGINT IDENTITY(1,1) PRIMARY KEY NONCLUSTERED
   ,PollK BIGINT            -- Foreign key to poll
   ,FName NVARCHAR(500)     -- Poll name
   ,FDescription NVARCHAR(MAX)-- Explain poll
);
```

```sql
CREATE TABLE vote.TPollAnswer (
   PollAnswerK BIGINT IDENTITY(1,1) PRIMARY KEY NONCLUSTERED
   ,PollK BIGINT            -- Poll this answer belongs to
   ,PollQuestionK BIGINT    -- Foreign key to question
   ,FName NVARCHAR(500)     -- Answer name
   ,FDescription NVARCHAR(MAX)-- Explain answer
);
```

```sql
CREATE TABLE vote.TPollVote (
   PollVoteK BIGINT IDENTITY(1,1) PRIMARY KEY NONCLUSTERED
   ,PollAnswerK BIGINT      -- Foreign key answer
   ,VoterK BIGINT           -- Foreign key to voter
   ,FVote INT               -- Number for how voter voted, negative number is dislike
   ,verified SMALLINT       -- Vote verification, references table vote.verify         
);
```
</details>

.. note:: _Why do place T in front of each table and F in front of some field values_
As you can see in these samples, tables have a large T in front of them and some fields has a capital F. 
You can name tables and fields to any name. This is just how I how I usually name tables and fields.
If you have a database with hundreds of tables, views etc. Each table in turn has lots of columns. 
Then it can quickly become difficult to keep track of what everything is.
T means normal table, F in front of a field means that the field has value data user can change. 


Script our four new voter tables
--
`TPoll`, `TPollQuestion`, `TPollAnswer` and `TPollVote` is now created in database and it's time to script those new tables.

Script these are done like we did with `TVoter` table.

<details>
<summary>Complete script, with our four new voter tables included</summary>
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<SELECTION
   NAME="sample_vote" DBID="sample_vote" DBSIMPLEID="sample_vote" KEY="sample_vote_001" OWNER="[vote]." VERSION="1"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="../../select.xsd">

<TABLETEMPLATE ID="vote.voter">
   <FIELD NAME="FIp" ALIAS="Ip" TYPE="STR" MAX="100" CONDITION="1" EDIT="1"/>
   <FIELD NAME="FName" ALIAS="Name" TYPE="STR" MAX="100" CONDITION="1" EDIT="1" />
   <FIELD NAME="FAlias" ALIAS="Alias" TYPE="STR" MAX="100" CONDITION="1" EDIT="1" />
   <FIELD NAME="FMail" ALIAS="Mail" MAX="100" TYPE="STR" CONDITION="1" EDIT="1" />
   <FIELD NAME="FLastVote" ALIAS="LastVote" TYPE="DATE" CONDITION="1"  EDIT="1" />
   <FIELD NAME="FDeleted" ALIAS="Deleted" TYPE="I2" CONDITION="1" EDIT="1" />
</TABLETEMPLATE>
   
<TABLETEMPLATE ID="vote.poll">
   <FIELD NAME="FName" ALIAS="Name" TYPE="STR" CONDITION="1" EDIT="1" />
   <FIELD NAME="FDescription" ALIAS="Description" TYPE="STR" CONDITION="1" EDIT="1" />
   <FIELD NAME="FBegin" ALIAS="Begin" TYPE="DATE" CONDITION="1" EDIT="1" />
   <FIELD NAME="FEnd" ALIAS="End" TYPE="DATE" CONDITION="1" EDIT="1" />
</TABLETEMPLATE>
   
<TABLETEMPLATE ID="vote.pollquestion">
   <FIELD NAME="PollQuestionK" ALIAS="PollQuestionK" TYPE="I4" CONDITION="1" />
   <FIELD NAME="PollK" ALIAS="PollK" TYPE="I4" CONDITION="1" />
   <FIELD NAME="FName" ALIAS="Name" TYPE="STR" CONDITION="1" />
   <FIELD NAME="FDescription" ALIAS="Description" TYPE="STR" CONDITION="1" />
</TABLETEMPLATE>
   
<TABLETEMPLATE ID="vote.pollanswer">
   <FIELD NAME="PollK" ALIAS="PollK" TYPE="I4" CONDITION="1" EDIT="1"  />
   <FIELD NAME="PollQuestionK" ALIAS="PollQuestionK" TYPE="I4" CONDITION="1" EDIT="1"  />
   <FIELD NAME="FName" ALIAS="Name" TYPE="STR" CONDITION="1" EDIT="1"  />
   <FIELD NAME="FDescription" ALIAS="Description" TYPE="STR" CONDITION="1" EDIT="1"  />
</TABLETEMPLATE>
   
<TABLETEMPLATE ID="vote.pollvote">
   <FIELD NAME="PollAnswerK" ALIAS="PollAnswerK" TYPE="I4" CONDITION="1" EDIT="1"  />
   <FIELD NAME="VoterK" ALIAS="VoterK" TYPE="I4" CONDITION="1" EDIT="1" />
   <FIELD NAME="FVote" ALIAS="Vote" TYPE="I4" CONDITION="1" EDIT="1" />
</TABLETEMPLATE>
   

<TABLE PREFIX="TPoll1" NAME="TPoll" ALIAS="TPoll1" SIMPLENAME="~TPoll TPoll">
   <FIELD NAME="PollK" ALIAS="PollK" TYPE="I4" CONDITION="1" KEY="1" />
   <USETABLETEMPLATE ID="vote.poll" />
</TABLE>   

<TABLE PREFIX="TPollQuestion1" NAME="TPollQuestion" ALIAS="TPollQuestion1" SIMPLENAME="~TPollQuestion TPollQuestion" PARENT="TPoll1">
   <JOIN TYPE="inner">[$parent].[PollK]=[$this].[PollK]</JOIN>
   <FIELD NAME="PollQuestionK" ALIAS="PollQuestionK" TYPE="I4" CONDITION="1" KEY="1" />
   <USETABLETEMPLATE ID="vote.pollquestion" />
</TABLE>   
   
<TABLE PREFIX="TPollAnswer1" NAME="TPollAnswer" ALIAS="TPollAnswer1" SIMPLENAME="~TPollAnswer TPollAnswer" PARENT="TPollQuestion1">
   <JOIN TYPE="inner">[$parent].[PollQuestionK]=[$this].[PollQuestionK]</JOIN>
   <FIELD NAME="PollAnswerK" ALIAS="PollAnswerK" TYPE="I4" CONDITION="1" KEY="1" />
   <USETABLETEMPLATE ID="vote.pollanswer" />
</TABLE>
   
<TABLE PREFIX="TPollVote1" NAME="TPollVote" ALIAS="TPollVote1" SIMPLENAME="~TPollVote TPollVote" PARENT="TPollAnswer1">
   <JOIN TYPE="inner">[$parent].[PollAnswerK]=[$this].[PollAnswerK]</JOIN>
   <FIELD NAME="PollVoteK" ALIAS="PollVoteK" TYPE="I4" CONDITION="1" KEY="1" />
   <USETABLETEMPLATE ID="vote.pollvote" />
</TABLE>

<TABLE PREFIX="TVoter1" NAME="TVoter" ALIAS="TVoter1" SIMPLENAME="~TVoter TVoter" PARENT="TPollVote1">
   <JOIN TYPE="inner">[$parent].[VoterK]=[$this].[VoterK]</JOIN>
   <FIELD NAME="VoterK" ALIAS="VoterK" TYPE="I4" CONDITION="1" KEY="1" />
   <USETABLETEMPLATE ID="vote.voter" />
</TABLE>

</SELECTION>
```
</details>

Selection are now able to work with all tables found in script.  
If you expand the script above you can see that it has grown. And it can grow a lot more. If the database
has hundreds of tables, then script can became quite large.  
To avoid this it is easier to create different type of clients. With selection it is easy to create different systems.
These systems can work with the same database. They just work or is optimized to work with different parts in the database.


#TABLE and #TABLETEMPLATE

Viewing script there are elements called `TABLE` and `TABLETEMPLATE`.
`TABLE` is used to describe a table in database for selection. Child elements in table has information about what fields the table
has. How each field works and internal rules for field. Basic settings are used in script above in this tutorial but you can specify a lot more rules.  

`TABLE` is needed for the table, you sometimes need more than one `TABLE` for one single table in database.
The reason for this is that in a system, a table can be used differently based on the situation.  
Users in a system, when you need to login, then there are rules for that. When the user votes, there are other rules
and you may want to analyze, then user could have other rules to count votes.  
When one single table is added with many `TABLE` elements you do not want to add same fields for each table.
To avoid this fields can be added (included) in table with `TABLETEMPLATE`. Placing fields for a table in `TABLETEMPLATE`
will simplify to include them in different tables.

*This line in with `USETABLETEMPLATE` includes `TABLETEMPLATE` that has the `vote.poll` **vote.poll** *
```xml
   <USETABLETEMPLATE ID="vote.poll" />
```


```xml
<TABLE PREFIX="TPoll1" NAME="TPoll" ALIAS="TPoll1" SIMPLENAME="~TPoll TPoll">
   <FIELD NAME="PollK" ALIAS="PollK" TYPE="I4" CONDITION="1" KEY="1" />
   <USETABLETEMPLATE ID="vote.poll" />
</TABLE> 
```
Using `TABLETEMPLATE` makes it easier to create scripts for selection.


Relational database and combining information.
--
When relational database combine information they join.
With `JOIN` keyword in SQL, databases combines columns from one or more tables and this is the core in relational databases.

Queries can sometimes be big and one reason for this is that databases picks data from different tables and those tables are combined.
To make this process fast you should index fields used to combine information from different tables. 
Indexing columns do make the database a bit slower updating information and size is increased. But the speed to combine information
is improved a lot. Databases are also good at analyze queries before they deliver information. They know what indexes
that are best to use first and if all indexes that are in the database for fields in query should be used.  
If a table has only a few hundred rows, then there is hardly any gain with indexing.  


In database script each table except the root `TABLE` has `JOIN` elements. There you can type how table combines
information to the parent table. If you do not add this `JOIN` element then selection will try to figure out how
to generate the joining but that process is sometimes a bit risky.
It is almost always better to write the exact phrase for how you want to combine information. 

.. header:: _sample join_
```xml
<JOIN TYPE="inner">[$parent].[PollAnswerK]=[$this].[PollAnswerK]</JOIN>
```

- `$parent` is replaced with parent table alias
- `$this` is replaced with table alias for current table
