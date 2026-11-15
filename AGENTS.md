# Moona identity and publishing

- The authorized Moona identity is **Tal Tzur <tal@moonastudio.ai>** for both Git author and committer. Do not use Ethan, Naomi, Gmail, or a no-reply identity for commits created on Tal's behalf in this project.
- Before a commit, inspect `git var GIT_AUTHOR_IDENT` and `git var GIT_COMMITTER_IDENT`. Before GitHub writes, verify the authenticated account is `moonaaistudio-ops` and the repository is in that namespace. For Vercel, verify team `moona-studio` (`team_UTVjLlu1QaqVk3kp3Gxf7O1I`) and the intended project.
- A connected plugin can have a different account from the CLI. Verify the identity for the tool actually used. Stop that tool's write path if it belongs to a different project; use an already authorized Moona connection instead.
- Do not switch back to another project's GitHub account at the end of Moona work. Do not change the global identity of other projects.
- Preserve authorship of historical work by other people. Rewriting published history requires explicit user authorization, backups, and an exact `--force-with-lease`; never use unconditional force.
- GitHub's squash/merge buttons can assign its account-default email. Create the final release commit locally with the authorized email and verify it before pushing, unless the remote workflow has been verified to retain this identity.
- Do not bypass the Moona identity hooks. If they stop a commit or push, correct the identity or destination.
- This requirement also applies to co-author trailers added on Tal's behalf.
