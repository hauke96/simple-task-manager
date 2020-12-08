This file contains some information on how to contribute to this project.

# How can I contribute?

There are several ways you can contribute:

* Report a bug or problem
* Add feature requests or take part in a feature discussion
* Add/extend/fix/modify translation files
* Add/extend/fix/modify documentation
* Fix a bug
* Implement a feature
* ...

## Contribute non-code stuff

**Note:** Everything regarding translation and documentation is considered "code" because you have to create git commits and a pull request.

### Report a bug

Feel free to [create an issue](https://github.com/hauke96/simple-task-manager/issues/new) and put the following things into the issue description:

* Version of STM (visible on the bottom of the page)
* The chronology of the situation:
    * What you have done *before* the bug occurred?
    * What was the desired behavior/result?
    * What was the actual behavior/result (aka the bug)?
        * Describe as detailed as possible what went wrong. Just saying "Project creation not working" isn't that helpful but "When clicking 'create project' the error message '.......' appears" is more helpful.
* Have you tried anything to alanyze/remove/get around the bug? If yes, what have you tried? E.g. trying a different browser, etc.

Any further information may help to determine the bug: Screenshots, browser console output, strange network behavior or anything else you noticed.

### Add feature request

Feel free to [create an issue](https://github.com/hauke96/simple-task-manager/issues/new) and put the following things into the issue description:

* In a few sentences: What is this feature about?
    * Example: "I want to subdivide tasks during the project creation."
* To help others understand you wish, add some context. Why do you want this feature? What makes it useful for the STM?
    * Example: "This enabled me to easily create several uniformly sized tasks for a specific region and therefore saves a lot of time."
* Also adding more content, mockups, drawings, examples, etc. may help.
    * Example: "I want to choose between multiple possible shapes like in the app XYZ: https://..."
* If you are a programmer and have ideas regarding the implementation, feel free to add them.

## Contribute code

Before you start implementing a larger feature: Start an issue and be open for a discussion.

### Getting started

Read the [doc/development README](./doc/development/README.md) which shows you how to setup the project and gives you an idea about a possible workflow.
It also links further down to client and server documentation files.

### Branching

Some words on the branches:

* `master`: Contains the last deployed code (probably not up to date).
* `dev`: Contains the latest code. However, some larger feature may still be on separate feature-branches.
* `release/...`: Contains preparations for a release. Will soon be merged into `master` and `dev`.
* `feature/...`: Contains unfinished code for a specific feature.

**Never** use the `master` branch because it doesn't contain the latest changes.
Usually you should use the `dev` branch.

### Fix a bug

1. For the repo
2. Check if the bug has already been fixed:
    1. Go onto the `dev` branch
    2. Start everything locally
    3. Try to reproduce the bug
    4. If bug hasn't been fixed on the `dev` branch: Keep on reading. If bug is fixed: Stop reading, nothing to do.
3. Go to the github issue or create a new one and assign yourself to to issue
4. Go back to your code and write a test which detects the bug
4. Fix the bug (nothing easier than that :P )
5. Make sure no tests are failing and the code format is fine
6. Update your branch by pulling the latest changes from the main STM repo
7. Create a pull request

### Add a feature

After checking the issue page, finishing discussions or asking questions, you are ready to start a new feature.

1. For the repo
2. Go to the `dev` branch
3. Create a new `feature/my-super-duper-feature` branch (as described in the [development README](./doc/development/README.md))
4. Start implementing your feature
    1. Also add tests
    2. Maybe adjust the documentation if e.g. a new API endpoint needs to be created
    3. Maybe update and adjust the clients translation files
5. Make sure no tests are failing and the code format is fine
6. Update your branch by pulling the latest changes from the main STM repo
7. Create a pull request

## Code conventions

See the [development README](./doc/development/README.md) for details.