import time
import os
from PIL import Image
import streamlit as st
from firebase_utils import save_survey_to_firebase, get_all_answered_folders, get_number_of_surveys_completed
import random


st.set_page_config(
    page_title="Survey",
    page_icon="https://raw.githubusercontent.com/danielfurtado11/danielfurtado11/main/icon-removebg-preview.png",
    layout="wide",
    initial_sidebar_state="collapsed",
    menu_items={
        "Get Help": "mailto:daniel.furtado@nexi.plus", 
        "About": "This is a survey application for evaluating student engagement in classrooms. It uses real classroom images and requires participants to rate student engagement based on visual cues.",
    }
)

row = st.columns(2)
row[0].image("logo.png", width=150)

base_path = "survey_images"
folders_dict = {}
survey_size = 2
engagement_options = [str(i+1) for (i) in range(10)] + ["No context image"]
engagement_captions = ["No engagement","","","","", "","", "","", "Maximum engagement", ""]


if "show_info" not in st.session_state:
    st.session_state["show_info"] = True

if st.session_state["show_info"] is True:

    st.write("")
    st.write("#### Student Engagement Evaluation Questionnaire - Research Study on Classroom Attention Using Visual cues")
    st.write("####")
    with st.container(border=True):
        st.write("""
    **Purpose of the Study:**
    This questionnaire is part of an academic research study aimed at evaluating student engagement and attention levels during class. The evaluation is based on real classroom images taken at different moments throughout a lesson.

    **What You Will Do:**
    On each page, you will see a general image of a classroom.
    Below it, a sequence of individual student faces, detected from the main image, will be displayed.
    For each face, you will be asked to rate the student’s level of engagement based on visual cues.
    How to Respond:
    Rate each face on a scale from 1 (no engagement) to 10 (maximum engagement).
    If you cannot determine the engagement level for a particular face, please select “No context image.”
    
    **Your Input Matters:**
    Your careful observations will contribute to the development of more effective teaching strategies and classroom technologies that respond to real-time student engagement. Your responses are anonymous and will only be used for research purposes.
    
    **Estimated Completion Time:** Approximately 10 minutes

    **Confidentiality:** All data is anonymous and treated with strict confidentiality.

    **Contact for Questions:** Daniel Furtado (daniel.furtado@nexi.plus)
    
    Thank you for your valuable participation. Your insight helps shape the future of education.
                """)
    st.write("")
    
    if 'name' not in st.session_state:
        st.session_state.name = ""
    if 'email' not in st.session_state:
        st.session_state.email = ""
    
    st.session_state.name = st.text_input("**Enter your name:**", value=st.session_state.name, placeholder="(Optional)")
    st.session_state.email = st.text_input("**Enter your email:**", value=st.session_state.email, placeholder="(Optional)")
    
    



# Estado do Survey
if 'show_survey' not in st.session_state:
    st.session_state['show_survey'] = False

# Botão para mostrar a seção do Survey
if not st.session_state['show_survey']:
    if st.button("Answer Survey"):
        st.session_state['show_info'] = False
        st.session_state['show_survey'] = True
        st.rerun()


# Estado para as pastas selecionadas
if 'select_new_folders' not in st.session_state:
    st.session_state['select_new_folders'] = True




