# Help

## General

Write your TODO list in the box on the left, or paste it in from somewhere else. It will be automatically saved and synced to a hidden folder on Google Drive so this file can follow you device to device. As you type, the markdown rendering of it will appear in the box on the right.

## Searching

Searching will look through every line in your markdown file and filter out any line that doesn't match your search terms. It should be pointed out that since it's searching the raw markdown something like

```
[this is a link](https://www.example.com/school)
```

will not be filtered out by the search term `school`.

The search bar has support for:

- Quotes

    As in, searching `hello world` will only match lines that have the literal sequence `hello world` in them, whereas normally the `hello` and `world` could be at different locations in the line.

- ORs

    As in, searching `school OR homework` will match and line that has either `school` or `homework` in it, whereas normally it would need both. You can have multiple ORs, and can use quotes, and it will all behave as expected. (e.g. `school OR homework OR "for college" OR university`)

- Dates

    As you'd expect, searching `DUE:2016-08-30` would filter out any line without that phrase. But, you can use `>` and `<` and `=` like so: `DUE:<2016-08-30` or `DUE:>=2016-08-30` to match any date with the `DUE` tag that is earlier or later (or equal to) the search date.

More search features will hopefully be coming soon! (feature requests go a long way towards prioritising things like this)
