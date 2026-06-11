For future contributors.

# package.json

Besides the usual stuff, the `"homepage"` entry is set to the url where the site is hosted. If the site is deployed elsewhere, this must be changed.

# index.html

This file sets up the basic format. The header is created here.

The help and about popup windows are written in this file.

# main.js

This script defines the functionality of the help and about window buttons.

This file also contains the definition of the functions for clicking a node and hovering over one.

# sigma.js

This file has the code for creating nodes based on data loaded from `github.js`.

This file also creates the check boxes for topic and document type visibility.

This file also assigns colors to topics and nodes.

This file also links nodes to each other based on citations.

This file also creates the year filter.

# github.js

This file defines the owner and repo where the code is stored. If the site is forked to a different repo, this must be changed.

This file defines the types of sources, and where they are stored in different json files.

This file defines the functions for logging in, retrieving source files from the GitHub repo, uploading files to the repo, adding a new source, and more.

This file defines the `Login` button, the `Add Source` button, and the `Upload changes` button.

The large `sourceFormFields` object defines what source fields can be edited.

# topics.js

This file just defines the supertopics and subtopics, as taken from Dr. K's `Topics2.docx`.
