# daxplore presenter #

A GWT Web Application that presents research data in the form of charts.

Daxplore Presenter is an open source project under the [LGPL license](http://www.tldrlegal.com/license/gnu-lesser-general-public-license-v2.1-(lgpl-2.1\)). It is being developed at [Stockholm University](http://www.su.se/) by Axel Winkler (axel.winkler@psychology.su.se) and Daniel Dunér (daniel.duner@psychology.su.se).

The project is primarily financed by [AFA Försäkring](http://www.afaforsakring.se).

Getting the project to build and run locally.
----------------------------
1. Install Eclipse and the Google Plugin for Eclipse  
http://code.google.com/eclipse/

2. Clone the project into workspace  
$ git clone git@github.com:synthax/daxplore-presenter.git

3. Import the project into Eclipse  
File -> New -> Project..  
General -> Project

4. Set location to match the folder of the cloned repository in your workspace (see step 2)

5. Synchronize the project with the plugin  
Open the Problem view  
Look under Errors  
Right click one of the items, like:  
"The App Engine SDK JAR appengine-api-1.0-sdk-1.6.1.jar is missing in the WEB-INF/lib directory"  
Select Quick Fix -> Synchronize <WAR>/WEB-INF/lib with SDK libraries  

6. Compile&Run or debug the project  
Right click project -> Debug as -> Web Application -> presentation.jsp  

7. Use the project Daxplore Producer to generate and upload data and metadata to the local database.

8. Open up and run the local web server (link provided by the Development Mode view in Eclipse)  

