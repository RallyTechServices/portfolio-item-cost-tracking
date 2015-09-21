#Portfolio Item Cost Tracking

As a portfolio manager I would like to see the cost of the work, and even how that cost is broken down based on a release or a parent, across many teams that may have different costs.  

The returned data set or Portfolio Items includes Portfolio Items of the selected type who's Actual End Date or Planned End Date (if Actual End Date is not populated) falls within the selected date range.  


###App Settings
####Based On Story Points
When Based On Story Points, the costs are calculated as followed:
* Cost per Unit
** Cost per unit for the current project scope
* Preliminary Budget
** Preliminary Estimate value of the Portfolio Item * Cost per Unit Note that for portfolio item types beyond the lowest level, this is calculated from the preliminary estimate of the portfolio item, not from the sum of the portfolio item children.  

#####Actual Cost to Date
  Plan Estimate of Stories in or past the Accepted State * Cost per Unit
#####Cost Remaining
  Plan Estimate of any Stories not yet in the Accepted State * Cost per Unit

## License

AppTemplate is released under the MIT license.  See the file [LICENSE](./LICENSE) for the full text.

##Documentation for SDK

You can find the documentation on our help [site.](https://help.rallydev.com/apps/2.0/doc/)
