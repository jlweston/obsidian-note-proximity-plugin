import {
	App,
	ItemView,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	WorkspaceLeaf,
} from "obsidian";
import { TfIdf } from "TfIdf";

interface NoteProximitySettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: NoteProximitySettings = {
	mySetting: "default",
};

export const NOTE_PROXIMITY_VIEW = "note-proximity-view";

export default class LookalikePlugin extends Plugin {
	settings: NoteProximitySettings;

	async onload() {
		await this.loadSettings();

		this.registerView(NOTE_PROXIMITY_VIEW, (leaf) => new ExampleView(leaf));

		// Register listeners for new/changed files.
		this.registerEvent(
			this.app.vault.on("create", this.onFileChange.bind(this))
		);
		this.registerEvent(
			this.app.vault.on("modify", this.onFileChange.bind(this))
		);
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				// @ts-expect-error
				if (leaf?.view.file && "path" in leaf?.view.file) {
					// @ts-expect-error
					if (leaf?.view.file instanceof TFile) {
						this.onFileChange(leaf?.view.file);
					}
				}
			})
		);

		// populate initial view with active file
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile && activeFile instanceof TFile) {
			this.onFileChange(activeFile);
		}

		// TODO add settings tab back once we have settings...
		// this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	// TODO: should probably optimise to add/remove only the new/changed file
	private async onFileChange(file: TFile) {
		const rankings = await this.calculateTfIdf(file);
		await this.updateView(rankings);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(NOTE_PROXIMITY_VIEW);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({
				type: NOTE_PROXIMITY_VIEW,
				active: true,
			});
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf) workspace.revealLeaf(leaf);
	}

	async updateView(rankings: { path: string; similarityIndex: number }[]) {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(NOTE_PROXIMITY_VIEW);
		if (leaves.length > 0) {
			const view = leaves[0].view as ExampleView;
			view.update(rankings);
		}
	}

	async calculateTfIdf(currentFile: TFile) {
		const { vault } = this.app;

		const tfIdf = new TfIdf();
		const files = vault.getMarkdownFiles();

		for (const file of files) {
			const text = await vault.cachedRead(file);
			tfIdf.addDocument({ text, path: file.path });
		}

		const rankings = tfIdf.rankDocumentsByQuery(
			await vault.cachedRead(currentFile),
			10,
			currentFile.path
		);
		console.log({ rankings });

		return rankings;
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class LookalikeSettingsTab extends PluginSettingTab {
	plugin: LookalikePlugin;

	constructor(app: App, plugin: LookalikePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// TODO add settings for:
		// - excluded folders
		// - number of similar notes to show
		// - similarity threshold
		// - choice of strategies (for both tf and idf)
		// - ability to exclude certain words
		// - ability to exclude frontmatter/codeblocks

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

export class ExampleView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return NOTE_PROXIMITY_VIEW;
	}

	getDisplayText() {
		return "Note proximity";
	}

	async onOpen() {}

	async update(rankings: { path: string; similarityIndex: number }[]) {
		const container = this.containerEl.children[1];
		container.empty();

		container
			.createEl("div", {
				// text: "Similar notes:",
				cls: "tree-item",
			})
			.createEl("div", {
				cls: ["tree-item-inner", "backlink-pane"],
				text: "Similar notes:",
			})
			.setCssStyles({
				color: "var(--text-muted)",
				fontSize: "var(--font-adaptive-smallest)",
				fontWeight: "var(--nav-heading-weight)",
				letterSpacing: ".05em",
				textTransform: "uppercase",
			});

		const searchResultContainer = container.createEl("div", {
			cls: ["search-results-container"],
		});

		const searchResultsChildren = searchResultContainer.createEl("div", {
			cls: ["search-results-children"],
		});

		for (const { path, similarityIndex } of rankings) {
			const searchResult = searchResultsChildren.createEl("div", {
				cls: ["tree-item", "search-result-file-title"],
			});

			searchResult.onclick = () => {
				this.app.workspace.openLinkText(path, "", false);
			};

			searchResult
				.createEl("div", {
					cls: ["tree-item-self", "is-clickable"],
				})
				.createEl("div", {
					text: `(${similarityIndex.toFixed(3)}) ${path}`,
					cls: ["tree-item-inner"],
				});
		}
	}

	async onClose() {
		// Nothing to clean up.
	}
}