# Seção do Survey
if st.session_state['show_survey']:


    _, col, _ = st.columns([1, 3, 1])
    with col:
        with st.container(border=True):
            with st.expander("**Information**", expanded=False):
                st.write(
                    """
                    **Purpose of the Study:**
                    This questionnaire is part of an academic research study aimed at evaluating student engagement and attention levels during class. The evaluation is based on real classroom images taken at different moments throughout a lesson.

                    **What You Will Do:**
                    On each page, you will see a general image of a classroom.
                    Below it, a sequence of individual student faces, detected from the main image, will be displayed.
                    For each face, you will be asked to rate the student’s level of engagement based on visual cues.
                    How to Respond:
                    Rate each face on a scale from 1 (no engagement) to 10 (maximum engagement).
                    If you cannot determine the engagement level for a particular face, please select “No context image.”
                    
                    **Your Input Matters:**
                    Your careful observations will contribute to the development of more effective teaching strategies and classroom technologies that respond to real-time student engagement. Your responses are anonymous and will only be used for research purposes.
                    
                    **Estimated Completion Time:** Approximately 10 minutes

                    **Confidentiality:** All data is anonymous and treated with strict confidentiality.

                    **Contact for Questions:** Daniel Furtado (daniel.furtado@nexi.plus)
                    
                    Thank you for your valuable participation. Your insight helps shape the future of education.
                    """
                )
                
            
            # Inicializa estado da página
            if 'survey_page' not in st.session_state:
                st.session_state.survey_page = 0

            for page_folder in sorted(os.listdir(base_path)):
                page_path = os.path.join(base_path, page_folder)
                
                if os.path.isdir(page_path):
                    inner_folders = [
                        f for f in sorted(os.listdir(page_path))
                        if os.path.isdir(os.path.join(page_path, f))
                    ]
                    folders_dict[page_folder] = inner_folders



            



            if st.session_state['select_new_folders']:
                st.session_state['select_new_folders'] = False
                all_folders = [(k, v) for k, folder in folders_dict.items() for v in folder]
                answered_folders = set(get_all_answered_folders())
                unanswered_folders = [(k, v) for (k, v) in all_folders if f"{k}/{v}" not in answered_folders]
                st.session_state["survey_content"] = []  
                selected_folders = random.sample(unanswered_folders, survey_size) if len(unanswered_folders) >= survey_size else unanswered_folders
                for folder in selected_folders:
                    folder_path = os.path.join(base_path, folder[0], folder[1])
                    face_images = sorted([f for f in os.listdir(folder_path) if f.startswith("face") and f.endswith(('.png', '.jpg', '.jpeg'))])
                    st.session_state["survey_content"].extend((folder_path, face_image) for face_image in face_images)

                    
                if "survey_start_time" not in st.session_state:
                    st.session_state["survey_start_time"] = time.time()
                

            
            total_pages = len(st.session_state.survey_content)
            current_page = st.session_state.survey_page 
            
            st.image(Image.open(st.session_state.survey_content[current_page][0]+"/0.jpg"), caption=f"Class Image", width=1000) 
            
            

            if "answers" not in st.session_state:
                st.session_state["answers"] = {}
            
            st.write("_" * 50)
            
            image_column, options_column = st.columns([1.4, 3])
            with image_column:
                image_path = st.session_state.survey_content[current_page][0] + "/" + st.session_state.survey_content[current_page][1]
                st.image(Image.open(image_path), caption=f"Face Image: {st.session_state.survey_content[current_page][1].split("-")[0].split("face")[1]}", width=190)
            
            with options_column:
                saved_option = st.session_state["answers"].get(image_path)
                selected_option = st.radio(
                    label=f"Face {st.session_state.survey_content[current_page][1].split("-")[0].split("face")[1]}:",
                    options=engagement_options,
                    index=engagement_options.index(saved_option) if saved_option in engagement_options else None,
                    horizontal=True,
                    captions=engagement_captions,
                )
            
            st.write("_" * 50)
            
            st.session_state["answers"].update({image_path: selected_option})

            st.write(f"Page {current_page + 1} of {total_pages}")
            col_prev, col_next = st.columns([2,5])
            with col_prev:
                if current_page > 0:
                    st.button(
                        "⬅ Previous ",
                        on_click=lambda: (
                            st.session_state.update({'survey_page': st.session_state.survey_page - 1})
                        ))
                    
                    
            with col_next:
                if current_page < total_pages - 1:
                    st.button(
                        "Next ➡",
                        on_click=lambda: (
                            st.session_state.update({'survey_page': st.session_state.survey_page + 1})
                        ),
                        disabled= selected_option == None
                    )
            
                    
                    
            
            if current_page == total_pages - 1 and selected_option != None:
                if st.button("Submit Answers"):
                    duration = round(time.time() - st.session_state["survey_start_time"],2)
                    save_survey_to_firebase(st.session_state.name,st.session_state.email, st.session_state["answers"], duration)                
                    st.success("Answers successfully submitted!")
                    st.session_state.survey_page = 0
                    st.session_state['show_survey'] = False
                    st.session_state["answers"] = {}
                    st.session_state["survey_content"] = []
                    st.session_state['select_new_folders'] = True
                    st.session_state["show_info"] = True
                    del st.session_state["survey_start_time"]
                    st.rerun()

            if st.button("Cancel"):
                st.session_state['show_survey'] = False
                st.session_state.survey_page = 0
                st.session_state["answers"] = {}
                st.session_state["survey_content"] = []
                st.session_state['select_new_folders'] = True
                st.session_state["show_info"] = True
                del st.session_state["survey_start_time"]
                st.rerun()