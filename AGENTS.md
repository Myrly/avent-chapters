This file has a few guidelines of how you should answer to ANY prompt. Things you need to check. And below, a list of files to check in order to follow additional codebase guidelines and obtain context of the project.

## Guidelines
1. Before updating any code, always evaluate ambiguity. You must never **guess**, if there is something ambiguous, prompt the agent supervisor for explanation. This applies to logic mainly, but also to styling if a component or page has a complex element to display and you were not told in details what the expected UI is.
2. Before any coding in any prompt, check `AGENTS_THOUGHTS.md` and `NEXT.md`.
3. During your coding. Keep track of your changes, thoughts, and explain what you do inside a new markdown file `AGENTS_THOUGHTS.md`?.
4. If what was asked you in the prompt is too much for a single prompt, prepare the instructions for the next one inside `NEXT.md`.
5. During your coding, know your limits.
6. Consider your code as a commit. Unless absolutely necessary, let's keep things as minimal and reused as possible. Ideally a commit shouldn't be more than 500 lines. 
7. After each work job, write a small review for the supervisor, containing : how well was the problem described, if there was any ambiguity (and in such case, point what was), if the markdown files provided enough clarity and context. For all these points, write a small comment (1 sentence or just "good") and a rating from 1 to 6 (where 6 is best, rounded to .5).
8. In general, try to use the least amount of 3rd party packages as possible. These are shortcuts but eventually end up being more of a problem than a solution.

## User interface conventions
- Follow `STYLE.md` for the pink palette and neobrutalist design. Use `.brutal-checkbox` for every checkbox; do not introduce browser-default checkbox styling.
- Keep the centered main content responsive up to 1200px, and verify that new form controls do not cause horizontal overflow on small screens.
- Preserve visible keyboard focus and the thick borders, squared corners, and offset shadows used by existing controls.
- EPUB section ignore controls must remain reversible: ignored sections stay visible with muted styling and a clear Restore action; do not remove them from the underlying book data.

## Absolute nevers
1. Never ever touch Git. 
2. Never ever run commands that affect any file, directory, or process outside of the project's scope. Exception : downloading new packages needed, upon supervisor validation. (For this project, you probably shouldn't need packages.)

## Check the following for guidelines related to the codebase : 
`./TECHNOLOGIES.md`
`./ARCHITECTURE.md`
`./PROJECT.md`
`./STYLE.md`
