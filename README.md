# daxplore presenter #

A GWT Web Application that presents research data in the form of charts.

Daxplore Presenter is an open source project under the [LGPL license](http://www.tldrlegal.com/license/gnu-lesser-general-public-license-v2.1-(lgpl-2.1\)). It is being developed at [Stockholm University](http://www.su.se/) by Axel Winkler (axel.winkler@psychology.su.se) and Daniel Dunér (daniel.duner@psychology.su.se).

The project is primarily financed by [AFA Försäkring](http://www.afaforsakring.se).

Getting the project to build and run locally in Eclipse
----------------------------
1. Install Eclipse, Java 7 (OpenJDK7)  
http://www.eclipse.org/downloads/

2. Install Eclipse plugins:
Google plugin (AppEngine + GWT): http://code.google.com/eclipse/
JST and/or WST Server Adapters from the Eclipse standard plugin repository

3. Clone the project into workspace  
$ git clone git@github.com:synthax/daxplore-presenter.git

4. Import the project into Eclipse  
File -> New -> Project..  
General -> Project

5. Use the Eclipse server view  to create a new Tomcat 7 server
Add the daxplore-presenter project to the server

6. Set location to match the folder of the cloned repository in your workspace (see step 2)

7. Synchronize the project with the plugin  
Open the Problem view  
Look under Errors  
Right click one of the items, like:  
"The App Engine SDK JAR appengine-api-1.0-sdk-1.6.1.jar is missing in the WEB-INF/lib directory"  
Select Quick Fix -> Synchronize <WAR>/WEB-INF/lib with SDK libraries  

8. Compile&Run or debug the project  
Right click project -> Debug as -> Web Application -> presentation.jsp  

9. Use our sister project Daxplore Producer to generate and upload data and metadata to the local database.

8. Open up and run the local web server (link provided by the Development Mode view in Eclipse)


Trouble shooting
---------------
If you get a VerifyError:
```java.lang.VerifyError: Expecting a stackmap frame at branch target ...```
Then add ```-XX:-UseSplitVerifier``` as a default VM argument. See this thread for more information:
http://stackoverflow.com/questions/7936006/why-am-i-getting-the-following-error-when-running-google-app-from-eclipse

