---
description: Turn the client's review into a tracked list, apply it, rebuild the preview
argument-hint: "[the client's comments, pasted]"
---

Run the revisions stage. The client's feedback: $ARGUMENTS

Load `jtakeit-sites:revisions` and follow it.

If the client has chosen a variant, record it (`jt-state set variants.chosen
<name>`) and collapse the project onto that variant first — delete the other
variants and the preview shell in one commit.

Turn the feedback into numbered items in `REVIEW.md`, each with a verdict: done,
declined (with the reason and the agreement), blocked (with what is awaited from
whom), or open. Convert anything vague into two concrete readings and ask, do
not guess. Flag anything that is a scope change rather than a revision.

Before every change: `git pull` — the owner may have edited text in the panel,
and every save is a commit — and `get_site` for what the panel holds unsaved.
Then commit, `import_branch`, `commit_and_build`, and a fresh preview link.
