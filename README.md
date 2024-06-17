# Obsidian Lookalike Plugin

[![GitHub Release](https://img.shields.io/github/v/release/jlweston/obsidian-note-proximity-plugin?sort=semver)](https://github.com/jlweston/obsidian-note-proximity-plugin/releases) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/license/MIT) [!["Buy Me A Coffee"](https://img.shields.io/badge/-buy_me_a%C2%A0coffee-gray?logo=buy-me-a-coffee)](https://www.buymeacoffee.com/jamieweston)

This is a plugin for Obsidian that allows you to identify other notes which may be similar to the current note. It does this by analysing word frequencies across all notes in the vault and comparing them to the current note.

## Installation

### From within Obsidian

Coming soon! This plugin isn't yet available in the Obsidian community plugins list.

### From GitHub

1. Find the latest release from the [releases page](https://github.com/jlweston/obsidian-note-proximity-plugin/releases).
2. Download `main.js`, `styles.css`, and `manifest.json`.
3. Create a folder in your Obsidian vault's plugins directory called `note-promixity`.
4. Copy the downloaded files into the `note-promixity` folder.
5. Reload Obsidian.
6. Under Settings -> Community plugins, enable the plugin.

## Usage

Once the plugin is enabled, there will be a new view in the right-hand pane called "Similar notes". Notes that are similar to the current note will be displayed here, with scores indicating how similar they are (higher scores indicate that the notes share potentially-relevant terms). Clicking on a note in this view will open it in the current editor.

## Feature roadmap

Allow configurations options for the plugin, such as:

-   [ ] configure a minimum similarity threshold
-   [ ] configure the maximum number of similar notes to display
-   [ ] allow for the exclusion of certain notes/folders from the analysis
-   [ ] allow for the exclusion of certain words from the analysis
-   [ ] allow for excluding frontmatter and/or code blocks from the analysis
-   [ ] selection of alternative algorithms for calculating similarity
