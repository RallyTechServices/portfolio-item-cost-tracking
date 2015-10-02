#Portfolio Item Cost Tracking

As a portfolio manager I would like to see the cost of the work, and even how that cost is broken down based on a release or a parent, across many teams that may have different costs.  

The returned data set or Portfolio Items includes Portfolio Items of the selected type who's Actual End Date or Planned End Date (if Actual End Date is not populated) falls within the selected date range.  


###App Settings
For all settings types, the following definitions apply:

* Cost per Unit
Cost per unit for the current project scope.  If the cost per unit is defined for the specific project in the Exceptions area of the App Settings, then that number will be used.  Otherwise, the Normalized Cost Per Unit will be used. 

* Preliminary Budget
Preliminary Estimate value of the Portfolio Item * Cost per Unit. Note that for portfolio item types beyond the lowest level, this is calculated from the preliminary estimate of the portfolio item, not from the sum of the portfolio item children.  


####Based On Story Points
When Based On Story Points, the costs are calculated as followed:

* Total Projected Cost:  Story Plan Estimate Total * Cost Per Unit
* Actual Cost: Accepted Story Plan Estimate Total * Cost Per Unit
* Remaining Cost: Total Projected - Actual Cost

If there are no stories associated with the feature, or if the stories associated with the feature have no estimates, the costs associated with those stories will be 0.

####Based On Timesheets
When Based On Timesheets, the costs are calculated as followed:

* Total Projected Cost:  (Task Estimate Total) * Cost Per Unit
* Actual Cost: Time Spent * Cost Per Unit
* Remaining Cost: (Total Projected - Actual Cost)

####Based On Task Hours
When Based On Task Hours, the costs are calculated as followed:

* Total Projected Cost:  Task Estimate Total * Cost Per Unit
* Actual Cost: Task Actual Total * Cost Per Unit
* Remaining Cost: (ToDo) Task Remaining Total * Cost Per Unit

What if TaskActuals aren't turned on for my project? 


## License

AppTemplate is released under the MIT license.  See the file [LICENSE](./LICENSE) for the full text.

##Documentation for SDK

You can find the documentation on our help [site.](https://help.rallydev.com/apps/2.0/doc/)
