import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createRetrievalChain } from "langchain/chains/retrieval";

// Initialize environment variables


config();
const app = express();
app.use(cors());
app.use(express.json());

// Initialize the LLM and tools
const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
  maxTokens: 500,
});

//initialize the PROMPT template 
const prompt = ChatPromptTemplate.fromTemplate(`Answer the user's 
    context: {context}
    input: {input}`);


    
//SETTING UP A RETRIEVAL CHAIN (PASS THE LLM AND AND PROMPT)
  const setupRetrievalChain = async () => {
  const chain = await createStuffDocumentsChain({ llm: model, prompt });

  // Load documents
  const loader = new DirectoryLoader("./data", {
    ".csv": (path) => new CSVLoader(path),
  });
  const docs = await loader.load();


  // Split documents
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 20,
  });
  const splitDocs = await splitter.splitDocuments(docs);

  // Create vector store
  const embeddings = new OpenAIEmbeddings();
  const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);

  // Create retriever
  const retriever = vectorStore.asRetriever({ k: 5 });

  // Create retrieval chain
  return createRetrievalChain({
    combineDocsChain: chain,
    retriever,
  });
};

// Lazy-load retrieval chain
let retrievalChain;
setupRetrievalChain().then((chain) => {
  retrievalChain = chain;
  console.log("Retrieval chain is ready");
});

// Endpoint to process user queries
app.post("/query", async (req, res) => {
  try {
    const { input } = req.body;
    if (!retrievalChain) {
      return res.status(503).send("Retrieval chain is not ready yet. Please try again later.");
    }

    const response = await retrievalChain.invoke({ input });
    res.status(200).json({ response });
  } catch (error) {
    console.error("Error processing query:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
