from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfplumber
import docx
from sentence_transformers import SentenceTransformer, util
import spacy
from google import genai
import os
from dotenv import load_dotenv
import json, re

# pip install -U google-genai
# pip install python-dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow CORS for all domains (adjust in production)

# Load models once at startup
embedder = SentenceTransformer('all-MiniLM-L6-v2')
nlp = spacy.load('en_core_web_sm')

def extract_text_from_resume(resume):
    filename = resume.filename.lower()
    if filename.endswith('.pdf'):
        with pdfplumber.open(resume) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    elif filename.endswith('.docx'):
        doc = docx.Document(resume)
        return "\n".join([para.text for para in doc.paragraphs])
    elif filename.endswith('.txt'):
        return resume.read().decode('utf-8')
    else:
        return ""

def get_semantic_similarity(resume_text, job_description):
    emb_resume = embedder.encode(resume_text, convert_to_tensor=True)
    emb_jd = embedder.encode(job_description, convert_to_tensor=True)
    return float(util.pytorch_cos_sim(emb_resume, emb_jd).item())

def extract_entities(resume_text):
    doc = nlp(resume_text)
    roles = [ent.text for ent in doc.ents if ent.label_ == "ORG" or ent.label_ == "PERSON" or ent.label_ == "TITLE"]
    orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
    degrees = [ent.text for ent in doc.ents if ent.label_ == "EDUCATION" or ent.label_ == "DEGREE"]
    return roles, orgs, degrees

def gemini_feedback(resume_text, job_description):
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    prompt = (
        f"Resume:\n{resume_text}\n\n"
        f"Job Description:\n{job_description}\n\n"
        "Analyze the resume for this job. List strengths, weaknesses, and recommendations for improvement. "
        "Respond ONLY in valid JSON with keys: strengths, weaknesses, recommendations. Do not include any explanation or text outside the JSON."
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    text = response.text.strip()
    # Try to extract JSON from the response
    try:
        # If the response is surrounded by code block markers, remove them
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        # Try to find the first {...} block
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            text = match.group(0)
        feedback = json.loads(text)
    except Exception:
        feedback = {
            "strengths": ["Could not parse Gemini response."],
            "weaknesses": [],
            "recommendations": []
        }
    return feedback

@app.route('/api/score-resume', methods=['POST'])
def score_resume():
    resume = request.files.get('resume')
    job_description = request.form.get('jobDescription')
    category = request.form.get('category')
    experience = request.form.get('experience')

    resume_text = extract_text_from_resume(resume)
    if not resume_text.strip():
        return jsonify({"error": "Could not extract text from resume."}), 400

    # 1. Semantic similarity
    similarity = get_semantic_similarity(resume_text, job_description)
    normalized_similarity = (similarity + 1) / 2  # Now in [0, 1]

    # 2. NER
    roles, orgs, degrees = extract_entities(resume_text)

    # 3. Gemini feedback
    gpt = gemini_feedback(resume_text, job_description)

    # Example: count matches for category in roles
    category_match = sum(1 for r in roles if category and category.lower() in r.lower())
    degree_points = min(len(degrees) * 5, 15)  # up to 15 points for degrees
    org_points = min(len(orgs) * 2, 10)        # up to 10 points for orgs

    # Use Gemini feedback: +5 for each strength, -3 for each weakness
    gpt_strengths = gpt.get("strengths", [])
    gpt_weaknesses = gpt.get("weaknesses", [])
    feedback_points = len(gpt_strengths) * 5 - len(gpt_weaknesses) * 3

    # 4. Scoring logic (example weights)
    score = (
        normalized_similarity * 50 +  # up to 50 points
        category_match * 10 +         # up to 10 points per match
        degree_points +               # up to 15 points
        org_points +                  # up to 10 points
        feedback_points               # variable
    )
    score = max(0, min(100, round(score, 2)))

    return jsonify({
        "score": score,
        "strengths": gpt["strengths"],
        "weaknesses": gpt["weaknesses"],
        "recommendations": gpt["recommendations"]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True) 