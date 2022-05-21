# Sample links and webserver

To open samples pages they need a webserver that feeds browser with data. This is because it uses modules.  
[Open bootstrap sample page with editing](http://localhost:8080/git/jsTableData/sample/sampleBootstrap5TableEdit.html)  
This sample above uses iisexpress and the url used is called `git`, it uses localhost with port 8080.
Sample configuration in applicationhost.config that issexpress uses to configure addressees 
```xml
<application path="/git" applicationPool="Clr4IntegratedAppPool">
   <virtualDirectory path="/" physicalPath="C:\dev\#github" />
</application>			
```

And this section is placed in the `sites` element within `site`.