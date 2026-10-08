<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- All file operations go through `src/lib/packet/fileService.ts` (mock now); swap its implementation for real APIs — UI must not call storage directly.
- App state (items, uploads, dialogs, toasts) lives in `src/lib/packet/store.tsx` context; pages read it via `usePacket()`.
- Styling is class-based CSS in `src/styles.css` using oklch tokens — add new classes/tokens there, not inline colors.
