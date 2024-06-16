type Path = string;
type Document = string[];

export class TfIdf {
	private corpus: Map<Path, Document>;

	constructor() {
		this.corpus = new Map();
	}

	private getWordsFromText(document: string) {
		return document
			.replace(/[\r\n]/g, " ")
			.trim()
			.split(/\W+/);
	}

	/*
	 * Breaks a string into an array of words (aka document)
	 */
	public addDocument(document: { text: string; path: string }) {
		let strArray = this.getWordsFromText(document.text);
		this.corpus.set(document.path, strArray);

		return this.corpus;
	}

	/*
	 * Creates a corpus from an array of documents
	 */
	public createCorpusFromStringArray(
		documents: {
			text: string;
			path: string;
		}[]
	) {
		for (let i = 0; i < documents.length; i++) {
			let strArray = this.getWordsFromText(documents[i].text);
			this.corpus.set(documents[i].path, strArray);
		}
		return this.corpus;
	}

	/*
	 * Calculates the term frequency (tf) of a given term in a document
	 * Term frequency is computed as:
	 * number of occurrences of the term / length of document;
	 */
	private calculateTermFrequency(term: string, document: string[]) {
		let numOccurences = 0;
		for (let i = 0; i < document.length; i++) {
			if (document[i].toLowerCase() == term.toLowerCase()) {
				numOccurences++;
			}
		}
		return (numOccurences * 1.0) / (document.length + 1);
	}

	/*
	 * Calculates the inverse document frequency (idf) of a term in a given document
	 * idf = log(number of documents where the term appears / term frequency)
	 */

	private calculateInverseDocumentFrequency(term: string) {
		if (this.corpus == null) return -1;
		let numDocs = 0;
		for (const document of this.corpus.values()) {
			for (let j = 0; j < document.length; j++) {
				if (document[j] == term.toLowerCase()) {
					numDocs++;
					break;
				}
			}
		}
		return Math.log(this.corpus.size / (numDocs + 1)) + 1;
	}

	/*
	 * Creates a vector of the idf of the query term in a given document
	 */

	createIdfModel(query: string | string[]) {
		query = Array.isArray(query) ? query : query.split(" ");
		if (this.corpus == null) return null;
		let model = [];
		for (let i = 0; i < query.length; i++) {
			model.push(this.calculateInverseDocumentFrequency(query[i]));
		}
		return model;
	}

	/*
	 * creates a vector of the tf-idf values for each query term
	 * tf-idf = tf * idf
	 */

	private createVectorSpaceModel(
		query: string | string[],
		document: string[]
	) {
		query = Array.isArray(query) ? query : query.split(" ");
		if (this.corpus == null) return null;
		let termFrequencyModel = [];
		let vectorSpaceModel = [];
		for (let i = 0; i < query.length; i++) {
			termFrequencyModel.push(
				this.calculateTermFrequency(query[i], document)
			);
		}
		let idfModel = this.createIdfModel(query);

		if (idfModel == null) return null;

		for (let j = 0; j < idfModel.length; j++) {
			vectorSpaceModel[j] = idfModel[j] * termFrequencyModel[j];
		}

		return vectorSpaceModel;
	}

	/*
	 * calculates the cosine similarity between two vectors computed as thier dot
	 * product. The higher the cosine similarity of a given document the closer of
	 * a match it is to the query.
	 */
	private calculateSimilarityIndex(
		query: string | string[],
		document: string[]
	) {
		query = Array.isArray(query) ? query : query.split(" ");
		let query_vector = this.createVectorSpaceModel(query, query);
		let doc_vector = this.createVectorSpaceModel(query, document);
		let similarityIndex = 0;
		for (let i = 0; i < query.length; i++) {
			let toAdd = query_vector[i] * doc_vector[i];
			if (isNaN(toAdd)) {
				similarityIndex += 0;
			} else {
				similarityIndex += toAdd;
			}
		}
		let query_mag = this.calculateMagnitude(query_vector);
		let doc_mag = this.calculateMagnitude(doc_vector);
		let similarity = (1.0 * similarityIndex) / (query_mag * doc_mag);
		return isNaN(similarity) ? 0 : similarity;
	}

	/*
	 * Ranks the documents in your corpus according to a query
	 */
	public rankDocumentsByQuery(
		query: string,
		limit: number = 10,
		excludePath?: string
	) {
		const queryParts = query.split(" ");
		let ranking = [];
		for (const [path, document] of this.corpus.entries()) {
			ranking.push({
				document: document,
				similarityIndex: this.calculateSimilarityIndex(
					queryParts,
					document
				),
				path,
			});
		}
		ranking.sort((a, b) => {
			return b.similarityIndex - a.similarityIndex;
		});
		return ranking
			.filter((document) =>
				excludePath ? document.path != excludePath : true
			)
			.splice(0, limit);
	}

	/*
	 * Calculates the magnitude of an input vector
	 */
	private calculateMagnitude(vector: number[]) {
		let magnitude = 0;
		for (let i = 0; i < vector.length; i++) {
			if (isNaN(vector[i])) {
				magnitude += 0;
			} else {
				magnitude += vector[i] * vector[i];
			}
		}
		return Math.sqrt(magnitude);
	}
}
