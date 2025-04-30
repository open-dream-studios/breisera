# import spacy
# import re
import sys
import json

input_arg = sys.argv[1] 
output = {'output': f'{input_arg}'}
print(json.dumps(output))

# # Load English tokenizer + parser
# nlp = spacy.load("en_core_web_sm")

# # Clean and process the transcript
# def clean_transcript(text):
#     # Remove music markers and normalize spaces
#     text = re.sub(r'\[Music\]', '', text, flags=re.IGNORECASE)
#     text = re.sub(r'\s+', ' ', text)
#     return text.strip()

# # Chunk into sentence-like chunks
# def chunk_sentences(text):
#     cleaned = clean_transcript(text)
#     doc = nlp(cleaned)
#     return [sent.text.strip() for sent in doc.sents]

# # Example usage
# text = "I mean the guys got streaming mode on pubs might be Imperial how he's gonna race [Music] foreign [Music] oh my gosh bro he's looking good bro"
# chunks = chunk_sentences(text)

# for i, chunk in enumerate(chunks):
#     print(f"{i+1}: {chunk}")
