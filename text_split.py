import nltk

# Download the required resources
nltk.download('punkt')
nltk.download('punkt_tab')

from nltk.tokenize import sent_tokenize

def split_text_into_chunks(text, sentences_per_chunk=3):
    # Split the text into sentences
    sentences = sent_tokenize(text)
    
    # Group sentences into chunks
    chunks = []
    for i in range(0, len(sentences), sentences_per_chunk):
        chunk = " ".join(sentences[i:i + sentences_per_chunk])
        chunks.append(chunk)
    
    # Create an index for each chunk
    indexed_chunks = {index: chunk for index, chunk in enumerate(chunks)}
    
    return indexed_chunks

