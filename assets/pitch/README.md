# Pitch audio

The two things `jt-pitch.mjs` mixes under the scroll. **Both are your own
files.** The plugin ships neither: a music bed needs a licence the plugin cannot
give you, and a voice-over is a particular person saying a particular sentence.
Drop them here, and the script finds them by name.

```
assets/pitch/
  voice/<lang>.mp3    one spoken line, per language
  music/<name>.mp3    the bed, quiet, one or several to choose from
```

A plugin update can replace the plugin's own directory, and this folder with
it. To keep the files somewhere of your own, lay out the same two subfolders
anywhere and point the script at them — `JT_PITCH_ASSETS=/path/to/pitch` in the
environment, or `--assets /path/to/pitch` per run. `--voice <file>` and
`--music <file>` take a single file directly.

## `voice/`

One file per language, named by its tag: `de.mp3`, `de-CH.mp3`, `fr.mp3`,
`en.mp3`, `uk.mp3`, `pl.mp3`. `--lang de-CH` looks for `de-CH.mp3` and falls
back to `de.mp3`, so a regional recording is optional and a missing one is not
an error.

Also accepted: `.m4a`, `.wav`, `.aac`, `.ogg`.

**What is on the recording.** Two sentences, six to nine seconds. Not a script
to be read at the prospect — a message from one person to another:

1. *This is what your site could look like.* Conditional, always. The site in
   the video is a proposal, and the sentence has to say so — anything that
   sounds like «here is your new website» is a claim about work they never
   asked for and it reads as a scam.
2. The ask, one line. Something that costs them nothing to answer: whether they
   want to see it properly, whether it is worth a conversation. Not a price,
   not a deadline, not a discount that expires.

Say the business's own name if you can be bothered to record per prospect — it
is the single biggest difference between this and a mass mailing. Otherwise
keep it generic and let the video carry the personalisation.

Record it as a person speaking, in the prospect's language, by someone who
actually speaks it. A synthesised voice reading a sales line in a language you
do not speak is audible, and it is the wrong first impression for a business
whose whole pitch is craft.

Level the recording to about −16 LUFS so it sits over the bed without the
script having to touch it.

## `music/`

One or more beds. `--music <name>` picks by file name; with no flag the script
takes the first alphabetically, so name the default something that sorts first
if you keep several.

It plays at 8% volume and fades out over the last 1.4 seconds. It is there to
stop the video feeling like a screen recording, nothing more — if it is
noticeable, it is too loud or too busy.

**Licensing is not optional.** These videos go to strangers as marketing, which
is commercial use. Use music that is cleared for it and keep the licence next to
the file:

```
music/
  calm-loop.mp3
  calm-loop.licence.txt    where it came from, what the licence allows, date
```

An Instagram DM with a copyright claim on it is a worse first impression than
no video at all.

## Nothing here is committed to the plugin

The repository holds this README and two empty folders, nothing else. Whatever
you add stays on your machine, with its licence note beside it — if you work
with others and want every pitch to sound the same, keep the shared folder
somewhere you all reach and point `JT_PITCH_ASSETS` at it.
