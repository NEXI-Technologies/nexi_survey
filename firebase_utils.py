import streamlit as st
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime





# Inicializa a app do Firebase 
if not firebase_admin._apps:
    cred = credentials.Certificate(st.secrets["firebase_credentials"])
    firebase_admin.initialize_app(cred)

# Conecta com o Firestore
db = firestore.client()




# ------------------- FUNÇÕES FIREBASE -------------------

def save_survey_to_firebase(name, email, answers_dict, duration):
    now = datetime.now().strftime("%Y_%m_%d_%H:%M:%S")
    doc_name = f"{email}_{now}"
    doc_ref = db.collection("survey_responses").document(doc_name)
    doc_ref.set({
        "name": name,
        "email": email,
        "timestamp": firestore.SERVER_TIMESTAMP,
        "answers": answers_dict,
        "duration": duration
    })



def get_all_answered_folders():
    # Pega todos os documentos da coleção
    docs = db.collection("survey_responses").stream()

    all_answered_folders = set()

    for doc in docs:
        data = doc.to_dict()
        answers = data.get("answers", {})
        folders = list(answers.keys())
        all_answered_folders.update(folders)

    return sorted(all_answered_folders)



def get_number_of_surveys_completed(username):
    docs = db.collection("survey_responses").where("username", "==", username).stream()
    return sum(1 for _ in docs)



def get_data():
    docs = db.collection("survey_responses").stream()
    all_data = []
    for doc in docs:
        data = doc.to_dict()
        all_data.append(data)
    return all_data
