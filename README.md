# todo.md

Hello! This is a tool for making todo lists that uses [markdown](https://daringfireball.net/projects/markdown/) to render everything.

Basically, you can take your notes in a nice plaintext format, which makes it easy to version control, sync, etc., but keep the benefits of _rich_ **text** and 😀s and tables and things.

But this tool has other features, to make it more useful as a todo list. Basically headings can become drop-downs so you can more easily browse through your list, and there are sorting and filtering tools that allow you to control which items show up and their order.

Also, a side note: While testing I was finding the typing fairly unresponsive when working with a large todo file, and eventually discovered it was grammarly that was at fault, not my stuff. So you might want to tell it not to work on this site, or just deal with the input lag/keep your todo list small. Of course, any other extensions that need to work as you type will probably have similar effects.

While you can organized the list however you want, here's an example of how I use it and recommend it be used:

## Example Heading

- Welcome the world! `DUE:1969-10-29` `@WWW` `+DOD` `+ARPA`

### Sub-Heading

- Get started on the next project!

## TODO

- Publish todo.md! `@HOME` `+HIGH`

    - Make an app?
    - Allow support for opening arbitrary markdown files
    - Make it so you can create "todo.md" files from Drive

- Fix bugs

    - Showdown only supports nested lists up to 2 layers deep. Since my personal todo.md has some 3-layered lists, this bugs me.

> Note: This is just an example of a "bug" I don't think will be fixed soon. Real bugs should be put into the bug tracker
