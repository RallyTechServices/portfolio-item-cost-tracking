#Portfolio Item Cost Tracking

As a portfolio manager I would like to see the cost of the work, and even how that cost is broken down based on a release or a parent, across many teams that may have different costs.  

The returned data set or Portfolio Items includes Portfolio Items of the selected type who's Actual End Date or Planned End Date (if Actual End Date is not populated) falls within the selected date range.  

![ScreenShot](/images/grid.png)

To select additional columns to be displayed, click the field picker icon.  ![ScreenShot](/images/field_picker_icon.png)

To filter the selected portfolio item types, click the filter icon.   ![ScreenShot](/images/filter_icon.png)

To export the results as a CSV file, click the export icon.   ![ScreenShot](/images/export_icon.png)

###App Settings
Configuring the Portfolio Item Cost Tracking App

 ![ScreenShot](/images/app_settings.png)

######Currency
Determines which currency sign to display next to calculated costs.  

######Calculate Preliminary Budget using
Determines which field to use to calculate the Preliminary Budget.  The prelimary budget will be calculated by multiplying the value of the selected field by the Cost per Unit for the project of the item. Note that for portfolio item types beyond the lowest level, this is calculated from the preliminary estimate of the portfolio item, not from the sum of the portfolio item children.  If the selected field value is null, then -- will be displayed.  

######Calculate Cost
Determines how to calculate total, actual and remaining costs.  Please see the details below for each option (Story Points, Task Actuals).

######Normalized Cost Per Unit
Cost per unit to use for calculating all costs where a specific project cost per unit is not specified.  

######Exceptions to the normalized cost
To specify project costs different than the value in the Normalized Cost Per Unit, click the Select Projects button to add projects to the exceptions list.  Once in the exceptions list, update the grid with the desired cost per unit for each project.  

###Cost Calcuation type details
For all Cost Calcuation options, the following definition applies:
Cost Per Unit = Cost per unit for the current project scope.  If the cost per unit is defined for the specific project in the Exceptions area of the App Settings, then that number will be used.  Otherwise, the Normalized Cost Per Unit will be used. 

####Based On Story Points
When Based On Story Points, the costs are calculated as followed:

* Total Projected Cost:  Story Plan Estimate Total * Cost Per Unit
* Actual Cost: Accepted Story Plan Estimate Total * Cost Per Unit
* Remaining Cost: Total Projected - Actual Cost

If there are no stories associated with the feature, or if the stories associated with the feature have no estimates, the costs associated with those stories will be 0.

####Based On Task Actuals
When Based On Task Actuals, the costs are calculated as followed:

* Total Projected Cost:  Task Estimate Total * Cost Per Unit
* Actual Cost: Task Actual Total * Cost Per Unit
* Remaining Cost: (ToDo) Task Remaining Total * Cost Per Unit

What if TaskActuals aren't turned on for my project? 
If task actuals aren't turned on for your current project, there will be a warning banner and any task actual calculations for that project will be 0.  

####Based On Timesheets (** not implemented yet)
When Based On Timesheets, the costs are calculated as followed:

* Total Projected Cost:  (Task Estimate Total) * Cost Per Unit
* Actual Cost: Time Spent * Cost Per Unit
* Remaining Cost: (Total Projected - Actual Cost)

## License

AppTemplate is released under the MIT license.  See the file [LICENSE](./LICENSE) for the full text.

##Documentation for SDK

You can find the documentation on our help [site.](https://help.rallydev.com/apps/2.0/doc/)
