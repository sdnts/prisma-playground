# reaper

This is the lambda that is run every day to delete unused workspaces.

- It fetches all workspaces whose `updatedAt` is greater than 7d.
- Then it calls `DELETE /workspaces/{id}` on these workspaces
