import { Embeddings } from "@langchain/core/embeddings";
import axios from "axios";

export class CustomEmbeddingClient extends Embeddings {
    private apiUrl = "http://localhost:4000/embed";

    async embedDocuments(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];
        for (const text of texts) {
            const response = await axios.post(this.apiUrl, { text });
            embeddings.push(response.data.embedding);
        }
        return embeddings;
    }

    async embedQuery(text: string): Promise<number[]> {
        const response = await axios.post(this.apiUrl, { text });
        return response.data.embedding;
    }
}
